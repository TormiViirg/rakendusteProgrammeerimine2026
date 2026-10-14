# Test catalogue

> Generated from `src/testing` by `npm run docs`. Do not edit: `npm test` fails when this file is out of date.

Every input of a ticket is a **parameter**. Its values are split into **equivalence classes** — sets of
values the tickets are expected to treat alike — and every class names its **boundary values**, the edges
where mistakes live. A class says whether its values are valid, degraded (shown, with a warning) or invalid
(the shift is not shown), which problem must be reported for which field, and what must be observable when
one of its values is on a ticket. Expected texts are read from the locale files and the fixtures by the
catalogue itself (`src/testing/fixtures/expected.ts`) and checked in all three languages.

185 classes and 507 values across 4 ticket kinds.

## How the classes are combined

| suite | strategy | coverage | cases |
|---|---|---|---|
| `base` | base choice | the ordinary ticket of each kind | 4 |
| `each` | base choice: one parameter at a time through every valid and degraded value | every class and every boundary value, one parameter at a time | 329 |
| `pairs` | pairwise (all pairs of classes, representatives only) | every pair of classes | 236 |
| `variants` | every on/off assignment of the kind's features | every variant of every kind | 88 |
| `invalid` | one invalid value at a time (a second fault would hide the first) | every invalid class, one at a time: none of these may be drawn | 153 |

The unit tests run every case through the pipeline (`tests/catalogue`); `npm run check:layout` draws every case in a browser, on every screen below, in three languages.

## break

a pause between shifts; the one ticket without a location

### break · times

start and end of the pause. Base class: `day`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `day` | starts and ends on the same date: no weekday line | valid | start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | start `"2026-11-18T21:30"` · end `"2026-11-18T23:59"` — the last minute that is still the same date<br>start `"2026-11-18T00:00"` · end `"2026-11-18T08:00"` — the first minute of a date<br>start `"2026-11-18T18:00"` · end `"2026-11-18T18:01"` — the shortest shift<br>start `"2026-11-18T18:00:59"` · end `"2026-11-18T20:10:59"` — seconds are accepted and ignored | `start` shows the value, `end` shows the value, no `weekdays` |
| `night` | ends on the next date: weekday line (and wolf prints where the ticket has room) | valid | start `"2026-11-18T21:30"` · end `"2026-11-19T01:45"` | start `"2026-11-18T21:30"` · end `"2026-11-19T00:00"` — ends exactly at midnight: the first minute that counts as the next date<br>start `"2026-11-18T23:59"` · end `"2026-11-19T00:00"` — the shortest night shift<br>start `"2026-11-18T21:30"` · end `"2026-11-19T23:59"` — the last minute before a second midnight | `start` shows the value, `end` shows the value, `weekdays` shows "kolmapäev-neljapäev" |
| `multi-day` | ends two or more dates later: the weekday line names the first and the last day | valid | start `"2026-11-18T21:30"` · end `"2026-11-20T02:00"` | start `"2026-11-18T21:30"` · end `"2026-11-20T00:00"` — ends exactly at the second midnight: the shortest shift of the class | `start` shows "21:30", `end` shows the value, `weekdays` shows "kolmapäev-reede" |
| `ends-before-start` | the end is not after the start | **invalid** → `end: time-order` | start `"2026-11-18T20:10"` · end `"2026-11-18T18:00"` | start `"2026-11-18T18:00"` · end `"2026-11-18T18:00"` — start and end are the same minute<br>start `"2026-11-19T18:00"` · end `"2026-11-18T20:10"` — the end is a date earlier | not shown |
| `malformed` | a time that is not a local date-time | **invalid** → `start: bad-datetime`, `end: bad-datetime` | start `"18:00"` · end `"2026-11-18T20:10"` | start `"2026-11-18T18:00"` · end `"20:10"` — the same defect in the end time<br>start `"2026-02-30T18:00"` · end `"2026-02-30T20:10"` — right shape, but the date does not exist — in all three times<br>start `"2026-02-29T18:00"` · end `"2026-03-01T20:10"` — 29 February in a year that has none<br>start `"2026-11-18T24:00"` · end `"2026-11-19T02:00"` — one past the last hour<br>start `"2026-11-18T18:60"` · end `"2026-11-18T20:10"` — one past the last minute<br>start `"2026-11-18T18:00+02:00"` · end `"2026-11-18T20:10"` — a time-zone suffix: these are local times, converting would be a guess<br>start `"2026-11-18T18:00Z"` · end `"2026-11-18T20:10"` — a UTC marker<br>start `1800` · end `"2026-11-18T20:10"` — a number instead of text | not shown |
| `absent` | a time is not given at all | **invalid** → `start: missing`, `end: missing` | start *not sent* · end `"2026-11-18T20:10"` | start `"2026-11-18T18:00"` · end *not sent* — no end time | not shown |

### break · breakTitle

kind of pause (lookup id). Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `full-size` | 1–14 characters: starts at full size | valid | `"rest"` | `"tc-break-14"` — the longest text of the class<br>`"tc-break-1"` — the shortest possible name | `title` shows the value |
| `one-step-smaller` | 15–30 characters: starts 1 step smaller | valid | `"tc-break-mid"` | `"tc-break-15"` — the shortest text of the class<br>`"tc-break-30"` — the longest text of the class | `title` shows the value |
| `two-steps-smaller` | 31 characters and more: starts 2 steps smaller | valid | `"tc-break-long"` | `"tc-break-31"` — the shortest text of the class | `title` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-break-word"` |  | `title` shows "Öövahetusejärgnetaastumispausike" |
| `unknown` | an id the break table has no row for: the raw id is shown, with a warning | **degraded** → `breakId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `title` shows the value |
| `absent` | no kind of pause given, or not as text | **invalid** → `breakId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### break · note

note under the barcode (optional lookup id). Base class: `typical`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `none` | no note | valid | *not sent* | `null` — explicitly empty | no `caption` |
| `typical` | a short line | valid | `"playful"` |  | `caption` shows "Tehke midagi lapsikut :)" |
| `long-phrase` | more than the line holds | valid | `"tc-note-long"` |  | `caption` shows "Palun ärge lahkuge hoonest: järgmine vahetus a…" |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-note-word"` |  | `caption` shows "Vabatahtliketoaskohvijateepakutaksetasuta" |
| `unknown` | an id the note table has no row for: the raw id is shown, with a warning | **degraded** → `noteId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `caption` shows the value |
| `wrong-type` | the note is given, but not as text | **invalid** → `noteId: missing` | `42` | `""` — an empty text is not "none" | not shown |

## venue

a shift at a cinema: only when and where

### venue · times

arrival, start and end of the shift. Base class: `day`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `day` | starts and ends on the same date: no weekday line | valid | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-18T23:59"` — the last minute that is still the same date<br>arrival `"2026-11-18T00:00"` · start `"2026-11-18T00:00"` · end `"2026-11-18T08:00"` — the first minute of a date<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:01"` — the shortest shift<br>arrival `"2026-11-18T18:00"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — arrival exactly at the start: the latest allowed<br>arrival `"2026-11-18T23:40"` · start `"2026-11-19T00:10"` · end `"2026-11-19T06:00"` — arriving the evening before does not make it a night shift<br>arrival `"2026-11-18T17:40:59"` · start `"2026-11-18T18:00:59"` · end `"2026-11-18T20:10:59"` — seconds are accepted and ignored | `arrival` shows the value, `start` shows the value, `end` shows the value, no `weekdays` |
| `night` | ends on the next date: weekday line (and wolf prints where the ticket has room) | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T01:45"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T00:00"` — ends exactly at midnight: the first minute that counts as the next date<br>arrival `"2026-11-18T23:30"` · start `"2026-11-18T23:59"` · end `"2026-11-19T00:00"` — the shortest night shift<br>arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T23:59"` — the last minute before a second midnight | `arrival` shows the value, `start` shows the value, `end` shows the value, `weekdays` shows "kolmapäev-neljapäev" |
| `multi-day` | ends two or more dates later: the weekday line names the first and the last day | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T02:00"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T00:00"` — ends exactly at the second midnight: the shortest shift of the class | `arrival` shows "21:00", `start` shows "21:30", `end` shows the value, `weekdays` shows "kolmapäev-reede" |
| `ends-before-start` | the end is not after the start | **invalid** → `end: time-order` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T20:10"` · end `"2026-11-18T18:00"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:00"` — start and end are the same minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-19T18:00"` · end `"2026-11-18T20:10"` — the end is a date earlier | not shown |
| `arrival-after-start` | the arrival time is later than the start | **invalid** → `arrival: arrival-after-start` | arrival `"2026-11-18T18:30"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T18:01"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the first minute that is too late | not shown |
| `malformed` | a time that is not a local date-time | **invalid** → `start: bad-datetime`, `end: bad-datetime`, `arrival: bad-datetime` | arrival `"2026-11-18T17:40"` · start `"18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"20:10"` — the same defect in the end time<br>arrival `"17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the same defect in the arrival time<br>arrival `"2026-02-30T17:40"` · start `"2026-02-30T18:00"` · end `"2026-02-30T20:10"` — right shape, but the date does not exist — in all three times<br>arrival `"2026-11-18T17:40"` · start `"2026-02-29T18:00"` · end `"2026-03-01T20:10"` — 29 February in a year that has none<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T24:00"` · end `"2026-11-19T02:00"` — one past the last hour<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:60"` · end `"2026-11-18T20:10"` — one past the last minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00+02:00"` · end `"2026-11-18T20:10"` — a time-zone suffix: these are local times, converting would be a guess<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00Z"` · end `"2026-11-18T20:10"` — a UTC marker<br>arrival `"2026-11-18T17:40"` · start `1800` · end `"2026-11-18T20:10"` — a number instead of text | not shown |
| `absent` | a time is not given at all | **invalid** → `start: missing`, `end: missing`, `arrival: missing` | arrival `"2026-11-18T17:40"` · start *not sent* · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end *not sent* — no end time<br>arrival *not sent* · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — no arrival time | not shown |

### venue · venue

the cinema (lookup id). Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `full-size` | 1–14 characters: starts at full size | valid | `"artis"` | `"tc-venue-14"` — the longest text of the class<br>`"tc-venue-1"` — the shortest possible name | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `one-step-smaller` | 15–30 characters: starts 1 step smaller | valid | `"coca-cola-plaza"` | `"tc-venue-15"` — the shortest text of the class<br>`"tc-venue-30"` — the longest text of the class | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `two-steps-smaller` | 31 characters and more: starts 2 steps smaller | valid | `"nordic-forum"` | `"tc-venue-31"` — the shortest text of the class<br>`"tc-venue-long"` — a whole sentence of a name, with a long address | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-venue-word"` |  | `venue` shows "Rahvusvahelistefilmifestivalidekorraldustoimko…", has `locate`, `address` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…", `caption` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…" |
| `no-address` | a cinema known by name only: no address, no entry text, no coordinates | valid | `"tc-venue-bare"` | `"tc-venue-bare-long"` — the same with a long name | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `unknown` | an id the venue table has no row for: the raw id is shown, with a warning | **degraded** → `venueId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `absent` | no cinema given, or not as text | **invalid** → `venueId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

## role

a shift in a position, without a film: when, where and as what

### role · times

arrival, start and end of the shift. Base class: `day`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `day` | starts and ends on the same date: no weekday line | valid | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-18T23:59"` — the last minute that is still the same date<br>arrival `"2026-11-18T00:00"` · start `"2026-11-18T00:00"` · end `"2026-11-18T08:00"` — the first minute of a date<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:01"` — the shortest shift<br>arrival `"2026-11-18T18:00"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — arrival exactly at the start: the latest allowed<br>arrival `"2026-11-18T23:40"` · start `"2026-11-19T00:10"` · end `"2026-11-19T06:00"` — arriving the evening before does not make it a night shift<br>arrival `"2026-11-18T17:40:59"` · start `"2026-11-18T18:00:59"` · end `"2026-11-18T20:10:59"` — seconds are accepted and ignored | `arrival` shows the value, `start` shows the value, `end` shows the value, no `weekdays` |
| `night` | ends on the next date: weekday line (and wolf prints where the ticket has room) | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T01:45"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T00:00"` — ends exactly at midnight: the first minute that counts as the next date<br>arrival `"2026-11-18T23:30"` · start `"2026-11-18T23:59"` · end `"2026-11-19T00:00"` — the shortest night shift<br>arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T23:59"` — the last minute before a second midnight | `arrival` shows the value, `start` shows the value, `end` shows the value, `weekdays` shows "kolmapäev-neljapäev" |
| `multi-day` | ends two or more dates later: the weekday line names the first and the last day | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T02:00"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T00:00"` — ends exactly at the second midnight: the shortest shift of the class | `arrival` shows "21:00", `start` shows "21:30", `end` shows the value, `weekdays` shows "kolmapäev-reede" |
| `ends-before-start` | the end is not after the start | **invalid** → `end: time-order` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T20:10"` · end `"2026-11-18T18:00"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:00"` — start and end are the same minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-19T18:00"` · end `"2026-11-18T20:10"` — the end is a date earlier | not shown |
| `arrival-after-start` | the arrival time is later than the start | **invalid** → `arrival: arrival-after-start` | arrival `"2026-11-18T18:30"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T18:01"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the first minute that is too late | not shown |
| `malformed` | a time that is not a local date-time | **invalid** → `start: bad-datetime`, `end: bad-datetime`, `arrival: bad-datetime` | arrival `"2026-11-18T17:40"` · start `"18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"20:10"` — the same defect in the end time<br>arrival `"17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the same defect in the arrival time<br>arrival `"2026-02-30T17:40"` · start `"2026-02-30T18:00"` · end `"2026-02-30T20:10"` — right shape, but the date does not exist — in all three times<br>arrival `"2026-11-18T17:40"` · start `"2026-02-29T18:00"` · end `"2026-03-01T20:10"` — 29 February in a year that has none<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T24:00"` · end `"2026-11-19T02:00"` — one past the last hour<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:60"` · end `"2026-11-18T20:10"` — one past the last minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00+02:00"` · end `"2026-11-18T20:10"` — a time-zone suffix: these are local times, converting would be a guess<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00Z"` · end `"2026-11-18T20:10"` — a UTC marker<br>arrival `"2026-11-18T17:40"` · start `1800` · end `"2026-11-18T20:10"` — a number instead of text | not shown |
| `absent` | a time is not given at all | **invalid** → `start: missing`, `end: missing`, `arrival: missing` | arrival `"2026-11-18T17:40"` · start *not sent* · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end *not sent* — no end time<br>arrival *not sent* · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — no arrival time | not shown |

### role · role

the position (lookup id); also picks the accent colour. Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `toned` | a position with its own accent colour | valid | `"screening-manager"` | `"admin"` — every colour of the table is drawn once<br>`"ticket-seller"` — every colour of the table is drawn once<br>`"checker"` — every colour of the table is drawn once<br>`"viewer"` — every colour of the table is drawn once<br>`"black-carpet"` — every colour of the table is drawn once<br>`"projectionist"` — every colour of the table is drawn once<br>`"gate"` — every colour of the table is drawn once<br>`"gate-admin"` — every colour of the table is drawn once | `role` shows the value, the role's accent colour |
| `full-size` | no colour of its own (black) · 1–14 characters: starts at full size | valid | `"photographer"` | `"tc-role-14"` — the longest text of the class<br>`"tc-role-1"` — the shortest possible name | `role` shows the value, accent `oklch(0 0 0)` |
| `one-step-smaller` | no colour of its own (black) · 15–30 characters: starts 1 step smaller | valid | `"info-desk"` | `"tc-role-15"` — the shortest text of the class<br>`"tc-role-30"` — the longest text of the class | `role` shows the value, accent `oklch(0 0 0)` |
| `two-steps-smaller` | no colour of its own (black) · 31 characters and more: starts 2 steps smaller | valid | `"guest-coordinator-assistant"` | `"tc-role-31"` — the shortest text of the class<br>`"tc-role-long"` — a whole sentence of a title | `role` shows the value, accent `oklch(0 0 0)` |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-role-word"` |  | `role` shows "Filmikoopiatelogistikakoordinaatoriabiline", accent `oklch(0 0 0)` |
| `unknown` | an id the role table has no row for: the raw id is shown, with a warning | **degraded** → `roleId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `role` shows the value, accent `oklch(0 0 0)` |
| `absent` | no position given, or not as text | **invalid** → `roleId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### role · venue

the cinema (lookup id). Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `full-size` | 1–14 characters: starts at full size | valid | `"artis"` | `"tc-venue-14"` — the longest text of the class<br>`"tc-venue-1"` — the shortest possible name | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `one-step-smaller` | 15–30 characters: starts 1 step smaller | valid | `"coca-cola-plaza"` | `"tc-venue-15"` — the shortest text of the class<br>`"tc-venue-30"` — the longest text of the class | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `two-steps-smaller` | 31 characters and more: starts 2 steps smaller | valid | `"nordic-forum"` | `"tc-venue-31"` — the shortest text of the class<br>`"tc-venue-long"` — a whole sentence of a name, with a long address | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-venue-word"` |  | `venue` shows "Rahvusvahelistefilmifestivalidekorraldustoimko…", has `locate`, `address` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…", `caption` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…" |
| `no-address` | a cinema known by name only: no address, no entry text, no coordinates | valid | `"tc-venue-bare"` | `"tc-venue-bare-long"` — the same with a long name | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `unknown` | an id the venue table has no row for: the raw id is shown, with a warning | **degraded** → `venueId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `absent` | no cinema given, or not as text | **invalid** → `venueId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### role · hall

the hall (lookup id). Base class: `numbered`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `numbered` | a numbered hall: "Saal 8" | valid | `"tc-hall-8"` |  | `hall` shows "Saal 8" |
| `numbered-smallest` | hall number 1: one digit | valid | `"tc-hall-1"` |  | `hall` shows "Saal 1" |
| `numbered-widest` | a three-digit hall number | valid | `"tc-hall-999"` |  | `hall` shows "Saal 999" |
| `named` | a hall with a name: a row of the hall table, under the key the hall names | valid | `"tc-hall-named"` | `"tc-hall-short"` — a short name | `hall` shows the value |
| `long-phrase` | a name with a description | valid | `"tc-hall-long"` |  | `hall` shows "Suur kinosaal koos rõdu ja lisatoolidega (siss…" |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-hall-word"` |  | `hall` shows "Kammersaalilisaruumikompleks" |
| `unknown` | an id the hall table has no row for: the raw id is shown, with a warning | **degraded** → `hallId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `hall` shows the value |
| `other-cinema` | a hall that belongs to another cinema than the shift's: shown as sent, with a warning | **degraded** → `hallId: inconsistent` | `"tc-hall-elsewhere"` |  | `hall` shows "Saal 3" |
| `none` | no hall: the shift is for the whole cinema | valid | *not sent* | `null` — explicitly empty | no `hall` |
| `wrong-type` | the hall is given, but not as text | **invalid** → `hallId: missing` | `42` | `""` — an empty text is not "none" | not shown |

### role · bc

Black Carpet time, minutes (optional). Base class: `two-digit`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `absent` | not given: the item is not shown at all | valid | *not sent* | `null` — explicitly empty<br>`0` — 0 minutes means there is none: the largest value that is not shown | no `bc` |
| `one-digit` | 1–9 minutes | valid | `5` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `bc` shows the value |
| `two-digit` | 10–99 minutes | valid | `59` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `bc` shows the value |
| `three-digit` | 100–999 minutes | valid | `240` | `100` — the smallest three digit value<br>`999` — the largest three digit value | `bc` shows the value |
| `four-digit` | 1000 minutes and more: must still stay inside the footer | valid | `1440` | `1000` — the smallest four digit value | `bc` shows the value |
| `negative` | below zero: left out, with a warning | **degraded** → `bcMin: bad-number` | `-5` | `-1` — the largest negative whole number | no `bc` |
| `fraction` | not a whole number: left out, with a warning | **degraded** → `bcMin: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | no `bc` |
| `text` | digits sent as text: left out, with a warning | **degraded** → `bcMin: bad-number` | `"45"` |  | no `bc` |
| `wrong-type` | not a number at all: left out, with a warning | **degraded** → `bcMin: bad-number` | `true` | `[108]` — a list holding the number | no `bc` |

## screening

a shift at a film screening

### screening · times

arrival, start and end of the shift. Base class: `day`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `day` | starts and ends on the same date: no weekday line | valid | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-18T23:59"` — the last minute that is still the same date<br>arrival `"2026-11-18T00:00"` · start `"2026-11-18T00:00"` · end `"2026-11-18T08:00"` — the first minute of a date<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:01"` — the shortest shift<br>arrival `"2026-11-18T18:00"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — arrival exactly at the start: the latest allowed<br>arrival `"2026-11-18T23:40"` · start `"2026-11-19T00:10"` · end `"2026-11-19T06:00"` — arriving the evening before does not make it a night shift<br>arrival `"2026-11-18T17:40:59"` · start `"2026-11-18T18:00:59"` · end `"2026-11-18T20:10:59"` — seconds are accepted and ignored | `arrival` shows the value, `start` shows the value, `end` shows the value, no `weekdays` |
| `night` | ends on the next date: weekday line (and wolf prints where the ticket has room) | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T01:45"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T00:00"` — ends exactly at midnight: the first minute that counts as the next date<br>arrival `"2026-11-18T23:30"` · start `"2026-11-18T23:59"` · end `"2026-11-19T00:00"` — the shortest night shift<br>arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-19T23:59"` — the last minute before a second midnight | `arrival` shows the value, `start` shows the value, `end` shows the value, `weekdays` shows "kolmapäev-neljapäev" |
| `multi-day` | ends two or more dates later: the weekday line names the first and the last day | valid | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T02:00"` | arrival `"2026-11-18T21:00"` · start `"2026-11-18T21:30"` · end `"2026-11-20T00:00"` — ends exactly at the second midnight: the shortest shift of the class | `arrival` shows "21:00", `start` shows "21:30", `end` shows the value, `weekdays` shows "kolmapäev-reede" |
| `ends-before-start` | the end is not after the start | **invalid** → `end: time-order` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T20:10"` · end `"2026-11-18T18:00"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T18:00"` — start and end are the same minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-19T18:00"` · end `"2026-11-18T20:10"` — the end is a date earlier | not shown |
| `arrival-after-start` | the arrival time is later than the start | **invalid** → `arrival: arrival-after-start` | arrival `"2026-11-18T18:30"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T18:01"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the first minute that is too late | not shown |
| `malformed` | a time that is not a local date-time | **invalid** → `start: bad-datetime`, `end: bad-datetime`, `arrival: bad-datetime` | arrival `"2026-11-18T17:40"` · start `"18:00"` · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end `"20:10"` — the same defect in the end time<br>arrival `"17:40"` · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — the same defect in the arrival time<br>arrival `"2026-02-30T17:40"` · start `"2026-02-30T18:00"` · end `"2026-02-30T20:10"` — right shape, but the date does not exist — in all three times<br>arrival `"2026-11-18T17:40"` · start `"2026-02-29T18:00"` · end `"2026-03-01T20:10"` — 29 February in a year that has none<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T24:00"` · end `"2026-11-19T02:00"` — one past the last hour<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:60"` · end `"2026-11-18T20:10"` — one past the last minute<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00+02:00"` · end `"2026-11-18T20:10"` — a time-zone suffix: these are local times, converting would be a guess<br>arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00Z"` · end `"2026-11-18T20:10"` — a UTC marker<br>arrival `"2026-11-18T17:40"` · start `1800` · end `"2026-11-18T20:10"` — a number instead of text | not shown |
| `absent` | a time is not given at all | **invalid** → `start: missing`, `end: missing`, `arrival: missing` | arrival `"2026-11-18T17:40"` · start *not sent* · end `"2026-11-18T20:10"` | arrival `"2026-11-18T17:40"` · start `"2026-11-18T18:00"` · end *not sent* — no end time<br>arrival *not sent* · start `"2026-11-18T18:00"` · end `"2026-11-18T20:10"` — no arrival time | not shown |

### screening · role

the position (lookup id); also picks the accent colour. Base class: `toned`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `toned` | a position with its own accent colour | valid | `"screening-manager"` | `"admin"` — every colour of the table is drawn once<br>`"ticket-seller"` — every colour of the table is drawn once<br>`"checker"` — every colour of the table is drawn once<br>`"viewer"` — every colour of the table is drawn once<br>`"black-carpet"` — every colour of the table is drawn once<br>`"projectionist"` — every colour of the table is drawn once<br>`"gate"` — every colour of the table is drawn once<br>`"gate-admin"` — every colour of the table is drawn once | `role` shows the value, the role's accent colour |
| `full-size` | no colour of its own (black) · 1–14 characters: starts at full size | valid | `"photographer"` | `"tc-role-14"` — the longest text of the class<br>`"tc-role-1"` — the shortest possible name | `role` shows the value, accent `oklch(0 0 0)` |
| `one-step-smaller` | no colour of its own (black) · 15–30 characters: starts 1 step smaller | valid | `"info-desk"` | `"tc-role-15"` — the shortest text of the class<br>`"tc-role-30"` — the longest text of the class | `role` shows the value, accent `oklch(0 0 0)` |
| `two-steps-smaller` | no colour of its own (black) · 31 characters and more: starts 2 steps smaller | valid | `"guest-coordinator-assistant"` | `"tc-role-31"` — the shortest text of the class<br>`"tc-role-long"` — a whole sentence of a title | `role` shows the value, accent `oklch(0 0 0)` |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-role-word"` |  | `role` shows "Filmikoopiatelogistikakoordinaatoriabiline", accent `oklch(0 0 0)` |
| `unknown` | an id the role table has no row for: the raw id is shown, with a warning | **degraded** → `roleId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `role` shows the value, accent `oklch(0 0 0)` |
| `absent` | no position given, or not as text | **invalid** → `roleId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### screening · venue

the cinema (lookup id). Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `full-size` | 1–14 characters: starts at full size | valid | `"artis"` | `"tc-venue-14"` — the longest text of the class<br>`"tc-venue-1"` — the shortest possible name | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `one-step-smaller` | 15–30 characters: starts 1 step smaller | valid | `"coca-cola-plaza"` | `"tc-venue-15"` — the shortest text of the class<br>`"tc-venue-30"` — the longest text of the class | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `two-steps-smaller` | 31 characters and more: starts 2 steps smaller | valid | `"nordic-forum"` | `"tc-venue-31"` — the shortest text of the class<br>`"tc-venue-long"` — a whole sentence of a name, with a long address | `venue` shows the value, has `locate`, `address` shows the value, `caption` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-venue-word"` |  | `venue` shows "Rahvusvahelistefilmifestivalidekorraldustoimko…", has `locate`, `address` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…", `caption` shows "Staapli3,Tallinn,10415,sissepääshoovipooltläbi…" |
| `no-address` | a cinema known by name only: no address, no entry text, no coordinates | valid | `"tc-venue-bare"` | `"tc-venue-bare-long"` — the same with a long name | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `unknown` | an id the venue table has no row for: the raw id is shown, with a warning | **degraded** → `venueId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `venue` shows the value, has `locate`, no `address`, no `caption` |
| `absent` | no cinema given, or not as text | **invalid** → `venueId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### screening · hall

the hall (lookup id). Base class: `numbered`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `numbered` | a numbered hall: "Saal 8" | valid | `"tc-hall-8"` |  | `hall` shows "Saal 8" |
| `numbered-smallest` | hall number 1: one digit | valid | `"tc-hall-1"` |  | `hall` shows "Saal 1" |
| `numbered-widest` | a three-digit hall number | valid | `"tc-hall-999"` |  | `hall` shows "Saal 999" |
| `named` | a hall with a name: a row of the hall table, under the key the hall names | valid | `"tc-hall-named"` | `"tc-hall-short"` — a short name | `hall` shows the value |
| `long-phrase` | a name with a description | valid | `"tc-hall-long"` |  | `hall` shows "Suur kinosaal koos rõdu ja lisatoolidega (siss…" |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-hall-word"` |  | `hall` shows "Kammersaalilisaruumikompleks" |
| `unknown` | an id the hall table has no row for: the raw id is shown, with a warning | **degraded** → `hallId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `hall` shows the value |
| `other-cinema` | a hall that belongs to another cinema than the shift's: shown as sent, with a warning | **degraded** → `hallId: inconsistent` | `"tc-hall-elsewhere"` |  | `hall` shows "Saal 3" |
| `absent` | no hall given, or not as text | **invalid** → `hallId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### screening · audience

audience type (lookup id). Base class: `typical`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `short` | one or two words | valid | `"free"` | `"school"` — a single word | `audience` shows the value |
| `typical` | fits its two lines on the phone | valid | `"preregistered"` |  | `audience` shows "Eelregistreerimisega (kaelakaardiga)" |
| `long-phrase` | a sentence: wraps, shrinks, then is cut | valid | `"invited"` | `"tc-audience-long"` — far more than fits | `audience` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-audience-word"` |  | `audience` shows "Eelregistreerimiskohustusegaerilinastus" |
| `unknown` | an id the audience table has no row for: the raw id is shown, with a warning | **degraded** → `audienceId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `audience` shows the value |
| `absent` | no audience given, or not as text | **invalid** → `audienceId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### screening · prefix

marker before the film title (optional lookup id). Base class: `none`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `none` | no marker | valid | *not sent* | `null` — explicitly empty |  |
| `short` | one word | valid | `"press"` | `"premiere"` — the longest of the real ones | `film` shows the value |
| `long-phrase` | a marker as long as a title | valid | `"tc-prefix-long"` |  | `film` contains "Rahvusvaheline esilinastus pressile ja filmitöö…" |
| `unknown` | an id the prefix table has no row for: the raw id is shown, with a warning | **degraded** → `filmPrefixId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `film` shows the value |
| `wrong-type` | the prefix is given, but not as text | **invalid** → `filmPrefixId: missing` | `42` | `""` — an empty text is not "none" | not shown |

### screening · film

the film (id into the content store). Base class: `full-size`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `full-size` | 1–44 characters: starts at full size on the phone | valid | `"tc-film-typical"` | `"tc-film-1"` — the shortest possible title<br>`"tc-film-44"` — the longest title of the class | `film` shows the value |
| `one-step-smaller` | 45 characters and more: starts one step smaller on the phone | valid | `"tc-film-two-lines"` | `"tc-film-45"` — the shortest title of the class<br>`"tc-film-long"` — far more than fits | `film` shows the value |
| `unbreakable` | one very long word: it can break at syllables only, or be cut | valid | `"tc-film-word"` |  | `film` contains "Sünnipäevanädalalõpupeopärastlõunaväsimatusetus" |
| `no-spaces` | a URL-like title: no spaces and no syllables to break at | valid | `"tc-film-url"` |  | `film` contains "https://poff.ee/films/2026/competition/first-fe…" |
| `other-language` | not translated into Estonian: shown in a fallback language | valid | `"tc-film-untranslated"` | `"tc-film-other-script"` — only in a language outside the interface languages and the fonts | `film` shows the value |
| `unknown` | an id the content store does not know: the raw id is shown, with a warning | **degraded** → `filmId: unknown-id` | `"no-such-row"` | `"constructor"` — the name of something every object has<br>`"__proto__"` — the key that reaches an object's prototype<br>`"venue.artis"` — looks like a path into the tables | `film` shows the value |
| `absent` | no film given, or not as text | **invalid** → `filmId: missing` | *not sent* | `null` — explicitly empty<br>`""` — an empty text<br>`"   "` — only spaces<br>`42` — a number where an id belongs | not shown |

### screening · programmes

programmes the film belongs to (list of content ids, at least one). Base class: `several`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `one` | a single programme: no separator | valid | `["tc-prog-shorts"]` | `["tc-prog-english-only"]` — a single programme with a very long name, in English only<br>`["tc-prog-word"]` — a single programme that is one long word<br>`["tc-prog-debut","tc-prog-ooc"]` — the first separator | `programme` shows the value |
| `several` | the mockup's three: one line on the phone | valid | `["tc-prog-debut","tc-prog-ooc","tc-prog-fil…` |  | `programme` shows "Debüütfilmide võistlusprogramm - Väljaspool võ…" |
| `more-than-fit` | more than the line holds: more lines if the ticket has room, then cut with the animated dots | valid | `["tc-prog-main","tc-prog-baltic","tc-prog-i…` |  | `programme` shows "Põhivõistlusprogramm - Balti filmide võistlusp…" |
| `unknown-programme` | an id the content store does not know: shown as the raw id, with a warning | **degraded** → `programmeIds: unknown-id` | `["tc-prog-debut","no-such-programme"]` | `["constructor","__proto__","tc-prog-debut"]` — ids that are names every object has | `programme` shows the value |
| `none` | no programme: a film always belongs to at least one | **invalid** → `programmeIds: empty-list` | `[]` |  | not shown |
| `absent` | the field is left out | **invalid** → `programmeIds: missing` | *not sent* | `null` — explicitly empty | not shown |
| `not-a-list` | one programme sent bare, not in a list | **invalid** → `programmeIds: missing` | `"et"` |  | not shown |
| `not-ids` | a list whose entries are not ids | **invalid** → `programmeIds: missing` | `[1,2]` | `["et",null]` — a single entry that is not an id spoils the list<br>`["et",""]` — an empty text among the ids | not shown |

### screening · subtitles

subtitle languages (list of lookup ids, optional). Base class: `several`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `none` | no subtitles: the row is not shown | valid | `[]` | *not sent* — the field is left out altogether<br>`null` — explicitly empty | no `subtitles` |
| `one` | a single language: no separator | valid | `["et"]` | `["et","en"]` — the first separator | has `subtitles`, `subtitleList` shows the value |
| `several` | the mockup's nine: fills the two lines on the phone | valid | `["et","en","ru","sv","pa","zh","ja","uk","s…` |  | has `subtitles`, `subtitleList` shows "eesti, inglise, vene, rootsi, punjabi, mandari…" |
| `more-than-fit` | more than the lines hold: cut, with the animated dots | valid | `["et","en","ru","sv","fi","lv","lt","de","f…` |  | has `subtitles`, `subtitleList` shows "eesti, inglise, vene, rootsi, soome, läti, lee…" |
| `unknown-language` | a language code without a row: shown as the raw code, with a warning | **degraded** → `subtitleIds: unknown-id` | `["et","xx"]` | `["constructor","__proto__","et"]` — codes that are names every object has | has `subtitles`, `subtitleList` shows the value |
| `not-a-list` | one language sent bare, not in a list | **invalid** → `subtitleIds: missing` | `"et"` |  | not shown |
| `not-ids` | a list whose entries are not ids | **invalid** → `subtitleIds: missing` | `[1,2]` | `["et",null]` — a single entry that is not an id spoils the list<br>`["et",""]` — an empty text among the ids | not shown |

### screening · duration

runtime of the film, minutes. Base class: `three-digit`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `one-digit` | 1–9 minutes | valid | `5` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `duration` shows the value |
| `two-digit` | 10–99 minutes | valid | `45` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `duration` shows the value |
| `three-digit` | 100–999 minutes: what the strip is designed for | valid | `108` | `100` — the smallest three digit value<br>`999` — the largest three digit value | `duration` shows the value |
| `four-digit` | 1000 minutes and more: longer than any film, and it must still stay inside the strip | valid | `1234` | `1000` — the smallest four digit value | `duration` shows the value |
| `zero` | a film of no length: just below the smallest valid value | **invalid** → `durationMin: bad-number` | `0` |  | not shown |
| `negative` | below zero | **invalid** → `durationMin: bad-number` | `-5` | `-1` — the largest negative whole number | not shown |
| `fraction` | not a whole number | **invalid** → `durationMin: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | not shown |
| `text` | digits sent as text | **invalid** → `durationMin: bad-number` | `"45"` |  | not shown |
| `wrong-type` | not a number at all | **invalid** → `durationMin: bad-number` | `true` | `[108]` — a list holding the number | not shown |
| `absent` | no runtime given | **invalid** → `durationMin: missing` | *not sent* | `null` — explicitly empty | not shown |

### screening · gap

time between screenings, minutes. Base class: `three-digit`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `zero` | the next screening starts right away: the smallest valid value | valid | `0` |  | `gap` shows "0" |
| `one-digit` | 1–9 minutes | valid | `5` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `gap` shows the value |
| `two-digit` | 10–99 minutes | valid | `45` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `gap` shows the value |
| `three-digit` | 100–999 minutes: the widest value shown as given | valid | `108` | `100` — the smallest three digit value<br>`999` — the largest three digit value | `gap` shows the value |
| `over-cap` | more than 999: shown as 999 | valid | `5000` | `1000` — the first value that is capped | `gap` shows "999" |
| `negative` | below zero | **invalid** → `gapMin: bad-number` | `-5` | `-1` — the largest negative whole number | not shown |
| `fraction` | not a whole number | **invalid** → `gapMin: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | not shown |
| `text` | digits sent as text | **invalid** → `gapMin: bad-number` | `"45"` |  | not shown |
| `wrong-type` | not a number at all | **invalid** → `gapMin: bad-number` | `true` | `[108]` — a list holding the number | not shown |
| `absent` | no value given | **invalid** → `gapMin: missing` | *not sent* | `null` — explicitly empty | not shown |

### screening · bc

Black Carpet time, minutes (optional). Base class: `absent`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `absent` | not given: the item is not shown at all | valid | *not sent* | `null` — explicitly empty<br>`0` — 0 minutes means there is none: the largest value that is not shown | no `bc` |
| `one-digit` | 1–9 minutes | valid | `5` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `bc` shows the value |
| `two-digit` | 10–99 minutes | valid | `59` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `bc` shows the value |
| `three-digit` | 100–999 minutes | valid | `240` | `100` — the smallest three digit value<br>`999` — the largest three digit value | `bc` shows the value |
| `four-digit` | 1000 minutes and more: must still stay inside the footer | valid | `1440` | `1000` — the smallest four digit value | `bc` shows the value |
| `negative` | below zero: left out, with a warning | **degraded** → `bcMin: bad-number` | `-5` | `-1` — the largest negative whole number | no `bc` |
| `fraction` | not a whole number: left out, with a warning | **degraded** → `bcMin: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | no `bc` |
| `text` | digits sent as text: left out, with a warning | **degraded** → `bcMin: bad-number` | `"45"` |  | no `bc` |
| `wrong-type` | not a number at all: left out, with a warning | **degraded** → `bcMin: bad-number` | `true` | `[108]` — a list holding the number | no `bc` |

### screening · qa

Q&A time, minutes (optional). Base class: `two-digit`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `absent` | not given: the item is not shown at all | valid | *not sent* | `null` — explicitly empty<br>`0` — 0 minutes means there is none: the largest value that is not shown | no `qa` |
| `one-digit` | 1–9 minutes | valid | `5` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `qa` shows the value |
| `two-digit` | 10–99 minutes | valid | `59` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `qa` shows the value |
| `three-digit` | 100–999 minutes | valid | `240` | `100` — the smallest three digit value<br>`999` — the largest three digit value | `qa` shows the value |
| `four-digit` | 1000 minutes and more: must still stay inside the footer | valid | `1440` | `1000` — the smallest four digit value | `qa` shows the value |
| `negative` | below zero: left out, with a warning | **degraded** → `qaMin: bad-number` | `-5` | `-1` — the largest negative whole number | no `qa` |
| `fraction` | not a whole number: left out, with a warning | **degraded** → `qaMin: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | no `qa` |
| `text` | digits sent as text: left out, with a warning | **degraded** → `qaMin: bad-number` | `"45"` |  | no `qa` |
| `wrong-type` | not a number at all: left out, with a warning | **degraded** → `qaMin: bad-number` | `true` | `[108]` — a list holding the number | no `qa` |

### screening · rating

minimum age (optional). Base class: `two-digit`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `absent` | no age limit: no badge | valid | *not sent* | `null` — explicitly empty<br>`0` — 0 means no limit: the largest value without a badge | no `rating` |
| `one-digit` | 1–9: a single digit in the badge | valid | `6` | `1` — the smallest one digit value<br>`9` — the largest one digit value | `rating` shows the value |
| `two-digit` | 10–99: the widest rating the badge holds | valid | `16` | `10` — the smallest two digit value<br>`99` — the largest two digit value | `rating` shows the value |
| `three-digit` | a whole number too wide for the badge: no badge, with a warning | **degraded** → `ageRating: out-of-range` | `120` | `100` — the first value that is too wide | no `rating` |
| `negative` | below zero: no badge, with a warning | **degraded** → `ageRating: out-of-range` | `-5` | `-1` — the largest negative whole number | no `rating` |
| `fraction` | not a whole number: no badge, with a warning | **degraded** → `ageRating: bad-number` | `12.5` | `1.5` — the smallest step off a whole number that still prints differently | no `rating` |
| `text` | digits sent as text: no badge, with a warning | **degraded** → `ageRating: bad-number` | `"45"` |  | no `rating` |
| `wrong-type` | not a number at all: no badge, with a warning | **degraded** → `ageRating: bad-number` | `true` | `[108]` — a list holding the number | no `rating` |

### screening · code

screening code, always 6 characters. Base class: `standard`.

| class | represents | validity | representative | boundary values | must lead to |
|---|---|---|---|---|---|
| `standard` | exactly 6 characters | valid | `"020121"` | `"000000"` — the narrowest digits<br>`"WM8QGX"` — letters are wider than digits | `code` shows the value |
| `too-short` | fewer characters: shown, with a warning | **degraded** → `sessionCode: wrong-length` | `"0201"` | `"02012"` — one character short<br>`"7"` — a single character | `code` shows the value |
| `too-long` | more characters: shown, with a warning | **degraded** → `sessionCode: wrong-length` | `"020121-2026-A"` | `"0201210"` — one character too many | `code` shows the value |
| `absent` | no code: a screening always has one | **invalid** → `sessionCode: missing` | *not sent* | `""` — an empty text<br>`"   "` — only spaces<br>`20121` — the code sent as a number: its leading zeros are already lost | not shown |

## Screens

The classes of screen size are cut where the layout changes (`src/design/scales.ts`), with the widths on both sides of every change.

| screen | size | scale | what it stands for | quick run |
|---|---|---|---|---|
| `phone` | 393 × 873 | `phone` | the phone mockups | yes |
| `phone-min` | 320 × 568 | `phone` | the narrowest phone still in use: the smallest type | yes |
| `phone-max` | 599 × 960 | `phone` | last width that gets thin tickets: the largest zoom | `--all` |
| `narrow-square` | 479 × 479 | `phone` | a small square window: the widest screen that gets thin tickets whatever its shape | `--all` |
| `landscape-min` | 480 × 320 | `phone-landscape` | the narrowest screen that gets a wide ticket: the smallest type of all | `--all` |
| `landscape` | 844 × 390 | `phone-landscape` | a phone on its side | `--all` |
| `landscape-max` | 1099 × 500 | `phone-landscape` | the tallest and widest screen that still counts as a phone on its side | `--all` |
| `square` | 599 × 599 | `wide-1` | as wide as tall, just under 600: not upright, so no longer a phone | `--all` |
| `landscape-over` | 844 × 501 | `wide-1` | one pixel too tall to count as a phone on its side | `--all` |
| `tablet-min` | 600 × 960 | `wide-1` | first width that gets wide tickets: the smallest zoom of a wide ticket | yes |
| `tablet` | 768 × 1024 | `wide-1` | a tablet | `--all` |
| `tablet-max` | 1099 × 1400 | `wide-1` | last width with one column | `--all` |
| `desktop-min` | 1100 × 800 | `wide-2` | first width with two columns: the smallest two-column tickets | `--all` |
| `desktop` | 1440 × 900 | `wide-2` | the desktop mockups | yes |
| `desktop-max` | 2199 × 1200 | `wide-2` | last width with two columns | `--all` |
| `wide-min` | 2200 × 1200 | `wide-3` | first width with three columns | `--all` |
| `wide` | 2560 × 1080 | `wide-3` | an ultrawide monitor | `--all` |

