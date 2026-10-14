import { useRef, type CSSProperties, type ReactNode } from 'react'
import { toneOf } from '../../design/tones'
import { useDesign } from '../design/context'
import { useSize } from '../hooks/useSize'
import { useTicket } from './context'

interface Props {
  /** Everything above the stub. It gets a fixed box: whatever does not fit is the Fit components' job. */
  children: ReactNode
  /** Strip + footer, between the notches. Fixed height. */
  stub?: ReactNode
  className?: string
}

/**
 * The ticket silhouette. Its size comes from the tokens alone (thin.frame /
 * wide.frame) — never from the content — and the outline is drawn on top of
 * everything inside it, always with the same stroke.
 *
 *   paper (fill)  →  content, clipped to the silhouette  →  outline + ticks
 *
 * thin: 357 × 326pt, notch on the right.   wide: 678 × 365pt, notch on both sides.
 */
export function TicketFrame({ children, stub, className = '' }: Props) {
  const { u, tokens } = useDesign()
  const { plan, model } = useTicket()
  const rootRef = useRef<HTMLDivElement>(null)
  const root = useSize(rootRef)

  const shape = plan.layout
  const T = tokens[shape].frame
  const both = shape === 'wide'
  const H = T.height
  const W = root.w / u
  const ready = root.w > 0

  const nTop = H - T.notchFromBottom
  const nBot = H - T.notchEndFromBottom - T.bevel
  const h = T.stroke / 2
  const right = `H${W - h} V${nTop} L${W - T.notchDepth - h},${nTop + T.bevel} V${nBot} L${W - h},${nBot + T.bevel} V${H - h}`
  const left = both ? `H${h} V${nBot + T.bevel} L${T.notchDepth + h},${nBot} V${nTop + T.bevel} L${h},${nTop} Z` : `H${h} Z`
  const outline = `M${h},${h} ${right} ${left}`

  // thin: ticks counted from the bottom edge so the last one closes the corner; wide: from the top
  const ticks: ReactNode[] = []
  const rem = (H - T.tick) % T.pitch
  const first = both ? 0 : rem > 0.01 && rem < T.pitch - 0.01 ? rem : 0
  for (let y = first; y <= H - T.tick + 0.01; y += T.pitch) {
    const inNotch = y + T.tick > nTop && y < nBot + T.bevel
    if (!(both && inNotch)) ticks.push(<rect key={`l${y}`} x={-T.tick} y={y} width={T.tick} height={T.tick} />)
    if ((both || y > 0.01) && !inNotch) ticks.push(<rect key={`r${y}`} x={W} y={y} width={T.tick} height={T.tick} />)
  }

  const px = (n: number) => `${n * u}px`
  const d = T.notchDepth
  const clipRight = `${px(W)} 0, ${px(W)} ${px(nTop)}, ${px(W - d)} ${px(nTop + T.bevel)}, ${px(W - d)} ${px(nBot)}, ${px(W)} ${px(nBot + T.bevel)}, ${px(W)} ${px(H)}`
  const clipLeft = both ? `0 ${px(H)}, 0 ${px(nBot + T.bevel)}, ${px(d)} ${px(nBot)}, ${px(d)} ${px(nTop + T.bevel)}, 0 ${px(nTop)}` : `0 ${px(H)}`
  const clip = `polygon(0 0, ${clipRight}, ${clipLeft})`

  const style = { height: px(H), visibility: ready ? 'visible' : 'hidden', '--tone': toneOf(model.toneRole) } as CSSProperties
  const box = { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': true } as const
  const present = Object.keys(plan.slots).filter((s) => plan.slots[s])

  return (
    <article
      ref={rootRef}
      className={`tk tk--${shape} ${className}`}
      style={style}
      // what this ticket is, for styling hooks and for the browser checks (scripts/check-layout.mjs)
      data-check="ticket"
      data-id={model.id}
      data-kind={plan.kind}
      data-layout={plan.layout}
      data-variant={plan.variant}
      data-rules={plan.rules.join(' ') || undefined}
      data-role={model.toneRole}
      data-slots={present.join(' ')}
      data-optional={Object.keys(plan.slots).join(' ')}
      // silhouette: notch top / bottom / depth in px, and how many sides
      data-notch={ready ? [nTop * u, (nBot + T.bevel) * u, d * u, both ? 2 : 1].map((n) => Math.round(n * 10) / 10).join(' ') : undefined}
    >
      {ready && (
        <svg className="tk__paper" {...box}>
          <path d={outline} fill="var(--t-color-paper)" />
        </svg>
      )}
      <div className="tk__content" style={{ clipPath: ready ? clip : undefined }}>
        <div className="tk__body" data-part="body">
          {children}
        </div>
        <div className="tk__stub">{stub}</div>
      </div>
      {ready && (
        <svg className="tk__frame" {...box}>
          <path d={outline} fill="none" stroke="var(--tone)" strokeWidth={T.stroke} />
          <g fill="var(--tone)">{ticks}</g>
        </svg>
      )}
    </article>
  )
}
