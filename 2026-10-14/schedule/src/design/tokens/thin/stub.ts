import { num } from '../leaf'

/**
 * Thin ticket: the stub — the coloured strip and the footer row under it.
 * PROTECTED: strip and footer heights and the strip inset (design/invariants.ts).
 */

/** Coloured strip above the footer. */
export const strip = {
  /** the strip stops at the notch: 13pt notch − 1pt outline */
  stubInset: 12,
  tallH: 40,
  infoH: 32,
  barcodeLen: 480,
  sepGap: 1,
  codeGap: 9,
  codeMid: 27,
  codeEnd: 14,
  codeLead: 27,
  blockFs: 20,
  blockLh: 22,
  blockPadY: 4,
  venuePadL: 7.5,
  venuePadR: 6,
  hallPadL: 19.5,
  hallPadR: 11.5,
  hallMaxW: '45%',
  iconW: 43,
  mapW: 18,
  mapH: 20,
  cellFs: 16,
  cellLh: 20,
  cellGap: 6,
  aPadTop: 3.8,
  aPadRight: 19.7,
  aPadBottom: 2,
  aPadLeft: 3.4,
  bPadY: 1.7,
  bPadRight: 3.5,
  bPadLeft: 10.2,
  sepInset: 2.2,
  sepW: 0.67,
  smallBasis: 80,
  smallFs: 12,
  smallLh: 14.3,
  unitGap: 3,
  bValueDrop: 0.7,
}

/** Footer row under the strip. */
export const foot = {
  h: 32,
  fs: 16,
  lh: 20,
  /** cinema address, shown when the footer has room (core/ticket/slot.ts → footerAddress) */
  addressFs: 12,
  /** numerals are set a touch narrower than the text in the mockups: 15.5 pt next to 16 pt text */
  numRatio: num(15.5 / 16),
  numTrack: -0.4,
  rolePadTop: 6.24,
  rolePadRight: 14,
  rolePadBottom: 5.76,
  rolePadLeft: 4.3,
  headlinePadTop: 7.3,
  headlinePadX: 14,
  headlinePadBottom: 4.7,
  scrPadTop: 5.64,
  scrPadBottom: 6.36,
  scrAPadLeft: 15.3,
  scrGap: 6,
  scrFirstMinW: 71.7,
  scrBPadRight: 12.4,
  scrBPadLeft: 9.3,
}
