import { Fit } from '../../fit/Fit'
import { SpaceBudget } from '../../fit/SpaceBudget'
import { Barcode } from '../../parts/Barcode'
import { MapIcon, TreasureMapIcon } from '../../parts/icons'
import { Paw } from '../../parts/Paw'
import { Times } from '../../parts/Times'
import { TicketFrame } from '../../ticket/TicketFrame'
import type { HeadlineProps } from '../thin/HeadlineTicket'

/** barcode pattern length in pt: longer than the strip is wide */
const BARS = 720

/**
 * WIDE HEADLINE TEMPLATE — large times and one large underlined title with an
 * icon. Tokens: wide.headline. Used by the cinema ticket and the break ticket
 * (which sets `single` and `large`).
 */
export function WideHeadlineTicket({ captions, time, barcode, title, titleSlot, caption, single = false, large = false, icon, onOpen, openLabel, weekdays, paw }: HeadlineProps) {
  const text = <Fit field={large ? 'wideHeadlineTitleLarge' : 'wideHeadlineTitle'} text={title} slot={titleSlot} render={(t) => <span className="wh-title__text">{t}</span>} />
  const Icon = icon === 'treasure' ? TreasureMapIcon : MapIcon
  return (
    <TicketFrame
      className={`wk wk--headline ${single ? 'wh--single' : ''} ${large ? 'wh--large' : ''} ${weekdays ? 'wk--night' : ''}`}
      stub={
        <>
          <div className="w-strip w-strip--open" data-part="strip" data-strip="wide">
            <span className="w-strip__cap" />
            <Barcode seed={barcode} variant="open" length={BARS} className="w-strip__code w-strip__code--grow" />
            <span className="w-strip__cap" />
          </div>
          <div className="w-foot w-foot--caption" data-part="foot">
            {caption && <Fit field="wideFootCaption" text={caption} slot="caption" />}
          </div>
        </>
      }
    >
      <div className="holo holo--wide" />
      {paw && (
        <>
          <Paw className="wh-paw wh-paw--1" />
          <Paw className="wh-paw wh-paw--2" />
          <Paw className="wh-paw wh-paw--3" />
        </>
      )}
      <SpaceBudget className="wh-body">
        <Times time={time} captions={captions} variant="wide-headline" range="hyphen" single={single} weekdays={weekdays} />
        <h3 className="wh-title">
          {onOpen ? (
            <button type="button" className="wh-title__wrap wh-title__button" onClick={onOpen} aria-label={openLabel} data-slot="locate">
              {text}
              <Icon className="wh-title__map" data-check="icon" />
            </button>
          ) : (
            <span className="wh-title__wrap">
              {text}
              <Icon className="wh-title__map" data-check="icon" />
            </span>
          )}
        </h3>
      </SpaceBudget>
    </TicketFrame>
  )
}
