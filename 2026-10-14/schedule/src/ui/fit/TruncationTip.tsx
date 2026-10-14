import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Tip {
  el: HTMLElement
  text: string
  items: string[] | null
  /** opened by tap / keyboard: stays until dismissed */
  pinned: boolean
}

const TARGET = '.fit[data-fit="clamp"]'

/**
 * Shows the full text of anything <Fit> had to cut with "…".
 *
 *   mouse     hover
 *   touch     tap (tap elsewhere or scroll to dismiss)
 *   keyboard  focus (Tab), Escape to dismiss
 *
 * One instance serves the whole schedule through event delegation. A list
 * (subtitle languages, programmes) is shown one value per line.
 */
export function TruncationTip({ label }: { label: string }) {
  const [tip, setTip] = useState<Tip | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    const read = (el: HTMLElement, pinned: boolean): Tip => {
      let items: string[] | null = null
      try {
        items = el.dataset.items ? (JSON.parse(el.dataset.items) as string[]) : null
      } catch {
        items = null
      }
      return { el, text: el.dataset.full ?? el.textContent ?? '', items, pinned }
    }
    const target = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>(TARGET) : null)

    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const el = target(e)
      if (el) setTip((t) => (t?.pinned ? t : read(el, false)))
    }
    const out = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !target(e)) return
      setTip((t) => (t && !t.pinned ? null : t))
    }
    const click = (e: MouseEvent) => {
      const el = target(e)
      setTip((t) => (el ? (t?.pinned && t.el === el ? null : read(el, true)) : null))
    }
    const focusIn = (e: FocusEvent) => {
      const el = target(e)
      if (el?.matches(':focus-visible')) setTip(read(el, true))
    }
    const focusOut = () => setTip((t) => (t && t.pinned && !t.el.matches(':hover') ? null : t))
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setTip(null)
    const scroll = () => setTip(null)

    document.addEventListener('pointerover', over)
    document.addEventListener('pointerout', out)
    document.addEventListener('click', click)
    document.addEventListener('focusin', focusIn)
    document.addEventListener('focusout', focusOut)
    document.addEventListener('keydown', key)
    window.addEventListener('scroll', scroll, { passive: true, capture: true })
    window.addEventListener('resize', scroll)
    return () => {
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      document.removeEventListener('click', click)
      document.removeEventListener('focusin', focusIn)
      document.removeEventListener('focusout', focusOut)
      document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', scroll, { capture: true })
      window.removeEventListener('resize', scroll)
    }
  }, [])

  // place it under the text, or above when there is no room; keep it on screen
  useLayoutEffect(() => {
    if (!tip || !box.current) return
    const r = tip.el.getBoundingClientRect()
    const b = box.current.getBoundingClientRect()
    const gap = parseFloat(getComputedStyle(box.current).getPropertyValue('--tip-gap')) || 6
    const margin = 8
    let top = r.bottom + gap
    if (top + b.height > window.innerHeight - margin && r.top - gap - b.height >= margin) top = r.top - gap - b.height
    const left = Math.max(margin, Math.min(r.left, window.innerWidth - margin - b.width))
    setPos((p) => (p && Math.abs(p.left - left) < 0.5 && Math.abs(p.top - top) < 0.5 ? p : { left, top }))
  }, [tip])

  if (!tip) return null
  return (
    <div ref={box} className="tip" role="tooltip" aria-label={label} style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
      {tip.items ? (
        <ul className="tip__list">
          {tip.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      ) : (
        tip.text
      )}
    </div>
  )
}
