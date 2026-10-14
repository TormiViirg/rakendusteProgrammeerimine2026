# PÖFF shift tickets — React + Vite

The volunteer "Minu vahetused" tickets, rebuilt from the mockups as a data-driven
component library: four ticket kinds, two ticket shapes, three languages.

```
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/
npm run build:single   # dist-single/index.html — everything inlined in one file

npm run check          # types, lint, unit tests (definitions, pipeline, catalogue, boundaries, docs)
npm run check:layout   # draws every test case in a headless browser (needs `npm run build && npm run preview`)
                       #   … -- --all   every screen class and boundary width (about half an hour)
npm run docs           # regenerates docs/TEST-CATALOGUE.md and docs/VARIANTS.md
```

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — the model, the layers, and
  "where do I change …?". Start here.
- **[docs/VARIANTS.md](docs/VARIANTS.md)** — every kind, its features, rules and
  all its variants (generated).
- **[docs/TEST-CATALOGUE.md](docs/TEST-CATALOGUE.md)** — every input class and
  boundary value the tests know (generated).

Preview URL params: `view=general|screening|desktop|desktop-general|mixed|test-base|test-each|test-pairs|test-variants|test-invalid`,
`page=<n>` (test views), `lang=et|en|ru`,
`screen=auto|320|393|430|land|tablet|desktop|wide`, `ratio=on|off`,
`mods=on|off`, `latency=<ms>`, `panel=0`.

## The four tickets

| kind | what it is | thin template | wide template |
|---|---|---|---|
| `break` | a pause; the one ticket without a location | headline | headline (one time row, large title) |
| `venue` | a shift at a cinema: when and where | headline | headline |
| `role` | a shift in a position, without a film | role | role |
| `screening` | a shift at a film screening | screening | screening |

Each is one folder in `src/tickets/`, and each differs along a few yes/no
**features** — night shift, subtitles, age rating, BC, Q&A, address, hall, note.
One assignment of a kind's features is a **variant**; what a ticket shows and
which numbers it uses depend on the variant and the ticket shape, and nothing
else. `docs/VARIANTS.md` lists them all.

## Two ticket shapes

| Shape | Size | Used on | Source |
|---|---|---|---|
| thin | 357 × 326 pt, notch on the right | phones in portrait, always one per row | the three phone mockups (px ÷ 3) |
| wide | 678 × 365 pt, notch on both sides | everything else | the desktop mockups (5760 px ÷ 4, and two at 1x) |

Thin tickets are never placed side by side. Wide tickets are: two per row on
a desktop (as in the mockup: 32 + 678 + 20 + 678 + 32 = 1440), three on very
wide screens, one on tablets and on a phone held sideways (`src/design/scales.ts`).
A screen narrower than 480 pt always gets thin tickets, whatever its shape: a
wide ticket there would be set at under half its size.

## Rules the data follows

Checked for every record before anything is drawn (`tickets/<kind>/record.ts`).
An **error** means the shift is not shown and the page says how many are missing;
a **warning** means it is shown without the bad part. Both go to the problem port
(the console, in the demo), each naming the shift, the field and the defect.
Nothing that arrives can take the page down: something that is not a record, an
unknown kind, the same id twice, a failed request — each is reported and the
rest is shown.

- **Only the cinema and the times are required.** The hall is optional except
  for a film. A break has no location.
- **Times** are local date-times (`2026-11-18T21:30`, seconds allowed, no time
  zone). The end must be after the start; the arrival not after the start.
- **A film brings its own required fields**: hall, at least one programme,
  runtime (≥ 1 min), time between screenings (≥ 0, shown as 999 at most),
  audience and screening code (six characters; another length is shown with a
  warning). A film title never appears without audience and code.
- **BC and Q&A** are shown only with a valid value: a whole number of at least
  one minute. Absent, `null` and `0` mean "none".
- **Age rating** is a number, 1–99, shown as "+18". Absent or `0` means no limit
  and no badge.
- **Night shifts.** A shift that ends on a later date than it starts
  (`core/shift/night.ts`). Only night shifts show the weekday line and the wolf prints.
- **A hall of another cinema** than the shift's is shown as sent, with a warning.
  A cinema shift shows no hall; one sent along is ignored.
- **An id without a lookup row** — or a film or programme the content store
  does not know — is shown raw, with a warning, rather than hidden. An optional
  id (hall, note, prefix) that is given but is not text is an error.
- **Colour follows the position** (`design/tones.ts`). Tickets without a role,
  and roles not in the table, are black. All colours in the code are `oklch()`.

## What never changes

The **outline** (357 × 326 thin, 678 × 365 wide) and the **strip** have one size
on every ticket, whatever is inside. No per-ticket rule may touch them — the
definition compiler rejects one that tries (`design/invariants.ts`) — and the
layout check measures every ticket. Content that does not fit is shrunk and then
cut; it never pushes the outline.

## Long text

A text may shrink by a quarter of its size, rounded to the nearest whole 4 pt
step (36 → 28, 32 → 24, 24 → 20, 20 → 16, 16 → 12, 12 → 8). In order: words may break
at syllable ends where more than one line is allowed; the text is set smaller
one step at a time; at the floor it is cut with "…". Anything cut opens in a
popover on hover, tap or keyboard focus; cut lists (subtitles, programmes) get
pulsing dots and show one value per line.

A ticket's spare room — a day shift has no weekday line, a film may have no
subtitles — is handed to the texts that need it, in the order its kind lists
(on the phone the film programme comes first). The decision is made in design
points, so the zoom does not tip it.

Syllable breaks are rule-based for Estonian, Russian and Finnish, with a list of
compound stems for Estonian ("filmi|programm"); English is left to the browser.

## Languages: three kinds of text

| Kind | Examples | Where | Changes |
|---|---|---|---|
| Fixed captions | arrival time, shift length, film, runtime, subtitles | `src/locales/*` → `ui` | with a frontend release |
| Lookup-table values | cinemas, addresses, entry instructions, halls, roles, audience types, weekdays, subtitle languages, the "Press" prefix, BC / Q&A / screening code, units | `src/locales/*` → `lut`, keyed by database id | rarely; mirrors DB tables with one column per language |
| Changing content | film titles, programme names | the content port, per target language, by collection | constantly |

A missing translation falls back along ru → en → et. Switching language keeps
the old content on screen (dimmed) until the new language arrives.

## The location sheet

The "?" on a screening ticket, the map brochure next to a cinema name and the
cinema name itself open a sheet over the schedule: cinema, hall, a map with a
pin, the written address and how to get in. It has the brochure icon's
silhouette and the width of a ticket; the page behind is blurred. It closes on
scroll, a tap on the background, the X, or Esc.

- Tiles: `MAP.tiles` in `design/map.ts` (OpenStreetMap by default — check their
  tile usage policy or point it at your own tile server before going live).
  Without network the sheet says the map could not be loaded and still shows the text.
- Coordinates in `adapters/backend-simulated/catalog.ts` are **approximate
  placeholders**, and `lut.venueEntry` holds **example** entry instructions.

## Mockup ratios

Thin ticket (phone mockups, px ÷ 3):

| Thing | pt | Relation |
|---|---|---|
| Card | 357 × 326 | width = 393 − 2 × 18; height = 27 × 12 + 2 |
| Perforation ticks | 2 × 2, every 12 | card height lands on this grid |
| Gap between cards | 20 | — |
| Stub notch | 13 deep | ≈ ⅓ of the card height, anchored to the bottom |
| Holo band / strip | 42 / 12 | 3.5 : 1 |
| Label and time type | 20 · 24 · 16 | role · headline · screening (5 : 6 : 4) |
| Hero type | 36 | 1.8× / 1.5× the label |

Wide ticket (desktop mockups, px ÷ 4):

| Thing | pt | Relation |
|---|---|---|
| Page | 1440 | 32 + 678 + 20 + 678 + 32 |
| Card | 678 × 365 | 1.9 × the thin width |
| Perforation ticks | 2 × 2, every 24 | twice the thin pitch, counted from the top |
| Notches | 14.5 deep, both sides | 152.5 → 24 pt above the bottom edge |
| Holo band / strip / footer | 42 / 40 / 30 | same band and strip as the thin headline ticket |
| Screening label and times | 27 | ⅔ of the headline ticket's 40 |
| Film title / cinema / hall | 32 | role 24, programme 24, subtitles 20 |
| Headline ticket: label · time · weekday · title | 40 · 38 · 32 · 46 | large title (break) 64 |
| Age badge | 86 diagonal | thin: 75 |
| Day heading | weekday 36, date 32 | rule 1 pt at 79 of 96 |

Fonts: Fira Sans Extra Condensed (text), Fira Mono (times, numerals, age
badge), Fira Sans Condensed (small captions).

**Ratio A/B** (`ratio=on|off`): A uses the clean values; B adds the raw
measurements where the mockup did not land on a clean number
(`design/tokens/measured.ts`).

## Placeholders and known differences

- `src/ui/assets/holo-band.png`, `holo-strip.png`, `holo-wide.png`, `paw.png` are
  cropped from the mockups — replace with the original artwork (same names).
- The menu bar is intentionally empty: `<Schedule menu={…} />` is the slot. On
  wide layouts the language switch sits in that slot.
- The map brochure and treasure map are the supplied vectors; the "?" is
  redrawn; barcodes are decorative.
- The mockups print "Pühapäev - 09.10.2026", which is not a Sunday. Weekdays are
  derived from the date, so the fixtures use 11.10.2026.
- **Wide role ticket** and the **location sheet** have no mockup; both are built
  from the sizes and spacing of the existing tickets.
- The desktop mockups disagree with each other in places; the build follows the
  4x one: notches on both sides, film title in regular weight.
- The 4x mockup stretches the start time horizontally (×1.29). Ratio A sets it
  unstretched; ratio B reproduces the stretch.
- The wide cinema mockup shows weekdays on a same-day shift; the build follows
  the stated rule and shows them only past midnight.

Comparisons against the mockups and screenshots of the test suites are in
`docs/compare/`; the last layout check is `docs/layout-check-result.txt`.

## Tests, in one paragraph

Every input of a ticket is a parameter whose values are split into equivalence
classes with named boundary values (`src/testing/catalogue`, listed in
`docs/TEST-CATALOGUE.md`): digit counts, midnight, text length tiers, list
lengths, missing and wrong-typed values, unknown and hostile ids. Suites combine
classes — one at a time, all pairs, every variant, one fault at a time — and
never invent values. Each case is checked twice against the same expectations:
on the pipeline's model (unit tests, three languages) and in a browser on every
class of screen (`check:layout`), together with layout: nothing outside the
outline, in a notch, overlapping or clipped, and one outline and strip size.
