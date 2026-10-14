# Architecture

How the shift tickets are built, and where to change what.

## The idea

A ticket is not drawn by a component that knows everything. It is the result of a
short pipeline, the same for every type of ticket, driven by one declarative
**definition per ticket kind**:

```
 backend record
      │  check        is the record well-formed?            tickets/<kind>/record.ts
      ▼
 checked record ──────────────────────────────▶ problems (errors: not shown · warnings: shown)
      │  build        record + lookups → display text       tickets/<kind>/build.ts
      ▼
 model
      │  describe     which yes/no features does it have?   tickets/<kind>/features.ts
      ▼
 ticket = model + VARIANT
      │  plan         variant × ticket shape →              tickets/<kind>/layouts.ts
      ▼               slots, token changes, space budget
 plan
      │  render       the kind's view for that shape        tickets/<kind>/view/
      ▼
 DOM  ⇄  fit          every text fitted; spare room         core/fit  (two state machines)
                      handed out
```

The first three stages run once per record (`core/ticket/pipeline.ts`), the
fourth when the ticket is drawn (`core/ticket/plan.ts`), because it depends on
whether the screen gets thin or wide tickets.

Three ideas carry the design:

1. **Ticket kinds are a closed list of definitions** (`tickets/registry.ts`).
   The engine knows none of them by name. Adding a kind is adding a folder.
2. **Sub-variants are a feature model.** Tickets of a kind differ along a few
   yes/no features (night, subtitles, rating, BC …). One assignment is a
   *variant*; a kind with *n* features has 2ⁿ. Which parts a ticket has and which
   token changes apply are functions of the variant alone — so every variant can
   be listed (`docs/VARIANTS.md`), checked and tested.
3. **Ports and adapters.** The engine reaches the outside world — backend,
   translations, map, hyphenation — only through interfaces (`core/ports`,
   `ui/ports.ts`). `app/compose.ts` is the one place that picks implementations.

## Vocabulary

| word | meaning | lives in |
|---|---|---|
| **kind** | a type of ticket: `break`, `venue`, `role`, `screening` | `tickets/<kind>/kind.ts` |
| **record** | what the backend sends for a shift: ids, numbers, local times | `tickets/<kind>/record.ts` |
| **check** | a named rule a record must satisfy | `core/shift/checks.ts` |
| **model** | the record as display-ready text | `tickets/<kind>/model.ts` |
| **feature** | a yes/no property of a model: `night`, `subtitles` … | `tickets/<kind>/features.ts` |
| **variant** | one assignment of all features of a kind | `core/ticket/feature.ts` |
| **slot** | an optional part of a ticket and when it is present | `tickets/<kind>/features.ts` |
| **rule** | token changes for the variants that match a condition | `tickets/<kind>/layouts.ts` |
| **budget** | which texts get a ticket's spare room, in what order | `tickets/<kind>/layouts.ts` |
| **shape** (layout) | `thin` (phone) or `wide` (everything else) | `design/layout.ts`, `design/scales.ts` |
| **template** | a body composition: role, headline, screening — per shape | `tickets/*/view`, `ui/templates` |
| **field** | a dynamic text slot of a template, with its sizing behaviour | `design/fields.ts` |
| **token** | a number, colour or font | `design/tokens/` |

Kinds and templates are different things. A kind says what a ticket *means*; a
template says how a body is *composed*. `venue` and `break` are two kinds that
share the headline template; tokens and fields belong to templates.

## A kind, in full

`tickets/venue/` is the smallest one. Each file answers one question:

| file | question | layer |
|---|---|---|
| `record.ts` | what does the backend send, and what must hold? | data + checks |
| `model.ts` | what is on the ticket, as text? | data |
| `build.ts` | how does a record become a model? | logic, through ports |
| `features.ts` | along which axes do tickets differ, and which optional parts follow? | data |
| `layouts.ts` | per shape: which variants change which tokens, and who gets spare room? | data |
| `kind.ts` | — assembles the five into the definition | — |
| `view/Thin.tsx`, `view/Wide.tsx` | how is it drawn? | React |

A view receives `{ model, slots, captions }`. It draws; it decides nothing about
presence — `slots.bc` is already the answer to "is there a BC column?".

## The two state machines

Fitting cannot be computed up front: whether a text fits depends on fonts and
line breaks. So it is done by measuring — but the *decisions* are pure functions
that see the DOM only through a small interface, which is why they are unit-tested
without a browser.

**Per text — `core/fit/fitText.ts`**

```
 WHOLE ──does not fit──▶ BROKEN ──does not fit──▶ SMALLER ──at the floor──▶ CUT with "…"
 start size             words may break          one 4 pt step               full text in
                        at syllables             at a time                   the popover
```

`BROKEN` exists only where more than one line is allowed. `SMALLER` first tries
to stay on fewer lines, then uses the full line budget. The floor is a quarter
off, rounded to the nearest whole 4 pt step below the field size — 36 → 28,
16 → 12, 12 → 8 (`core/fit/floor.ts`); for small sizes the rounding makes it a
third. `ui/fit/Fit.tsx` is the probe.

**Per ticket body — `core/fit/allocator.ts`**

```
 SETTLED ──pick──▶ TRYING(grant) ──fits──▶ SETTLED …           (grant kept)
    │                   │
    │ nothing left      └──overflows──▶ REVERTING ──▶ SETTLED   (grant undone, blocked)
    ▼
  DONE
```

Grants, in this order: give a long text back the size it started below; one more
line for what is shrunk or cut; then enlarge the `grow` fields. It always ends:
kept grants count towards a cap, failed ones are blocked — and it ends soon: every
state is one layout pass, so it stops trying new grants after `MAX_PASSES` (40,
below React's limit of 50 nested updates). `ui/fit/SpaceBudget.tsx` feeds it
observations of the DOM; "overflows" is judged with a tolerance in design points,
so the zoom does not tip the decision. (Line breaks still depend on sub-pixel
text widths: `check:layout --all` prints how many tickets were fitted differently
on two screens of the same class.)

The allocator only reaches texts inside the body it wraps, and a text is
re-measured when its own inputs change — so texts that receive grants must not
share a flexible row with each other. Today they sit in fixed grid columns.

The allocator drives the text machines: each grant changes what a `<Fit>` may do,
and the next observation reports how they settled.

## Layers and the dependency rule

```
src/
  design/     DATA      tokens, fields, scales, modifiers, tones, invariants
  locales/    DATA      et, en, ru: captions and lookup tables
  core/       ENGINE    ports · shift value objects · ticket engine · fit · schedule · design resolution
  tickets/    KINDS     one folder per kind (definition) + its views
  ui/         REACT     frame, fit, parts, templates, schedule page, location sheet, styles
  adapters/   OUTSIDE   backend-simulated · i18next · leaflet · hyphenation · console
  testing/    TESTS     catalogue of input classes, suites, fixtures, screens
  app/        ROOT      compose.ts (wiring) + the demo shell
```

| layer | may import |
|---|---|
| `design`, `locales` | nothing |
| `core` | `design` |
| `tickets/<kind>/*.ts` | `core`, `design` — and no other kind |
| `testing` | `tickets`, `core`, `design`, `locales` |
| `ui` | `core`, `design` + React |
| `tickets/<kind>/view`, `tickets/views.ts` | `ui`, its own kind, `core`, `design` + React |
| `adapters/<name>` | `core`, `design`, `locales`, `tickets` (types), `ui/ports.ts` + the one library it wraps — and no other adapter |
| `app` | everything |

`tests/architecture/boundaries.test.ts` enforces this table on every import, so
it cannot erode. Arrows point inwards: nothing in `core`, `design` or a kind
definition knows React, the DOM, i18next, Leaflet or the backend.

### Ports and their adapters

| port | what the engine asks for | adapter in the demo | to replace it |
|---|---|---|---|
| `ScheduleSource` | the shift records | `adapters/backend-simulated` | one that calls `GET /my-shifts` |
| `ContentSource` | changing texts in a language, by collection (`films`, `programmes`, … — a kind names the collections it needs in `content`) | `adapters/backend-simulated` | one that calls the CMS |
| `Catalog` | coordinates, hall numbers | `adapters/backend-simulated` | the same data from the backend |
| `Lookup` | captions, patterns and lookup-table rows in a language | `adapters/i18next` + `src/locales` (i18next for captions and patterns; the tables are plain maps) | load the tables from the backend (`addRows`) |
| `Hyphenator` | syllable breaks | `adapters/hyphenation` (rules) | a dictionary-based library |
| `MapPort` (`ui/ports.ts`) | draw a map of one point | `adapters/leaflet` | another map, or none |
| `ProblemSink` | where data problems go | `adapters/console` | your monitoring |

To go live, write the first three against the real API and change three lines in
`app/compose.ts`. The response shapes are `core/shift/records.ts` and
`tickets/<kind>/record.ts`.

What the ports do **not** hide: the list of fixed captions (`core/schedule/captions.ts`)
and the names of the lookup tables a kind reads (`'venue'`, `'role'` …) are part of
the engine's vocabulary. A new caption or table is an edit there and in the three
locale files — the unit tests fail until all three have it.

### Data is never trusted

Everything that arrives through a port is treated as data that may be wrong:

- **Records.** `makeTicket` accepts `unknown`. Not an object, no id, an unknown
  kind, a failed check, a definition that throws — each ends as a list of
  problems, never as an exception. A problem names the **field** and one of a
  fixed set of defect codes (`core/ticket/problem.ts`: `missing`, `bad-datetime`,
  `time-order`, `bad-number`, `out-of-range`, `empty-list`, `wrong-length`,
  `unknown-id`, `duplicate-id`, `malformed`, `unknown-kind`, `failed` …). The
  codes describe defects, not fields, so a new kind needs no new code.
- **Ids.** An id is looked up as a plain key — never as a property path, never
  on a prototype. `"constructor"`, `"a.b"` and `"__proto__"` are ordinary ids
  without a row. The test catalogue sends them through every id field and both lists.
- **Responses.** A schedule that is not a schedule is an empty one; a group that
  is not a group is skipped; section ids are made unique.
- **Content.** Loaded content is only used for the records it was fetched for;
  an id it lacks — or an answer of the wrong shape — is shown raw and reported;
  a failed request shows a notice.
- **Contradictions.** A hall that belongs to another cinema than the shift's is
  shown as sent and reported (`inconsistent`).
- **Views.** A ticket whose view throws is left out and reported
  (`ui/schedule/TicketBoundary.tsx`); the rest of the page stays, and the ticket
  is tried again when its content changes. (The page's "N shifts could not be
  shown" line counts faulty records, not failing views.)

## Where do I change …?

| I want to … | change |
|---|---|
| change a size, gap or colour | `design/tokens/…` (the file of the template or part) |
| change how a text shrinks, or its line budget | `design/fields.ts`, `design/tokens/lines.ts`, `design/fit.ts` |
| give a certain variant different numbers | a rule in `tickets/<kind>/layouts.ts` |
| change who gets spare room | the budget in `tickets/<kind>/layouts.ts` |
| show or hide a part under other conditions | the slot in `tickets/<kind>/features.ts` |
| add something a ticket can differ by | a feature in `tickets/<kind>/features.ts` (+ its witness in `testing/catalogue/kinds.ts`) |
| add a fixed caption | the key in `core/schedule/captions.ts` + the text in all three `src/locales/*.ts` |
| add a kind of changing content | return its collection from the kind's `content`, read it with `ctx.contentText` |
| accept or reject other data | the checks in `tickets/<kind>/record.ts`, `core/shift/checks.ts` |
| change what "night" means | `core/shift/night.ts` |
| change which screens get which tickets | `design/scales.ts` |
| change a page-wide adjustment | `design/modifiers.ts` |
| change a role colour | `design/tones.ts` |
| change a caption or a lookup row | `src/locales/*.ts` |
| change how a ticket is laid out | its view, and the stylesheet named in the view's comment |
| add a test category | a class in `testing/catalogue/parameters/…`, then `npm run docs` |
| add a screen size to test | `testing/screens.ts` |

## Adding a ticket kind

Say, a `training` ticket: when, where, and a trainer's name.

1. **Copy `tickets/venue/`** to `tickets/training/`.
2. **`record.ts`** — the fields the backend sends and the checks:
   `[...LOCATED_CHECKS, required('trainerId')]`.
3. **`model.ts`, `build.ts`** — the display text. Use `ctx.lookup`, `ctx.catalog`,
   `ctx.known()` (raw id + warning when a lookup has no row).
4. **`features.ts`** — the features (`night`, `address`, …) and the slots that follow from them.
5. **`layouts.ts`** — rules and budget per shape. Start with `rules: []`.
6. **`view/Thin.tsx`, `view/Wide.tsx`** — draw it. Reuse a template from
   `ui/templates` if one fits (as `venue` and `break` do), or compose `TicketFrame`,
   `Times`, `Fit`, `SpaceBudget` yourself. Mark optional parts with `data-slot`.
7. **Register**: one line in `tickets/registry.ts`, one in `tickets/views.ts`.
   TypeScript refuses to compile until both exist for both shapes.
8. **Catalogue**: its parameters and feature witnesses in `testing/catalogue/kinds.ts`;
   a reader for every new slot name in `testing/readers.ts`; then `npm run docs`.

Then `npm run check` compiles the definition (protected tokens, unknown fields,
conflicting rules), runs every class of the catalogue through the pipeline and
enforces the dependency rule; `npm run check:layout` draws it on every screen.
Nothing in `core/ticket`, `core/fit` or `ui/schedule/` needs to change.

What the copy does not give you, and where it goes:

| the new ticket needs … | add it in |
|---|---|
| a lookup table (`trainer`) | `lut.trainer` in all three `src/locales/*.ts` |
| a caption of its own ("Koolitaja:") | `core/schedule/captions.ts` + `ui` in all three locale files |
| a text with placeholders ("Saal {{n}}") | `Patterns` in `core/ports/lookup.ts` + the adapter's key list + `ui` in all three locale files |
| to count as "without a film" for the page-wide `mixed` adjustment | the list in `design/modifiers.ts` |
| a text slot of its own | `design/fields.ts` + `design/tokens/lines.ts` |
| numbers of its own | a token file under `design/tokens/thin|wide/`, registered in `design/tokens/index.ts` |
| a layout of its own | a stylesheet under `ui/styles/thin|wide/`, imported in `ui/styles/index.css` |
| a new kind of check | `core/shift/checks.ts` |
| test values | classes in `testing/catalogue/parameters/`, rows in `testing/fixtures/` |

The last three rows of the first table (`venue` reuses the headline template)
are why copying `venue` is the short path.

## Adding a variant rule

In `tickets/<kind>/layouts.ts`:

```ts
{
  id: 'night-no-subtitles',
  about: 'why this exists',
  when: { night: true, subtitles: false },     // a conjunction of feature values
  set: { wide: { screening: { filmFs: 36 } } },
}
```

All matching rules apply in order; a later one wins. The compiler
(`core/ticket/compile.ts`, run at start-up and in the tests) rejects a rule that

- sets a protected token, a token that does not exist, or the wrong kind of value;
- reaches outside its own ticket shape (a wide rule may set `wide`, `color`, `font`
  and the line budgets of wide fields — `design/invariants.ts`);
- names a feature the kind does not have;
- can apply together with another rule and set the same token differently — unless
  its condition strictly includes the other's (then it is the more specific one
  and is meant to win).

It also runs every slot against every variant: a slot that reads a feature the
kind does not have, or does not answer yes or no, is an error; a feature nothing
depends on is a warning.

## What cannot break silently

| invariant | enforced by |
|---|---|
| the outline and the strip have one size on every ticket | `design/invariants.ts` + `core/ticket/compile.ts` (rules) · `check:layout` (`size`) |
| every CSS variable a stylesheet reads is a token; a token nothing mentions is flagged (a coarse net, by name) | `tests/architecture/css-tokens.test.ts` |
| slot names and field ids agree between kinds, views, readers and catalogue | `tests/architecture/slots.test.ts` |
| the rules as the festival stated them (numbers, night, BC / Q&A, address, colours) | `tests/tickets/stated-rules.test.ts` — written by hand, not derived from the definitions |
| layers only import inwards | `tests/architecture/boundaries.test.ts` |
| every kind has a view for both shapes | the type of `tickets/views.ts` |
| every budget names real fields of the right shape | `core/ticket/compile.ts` |
| every optional part is drawn exactly when the plan says so | `check:layout` (`slots`) |
| every input class leads to what it says, in three languages | `tests/catalogue` (pipeline) · `check:layout` (`expect`, `problems`, `drawn`) |
| no record, id, response or failing view can take the page down | `tests/core/pipeline.test.ts` · the hostile ids of the catalogue · `TicketBoundary` |
| every caption and table exists in every language | `tests/adapters/lookup.test.ts` |
| the generated documents match the code | `tests/docs/generated.test.ts` |
| a wrong definition never reaches the screen | `assertKinds` in `app/compose.ts` |

## Testing

`docs/TEST-CATALOGUE.md` (generated) lists every input class. The model:

- **Parameters, equivalence classes, boundary values** — `testing/catalogue`.
  A parameter is one input of a ticket. Its values are split into classes the
  tickets treat alike; every class names its boundary values. No test value
  exists outside the catalogue: each is the representative or a named edge of
  a class. A class states its validity (valid · degraded = shown with a warning ·
  invalid = not shown), the problems it must raise (**field and code**) and what
  the ticket must show.
- **Where the classes are cut** — at the places the code treats values
  differently: digit counts (1, 2, 3, 4 digits; the 999 cap; the two-digit age
  badge), midnight, the size tiers of long texts (the character counts on both
  sides of each tier, read from `design/fit.ts`), list lengths (0, 1, 2, fits,
  does not fit), text shape (phrase, one unbreakable word, no syllables),
  language coverage (translated, fallback, other script), and "not the right
  type at all" for every field.
- **An independent oracle** — expected texts are worked out by the catalogue
  from the locale files and fixtures (`testing/fixtures/expected.ts`), with a
  few lines of its own and no code shared with the lookup adapter or the
  pipeline. Weekdays of the test dates are written down, not computed.
- **Strategies** — `testing/suites` decide how classes are combined, never
  which values exist: *base choice* (`base`; `each` = one parameter at a time
  through every valid and degraded value; `invalid` = one fault at a time, since
  a second fault would hide the first), *pairwise* (`pairs`: every pair of
  classes of any two parameters on some ticket), *every variant* (`variants`:
  all 2ⁿ feature assignments).
- **Two readers, one catalogue** — the unit tests check every case against the
  pipeline's model in et, en and ru (`tests/catalogue`); `check:layout` checks
  the same expectations against the DOM, plus layout, on every screen class.
  Screens are a parameter too: `testing/screens.ts` has the classes and the
  widths on both sides of every layout change.
- **Unit tests of the rules themselves** — `tests/core`: boundaries of the
  shrink floor, the size tiers, midnight, scale widths, the footer rule, the
  allocator and the text machine on models; hostile input to the pipeline.

- **The rules as stated** — `tests/tickets/stated-rules.test.ts` holds the
  festival's rules written by hand (999, six characters, night-only weekdays and
  wolf prints, the address rule, the nine colours from their hex codes). The
  catalogue derives its boundaries from the definitions and follows them when
  they change; this file does not, on purpose.

How far to trust it: wrong behaviours were planted one at a time in two rounds
(22 by the author, 38 by an independent reviewer). The first round was caught
entirely; of the second, 17 real ones survived — each led to a test or an
expectation that now fails for it. That is evidence the net is tight, not proof
that it has no holes: what a model carries that no slot shows and no test names
is still unchecked.
