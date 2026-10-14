import { FILM_TIERS, HERO_TIERS, type SizeTier } from '../../design/fit'

/**
 * Text fixtures for the test catalogue: texts of an exact length, a long
 * phrase, an unbreakable word. Lengths that matter are not typed in — they are
 * read from the rules they test (design/fit.ts), so a changed tier moves its
 * boundary values along.
 */

/** A text of exactly `n` characters, cut from `source` (which is repeated if too short). */
export function exact(n: number, source: string): string {
  let text = source
  while (text.length < n) text += ` ${source}`
  text = text.slice(0, n)
  // never end on a space or a hyphen: the length must be visible characters
  return /[\s-]$/.test(text) ? `${text.slice(0, -1)}a` : text
}

/** The character counts on both sides of every tier change: [14, 15, 30, 31] for the 36 pt headlines. */
export const tierEdges = (tiers: SizeTier[]): number[] => tiers.filter((t) => Number.isFinite(t.upToChars)).flatMap((t) => [t.upToChars, t.upToChars + 1])

export const HERO_EDGES = tierEdges(HERO_TIERS)
export const FILM_EDGES = tierEdges(FILM_TIERS)

/** Which tier a text of this length starts in: 0 = full size. */
export const tierOf = (tiers: SizeTier[], length: number) => tiers.find((t) => length <= t.upToChars)!.stepsDown

export const PHRASES = {
  venue: 'Tallinna Rahvusvaheline Filmifestivalide ja Audiovisuaalkultuuri Keskus Noblessneri sadamalinnakus',
  role: 'Rahvusvaheliste külaliste transpordi ja majutuse korralduse vanemkoordinaatori esimene asetäitja',
  break: 'Kohustuslik puhke- ja taastumispaus kõigile öövahetuse vabatahtlikele',
  film: 'Lugu sellest, kuidas üks väikese rannaküla kalur otsustas ühel udusel novembrihommikul sõita Tallinnasse filmifestivalile ja mis temaga seal kolme nädala jooksul juhtus',
}
