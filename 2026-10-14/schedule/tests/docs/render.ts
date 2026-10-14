import { leaves } from '../../src/core/design/merge'
import { conditionText, enumerate, variantName } from '../../src/core/ticket/feature'
import type { AnyKind } from '../../src/core/ticket/kind'
import { planTicket } from '../../src/core/ticket/plan'
import { LAYOUTS } from '../../src/design/layout'
import { CATALOGUE, CATALOGUE_KINDS, allPoints } from '../../src/testing/catalogue'
import type { Expectation, Point } from '../../src/testing/catalogue/types'
import { SCREENS } from '../../src/testing/screens'
import { SUITES, SUITE_IDS, allCases } from '../../src/testing/suites'
import { KINDS } from '../../src/tickets/registry'

/** Renders the two generated documents. Pure: the same sources always give the same text. */

const code = (v: unknown) => `\`${String(v)}\``
const cell = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n', ' ')

function value(point: Point): string {
  const entries = Object.entries(point.patch)
  const show = (v: unknown) => {
    if (v === undefined) return '*not sent*'
    const json = JSON.stringify(v)
    return code(json.length > 46 ? `${json.slice(0, 43)}…` : json)
  }
  return entries.length === 1 ? show(entries[0][1]) : entries.map(([k, v]) => `${k} ${show(v)}`).join(' · ')
}

/** What a class must lead to, in a few words: per slot, and without listing every boundary value again. */
function leadsTo(all: Expectation[]): string {
  const bySlot = new Map<string, Set<string>>()
  for (const e of all) {
    const key = 'tone' in e ? 'accent colour' : e.slot
    // texts are listed in Estonian, the language the fixtures are written in
    const text = 'tone' in e ? e.tone : 'present' in e ? (e.present ? 'present' : 'absent') : 'is' in e ? `"${e.is.et}"` : `contains "${e.has.et}"`
    bySlot.set(key, (bySlot.get(key) ?? new Set()).add(text))
  }
  return [...bySlot]
    .map(([slot, texts]) => {
      const [first] = texts
      if (texts.size > 1) return slot === 'accent colour' ? 'the role\'s accent colour' : `${code(slot)} shows the value`
      if (first === 'present') return `has ${code(slot)}`
      if (first === 'absent') return `no ${code(slot)}`
      if (slot === 'accent colour') return `accent ${code(first)}`
      return first.startsWith('contains ') ? `${code(slot)} ${cell(first.length > 60 ? `${first.slice(0, 57)}…"` : first)}` : `${code(slot)} shows ${cell(first.length > 50 ? `${first.slice(0, 47)}…"` : first)}`
    })
    .join(', ')
}

export function renderCatalogue(): string {
  const out: string[] = []
  const points = CATALOGUE_KINDS.reduce((n, k) => n + allPoints(k).length, 0)
  const classes = CATALOGUE_KINDS.reduce((n, k) => n + CATALOGUE[k].parameters.reduce((m, p) => m + p.classes.length, 0), 0)

  out.push(
    '# Test catalogue',
    '',
    '> Generated from `src/testing` by `npm run docs`. Do not edit: `npm test` fails when this file is out of date.',
    '',
    'Every input of a ticket is a **parameter**. Its values are split into **equivalence classes** — sets of',
    'values the tickets are expected to treat alike — and every class names its **boundary values**, the edges',
    'where mistakes live. A class says whether its values are valid, degraded (shown, with a warning) or invalid',
    '(the shift is not shown), which problem must be reported for which field, and what must be observable when',
    'one of its values is on a ticket. Expected texts are read from the locale files and the fixtures by the',
    'catalogue itself (`src/testing/fixtures/expected.ts`) and checked in all three languages.',
    '',
    `${classes} classes and ${points} values across ${CATALOGUE_KINDS.length} ticket kinds.`,
    '',
    '## How the classes are combined',
    '',
    '| suite | strategy | coverage | cases |',
    '|---|---|---|---|',
  )
  const strategy: Record<string, string> = {
    base: 'base choice',
    each: 'base choice: one parameter at a time through every valid and degraded value',
    pairs: 'pairwise (all pairs of classes, representatives only)',
    variants: 'every on/off assignment of the kind\'s features',
    invalid: 'one invalid value at a time (a second fault would hide the first)',
  }
  for (const id of SUITE_IDS) out.push(`| \`${id}\` | ${strategy[id]} | ${SUITES[id].about} | ${allCases(id).length} |`)
  out.push('', 'The unit tests run every case through the pipeline (`tests/catalogue`); `npm run check:layout` draws every case in a browser, on every screen below, in three languages.', '')

  for (const kind of CATALOGUE_KINDS) {
    out.push(`## ${kind}`, '', KINDS[kind].about, '')
    for (const p of CATALOGUE[kind].parameters) {
      out.push(`### ${kind} · ${p.id}`, '', `${p.about}. Base class: \`${p.base}\`.`, '', '| class | represents | validity | representative | boundary values | must lead to |', '|---|---|---|---|---|---|')
      for (const c of p.classes) {
        const [rep, ...edges] = c.points
        const reported = [...new Set(c.points.flatMap((x) => x.problems.map((pr) => `${pr.field}: ${pr.code}`)))]
        const validity = c.validity === 'valid' ? 'valid' : `**${c.validity}** → ${reported.map(code).join(', ')}`
        const leads = c.validity === 'invalid' ? 'not shown' : leadsTo(c.points.flatMap((x) => c.expect(x)))
        out.push(`| \`${c.id}\` | ${cell(c.about)} | ${validity} | ${value(rep)} | ${edges.map((e) => `${value(e)} — ${cell(e.about)}`).join('<br>')} | ${leads} |`)
      }
      out.push('')
    }
  }

  out.push('## Screens', '', 'The classes of screen size are cut where the layout changes (`src/design/scales.ts`), with the widths on both sides of every change.', '', '| screen | size | scale | what it stands for | quick run |', '|---|---|---|---|---|')
  for (const s of SCREENS) out.push(`| \`${s.id}\` | ${s.width} × ${s.height} | \`${s.scale}\` | ${s.about} | ${s.core ? 'yes' : '`--all`'} |`)
  out.push('')
  return out.join('\n')
}

export function renderVariants(): string {
  const out: string[] = [
    '# Ticket kinds and their variants',
    '',
    '> Generated from `src/tickets` by `npm run docs`. Do not edit: `npm test` fails when this file is out of date.',
    '',
    'A kind has **features** (yes/no axes). One assignment of all of them is a **variant**. Which optional parts',
    '(**slots**) a ticket has and which **rules** change its tokens depend on the variant and the ticket shape alone.',
    '',
  ]
  for (const kind of Object.values(KINDS) as AnyKind[]) {
    const features = Object.keys(kind.features)
    out.push(`## ${kind.id}`, '', `${kind.about}.`, '', '| feature | meaning |', '|---|---|')
    for (const f of features) out.push(`| \`${f}\` | ${kind.features[f].about} |`)
    out.push('')
    for (const layout of LAYOUTS) {
      const { rules, budget } = kind.layouts[layout]
      out.push(`### ${kind.id} · ${layout}`, '')
      if (rules.length) {
        out.push('| rule | when | sets | why |', '|---|---|---|---|')
        for (const r of rules) out.push(`| \`${r.id}\` | ${conditionText(r.when)} | ${leaves(r.set).map(([p, v]) => `\`${p}\` = ${JSON.stringify(v)}`).join('<br>')} | ${cell(r.about)} |`)
        out.push('')
      } else out.push('No variant rules.', '')
      out.push(`Spare room: restore ${budget.restore.map(code).join(' → ') || '—'}; grow ${budget.grow.map((g) => `${code(g.field)} +${g.steps}`).join(' → ') || '—'}; at most ${budget.maxExtraLines} extra line${budget.maxExtraLines === 1 ? '' : 's'} per field.`, '')
    }
    out.push(`### ${kind.id} · all ${2 ** features.length} variants`, '', '| variant | parts on a thin ticket | parts on a wide ticket | rules (thin · wide) |', '|---|---|---|---|')
    for (const v of enumerate(features)) {
      const [thin, wide] = LAYOUTS.map((l) => planTicket(kind, v, l))
      const parts = (p: typeof thin) => Object.keys(p.slots).filter((s) => p.slots[s]).join(', ') || '—'
      out.push(`| ${variantName(v)} | ${parts(thin)} | ${parts(wide)} | ${thin.rules.join(', ') || '—'} · ${wide.rules.join(', ') || '—'} |`)
    }
    out.push('')
  }
  return out.join('\n')
}
