import type { Captions } from '../../core/schedule/captions'
import type { ShiftTime } from '../../core/shift/time'
import type { TextFieldId } from '../../design/fields'
import { Fit } from '../fit/Fit'

/** Which template's time tokens to use: thin.<template>.times / wide.<template>.times. */
export type TimesVariant = 'thin-role' | 'thin-headline' | 'thin-screening' | 'wide-screening' | 'wide-role' | 'wide-headline'

interface Props {
  time: ShiftTime
  captions: Captions
  variant: TimesVariant
  /** "spaced": 21:30 — 00:50.  "tight": 21:30—00:50.  "hyphen": wide tickets. */
  range?: 'spaced' | 'tight' | 'hyphen'
  /** one row ("Pausi kestus") instead of arrival + shift */
  single?: boolean
  /** draw the weekday line (the ticket's `weekdays` slot) */
  weekdays: boolean
}

const LABEL_FIELD: Record<TimesVariant, TextFieldId> = {
  'thin-role': 'thinRoleTimesLabel',
  'thin-headline': 'thinHeadlineTimesLabel',
  'thin-screening': 'thinScreeningTimesLabel',
  'wide-screening': 'wideScreeningTimesLabel',
  'wide-role': 'wideRoleTimesLabel',
  'wide-headline': 'wideHeadlineTimesLabel',
}
const DASH = { spaced: ' — ', tight: '—', hyphen: '-' }

/**
 * The "Kohaloleku aeg / Vahetuse kestus" block shared by all tickets.
 * Times are always present; the weekday line only on night shifts.
 */
export function Times({ time, captions, variant, range = 'spaced', single = false, weekdays }: Props) {
  const field = LABEL_FIELD[variant]
  return (
    <dl className={`times times--${variant}`}>
      {!single && (
        <>
          <Fit as="dt" field={field} text={captions.arrival} className="times__label" />
          <dd className="times__value mono" data-check="text" data-slot="arrival">
            {time.arrival}
          </dd>
        </>
      )}
      <Fit as="dt" field={field} text={single ? captions.breakDuration : captions.shift} className="times__label" />
      <dd className="times__value" data-check="text">
        <span className="range">
          <span className="mono range__time">
            <span className="range__start" data-slot="start">{time.start}</span>
            <span className="range__dash">{DASH[range]}</span>
            <span className="range__end" data-slot="end">{time.end}</span>
          </span>
          {weekdays && (
            <span className="range__days" data-check="text" data-slot="weekdays">
              <span>{time.startDay}</span>
              <span>-</span>
              <span>{time.endDay}</span>
            </span>
          )}
        </span>
      </dd>
    </dl>
  )
}
