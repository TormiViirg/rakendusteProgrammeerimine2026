import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * THE DEPENDENCY RULE, enforced.
 *
 *   design    data only                      → nothing
 *   locales   data only                      → nothing
 *   core      the engine and the ports       → design
 *   tickets   the kind definitions           → core, design
 *   testing   catalogue, suites, fixtures    → tickets, core, design, locales
 *   ui        React components               → core, design                      (+ react)
 *   views     tickets/<kind>/view, views.ts  → ui, tickets, core, design         (+ react)
 *   adapters  implementations of the ports   → core, design, locales, tickets, ui/ports
 *                                              (+ the one library each wraps)
 *   app       the composition root           → everything
 *
 * Arrows point inwards only: nothing in core, design or a kind definition knows
 * React, the DOM, i18next, Leaflet or the backend. That is what lets an adapter
 * be replaced without touching anything downstream.
 */
const SRC = resolve(__dirname, '../../src')

type Layer = 'design' | 'locales' | 'core' | 'tickets' | 'views' | 'testing' | 'ui' | 'adapters' | 'app'

const ALLOWED: Record<Layer, Layer[]> = {
  design: ['design'],
  locales: ['locales'],
  core: ['core', 'design'],
  tickets: ['tickets', 'core', 'design'],
  testing: ['testing', 'tickets', 'core', 'design', 'locales'],
  ui: ['ui', 'core', 'design'],
  views: ['views', 'ui', 'tickets', 'core', 'design'],
  adapters: ['adapters', 'core', 'design', 'locales', 'tickets', 'ui'],
  app: ['app', 'adapters', 'views', 'ui', 'testing', 'tickets', 'core', 'design', 'locales'],
}

/** Packages a layer may import. Adapters are listed one by one: each wraps exactly one library, or none. */
const PACKAGES: Record<Exclude<Layer, 'adapters'>, RegExp[]> = {
  design: [],
  locales: [],
  core: [],
  tickets: [],
  testing: [],
  ui: [/^react(\/|$)/],
  views: [/^react(\/|$)/],
  app: [/^react(-dom)?(\/|$)/],
}
const ADAPTER_PACKAGES: Record<string, RegExp[]> = {
  'backend-simulated': [],
  console: [],
  hyphenation: [],
  i18next: [/^i18next$/],
  leaflet: [/^leaflet(\/|$)/],
}
const adapterOf = (file: string) => relative(join(SRC, 'adapters'), file).split(/[\\/]/)[0]
const packagesFor = (file: string) => {
  const layer = layerOf(file)
  return layer === 'adapters' ? (ADAPTER_PACKAGES[adapterOf(file)] ?? []) : PACKAGES[layer]
}

function layerOf(file: string): Layer {
  const rel = relative(SRC, file).split('\\').join('/')
  const [top, second, third] = rel.split('/')
  if (top === 'tickets' && (third === 'view' || second === 'views.ts')) return 'views'
  return top as Layer
}

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? sources(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : []
  })
}

const files = sources(SRC)
/**
 * Every module a file depends on, however it says so:
 *   import … from 'x' · export … from 'x' (also across lines, also `import type`)
 *   import 'x'  ·  import('x')  ·  typeof import('x')  ·  require('x')
 */
const FORMS = [
  /(?:^|\n)\s*(?:import|export)\s[^'";]*?from\s+['"]([^'"]+)['"]/g,
  /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]
const importsIn = (source: string) => FORMS.flatMap((form) => [...source.matchAll(form)].map((m) => m[1]))
const imports = (file: string) => importsIn(readFileSync(file, 'utf8'))

describe('the dependency rule', () => {
  it('finds the sources', () => {
    expect(files.length).toBeGreaterThan(80)
    expect(new Set(files.map(layerOf))).toEqual(new Set(Object.keys(ALLOWED)))
    // the import scanner sees them: far more imports than files
    expect(files.flatMap(imports).length).toBeGreaterThan(files.length * 2)
  })

  it('no file imports from a layer it may not know', () => {
    const wrong: string[] = []
    for (const file of files) {
      const from = layerOf(file)
      for (const spec of imports(file)) {
        if (spec.startsWith('.')) {
          const target = resolve(dirname(file), spec)
          if (/\.(css|png|svg)$/.test(spec)) continue
          const to = layerOf(target)
          if (!ALLOWED[from].includes(to)) wrong.push(`${relative(SRC, file)} (${from}) imports ${spec} (${to})`)
        } else if (!packagesFor(file).some((p) => p.test(spec)) && !spec.startsWith('@fontsource')) {
          wrong.push(`${relative(SRC, file)} (${from}) imports the package "${spec}"`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('adapters use the UI only for the port they implement', () => {
    const wrong = files
      .filter((f) => layerOf(f) === 'adapters')
      .flatMap((f) => imports(f).filter((s) => s.startsWith('.') && layerOf(resolve(dirname(f), s)) === 'ui' && !/\/ui\/ports$/.test(resolve(dirname(f), s))).map((s) => `${relative(SRC, f)} imports ${s}`))
    expect(wrong).toEqual([])
  })

  it('the scanner sees every way of importing', () => {
    const sample = [
      "import a from './a'",
      "import type { B } from './b'",
      "import {\n  c,\n  d,\n} from './c'",
      "export { e } from './e'",
      "export * from './f'",
      "import './g.css'",
      "const h = await import('./h')",
      "type I = typeof import('./i')",
      "type J = import('./j').J",
      "const k = require('./k')",
    ].join('\n')
    expect(importsIn(sample).sort()).toEqual(['./a', './b', './c', './e', './f', './g.css', './h', './i', './j', './k'])
  })

  it('every adapter folder has its own list of allowed packages', () => {
    const folders = new Set(files.filter((f) => layerOf(f) === 'adapters').map(adapterOf))
    expect([...folders].sort()).toEqual(Object.keys(ADAPTER_PACKAGES).sort())
  })

  it('an adapter does not reach into another adapter', () => {
    const adapter = adapterOf
    const wrong = files
      .filter((f) => layerOf(f) === 'adapters')
      .flatMap((f) =>
        imports(f)
          .filter((s) => s.startsWith('.'))
          .map((s) => resolve(dirname(f), s))
          .filter((t) => layerOf(t) === 'adapters' && adapter(t) !== adapter(f))
          .map((t) => `${relative(SRC, f)} imports ${relative(SRC, t)}`),
      )
    expect(wrong).toEqual([])
  })

  it('a kind does not reach into another kind', () => {
    const kind = (f: string) => relative(join(SRC, 'tickets'), f).split(/[\\/]/)[0]
    const wrong = files
      .filter((f) => ['tickets', 'views'].includes(layerOf(f)) && !/tickets[\\/](registry|views)\.ts$/.test(f))
      .flatMap((f) =>
        imports(f)
          .filter((s) => s.startsWith('.'))
          .map((s) => resolve(dirname(f), s))
          .filter((t) => ['tickets', 'views'].includes(layerOf(t)) && kind(t) !== kind(f))
          .map((t) => `${relative(SRC, f)} imports ${relative(SRC, t)}`),
      )
    expect(wrong).toEqual([])
  })

  // That the pure layers do not touch the browser is checked by the compiler, not by a
  // pattern: tsconfig.pure.json compiles design, locales, core, the kind definitions and
  // testing WITHOUT the DOM library, so `document`, `HTMLElement`, `fetch` … do not exist there.
  it('tsconfig.pure.json covers the pure layers and has no DOM', () => {
    const pure = JSON.parse(readFileSync(resolve(SRC, '../tsconfig.pure.json'), 'utf8'))
    expect(pure.compilerOptions.lib).toEqual(['ES2023'])
    expect(pure.compilerOptions.types).toEqual([])
    expect(pure.include.sort()).toEqual(['src/core', 'src/design', 'src/locales', 'src/testing', 'src/tickets'])
    expect(pure.exclude).toEqual(['src/tickets/*/view', 'src/tickets/views.ts'])
  })
})
