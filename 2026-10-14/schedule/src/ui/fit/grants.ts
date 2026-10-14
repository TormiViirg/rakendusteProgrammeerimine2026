import { createContext, useContext } from 'react'
import type { Grants } from '../../core/fit/allocator'
import { NO_GRANT, type Grant } from '../../core/fit/grant'

/** What the allocator has granted the fields of the ticket body around us. Set by <SpaceBudget>, read by <Fit>. */
export const GrantContext = createContext<Grants>({})
export const useGrant = (field: string): Grant => useContext(GrantContext)[field] ?? NO_GRANT
