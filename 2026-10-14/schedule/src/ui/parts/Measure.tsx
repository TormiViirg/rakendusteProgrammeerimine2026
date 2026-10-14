import { measureString, type Measure } from '../../core/shift/measure'
import type { TextFieldId } from '../../design/fields'
import { Fit } from '../fit/Fit'

/** Number in Fira Mono + unit in the text face: "108 min". */
export function MeasureText({ m, className = '', slot }: { m: Measure; className?: string; slot?: string }) {
  return (
    <span className={`measure ${className}`} data-check="text" data-slot={slot} data-value={slot ? m.value : undefined}>
      <span className="mono">{m.value}</span>
      {m.unit && <span className="measure__unit">{m.unit}</span>}
    </span>
  )
}

/** "BC: 59 min" — a caption with a measure, fitted as one text. */
export function LabelledMeasure({ field, label, m, className = '', slot }: { field: TextFieldId; label: string; m: Measure; className?: string; slot?: string }) {
  return (
    <Fit
      field={field}
      text={`${label} ${measureString(m)}`}
      className={className}
      slot={slot}
      value={m.value}
      render={() => (
        <>
          {label}{' '}
          <span className="measure">
            <span className="mono">{m.value}</span>
            {m.unit && <span className="measure__unit">{m.unit}</span>}
          </span>
        </>
      )}
    />
  )
}
