import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DERIVED_CSS_VARS, cssVars } from '../../src/core/design/cssVars'
import { BASE } from '../../src/design/tokens'

/**
 * The stylesheets and the token tree must agree: a stylesheet may only read
 * custom properties that the tokens produce. Catches a renamed or deleted
 * token that a stylesheet still uses (which would silently render as nothing).
 */
const SRC = join(__dirname, '../../src')

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? cssFiles(p) : e.name.endsWith('.css') ? [p] : []
  })
}

const known = new Set([...Object.keys(cssVars(BASE, 1)), ...DERIVED_CSS_VARS])
const files = cssFiles(SRC)

describe('stylesheets and tokens', () => {
  it('finds the stylesheets', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('every var(--t-…) in a stylesheet is a token', () => {
    const unknown: string[] = []
    for (const file of files) {
      const css = readFileSync(file, 'utf8')
      for (const [, name] of css.matchAll(/var\(\s*(--t-[A-Za-z0-9-]+)/g)) {
        if (!known.has(name)) unknown.push(`${relative(SRC, file)}: ${name}`)
      }
    }
    expect(unknown).toEqual([])
  })
})

/** TypeScript and TSX sources outside the token files. */
function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return p.endsWith(join('design', 'tokens')) ? [] : tsFiles(p)
    return /\.tsx?$/.test(e.name) ? [p] : []
  })
}

describe('unread tokens', () => {
  // A coarse net: a token passes if a stylesheet reads its variable, or its last name appears as a
  // property access in code. It catches a token nothing mentions; it cannot prove a token is used.
  it('every token is read by a stylesheet, or its name is read somewhere in code', () => {
    const css = files.map((f) => readFileSync(f, 'utf8')).join('\n')
    const code = tsFiles(SRC)
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    const dead = Object.keys(cssVars(BASE))
      .filter((name) => !css.includes(`var(${name})`) && !css.includes(`var(${name},`))
      // read in code as `tokens.….<leaf>` or, for whole groups, by iterating (lines, overlay)
      .filter((name) => !name.startsWith('--t-lines-') && !name.startsWith('--t-overlay-'))
      .filter((name) => !new RegExp(`\\.${name.split('-').pop()}\\b`).test(code))
    expect(dead).toEqual([])
  })
})
