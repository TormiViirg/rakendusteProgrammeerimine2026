/**
 * The two ticket shapes.
 *   thin  the phone ticket (357 pt wide, notch on the right)
 *   wide  the landscape ticket (678 pt wide, notch on both sides)
 * Which one a screen gets is decided in scales.ts; thin tickets are never placed side by side.
 */
export const LAYOUTS = ['thin', 'wide'] as const
export type Layout = (typeof LAYOUTS)[number]
