import { useMemo } from 'react'
import { useDesign } from '../design/context'

/** Deterministic decorative barcode: the same seed always yields the same bars. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
function prng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Props {
  seed: string
  /** "dense": mostly black with hairline gaps (strip next to labels). "open": classic barcode. */
  variant?: 'dense' | 'open'
  className?: string
  /** bar pattern length in pt; must exceed the widest place it is used in */
  length?: number
}

export function Barcode({ seed, variant = 'dense', className = '', length }: Props) {
  // longer than any card is wide; the parent crops it
  const fallback = useDesign().tokens.thin.strip.barcodeLen
  const LENGTH = length ?? fallback
  const bars = useMemo(() => {
    const rnd = prng(hash(seed + variant))
    const pick = (arr: number[]) => arr[Math.floor(rnd() * arr.length)]
    const black = variant === 'dense' ? [1, 2, 2, 2, 2, 3, 3, 4, 5] : [1, 1, 1, 1, 2, 2, 3, 4]
    const white = variant === 'dense' ? [1, 1, 1, 1, 2] : [1, 1, 2, 2, 3, 4]
    const out: { x: number; w: number }[] = []
    let x = 0
    while (x < LENGTH) {
      const w = pick(black)
      out.push({ x, w })
      x += w + pick(white)
    }
    return out
  }, [seed, variant, LENGTH])

  return (
    <span className={`barcode ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${LENGTH} 10`} preserveAspectRatio="none" style={{ width: `calc(${LENGTH} * var(--u))` }}>
        {bars.map((b) => (
          <rect key={b.x} x={b.x} y={0} width={b.w} height={10} />
        ))}
      </svg>
    </span>
  )
}
