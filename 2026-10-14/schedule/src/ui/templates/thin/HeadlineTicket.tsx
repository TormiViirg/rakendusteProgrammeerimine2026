import type { Captions } from '../../../core/schedule/captions'
import type { ShiftTime } from '../../../core/shift/time'
import { Fit } from '../../fit/Fit'
import { SpaceBudget } from '../../fit/SpaceBudget'
import { Barcode } from '../../parts/Barcode'
import { MapIcon, TreasureMapIcon } from '../../parts/icons'
import { Paw } from '../../parts/Paw'
import { Times } from '../../parts/Times'
import { TicketFrame } from '../../ticket/TicketFrame'

export interface HeadlineProps {
  captions: Captions
  time: ShiftTime
  barcode: string
  /** the large underlined text */
  title: string
  /** what the title is, for the checks: the cinema's name ("venue") or the break's ("title") */
  titleSlot: 'venue' | 'title'
  /** one line under the barcode */
  caption?: string
  /** one time row ("Pausi kestus") instead of arrival + shift */
  single?: boolean
  /** a larger title (wide tickets only) */
  large?: boolean
  /** the icon after the title */
  icon: 'map' | 'treasure'
  /** makes the title a button (opens the location sheet) */
  onOpen?: () => void
  openLabel?: string
  weekdays: boolean
  paw: boolean
}

/**
 * THIN HEADLINE TEMPLATE — times and one large underlined title with an icon.
 * Tokens: thin.headline. Used by the cinema ticket and the break ticket.
 */
export function ThinHeadlineTicket({ captions, time, barcode, title, titleSlot, caption, single = false, icon, onOpen, openLabel, weekdays, paw }: HeadlineProps) {
  const text = <Fit field="thinHeadlineTitle" text={title} slot={titleSlot} render={(t) => <span className="hl-title__text">{t}</span>} />
  return (
    <TicketFrame
      className={`tk--headline ${paw ? 'has-paw' : ''}`}
      stub={
        <>
          <div className="strip strip--tall strip--open" data-part="strip" data-strip="thin-tall">
            <Barcode seed={barcode} variant="open" className="strip__code strip__code--grow" />
          </div>
          <div className="foot foot--headline" data-part="foot">
            {caption && <Fit field="thinHeadlineCaption" text={caption} slot="caption" />}
          </div>
        </>
      }
    >
      <div className="holo holo--band" />
      <SpaceBudget className="hl-body">
        <Times time={time} captions={captions} variant="thin-headline" range="tight" single={single} weekdays={weekdays} />
        <div className="hl-row">
          <div className="hl-row__paw">{paw && <Paw />}</div>
          <h3 className="hl-title">
            {onOpen ? (
              <button type="button" className="hl-title__button" onClick={onOpen} aria-label={openLabel} data-slot="locate">
                {text}
                <MapIcon className="hl-title__map" data-check="icon" />
              </button>
            ) : (
              <>
                {text}
                {icon === 'treasure' ? <TreasureMapIcon className="hl-title__map" data-check="icon" /> : <MapIcon className="hl-title__map" data-check="icon" />}
              </>
            )}
          </h3>
          <div />
        </div>
      </SpaceBudget>
    </TicketFrame>
  )
}
