import { fieldLayout } from '../../design/fields'
import { PROTECTED_TOKEN_PATHS, RULE_ROOTS } from '../../design/invariants'
import { LAYOUTS } from '../../design/layout'
import { BASE } from '../../design/tokens'
import { isLeaf } from '../../design/tokens/leaf'
import { at, leaves } from '../design/merge'
import { conditionText, enumerate, impliedBy, overlap, type Features } from './feature'
import type { KindRegistry } from './kind'
import { planTicket } from './plan'

/**
 * COMPILE — static checks of the kind definitions. Nothing here looks at data;
 * it reads the definitions like a compiler reads a program and reports what
 * cannot be right:
 *
 *   • a rule changes the outline or the strip (design/invariants.ts → PROTECTED_TOKEN_PATHS)
 *   • a rule sets a token outside its reach: the other shape's, or the page's (RULE_ROOTS),
 *     or the line budget of a field of the other shape
 *   • a rule sets a token that does not exist, or with the wrong type of value
 *   • a rule's condition or a slot reads a feature the kind does not have
 *     (slots are functions, so they are run against every variant with a
 *     feature set that refuses unknown names)
 *   • two rules can apply to the same ticket and set the same token differently,
 *     unless the later one is strictly the more specific (its condition includes
 *     the other's and adds to it) — otherwise their order would silently decide
 *   • a budget names a text field that does not exist or belongs to the other shape
 *   • a feature changes nothing (no rule and no slot depends on it) — a warning
 *
 * Run by the unit tests (so a bad definition fails the build) and once at
 * start-up in development.
 */
export interface Diagnostic {
  level: 'error' | 'warning'
  /** "screening / wide / rule night" */
  where: string
  message: string
}

const sameLeaf = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A feature set that throws when asked for a feature the kind does not have (a misspelt name in a slot). */
function strict(features: Features): Features {
  return new Proxy(features, {
    get(target, name) {
      if (typeof name === 'string' && !Object.hasOwn(target, name)) throw new Error(`reads "${name}", which is not a feature of this kind (${Object.keys(target).join(', ')})`)
      return Reflect.get(target, name)
    },
  })
}
/** What kind of token value this is, in the words of design/tokens/leaf.ts. */
const leafType = (v: unknown) =>
  typeof v === 'number' ? 'length in points' : typeof v === 'string' ? 'CSS value' : typeof v === 'object' && v !== null && 'em' in v ? 'length in em — em(…)' : typeof v === 'object' && v !== null && 'n' in v ? 'plain number — num(…)' : typeof v

export function compileKinds(kinds: KindRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  const error = (where: string, message: string) => out.push({ level: 'error', where, message })
  const warning = (where: string, message: string) => out.push({ level: 'warning', where, message })

  for (const [key, kind] of Object.entries(kinds)) {
    if (kind.id !== key) error(key, `registered as "${key}" but its id is "${kind.id}"`)
    const features = Object.keys(kind.features)
    const variants = enumerate(features)
    const used = new Set<string>()

    for (const layout of LAYOUTS) {
      const here = `${kind.id} / ${layout}`
      const spec = kind.layouts[layout]
      if (!spec) {
        error(here, 'no definition for this ticket shape')
        continue
      }

      // ── rules ──
      const ids = new Set<string>()
      spec.rules.forEach((rule, i) => {
        const where = `${here} / rule ${rule.id}`
        if (ids.has(rule.id)) error(where, 'rule id used twice')
        ids.add(rule.id)
        for (const f of Object.keys(rule.when)) {
          if (!features.includes(f)) error(where, `condition uses "${f}", which is not a feature of this kind (${features.join(', ')})`)
          used.add(f)
        }
        for (const [path, value] of leaves(rule.set)) {
          const base = at(BASE, path)
          if (base === undefined || !isLeaf(base)) error(where, `sets "${path}", which is not a token`)
          else if (leafType(base) !== leafType(value)) error(where, `sets "${path}" to a ${leafType(value)}, but the token is a ${leafType(base)}`)
          const guard = PROTECTED_TOKEN_PATHS.find((p) => path === p || path.startsWith(`${p}.`))
          if (guard) error(where, `sets "${path}": "${guard}" is protected — the outline and the strip are the same on every ticket`)
          const [root, second] = path.split('.')
          if (!(RULE_ROOTS[layout] as readonly string[]).includes(root)) error(where, `sets "${path}": a ${layout} rule can only reach ${RULE_ROOTS[layout].join(', ')}`)
          else if (root === 'lines' && fieldLayout(second) !== layout) error(where, `sets the line budget of "${second}", a field of the other ticket shape`)
        }
        // order-dependence against every earlier rule
        for (const earlier of spec.rules.slice(0, i)) {
          if (!overlap(earlier.when, rule.when)) continue
          const mine = new Map(leaves(rule.set))
          for (const [path, value] of leaves(earlier.set)) {
            if (!mine.has(path) || sameLeaf(mine.get(path), value)) continue
            // fine when the later rule is strictly the more specific one: it is meant to win
            if (impliedBy(earlier.when, rule.when) && !impliedBy(rule.when, earlier.when)) continue
            error(where, `and rule ${earlier.id} can both apply (${conditionText(rule.when)} / ${conditionText(earlier.when)}) and set "${path}" differently; make one condition include the other, or exclude each other`)
          }
        }
      })

      // ── budget ──
      const fields = [...spec.budget.restore, ...spec.budget.grow.map((g) => g.field)]
      for (const field of fields) {
        const shape = fieldLayout(field)
        if (!shape) error(`${here} / budget`, `"${field}" is not a text field (design/fields.ts)`)
        else if (shape !== layout) error(`${here} / budget`, `"${field}" belongs to the other ticket shape`)
      }
      if (new Set(spec.budget.restore).size !== spec.budget.restore.length) error(`${here} / budget`, 'a field is listed twice in restore')

      // ── every variant must plan ──
      for (const v of variants) {
        try {
          planTicket(kind, v, layout)
        } catch (e) {
          error(here, `planning fails for variant ${JSON.stringify(v)}: ${String(e)}`)
        }
      }
    }

    // ── slots: run each against every variant; which features do they depend on? ──
    for (const [slot, rule] of Object.entries(kind.slots)) {
      const where = `${kind.id} / slot ${slot}`
      let broken = false
      for (const layout of LAYOUTS) {
        for (const v of variants) {
          if (broken) break
          try {
            const value = rule(strict(v), layout)
            if (typeof value !== 'boolean') throw new Error(`returns ${JSON.stringify(value)}, not true or false`)
            for (const f of features) if (rule(strict({ ...v, [f]: !v[f] }), layout) !== value) used.add(f)
          } catch (e) {
            broken = true
            error(where, e instanceof Error ? e.message : String(e))
          }
        }
      }
    }

    for (const f of features) if (!used.has(f)) warning(`${kind.id} / feature ${f}`, 'no rule and no slot depends on it')
  }
  return out
}

/** Throws with every error if the definitions are wrong. */
export function assertKinds(kinds: KindRegistry): void {
  const errors = compileKinds(kinds).filter((d) => d.level === 'error')
  if (errors.length) throw new Error(`Ticket definitions are invalid:\n${errors.map((d) => `  ${d.where}: ${d.message}`).join('\n')}`)
}
