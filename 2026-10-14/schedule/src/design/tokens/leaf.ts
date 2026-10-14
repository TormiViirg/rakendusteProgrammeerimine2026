/**
 * What a design token can be.
 *
 *   36          a length in design points (mockup px ÷ 3 on thin, ÷ 4 on wide tickets);
 *               one point is `u` CSS px at render time
 *   '213fr'     a ready CSS value (colours, grid tracks, font stacks)
 *   em(0.9)     a length relative to the font size
 *   num(2)      a plain number (a count, a ratio)
 */
export const em = (v: number) => ({ em: v }) as const
export const num = (v: number) => ({ n: v }) as const

export type Leaf = number | string | { readonly em: number } | { readonly n: number }

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends Leaf ? T[K] : DeepPartial<T[K]> }

export const isLeaf = (v: unknown): v is Leaf => typeof v !== 'object' || v === null || 'em' in (v as object) || 'n' in (v as object)
