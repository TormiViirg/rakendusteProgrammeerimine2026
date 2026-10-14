import { createContext, useContext } from 'react'
import { FALLBACK_DESIGN, type Design } from '../../core/design/resolveDesign'
import type { Tokens } from '../../design/tokens'

export interface DesignState {
  design: Design
  /** the tokens in force here: the page's, or one ticket's after its variant rules */
  tokens: Tokens
  /** CSS px per design point */
  u: number
  /** changes whenever anything that affects text measurement changes */
  layoutKey: string
  /** interface language — picks the hyphenation rules */
  lang?: string
}

export const DesignContext = createContext<DesignState>({ design: FALLBACK_DESIGN, tokens: FALLBACK_DESIGN.tokens, u: 1, layoutKey: '' })
export const useDesign = () => useContext(DesignContext)
