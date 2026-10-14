import { createContext, useContext } from 'react'
import type { Hyphenator } from '../core/ports'

/**
 * What the components need from outside at render time. The composition root
 * (app/compose.ts) supplies the implementations through <UiPortsProvider>.
 */

/** PORT — draws a map of one point. adapters/leaflet implements it. */
export interface MapPort {
  /**
   * Draws the map into `el` and returns a function that removes it again.
   * `onStatus` is called when the first tile has loaded, or when none could be.
   */
  show(el: HTMLElement, point: { lat: number; lng: number; zoom: number }, onStatus: (status: 'loaded' | 'failed') => void): () => void
}

export interface UiPorts {
  hyphenator: Hyphenator
  map: MapPort
}

const noPorts: UiPorts = {
  hyphenator: { hyphenate: (text) => text, knows: () => false },
  map: {
    show: (_el, _point, onStatus) => {
      onStatus('failed')
      return () => {}
    },
  },
}

const Ctx = createContext<UiPorts>(noPorts)
export const UiPortsProvider = Ctx.Provider
export const useUiPorts = () => useContext(Ctx)
