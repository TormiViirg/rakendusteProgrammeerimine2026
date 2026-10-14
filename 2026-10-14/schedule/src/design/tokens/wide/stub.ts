/**
 * Wide ticket: the stub — strip and footer row.
 * PROTECTED: strip and footer heights and the strip inset (design/invariants.ts).
 */

/** Coloured strip: inset on both sides by the notch. */
export const strip = {
  inset: 13.5,
  h: 40,
  fs: 20,
  numFs: 18,
  lead: 101.5,
  mid: 20,
  end: 4.5,
  /** the two blocks share the remaining width in the ratio of their mockup widths */
  blockA: '213fr',
  blockB: '310fr',
  aPadLeft: 21.5,
  bPadLeft: 14.5,
  padRight: 8,
  gap: 8,
  unitGap: 6,
  /** headline and role tickets: solid caps at both ends of the barcode */
  cap: 28,
}

export const foot = {
  h: 30,
  fs: 16,
  numFs: 14,
  padLeft: 33,
  padRight: 28.75,
  bcMinW: 99.75,
  gap: 12,
  /** gap between the audience text and the code label */
  audienceGap: 37,
  codeBasis: 174.25,
  addressFs: 15,
}
