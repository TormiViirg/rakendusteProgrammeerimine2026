import type { Captions } from '../../core/schedule/captions'
import type { Measure } from '../../core/shift/measure'
import { Fit } from '../fit/Fit'
import { LabelledMeasure } from './Measure'

interface Props {
  captions: Captions
  /** each column is drawn when it is given — the caller passes what the ticket's slots allow */
  bc?: Measure
  qa?: Measure
  audience?: string
  sessionCode?: string
  address?: string
}

/** The row under the strip on wide tickets: BC · Q&A · address · audience · screening code. */
export function WideFoot({ captions, bc, qa, audience, sessionCode, address }: Props) {
  return (
    <div className="w-foot w-foot--cols" data-part="foot">
      {bc && <LabelledMeasure field="wideFootItem" label={captions.bc} m={bc} className="w-foot__bc" slot="bc" />}
      {qa && <LabelledMeasure field="wideFootItem" label={captions.qa} m={qa} className="w-foot__qa" slot="qa" />}
      {address && <Fit field="wideFootAddress" text={address} className="w-foot__address" slot="address" />}
      {audience && (
        <span className="w-foot__audience">
          <Fit field="wideFootAudience" text={audience} slot="audience" />
        </span>
      )}
      {sessionCode && (
        <span className="w-foot__code">
          <Fit field="wideFootItem" text={captions.sessionCode} className="w-foot__code-label" />
          <Fit field="wideFootCode" text={sessionCode} className="mono w-foot__code-value" slot="code" />
        </span>
      )}
    </div>
  )
}
