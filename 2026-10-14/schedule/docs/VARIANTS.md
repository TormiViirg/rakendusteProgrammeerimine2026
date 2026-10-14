# Ticket kinds and their variants

> Generated from `src/tickets` by `npm run docs`. Do not edit: `npm test` fails when this file is out of date.

A kind has **features** (yes/no axes). One assignment of all of them is a **variant**. Which optional parts
(**slots**) a ticket has and which **rules** change its tokens depend on the variant and the ticket shape alone.

## break

a pause between shifts; the one ticket without a location.

| feature | meaning |
|---|---|
| `night` | the pause runs past midnight |
| `note` | it has a note under the barcode |

### break · thin

No variant rules.

Spare room: restore `thinHeadlineTitle`; grow —; at most 2 extra lines per field.

### break · wide

| rule | when | sets | why |
|---|---|---|---|
| `night` | night | `wide.headline.times.fs` = 36<br>`wide.headline.times.valueFs` = 34<br>`wide.headline.times.lh` = 49<br>`wide.headline.times.dayFs` = 28<br>`wide.headline.times.dayLh` = 32 | past midnight the time block is one step smaller (40 → 36), which gives the weekday line and the title more air |

Spare room: restore `wideHeadlineTitleLarge`; grow —; at most 1 extra line per field.

### break · all 4 variants

| variant | parts on a thin ticket | parts on a wide ticket | rules (thin · wide) |
|---|---|---|---|
| plain | — | — | — · — |
| note | caption | caption | — · — |
| night | weekdays, paw | weekdays, paw | — · night |
| night+note | weekdays, paw, caption | weekdays, paw, caption | — · night |

## venue

a shift at a cinema: only when and where.

| feature | meaning |
|---|---|
| `night` | the shift runs past midnight |
| `address` | the cinema has a written-out address |

### venue · thin

No variant rules.

Spare room: restore `thinHeadlineTitle`; grow —; at most 2 extra lines per field.

### venue · wide

| rule | when | sets | why |
|---|---|---|---|
| `day` | no night | `wide.headline.bodyPadBottom` = 34 | no weekday line by day, so the cinema sits higher: more room between cinema and barcode, less between cinema and times |
| `night` | night | `wide.headline.times.fs` = 36<br>`wide.headline.times.valueFs` = 34<br>`wide.headline.times.lh` = 49<br>`wide.headline.times.dayFs` = 28<br>`wide.headline.times.dayLh` = 32 | past midnight the time block is one step smaller (40 → 36), which gives the weekday line and the cinema more air |

Spare room: restore `wideHeadlineTitle`; grow —; at most 1 extra line per field.

### venue · all 4 variants

| variant | parts on a thin ticket | parts on a wide ticket | rules (thin · wide) |
|---|---|---|---|
| plain | locate | locate | — · day |
| address | caption, locate | caption, locate | — · day |
| night | weekdays, paw, locate | weekdays, paw, locate | — · night |
| night+address | weekdays, paw, caption, locate | weekdays, paw, caption, locate | — · night |

## role

a shift in a position, without a film: when, where and as what.

| feature | meaning |
|---|---|
| `night` | the shift runs past midnight |
| `hall` | the shift is in a particular hall |
| `bc` | it has a valid Black Carpet time |
| `address` | the cinema has a written-out address |

### role · thin

No variant rules.

Spare room: restore `thinRoleTitle`; grow —; at most 2 extra lines per field.

### role · wide

No variant rules.

Spare room: restore `wideRoleTitle` → `wideRoleVenue`; grow —; at most 1 extra line per field.

### role · all 16 variants

| variant | parts on a thin ticket | parts on a wide ticket | rules (thin · wide) |
|---|---|---|---|
| plain | locate | locate | — · — |
| address | address, locate | address, locate | — · — |
| bc | bc, locate | bc, locate | — · — |
| bc+address | bc, address, locate | bc, address, locate | — · — |
| hall | hall, locate | hall, locate | — · — |
| hall+address | hall, address, locate | hall, address, locate | — · — |
| hall+bc | hall, bc, locate | hall, bc, locate | — · — |
| hall+bc+address | hall, bc, address, locate | hall, bc, address, locate | — · — |
| night | weekdays, locate | weekdays, paw, locate | — · — |
| night+address | weekdays, address, locate | weekdays, paw, address, locate | — · — |
| night+bc | weekdays, bc, locate | weekdays, paw, bc, locate | — · — |
| night+bc+address | weekdays, bc, address, locate | weekdays, paw, bc, address, locate | — · — |
| night+hall | weekdays, hall, locate | weekdays, paw, hall, locate | — · — |
| night+hall+address | weekdays, hall, address, locate | weekdays, paw, hall, address, locate | — · — |
| night+hall+bc | weekdays, hall, bc, locate | weekdays, paw, hall, bc, locate | — · — |
| night+hall+bc+address | weekdays, hall, bc, address, locate | weekdays, paw, hall, bc, address, locate | — · — |

## screening

a shift at a film screening.

| feature | meaning |
|---|---|
| `night` | the shift runs past midnight |
| `rating` | the film has an age rating |
| `subtitles` | the film has subtitles |
| `bc` | it has a valid Black Carpet time |
| `qa` | it has a valid Q&A time |
| `address` | the cinema has a written-out address |

### screening · thin

| rule | when | sets | why |
|---|---|---|---|
| `no-subtitles` | no subtitles | `thin.holo.strip` = 22 | without subtitles there is room: the holo strip takes the desktop band's proportions (678 : 42 → 357 : 22) |

Spare room: restore `thinScreeningProgramme` → `thinScreeningFilm` → `thinScreeningSubs` → `thinScreeningAudience` → `thinScreeningVenue` → `thinScreeningRole`; grow `thinScreeningProgramme` +1 → `thinScreeningFilm` +1; at most 3 extra lines per field.

### screening · wide

No variant rules.

Spare room: restore `wideScreeningProgramme` → `wideScreeningFilm` → `wideScreeningSubs` → `wideScreeningRole`; grow `wideScreeningFilm` +1; at most 3 extra lines per field.

### screening · all 64 variants

| variant | parts on a thin ticket | parts on a wide ticket | rules (thin · wide) |
|---|---|---|---|
| plain | locate | locate | no-subtitles · — |
| address | address, locate | address, locate | no-subtitles · — |
| qa | qa, locate | qa, locate | no-subtitles · — |
| qa+address | qa, locate | qa, locate | no-subtitles · — |
| bc | bc, locate | bc, locate | no-subtitles · — |
| bc+address | bc, locate | bc, locate | no-subtitles · — |
| bc+qa | bc, qa, locate | bc, qa, locate | no-subtitles · — |
| bc+qa+address | bc, qa, locate | bc, qa, locate | no-subtitles · — |
| subtitles | subtitles, locate | subtitles, locate | — · — |
| subtitles+address | subtitles, address, locate | subtitles, address, locate | — · — |
| subtitles+qa | subtitles, qa, locate | subtitles, qa, locate | — · — |
| subtitles+qa+address | subtitles, qa, locate | subtitles, qa, locate | — · — |
| subtitles+bc | subtitles, bc, locate | subtitles, bc, locate | — · — |
| subtitles+bc+address | subtitles, bc, locate | subtitles, bc, locate | — · — |
| subtitles+bc+qa | subtitles, bc, qa, locate | subtitles, bc, qa, locate | — · — |
| subtitles+bc+qa+address | subtitles, bc, qa, locate | subtitles, bc, qa, locate | — · — |
| rating | rating, locate | rating, locate | no-subtitles · — |
| rating+address | rating, address, locate | rating, address, locate | no-subtitles · — |
| rating+qa | rating, qa, locate | rating, qa, locate | no-subtitles · — |
| rating+qa+address | rating, qa, locate | rating, qa, locate | no-subtitles · — |
| rating+bc | rating, bc, locate | rating, bc, locate | no-subtitles · — |
| rating+bc+address | rating, bc, locate | rating, bc, locate | no-subtitles · — |
| rating+bc+qa | rating, bc, qa, locate | rating, bc, qa, locate | no-subtitles · — |
| rating+bc+qa+address | rating, bc, qa, locate | rating, bc, qa, locate | no-subtitles · — |
| rating+subtitles | rating, subtitles, locate | rating, subtitles, locate | — · — |
| rating+subtitles+address | rating, subtitles, address, locate | rating, subtitles, address, locate | — · — |
| rating+subtitles+qa | rating, subtitles, qa, locate | rating, subtitles, qa, locate | — · — |
| rating+subtitles+qa+address | rating, subtitles, qa, locate | rating, subtitles, qa, locate | — · — |
| rating+subtitles+bc | rating, subtitles, bc, locate | rating, subtitles, bc, locate | — · — |
| rating+subtitles+bc+address | rating, subtitles, bc, locate | rating, subtitles, bc, locate | — · — |
| rating+subtitles+bc+qa | rating, subtitles, bc, qa, locate | rating, subtitles, bc, qa, locate | — · — |
| rating+subtitles+bc+qa+address | rating, subtitles, bc, qa, locate | rating, subtitles, bc, qa, locate | — · — |
| night | weekdays, locate | weekdays, paw, locate | no-subtitles · — |
| night+address | weekdays, address, locate | weekdays, paw, address, locate | no-subtitles · — |
| night+qa | weekdays, qa, locate | weekdays, paw, qa, locate | no-subtitles · — |
| night+qa+address | weekdays, qa, locate | weekdays, paw, qa, locate | no-subtitles · — |
| night+bc | weekdays, bc, locate | weekdays, paw, bc, locate | no-subtitles · — |
| night+bc+address | weekdays, bc, locate | weekdays, paw, bc, locate | no-subtitles · — |
| night+bc+qa | weekdays, bc, qa, locate | weekdays, paw, bc, qa, locate | no-subtitles · — |
| night+bc+qa+address | weekdays, bc, qa, locate | weekdays, paw, bc, qa, locate | no-subtitles · — |
| night+subtitles | weekdays, subtitles, locate | weekdays, paw, subtitles, locate | — · — |
| night+subtitles+address | weekdays, subtitles, address, locate | weekdays, paw, subtitles, address, locate | — · — |
| night+subtitles+qa | weekdays, subtitles, qa, locate | weekdays, paw, subtitles, qa, locate | — · — |
| night+subtitles+qa+address | weekdays, subtitles, qa, locate | weekdays, paw, subtitles, qa, locate | — · — |
| night+subtitles+bc | weekdays, subtitles, bc, locate | weekdays, paw, subtitles, bc, locate | — · — |
| night+subtitles+bc+address | weekdays, subtitles, bc, locate | weekdays, paw, subtitles, bc, locate | — · — |
| night+subtitles+bc+qa | weekdays, subtitles, bc, qa, locate | weekdays, paw, subtitles, bc, qa, locate | — · — |
| night+subtitles+bc+qa+address | weekdays, subtitles, bc, qa, locate | weekdays, paw, subtitles, bc, qa, locate | — · — |
| night+rating | weekdays, rating, locate | weekdays, paw, rating, locate | no-subtitles · — |
| night+rating+address | weekdays, rating, address, locate | weekdays, paw, rating, address, locate | no-subtitles · — |
| night+rating+qa | weekdays, rating, qa, locate | weekdays, paw, rating, qa, locate | no-subtitles · — |
| night+rating+qa+address | weekdays, rating, qa, locate | weekdays, paw, rating, qa, locate | no-subtitles · — |
| night+rating+bc | weekdays, rating, bc, locate | weekdays, paw, rating, bc, locate | no-subtitles · — |
| night+rating+bc+address | weekdays, rating, bc, locate | weekdays, paw, rating, bc, locate | no-subtitles · — |
| night+rating+bc+qa | weekdays, rating, bc, qa, locate | weekdays, paw, rating, bc, qa, locate | no-subtitles · — |
| night+rating+bc+qa+address | weekdays, rating, bc, qa, locate | weekdays, paw, rating, bc, qa, locate | no-subtitles · — |
| night+rating+subtitles | weekdays, rating, subtitles, locate | weekdays, paw, rating, subtitles, locate | — · — |
| night+rating+subtitles+address | weekdays, rating, subtitles, address, locate | weekdays, paw, rating, subtitles, address, locate | — · — |
| night+rating+subtitles+qa | weekdays, rating, subtitles, qa, locate | weekdays, paw, rating, subtitles, qa, locate | — · — |
| night+rating+subtitles+qa+address | weekdays, rating, subtitles, qa, locate | weekdays, paw, rating, subtitles, qa, locate | — · — |
| night+rating+subtitles+bc | weekdays, rating, subtitles, bc, locate | weekdays, paw, rating, subtitles, bc, locate | — · — |
| night+rating+subtitles+bc+address | weekdays, rating, subtitles, bc, locate | weekdays, paw, rating, subtitles, bc, locate | — · — |
| night+rating+subtitles+bc+qa | weekdays, rating, subtitles, bc, qa, locate | weekdays, paw, rating, subtitles, bc, qa, locate | — · — |
| night+rating+subtitles+bc+qa+address | weekdays, rating, subtitles, bc, qa, locate | weekdays, paw, rating, subtitles, bc, qa, locate | — · — |

