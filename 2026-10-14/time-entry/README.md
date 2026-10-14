# Minu vabad ajad – volunteer availability (front end)

React + Vite + TypeScript. Volunteers mark when they are free inside the
intervals an admin has opened. Phone and desktop layouts, Estonian / English /
Russian, no backend yet (an in-memory dummy stands behind the backend port).

```
npm install
npm run dev          # http://localhost:5173
npm test             # 309 domain / adapter / architecture tests (Vitest)
npm run test:ui      # 80 browser tests, phone + desktop + touch, ET/EN/RU (Playwright)
```

Demo switches (query string):

| Switch | Values | Effect |
| --- | --- | --- |
| `scenario` | `demo` · `fresh` · `backToBack` · `single` · `overlap` · `gen-…` | dummy data set; `gen-<span>-<teams>-<time>-<filled>` are the 192 generated boundary combinations |
| `touch` | – | force the touch time drums (otherwise: any coarse pointer) |
| `matrix` | – | lists the generated combinations with links (`?matrix`) |
| `now` | ISO instant, or `system` | "current time"; default is the scenario's own (Tue 3 Nov 2026 10:00 Tallinn for `demo`) |
| `lang` | `et` · `en` · `ru` | language (otherwise the remembered one, then Estonian) |
| `day` | `2026-11-06` | day to open on |
| `days` | `5` | Monday–Friday columns, as drawn in the desktop mock-ups (default Monday–Sunday) |

## The model

Everything is a UTC instant; wall-clock time exists only at the edges.

```
Period            the general interval the admin enters (UTC)
└─ ShiftWindow    sub-interval: one per illustrative day per team (admin data)
   └─ OpenDay     what the volunteer sees: every team's windows of a day merged into one open area
      └─ DaySelection   any number of volunteer intervals inside it; current / confirmed / leaderAdded / leaderRemoved
```

* The volunteer never deals with teams: one open area, one selection and one
  comment per day. Which team a chosen hour goes to is the backend's bookkeeping.
  Only a team lead's own entries carry a team (and wear its colour).
* An **illustrative day** may run past midnight. Positions inside it are *day
  minutes* (25:30 → 1530), so "next day's night" stays under the day that
  reached midnight.
* **Grace** is judged per open piece: once `now ≥ piece.start − grace`, confirmed
  time in that piece can no longer be removed, adding still works. A volunteer
  in several teams gets the harshest grace for all of them. Enforced by one
  invariant in `domain/selection.ts`: the frozen part of `confirmed` ⊆ `current`.
* **Past**: once a piece has ended nothing responds there, and no lock is shown.
* **Entered times** are rounded to the step (5 min) and clipped to the open
  pieces – in one place (`TimeWheel.settle` → `domain/selection.snap`).
* **Desktop grid**: columns always start at a Monday. When the whole week does
  not fit, the week is cut into chunks of N days counted from Monday, so
  resizing keeps the week and chunk boundaries never move. The longest open
  area among the visible days sets the rows; gaps and days without a window
  are crossed out; a crossed-out block ends at midnight and starts again after
  the night note. A gap shorter than an hour between two pieces (17:30 → 17:45)
  stays inside one cell as a visible closed band – the click picks both open
  parts, never the gap.
* **Tab locks** mark today and the days before it; grace-period days, where
  time can still be added, carry none. Frozen cells keep their own lock icon.
* The **feedback tone** (nudge / neutral / praise) sets the border colour of the
  volunteer's entries – green once the target is met.

## Ports and adapters

```
src/
  domain/      pure rules, no imports from outside (time, calendar, rules, selection, grid, textFit)
    stats/     the feedback engine
  ports/       ScheduleBackend · Clock · Preferences · TextMeasure · ZoneFactory
  adapters/    dummy backend + scenarios + 144 generated combinations (UTC DTOs),
               Intl time zone, clocks, localStorage+cookie preferences, canvas text
               measure, i18next, rule-based hyphenator (ET/RU; EN uses the browser)
  app/         reducer, read models, design scale, React context
  ui/          mobile/ · desktop/ · shared/ · dev/ (the ?matrix page) · styles/ (oklch only)
  main.tsx     composition root – the only file that picks adapters
```

`tests/architecture.test.ts` fails the build when a layer imports the wrong
way, or when a colour that is not `oklch()` appears.

To attach the real backend: implement `ScheduleBackend` (two methods) and swap
one line in `main.tsx`. The DTO in `adapters/dummy/dto.ts` is the proposed wire
format.

## The feedback engine (`domain/stats`)

```
schedule ─▶ facts ─▶ level machines ─▶ rule table ─▶ MessageSpec ─▶ i18n ─▶ text fitter
            per day/     Moore machine     WHEN predicate     key + numbers    words    2-pt size ladder
            week/month/  with hysteresis   SAY key WITH params
            period (UTC)
```

* **facts.ts** – numbers per scope: slots, minutes, distinct days, target, ratio, cohort percentile.
* **levelMachine.ts** – `none → low → near → met`, with hysteresis so the sentence does not flicker.
* **predicates.ts** – a small JSON-serialisable condition language (`all` / `any` / `not` / comparisons / level tests).
* **rules.ts** – the table: condition, message key, which facts feed which placeholder, priority.
* **engine.ts** – `advance(state, input) → (state', feedback)`; never produces prose.
* **locales/*.json** – the wording, with plural forms per language.
* **textFit.ts** – size ladder in 2-point steps (1 pt = 1 mock-up pixel); smaller rungs allow more rows.
  A size never drops below three quarters of its base, rounded down to whole steps: 36 → 28, 48 → 36, 64 → 48
  (`floorSize`). Components shrink under the same rule (`--shrink-floor`): the "Mulle sobib" row, the range
  nav titles. Nothing is ever drawn outside its slot; long titles wrap inside it.

Targets and cohort quantiles are dummy values in `adapters/dummy/scenarios.ts`.

## Design scale

Phone: one unit `u` = width ÷ 393 (mock-ups @3x). Desktop: the mock-ups sit on
a 12-column grid (32u margins, 96u columns, 20u gutters at 1440 wide); the time
column and every day column are two grid columns, and `u` is derived from the
page width and the number of day columns (`app/layout.ts`). So margins, gutters,
rows and type all scale together: a seven-day week at 1440 px renders at
0.76u, five days at 1.0u. Columns are dropped when the smallest running text (12 u) would fall under
9 px, i.e. when `u` < 0.75 – the text decides the minimum column.
Type is Fira Sans Extra Condensed and Fira Mono, identified by fitting the
mock-up text; "pt" in the feedback ladder means one mock-up pixel.
`docs/` holds side-by-side comparisons with the mock-ups.

Position colours (`adapters/dummy/positions.ts`) are the ticket hex codes
converted to oklch. The volunteer's own entries take the feedback accent:
blue while more time is wanted, green once the target is met – never red or
orange. Touch devices get two scroll drums (hours, minutes) in place of the
typed wheel, in the same mono-and-rule style.

## Tests

`tests/BOUNDARIES.md` lists every case with the equivalence class or boundary
it stands for (regenerate with `node scripts/boundaries.mjs`).
