import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cssVars } from '../../core/design/cssVars'
import { resolveDesign, type Design, type DesignOptions } from '../../core/design/resolveDesign'
import type { DesignContext as ScreenContext } from '../../design/scales'
import { useSize } from '../hooks/useSize'
import { DesignContext, type DesignState } from './context'

interface Props extends DesignOptions {
  children: ReactNode
  /** what is on screen — feeds the scale and modifier selection */
  tickets: Pick<ScreenContext, 'kinds' | 'count' | 'longestText'>
  /** simulate a screen (demo / tests); defaults to the real container width and window height */
  viewport?: { width: number; height: number }
  lang?: string
  /** reports the resolved design (for a debug read-out) */
  onDesign?: (d: Design) => void
}

/**
 * Measures the available space, asks core/design which scale and modifiers
 * apply, and publishes the resulting tokens as CSS custom properties and as
 * React context.
 */
export function DesignProvider({ children, tickets, viewport, lang, onDesign, ratio, modifiers, scaleId }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const [winH, setWinH] = useState(() => window.innerHeight)
  const [fontsTick, setFontsTick] = useState(0)

  useEffect(() => {
    const onResize = () => setWinH(window.innerHeight)
    window.addEventListener('resize', onResize)
    // web fonts change text widths: bump so fitted text re-measures
    const bump = () => setFontsTick((n) => n + 1)
    document.fonts.ready.then(bump)
    document.fonts.addEventListener('loadingdone', bump)
    return () => {
      window.removeEventListener('resize', onResize)
      document.fonts.removeEventListener('loadingdone', bump)
    }
  }, [])

  const width = viewport?.width ?? size.w
  const height = viewport?.height ?? winH
  const { kinds, count, longestText } = tickets
  const kindsKey = [...kinds].sort().join(',')

  const design = useMemo(
    () => resolveDesign({ width, height, kinds, count, longestText }, { ratio, modifiers, scaleId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kinds is compared by content
    [width, height, kindsKey, count, longestText, ratio, modifiers, scaleId],
  )

  useEffect(() => onDesign?.(design), [design, onDesign])

  const state = useMemo<DesignState>(
    () => ({
      design,
      tokens: design.tokens,
      u: design.u,
      lang,
      layoutKey: [Math.round(width), design.scale.id, design.modifiers.map((m) => m.id).join('+'), design.columns, ratio, fontsTick, lang].join('|'),
    }),
    [design, width, ratio, fontsTick, lang],
  )

  const style = useMemo(
    () =>
      ({
        ...cssVars(design.tokens, design.u),
        '--columns': String(design.columns),
        '--page-w': `${design.artboard * design.u}px`,
      }) as CSSProperties,
    [design],
  )

  return (
    <div ref={ref} className="sc" lang={lang} data-layout={design.layout} data-scale={design.scale.id} data-modifiers={design.modifiers.map((m) => m.id).join(' ')} style={style}>
      <DesignContext.Provider value={state}>{width > 0 ? children : null}</DesignContext.Provider>
    </div>
  )
}
