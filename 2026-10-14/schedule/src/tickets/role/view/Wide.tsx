import { Fit } from '../../../ui/fit/Fit'
import { SpaceBudget } from '../../../ui/fit/SpaceBudget'
import { Barcode } from '../../../ui/parts/Barcode'
import { MapIcon } from '../../../ui/parts/icons'
import { Paw } from '../../../ui/parts/Paw'
import { Times } from '../../../ui/parts/Times'
import { WideFoot } from '../../../ui/parts/WideFoot'
import { useOpenPlace } from '../../../ui/place/openPlace'
import { TicketFrame } from '../../../ui/ticket/TicketFrame'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { RoleSlot } from '../features'
import type { RoleModel } from '../model'

/** barcode pattern length in pt: longer than the strip is wide */
const BARS = 720

/**
 * WIDE ROLE TEMPLATE — a shift without a film on wide screens: compact times,
 * then four columns: the role in the left two, the location in the right two.
 * Tokens: wide.role. (No desktop mockup exists for this ticket.)
 */
export function RoleWide({ model, slots, captions }: TicketViewProps<RoleModel, RoleSlot>) {
  const openPlace = useOpenPlace()
  const { place } = model
  return (
    <TicketFrame
      className={`wk wk--role ${slots.weekdays ? 'wk--night' : ''}`}
      stub={
        <>
          <div className="w-strip w-strip--open" data-part="strip" data-strip="wide">
            <span className="w-strip__cap" />
            <Barcode seed={model.barcode} variant="open" length={BARS} className="w-strip__code w-strip__code--grow" />
            <span className="w-strip__cap" />
          </div>
          <WideFoot captions={captions} bc={slots.bc ? model.bc : undefined} address={slots.address ? place.address : undefined} />
        </>
      }
    >
      <div className="holo holo--wide" />
      {slots.paw && <Paw className="w-paw" />}
      <SpaceBudget className="r-body">
        <Times time={model.time} captions={captions} variant="wide-role" range="hyphen" weekdays={slots.weekdays} />
        <div className="r-row">
          <h3 className="r-role">
            <Fit field="wideRoleTitle" text={model.role} slot="role" />
          </h3>
          <div className="r-place">
            {slots.locate ? (
              <button type="button" className="r-place__venue" onClick={() => openPlace(place)} aria-label={`${place.name} – ${captions.map}`} data-slot="locate">
                <Fit field="wideRoleVenue" text={place.name} slot="venue" />
                <MapIcon className="r-place__map" data-check="icon" />
              </button>
            ) : (
              <div className="r-place__venue">
                <Fit field="wideRoleVenue" text={place.name} slot="venue" />
              </div>
            )}
            {slots.hall && <Fit field="wideRoleHall" text={place.hall!} className="r-place__hall" slot="hall" />}
          </div>
        </div>
      </SpaceBudget>
    </TicketFrame>
  )
}
