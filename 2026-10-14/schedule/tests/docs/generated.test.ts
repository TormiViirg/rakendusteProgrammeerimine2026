import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderCatalogue, renderVariants } from './render'

/**
 * Two documents are generated from the code. `npm run docs` writes them;
 * `npm test` fails when what is on disk is not what the code says — so they
 * cannot go stale.
 */
const DOCS = join(__dirname, '../../docs')
const WRITE = process.env.WRITE_DOCS === '1'

describe.each([
  ['TEST-CATALOGUE.md', renderCatalogue],
  ['VARIANTS.md', renderVariants],
])('docs/%s', (name, render) => {
  it(WRITE ? 'is written' : 'is up to date (run `npm run docs` after changing the catalogue or a kind)', () => {
    const file = join(DOCS, name)
    const text = `${render()}\n`
    if (WRITE) writeFileSync(file, text)
    expect(existsSync(file) ? readFileSync(file, 'utf8') : '').toBe(text)
  })
})
