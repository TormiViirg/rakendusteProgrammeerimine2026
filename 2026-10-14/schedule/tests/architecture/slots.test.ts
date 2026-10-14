import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AnyKind } from '../../src/core/ticket/kind'
import { TEXT_FIELDS } from '../../src/design/fields'
import { CATALOGUE, CATALOGUE_KINDS } from '../../src/testing/catalogue'
import { knownSlot } from '../../src/testing/readers'
import { KINDS } from '../../src/tickets/registry'

/**
 * NAMES THAT MUST AGREE. Slot names and field ids are plain strings in four
 * places — a kind's slot rules, its views (`slots.x`, `data-slot="x"`,
 * `field="x"`), the test readers and the catalogue's expectations — and
 * TypeScript only checks some of the links. This reads the sources and checks
 * the rest, so a rename cannot leave one of them behind.
 */
const SRC = join(__dirname, '../../src')
const read = (dir: string): string =>
  readdirSync(dir, { withFileTypes: true })
    .map((e) => (e.isDirectory() ? read(join(dir, e.name)) : /\.tsx$/.test(e.name) ? readFileSync(join(dir, e.name), 'utf8') : ''))
    .join('\n')

const shared = read(join(SRC, 'ui'))
const viewsOf = (kind: string) => read(join(SRC, 'tickets', kind, 'view'))
const all = [shared, ...Object.keys(KINDS).map(viewsOf)].join('\n')
const literals = (source: string, attribute: string) => [...source.matchAll(new RegExp(`\\b${attribute}=(?:"([^"]+)"|\\{'([^']+)'\\})`, 'g'))].map((m) => m[1] ?? m[2])
const kindSlots = new Set(Object.values(KINDS).flatMap((k) => Object.keys((k as AnyKind).slots)))

describe('slot names', () => {
  it('every part a view marks is one the tests can read or a kind decides', () => {
    const marked = new Set([...literals(all, 'data-slot'), ...literals(all, 'slot'), ...literals(all, 'titleSlot')])
    expect(marked.size).toBeGreaterThan(15)
    expect([...marked].filter((s) => !knownSlot(s) && !kindSlots.has(s))).toEqual([])
  })

  it('every optional part of a kind is asked for by that kind\'s views', () => {
    for (const [id, kind] of Object.entries(KINDS)) {
      const source = viewsOf(id)
      for (const slot of Object.keys((kind as AnyKind).slots)) expect(new RegExp(`\\bslots\\.${slot}\\b`).test(source), `${id}: no view reads slots.${slot}`).toBe(true)
    }
  })

  it('every optional part is marked in the DOM somewhere, so the browser check can see whether it is drawn', () => {
    const marked = new Set([...literals(all, 'data-slot'), ...literals(all, 'slot')])
    expect([...kindSlots].filter((s) => !marked.has(s))).toEqual([])
  })

  it('every slot the catalogue expects something of is marked in the DOM', () => {
    const marked = new Set([...literals(all, 'data-slot'), ...literals(all, 'slot'), ...literals(all, 'titleSlot')])
    const expected = new Set<string>()
    for (const kind of CATALOGUE_KINDS) for (const p of CATALOGUE[kind].parameters) for (const c of p.classes) for (const point of c.points) for (const e of c.expect(point)) if ('slot' in e) expected.add(e.slot)
    expect([...expected].filter((s) => !marked.has(s))).toEqual([])
  })
})

describe('field ids', () => {
  const used = new Set([...literals(all, 'field'), ...[...all.matchAll(/'((?:thin|wide)[A-Z]\w+)'/g)].map((m) => m[1])])

  it('every text field of design/fields.ts is used by a view', () => {
    expect(Object.keys(TEXT_FIELDS).filter((f) => !used.has(f))).toEqual([])
  })

  it('every field a budget names is drawn by its kind\'s views or a template they use', () => {
    for (const [id, kind] of Object.entries(KINDS))
      for (const [layout, spec] of Object.entries((kind as AnyKind).layouts)) {
        const source = viewsOf(id) + shared
        for (const field of [...spec.budget.restore, ...spec.budget.grow.map((g) => g.field)]) expect(source.includes(field), `${id} ${layout}: budget names ${field}`).toBe(true)
      }
  })
})
