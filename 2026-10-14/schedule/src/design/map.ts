/** Map tiles for the location sheet. Swap for a self-hosted tile server if wanted. */
export const MAP = {
  tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}

/**
 * The map brochure silhouette (from the supplied icon, 32 × 36): three folded
 * panels with slanted top and bottom edges. Background of the location sheet.
 */
export const BROCHURE = {
  width: 32,
  height: 36,
  outline: [
    [0, 1.07],
    [10.84, 3.25],
    [21.06, 0],
    [32, 1.25],
    [32, 34.03],
    [20.92, 32.63],
    [11.02, 36],
    [0, 33.73],
  ] as [number, number][],
  /** fold lines: [x, top y, bottom y] */
  folds: [
    [10.93, 3.25, 36],
    [21, 0, 32.63],
  ] as [number, number, number][],
}
