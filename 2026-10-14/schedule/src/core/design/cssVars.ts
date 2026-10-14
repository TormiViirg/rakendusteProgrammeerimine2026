import type { DeepPartial, Leaf, Tokens } from '../../design/tokens'

/**
 * Flattens a token tree into CSS custom properties:
 *   thin.role.titleFs = 36          →  --t-thin-role-titleFs: calc(36 * var(--u))
 *   thin.role.times.dayGap = em()   →  --t-thin-role-times-dayGap: 0.97em
 *   overlay.zoom = num()            →  --t-overlay-zoom: 16
 *   color.ink = 'oklch(…)'          →  --t-color-ink: oklch(…)
 */
export function cssVars(tokens: Tokens | DeepPartial<Tokens>, u?: number): Record<string, string> {
  const out: Record<string, string> = u === undefined ? {} : { '--u': `${u}px` }
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'number') out[path] = `calc(${node} * var(--u))`
    else if (typeof node === 'string') out[path] = node
    else if (node && typeof node === 'object') {
      const leaf = node as Leaf & object
      if ('em' in leaf) out[path] = `${leaf.em}em`
      else if ('n' in leaf) out[path] = String(leaf.n)
      else for (const [k, v] of Object.entries(node)) walk(v, `${path}-${k}`)
    }
  }
  walk(tokens, '--t')
  const page = tokens.page
  if (page?.menuH !== undefined && page.titleRowH !== undefined) out['--t-page-topBlock'] = `calc(${page.menuH + page.titleRowH} * var(--u))`
  return out
}

/** Custom properties that cssVars derives in addition to the token leaves. */
export const DERIVED_CSS_VARS = ['--t-page-topBlock']
