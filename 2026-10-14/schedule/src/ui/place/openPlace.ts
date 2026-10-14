import { createContext, useContext } from 'react'
import type { Place } from '../../core/shift/place'

/** Opens the location sheet for a cinema. Provided by <PlaceOverlayProvider>; a no-op without one. */
export const PlaceContext = createContext<(place: Place) => void>(() => {})
export const useOpenPlace = () => useContext(PlaceContext)
