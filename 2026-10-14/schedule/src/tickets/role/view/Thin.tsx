import { Fit } from '../../../ui/fit/Fit'
import { SpaceBudget } from '../../../ui/fit/SpaceBudget'
import { Barcode } from '../../../ui/parts/Barcode'
import { MapIcon } from '../../../ui/parts/icons'
import { LabelledMeasure } from '../../../ui/parts/Measure'
import { Times } from '../../../ui/parts/Times'
import { useOpenPlace } from '../../../ui/place/openPlace'
import { TicketFrame } from '../../../ui/ticket/TicketFrame'
import type { TicketViewProps } from '../../../ui/ticket/view'
import type { RoleSlot } from '../features'
import type { RoleModel } from '../model'

/**
 * THIN ROLE TEMPLATE — a shift without a film on a phone: times, the role in
 * large type; cinema, hall and the map button sit in the strip. Tokens: thin.role.
 */
export function RoleThin({ model, slots, captions }: TicketViewProps<RoleModel, RoleSlot>) {
  const openPlace = useOpenPlace()
  const { place, barcode: seed } = model
  return (
    <TicketFrame
      className="tk--role"
      stub={
        <>
          <div className="strip strip--tall" data-part="strip" data-strip="thin-tall">
            <Barcode seed={seed + 'a'} className="strip__code strip__code--grow" />
            <span className="strip__block strip__block--venue">
              <Fit field="thinStripVenue" text={place.name} slot="venue" />
            </span>
            {slots.hall && <Barcode seed={seed + 'b'} className="strip__code strip__code--gap" />}
            {slots.hall && (
              <strong className="strip__block strip__block--hall">
                <Fit field="thinStripHall" text={place.hall!} slot="hall" />
              </strong>
            )}
            <Barcode seed={seed + 'c'} className="strip__code strip__code--mid" />
            {slots.locate && (
              <button type="button" className="strip__block strip__block--icon" onClick={() => openPlace(place)} aria-label={`${place.name} – ${captions.map}`} data-slot="locate">
                <MapIcon className="strip__map" data-check="icon" />
              </button>
            )}
            <Barcode seed={seed + 'd'} className="strip__code strip__code--end" />
          </div>
          <div className="foot foot--role" data-part="foot">
            {slots.bc && <LabelledMeasure field="thinFootItem" label={captions.bc} m={model.bc!} className="foot__item" slot="bc" />}
            {slots.address && <Fit field="thinFootAddress" text={place.address!} className="foot__address" slot="address" />}
          </div>
        </>
      }
    >
      <div className="holo holo--band" />
      <SpaceBudget className="role-body">
        <Times time={model.time} captions={captions} variant="thin-role" weekdays={slots.weekdays} />
        <h3 className="role-title">
          <span className="role-title__under">
            <Fit field="thinRoleTitle" text={model.role} slot="role" />
          </span>
        </h3>
      </SpaceBudget>
    </TicketFrame>
  )
}
