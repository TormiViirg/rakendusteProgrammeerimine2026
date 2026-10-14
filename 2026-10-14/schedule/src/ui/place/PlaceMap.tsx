import { useEffect, useRef, useState } from 'react'
import type { Place } from '../../core/shift/place'
import { useDesign } from '../design/context'
import { useUiPorts } from '../ports'

/**
 * The map on the location sheet. The drawing is behind the MapPort
 * (adapters/leaflet); this component gives it an element and a point and shows
 * a notice when there is no point or no tile could be loaded.
 */
export function PlaceMap({ place, unavailable }: { place: Place; unavailable: string }) {
  const { tokens } = useDesign()
  const { map } = useUiPorts()
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const { lat, lng } = place
  const hasPoint = typeof lat === 'number' && typeof lng === 'number'
  const zoom = tokens.overlay.zoom.n

  useEffect(() => {
    const el = ref.current
    if (!el || !hasPoint) return
    return map.show(el, { lat: lat!, lng: lng!, zoom }, (status) => setFailed(status === 'failed'))
  }, [map, hasPoint, lat, lng, zoom])

  const noMap = failed || !hasPoint
  return (
    <div className="place__map" data-failed={noMap || undefined}>
      <div ref={ref} className="place__leaflet" />
      {noMap && <p className="place__nomap">{unavailable}</p>}
    </div>
  )
}
