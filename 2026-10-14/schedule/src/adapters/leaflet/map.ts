import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP } from '../../design/map'
import type { MapPort } from '../../ui/ports'
import './leaflet.css'

/**
 * ADAPTER — the MapPort with Leaflet and raster tiles (design/map.ts → MAP).
 * The pin is a plain element styled by the location sheet (`.place__pin`).
 */
export const leafletMap: MapPort = {
  show(el, { lat, lng, zoom }, onStatus) {
    const map = L.map(el, { center: [lat, lng], zoom, zoomControl: true, attributionControl: true })
    let loaded = false
    const tiles = L.tileLayer(MAP.tiles, { attribution: MAP.attribution, maxZoom: MAP.maxZoom })
    tiles.on('tileload', () => {
      loaded = true
      onStatus('loaded')
    })
    tiles.on('tileerror', () => {
      if (!loaded) onStatus('failed')
    })
    tiles.addTo(map)
    L.marker([lat, lng], {
      icon: L.divIcon({ className: 'place__pin', html: '<span></span>', iconSize: [0, 0] }),
      keyboard: false,
      interactive: false,
    }).addTo(map)
    // the sheet is laid out after mount: let Leaflet read the final size
    const raf = requestAnimationFrame(() => map.invalidateSize())
    return () => {
      cancelAnimationFrame(raf)
      map.remove()
    }
  },
}
