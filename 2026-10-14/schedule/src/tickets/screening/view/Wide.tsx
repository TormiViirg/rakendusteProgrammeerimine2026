import { useCallback, useState } from 'react'
import { useDesign } from '../../../ui/design/context'
import { Fit, type FitResult } from '../../../ui/fit/Fit'
import { SpaceBudget } from '../../../ui/fit/SpaceBudget'
import { Barcode } from '../../../ui/parts/Barcode'
import { HelpIcon } from '../../../ui/parts/icons'
import { MeasureText } from '../../../ui/parts/Measure'
import { Paw } from '../../../ui/parts/Paw'
import { Times } from '../../../ui/parts/Times'
import { WideFoot } from '../../../ui/parts/WideFoot'
import { useOpenPlace } from '../../../ui/place/openPlace'
import { TicketFrame } from '../../../ui/ticket/TicketFrame'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { ScreeningSlot } from '../features'
import type { ScreeningModel } from '../model'
import { nextHallStyle, type HallStyle } from './hallStyle'

/**
 * WIDE SCREENING TEMPLATE — a shift with a film on wide screens (desktop
 * mockup, 678 × 365pt). Left: times, film, programme. Right column: cinema,
 * hall, role. Subtitles run the full width; the audience type sits in the
 * footer. Tokens: wide.screening.
 */
export function ScreeningWide({ model: s, slots, captions }: TicketViewProps<ScreeningModel, ScreeningSlot>) {
  const { layoutKey } = useDesign()
  return (
    <TicketFrame
      className={`wk wk--screening ${slots.weekdays ? 'wk--night' : ''} ${slots.rating ? 'has-rating' : ''}`}
      stub={
        <>
          <div className="w-strip" data-part="strip" data-strip="wide">
            <Barcode seed={s.barcode} className="w-strip__code w-strip__code--lead" />
            <div className="w-strip__block w-strip__block--a">
              <Fit field="wideStripLabel" text={captions.duration} className="w-strip__label" />
              <MeasureText m={s.duration} className="w-strip__value" slot="duration" />
            </div>
            <Barcode seed={s.barcode + 'm'} className="w-strip__code w-strip__code--mid" />
            <div className="w-strip__block w-strip__block--b">
              <Fit field="wideStripLabel" text={captions.gapLine} className="w-strip__label" />
              <MeasureText m={s.gap} className="w-strip__value" slot="gap" />
            </div>
            <Barcode seed={s.barcode + 'e'} className="w-strip__code w-strip__code--end" />
          </div>
          <WideFoot
            captions={captions}
            bc={slots.bc ? s.bc : undefined}
            qa={slots.qa ? s.qa : undefined}
            audience={s.audience}
            sessionCode={s.sessionCode}
            address={slots.address ? s.place.address : undefined}
          />
        </>
      }
    >
      <div className="holo holo--wide" />
      {slots.rating && (
        <div className="w-rating" aria-label={s.rating} data-check="badge" data-slot="rating" data-value={s.rating}>
          <span className="w-rating__text mono">{s.rating}</span>
        </div>
      )}
      {slots.paw && <Paw className="w-paw" />}
      <SpaceBudget className="w-body">
        <div className="w-top">
          <div className="w-left">
            <Times time={s.time} captions={captions} variant="wide-screening" range="hyphen" weekdays={slots.weekdays} />
            <div className="w-film">
              <Fit field="wideScreeningFilmLabel" text={captions.film} className="w-film__label" />
              <h3 className="w-film__title">
                <Fit field="wideScreeningFilm" text={s.film} lang={s.filmLang} slot="film" />
              </h3>
              <Fit field="wideScreeningProgramme" text={s.programme.join(captions.programmeSeparator)} items={s.programme} className="w-film__programme" slot="programme" />
            </div>
          </div>
          {/* starts over when the texts or the layout change */}
          <RightColumn key={`${layoutKey}|${s.place.name}|${s.place.hall}`} model={s} helpLabel={`${s.place.name} – ${captions.help}`} locate={slots.locate} />
        </div>
        {slots.subtitles && (
          <div className="w-subs" data-slot="subtitles">
            <Fit field="wideScreeningSubsLabel" text={captions.subtitles} className="w-subs__label" />
            <Fit field="wideScreeningSubs" text={s.subtitles.join(captions.listSeparator)} items={s.subtitles} className="w-subs__list" slot="subtitleList" />
          </div>
        )}
      </SpaceBudget>
    </TicketFrame>
  )
}

/** Cinema · hall · role. How the hall is set follows hallStyle.ts; the whitespace above the name closes up in CSS. */
function RightColumn({ model: s, helpLabel, locate }: { model: ScreeningModel; helpLabel: string; locate: boolean }) {
  const openPlace = useOpenPlace()
  const [hall, setHall] = useState<HallStyle>('normal')
  const onVenue = useCallback((r: FitResult) => setHall((now) => nextHallStyle(now, { venueRows: r.lines })), [])
  const onHall = useCallback((r: FitResult) => setHall((now) => nextHallStyle(now, { hallCut: r.cut })), [])

  return (
    <div className="w-right">
      <div className="w-right__top" />
      <div className="w-right__venue">
        <span className="w-right__venue-wrap">
          <Fit field="wideScreeningVenue" text={s.place.name} onFit={onVenue} slot="venue" />
          {locate && (
            <button type="button" className="w-help" onClick={() => openPlace(s.place)} aria-label={helpLabel} data-check="icon" data-slot="locate">
              <HelpIcon />
            </button>
          )}
        </span>
      </div>
      <Fit
        field={hall === 'normal' ? 'wideScreeningHall' : 'wideScreeningHallSmall'}
        text={s.place.hall}
        onFit={onHall}
        className={`w-right__hall ${hall === 'small-light' ? 'is-light' : ''}`}
        refit={hall}
        slot="hall"
      />
      <Fit field="wideScreeningRole" text={s.role} className="w-right__role" slot="role" />
    </div>
  )
}
