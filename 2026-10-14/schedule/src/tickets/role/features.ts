import type { FeatureDefs } from '../../core/ticket/feature'
import { footerAddress, when, type SlotRules } from '../../core/ticket/slot'
import type { RoleModel } from './model'

export type RoleFeature = 'night' | 'hall' | 'bc' | 'address'

export const roleFeatures: FeatureDefs<RoleModel, RoleFeature> = {
  night: { about: 'the shift runs past midnight', of: (m) => m.night },
  hall: { about: 'the shift is in a particular hall', of: (m) => Boolean(m.place.hall) },
  bc: { about: 'it has a valid Black Carpet time', of: (m) => Boolean(m.bc) },
  address: { about: 'the cinema has a written-out address', of: (m) => Boolean(m.place.address) },
}

export type RoleSlot = 'weekdays' | 'paw' | 'hall' | 'bc' | 'address' | 'locate'

export const roleSlots: SlotRules<RoleFeature, RoleSlot> = {
  weekdays: when({ night: true }),
  /** the phone ticket has no room for a wolf print */
  paw: when({ night: true }, { only: 'wide' }),
  hall: when({ hall: true }),
  bc: when({ bc: true }),
  /** footer row: BC is its only column, so the address always has room */
  address: footerAddress('address', {
    thin: { optional: ['bc'], always: 0, max: 2 },
    wide: { optional: ['bc'], always: 0, max: 2 },
  }),
  locate: when({}),
}
