import type { Layout } from '../../design/layout'
import { MODIFIERS, type Modifier } from '../../design/modifiers'
import { SCALES, type DesignContext, type Scale } from '../../design/scales'
import { BASE, type Tokens } from '../../design/tokens'
import { MEASURED } from '../../design/tokens/measured'
import { merge } from './merge'

/** The page-level design a screen gets: tokens, ticket shape, zoom and columns. */
export interface Design {
  tokens: Tokens
  scale: Scale
  modifiers: Modifier[]
  layout: Layout
  /** CSS px per design point */
  u: number
  columns: number
  /** page width in pt for the chosen column count */
  artboard: number
}

export interface DesignOptions {
  /** A (true) = BASE, B (false) = BASE + MEASURED */
  ratio: boolean
  /** set false to ignore MODIFIERS (useful when comparing against the mockups) */
  modifiers?: boolean
  /** pin a scale by id instead of selecting by context */
  scaleId?: string
}

export const ticketWidth = (t: Tokens, layout: Layout) => t[layout].frame.width

const artboardFor = (t: Tokens, layout: Layout, columns: number) => 2 * t.page.gutter + columns * ticketWidth(t, layout) + (columns - 1) * t.page.cardGap

/** BASE → MEASURED (ratio B) → the first matching scale → every matching modifier. */
export function resolveDesign(ctx: DesignContext, opts: DesignOptions): Design {
  const scale = SCALES.find((s) => s.id === opts.scaleId) ?? SCALES.find((s) => s.when(ctx)) ?? SCALES[SCALES.length - 1]
  const modifiers = opts.modifiers === false ? [] : MODIFIERS.filter((m) => m.when(ctx))

  let tokens = opts.ratio ? BASE : merge(BASE, MEASURED)
  tokens = merge(tokens, scale.overrides)
  for (const m of modifiers) tokens = merge(tokens, m.overrides)

  const columns = Math.max(1, scale.columns)
  const artboard = artboardFor(tokens, scale.layout, columns)
  let u = scale.unit.mode === 'fixed' ? scale.unit.u : ctx.width > 0 ? ctx.width / artboard : 1
  if (scale.unit.mode === 'fit' && scale.unit.maxU) u = Math.min(u, scale.unit.maxU)
  return { tokens, scale, layout: scale.layout, modifiers, u, columns, artboard }
}

/** A design to render with before the screen has been measured. */
export const FALLBACK_DESIGN: Design = { tokens: BASE, scale: SCALES[0], layout: 'thin', modifiers: [], u: 1, columns: 1, artboard: 393 }
