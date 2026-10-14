import { useEffect, useRef, useState } from 'react'
import type { DayGroup } from '../../core/schedule/schedule'
import { useDesign } from '../design/context'

/** Sticky day heading. Gets a heavier rule while it is pinned under the page top block. */
export function DayHeader({ day, rule }: { day: DayGroup; rule: boolean }) {
  const { layoutKey, design } = useDesign()
  const wide = design.layout === 'wide'
  const sentinel = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLHeadingElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = sentinel.current
    if (!el || !header.current) return
    // The resolved sticky offset (safe-area inset + top block) in px.
    const top = Math.round(parseFloat(getComputedStyle(header.current).top) || 0)
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < top + 2), {
      rootMargin: `-${top + 1}px 0px 0px 0px`,
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [layoutKey])
  return (
    <>
      <div ref={sentinel} className="day__sentinel" />
      <h2 ref={header} className={`day__header ${rule || wide ? 'day__header--rule' : ''}`} data-stuck={stuck}>
        {wide && day.weekday && day.date ? (
          <>
            <span className="day__weekday">{day.weekday}</span>
            <span className="day__date mono">{day.date}</span>
          </>
        ) : (
          <span className={wide ? 'day__weekday' : 'mono'}>{day.label}</span>
        )}
      </h2>
    </>
  )
}
