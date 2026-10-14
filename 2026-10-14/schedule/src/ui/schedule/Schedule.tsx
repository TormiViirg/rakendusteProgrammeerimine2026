import type { ReactNode } from 'react'
import type { Captions } from '../../core/schedule/captions'
import type { ProblemSink } from '../../core/ports'
import type { DayGroup } from '../../core/schedule/schedule'
import type { KindRegistry } from '../../core/ticket/kind'
import { TruncationTip } from '../fit/TruncationTip'
import { PlaceOverlayProvider } from '../place/PlaceOverlay'
import type { ViewRegistry } from '../ticket/view'
import { DayHeader } from './DayHeader'
import { TicketBoundary } from './TicketBoundary'
import { TicketCard } from './TicketCard'

interface Props {
  days: DayGroup[]
  captions: Captions
  /** the ticket kinds and their views (tickets/registry.ts, tickets/views.ts) */
  kinds: KindRegistry
  views: ViewRegistry
  lang: string
  languages: readonly string[]
  onLang: (lang: string) => void
  /** Thin rule under the date (general schedule mockup has it, the screening one does not). */
  dateRule?: boolean
  /** Slot for the site menu bar — intentionally left empty for now. */
  menu?: ReactNode
  /** first load: nothing to show yet */
  pending?: boolean
  /** a newer language is on its way; current content is dimmed */
  stale?: boolean
  /** a line for shifts that could not be shown, already worded ("2 vahetust ei saanud kuvada") */
  notice?: string
  /** where a ticket that fails while drawing is reported */
  problems?: ProblemSink
}

/** The page: sticky top block, day headings, tickets. Must sit inside <DesignProvider>. */
export function Schedule({ days, captions, kinds, views, lang, languages, onLang, dateRule = false, menu, pending = false, stale = false, notice, problems }: Props) {
  return (
    <PlaceOverlayProvider captions={captions}>
      <div className="page" data-loading={stale} aria-busy={pending || stale}>
        <div className="top">
          <div className="top__menu">{menu}</div>
          <div className="top__title">
            <h1>{captions.myShifts}</h1>
            <nav className="langs" aria-label="Language">
              {languages
                .filter((l) => l !== lang)
                .map((l) => (
                  <button key={l} type="button" onClick={() => onLang(l)} lang={l}>
                    {l.toUpperCase()}
                  </button>
                ))}
            </nav>
          </div>
        </div>
        {pending && <p className="page__status">{captions.loading}</p>}
        {!pending && days.length === 0 && !notice && <p className="page__status">{captions.empty}</p>}
        {notice && (
          <p className="page__status page__status--notice" role="status" data-notice="">
            {notice}
          </p>
        )}
        {days.map((day) => (
          <section className="day" key={day.id}>
            <DayHeader day={day} rule={dateRule} />
            <div className="day__list">
              {day.tickets.map((t) => {
                const card = (
                  <TicketBoundary key={t.id} shiftId={t.id} kind={t.kind} problems={problems} subject={t}>
                    <TicketCard ticket={t} captions={captions} kinds={kinds} views={views} />
                  </TicketBoundary>
                )
                const note = day.notes && Object.hasOwn(day.notes, t.id) ? day.notes[t.id] : undefined
                return note ? (
                  <div className="tk-cell" key={t.id}>
                    <p className="tk-note">{note}</p>
                    {card}
                  </div>
                ) : (
                  card
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <TruncationTip label={captions.showAll} />
    </PlaceOverlayProvider>
  )
}
