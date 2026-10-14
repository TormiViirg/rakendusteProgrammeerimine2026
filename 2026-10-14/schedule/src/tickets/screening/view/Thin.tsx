import { Fit } from '../../../ui/fit/Fit'
import { SpaceBudget } from '../../../ui/fit/SpaceBudget'
import { Barcode } from '../../../ui/parts/Barcode'
import { HelpIcon } from '../../../ui/parts/icons'
import { LabelledMeasure, MeasureText } from '../../../ui/parts/Measure'
import { Times } from '../../../ui/parts/Times'
import { useOpenPlace } from '../../../ui/place/openPlace'
import { TicketFrame } from '../../../ui/ticket/TicketFrame'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { ScreeningSlot } from '../features'
import type { ScreeningModel } from '../model'

/**
 * THIN SCREENING TEMPLATE — a shift with a film on a phone: audience, cinema,
 * film, programme, subtitles; runtime and gap in the strip; BC, Q&A and the
 * screening code under it. Tokens: thin.screening.
 */
export function ScreeningThin({ model: s, slots, captions }: TicketViewProps<ScreeningModel, ScreeningSlot>) {
  const openPlace = useOpenPlace()
  return (
    <TicketFrame
      className={`tk--screening ${slots.rating ? 'has-rating' : ''}`}
      stub={
        <>
          <div className="strip strip--info" data-part="strip" data-strip="thin-info">
            <Barcode seed={s.barcode} className="strip__code strip__code--lead" />
            <div className="strip__cell strip__cell--a">
              <Fit field="thinStripLabel" text={captions.duration} className="strip__label" />
              <MeasureText m={s.duration} className="strip__value" slot="duration" />
            </div>
            <div className="strip__cell strip__cell--b">
              <Fit field="thinStripSmallLabel" text={captions.gap} className="strip__label strip__label--small" />
              <MeasureText m={s.gap} className="strip__value" slot="gap" />
            </div>
          </div>
          <div className="foot foot--screening" data-part="foot">
            <div className="foot__half foot__half--a">
              {slots.bc && <LabelledMeasure field="thinFootItem" label={captions.bc} m={s.bc!} className="foot__item" slot="bc" />}
              {slots.qa && <LabelledMeasure field="thinFootItem" label={captions.qa} m={s.qa!} className="foot__item" slot="qa" />}
              {slots.address && <Fit field="thinFootAddress" text={s.place.address!} className="foot__address" slot="address" />}
            </div>
            <div className="foot__half foot__half--b">
              <Fit field="thinFootItem" text={captions.sessionCode} className="foot__code-label" />
              <Fit field="thinFootCode" text={s.sessionCode} className="mono foot__code" slot="code" />
            </div>
          </div>
        </>
      }
    >
      <div className="holo holo--strip" />
      {slots.rating && (
        <div className="rating" aria-label={s.rating} data-check="badge" data-slot="rating" data-value={s.rating}>
          <span className="rating__text mono">
            <span className="rating__prefix">{s.rating!.slice(0, 1)}</span>
            {s.rating!.slice(1)}
          </span>
        </div>
      )}
      <SpaceBudget className="scr-body">
        <Times time={s.time} captions={captions} variant="thin-screening" weekdays={slots.weekdays} />
        {/* spare room collects here, so the block below keeps the mockup's distance to the strip */}
        <div className="scr-spacer" />
        <div className="scr-cols">
          <div className="scr-left">
            <Fit field="thinScreeningCaption" text={captions.audience} className="scr-caption" />
            <Fit field="thinScreeningAudience" text={s.audience} className="scr-audience" slot="audience" />
            <Fit field="thinScreeningFilmCaption" text={captions.film} className="scr-caption scr-caption--film" />
          </div>
          <div className="scr-right">
            <div className="scr-venue">
              <span className={`scr-venue__name ${slots.locate ? 'scr-venue__name--help' : ''}`}>
                <Fit field="thinScreeningVenue" text={s.place.name} slot="venue" />
                {slots.locate && (
                <button type="button" className="scr-venue__help" onClick={() => openPlace(s.place)} aria-label={`${s.place.name} – ${captions.help}`} data-check="icon" data-slot="locate">
                  <HelpIcon />
                </button>
                )}
              </span>
            </div>
            <Fit field="thinScreeningHall" text={s.place.hall} className="scr-hall" slot="hall" />
            <Fit field="thinScreeningRole" text={s.role} className="scr-role" slot="role" />
          </div>
        </div>
        <h3 className="scr-film">
          <Fit field="thinScreeningFilm" text={s.film} lang={s.filmLang} slot="film" />
        </h3>
        <Fit field="thinScreeningProgramme" text={s.programme.join(captions.programmeSeparator)} items={s.programme} className="scr-programme" slot="programme" />
        {slots.subtitles && (
          <div className="scr-subs" data-slot="subtitles">
            <Fit field="thinScreeningSubsLabel" text={captions.subtitles} className="scr-subs__label" />
            <Fit field="thinScreeningSubs" text={s.subtitles.join(captions.listSeparator)} items={s.subtitles} className="scr-subs__list" slot="subtitleList" />
          </div>
        )}
      </SpaceBudget>
    </TicketFrame>
  )
}
