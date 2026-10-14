import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ticketWidth } from '../../core/design/resolveDesign'
import type { Captions } from '../../core/schedule/captions'
import type { Place } from '../../core/shift/place'
import { BROCHURE } from '../../design/map'
import { useDesign } from '../design/context'
import { CloseIcon } from '../parts/icons'
import { useUiPorts } from '../ports'
import { PlaceContext } from './openPlace'
import { PlaceMap } from './PlaceMap'

export function PlaceOverlayProvider({ captions, children }: { captions: Captions; children: ReactNode }) {
  const [place, setPlace] = useState<Place | null>(null)
  const opener = useRef<Element | null>(null)
  const open = useCallback((p: Place) => {
    opener.current = document.activeElement
    setPlace(p)
  }, [])
  const close = useCallback(() => {
    setPlace(null)
    if (opener.current instanceof HTMLElement) opener.current.focus({ preventScroll: true })
  }, [])
  return (
    <PlaceContext.Provider value={open}>
      {children}
      {place && <PlaceOverlay place={place} captions={captions} onClose={close} />}
    </PlaceContext.Provider>
  )
}

/**
 * The location sheet: a folded map brochure (the supplied vector's shape and
 * proportions) the size of a shift ticket, laid over the schedule.
 *
 *   map · hall · written-out address · how to get in
 *
 * It closes on scroll, on a tap on the blurred background, on the X and on Escape.
 */
function PlaceOverlay({ place, captions, onClose }: { place: Place; captions: Captions; onClose: () => void }) {
  const { tokens, u, design, lang } = useDesign()
  const { hyphenator } = useUiPorts()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight })
    // any scroll of the page behind dismisses it
    window.addEventListener('scroll', onClose, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('scroll', onClose)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [onClose])

  // as wide as a ticket, in the brochure's proportions, but never larger than the screen
  const o = tokens.overlay
  const ticketW = ticketWidth(tokens, design.layout) * u
  const ratio = BROCHURE.height / BROCHURE.width
  const width = Math.min(ticketW, view.w * o.maxViewport.n, (view.h * o.maxViewport.n) / ratio)
  const height = width * ratio
  // 1 brochure point = width / thin ticket width: the same layout at every size
  const scale = width / tokens.thin.frame.width
  const style = { width, height } as Record<string, string | number>
  // overlay tokens → --o-<name>, already in px at this size
  for (const [k, v] of Object.entries(o)) if (typeof v === 'number') style[`--o-${k}`] = `${v * scale}px`

  const points = BROCHURE.outline.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <div className="place" role="dialog" aria-modal="true" aria-label={`${captions.place}: ${place.name}`} onClick={onClose}>
      <div className="place__sheet" style={style as CSSProperties} onClick={(e) => e.stopPropagation()}>
        <svg className="place__shape" viewBox={`0 0 ${BROCHURE.width} ${BROCHURE.height}`} preserveAspectRatio="none" aria-hidden="true">
          <polygon points={points} className="place__paper" />
          {BROCHURE.folds.map(([x, y0, y1]) => (
            <line key={x} x1={x} y1={y0} x2={x} y2={y1} className="place__fold" />
          ))}
        </svg>
        <div className="place__content">
          <header className="place__head">
            <div className="place__names">
              <h2 className="place__title">{hyphenator.hyphenate(place.name, lang)}</h2>
              {place.hall && <p className="place__hall">{place.hall}</p>}
            </div>
            <button ref={closeRef} type="button" className="place__close" onClick={onClose} aria-label={captions.close}>
              <CloseIcon />
            </button>
          </header>
          <PlaceMap place={place} unavailable={captions.mapUnavailable} />
          <dl className="place__info">
            {place.address && (
              <>
                <dt>{captions.addressLabel}</dt>
                <dd>{place.address}</dd>
              </>
            )}
            {place.entry && (
              <>
                <dt>{captions.entryLabel}</dt>
                <dd>{hyphenator.hyphenate(place.entry, lang)}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
