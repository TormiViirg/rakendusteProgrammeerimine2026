import { useInsertionEffect, useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { fitText, type FitProbe } from '../../core/fit/fitText'
import { intendedSize, textSize } from '../../core/fit/textSize'
import type { TextFieldId } from '../../design/fields'
import { useDesign } from '../design/context'
import { useUiPorts } from '../ports'
import { useGrant } from './grants'

export interface FitResult {
  /** lines the text takes */
  lines: number
  /** cut with "…" */
  cut: boolean
  /** final font size in pt */
  size: number
}

interface Props {
  /** which entry of TEXT_FIELDS (design/fields.ts) governs this text */
  field: TextFieldId
  /** the text itself */
  text: string
  /**
   * The separate values `text` is joined from (subtitle languages, programmes).
   * A cut list gets animated dots and its popover shows one value per line.
   */
  items?: string[]
  as?: ElementType
  className?: string
  /** language of the text when it differs from the interface language */
  lang?: string
  /** names the part for the browser checks: data-slot */
  slot?: string
  /** the bare value the part shows, where the text wraps it in a caption: data-value */
  value?: string
  /** custom markup; receives the text with its soft hyphens */
  render?: (text: string) => ReactNode
  /** measure again when this changes — for anything outside the text that changes its width (a weight set by a class) */
  refit?: unknown
  onFit?: (r: FitResult) => void
}

/**
 * Text that always fits its line budget.
 *
 * The decisions are core/fit/fitText.ts (whole → broken at syllables → smaller
 * → cut); this component is its probe on the DOM: it lays the text out at a
 * size and reports lines and overflow. The full text of anything cut opens in
 * <TruncationTip>. A <SpaceBudget> around the ticket body may grant the field
 * extra lines or a larger size.
 *
 * Every text that may take more than one line gets syllable breaks here, so a
 * new field needs nothing extra.
 */
export function Fit({ field, text, items, as: Tag = 'span', className = '', lang, slot, value, render, refit, onFit }: Props) {
  const { tokens, u, layoutKey, lang: uiLang } = useDesign()
  const { hyphenator } = useUiPorts()
  const grant = useGrant(field)
  const spec = textSize(tokens, field, text, grant)
  const ref = useRef<HTMLElement>(null)
  const { start, lh, baseFs, min, maxLines, step, preferLines, preferMin, tierSteps } = spec
  const textLang = lang ?? uiLang
  const multi = maxLines > 1
  // The soft hyphens are always in the text; CSS ignores them (hyphens: none)
  // until the probe is asked for the broken layout and sets data-broken.
  const shown = multi ? hyphenator.hyphenate(text, textLang) : text
  const intended = intendedSize(spec, grant)

  const deps = [shown, start, lh, baseFs, min, maxLines, step, preferLines, preferMin, tierSteps, intended, u, layoutKey, refit, onFit]

  // BEFORE any text of this pass is measured, every text that is about to be measured goes back to
  // its start size. Texts share rows: how wide one is depends on the size of its neighbours, and a
  // neighbour still at the size of the previous pass (other fonts, another width) would be measured
  // against. Insertion effects all run before the first layout effect, which is what this needs.
  useInsertionEffect(() => {
    const el = ref.current
    if (!el) return // first mount: React has just set the start size
    el.style.fontSize = `calc(${start} * var(--u))`
    el.style.lineHeight = `calc(${lh * start / baseFs} * var(--u))`
    el.removeAttribute('data-fit')
    delete el.dataset.broken
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the same moments as the measuring effect below
  }, deps)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const lhFor = (fs: number) => (lh * fs) / baseFs
    // Lines are counted from the text itself (a Range), not the element box,
    // because grid and flex parents may stretch the box.
    const range = document.createRange()
    range.selectNodeContents(el.querySelector('.fit__text') ?? el)
    const lines = (fs: number) => {
      const h = range.getBoundingClientRect().height
      return h === 0 ? 0 : Math.max(1, Math.round((h - 1.2 * fs * u) / (lhFor(fs) * u)) + 1)
    }
    const probe: FitProbe = {
      at(size, broken) {
        el.style.fontSize = `calc(${size} * var(--u))`
        el.style.lineHeight = `calc(${lhFor(size)} * var(--u))`
        if (broken) el.dataset.broken = '1'
        else delete el.dataset.broken
        return { lines: lines(size), overflowsWidth: el.scrollWidth > el.clientWidth + 1 }
      },
    }

    el.removeAttribute('data-fit')
    const { size, cut } = fitText({ start, lh, baseFs, min, maxLines, step, preferLines, preferMin, tierSteps }, probe)

    if (cut) {
      el.setAttribute('data-fit', 'clamp')
      // reachable by keyboard; TruncationTip shows the full text
      el.setAttribute('tabindex', '0')
    } else {
      el.removeAttribute('tabindex')
    }
    // counted after the cut is applied: a cut word wraps anywhere and may fill more lines
    const used = Math.min(maxLines, lines(size))
    el.dataset.fitSize = String(Math.round(size * 10) / 10)
    el.dataset.used = String(used)
    // "shrunk" = smaller than intended: what the space budget tries to undo
    if (size < intended - 0.01) el.dataset.shrunk = '1'
    else delete el.dataset.shrunk
    onFit?.({ lines: used, cut, size })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the list above
  }, deps)

  const style = {
    fontSize: `calc(${start} * var(--u))`,
    lineHeight: `calc(${(lh * start) / baseFs} * var(--u))`,
    '--fit-lines': maxLines,
    '--fit-base': baseFs,
  } as CSSProperties

  return (
    <Tag
      ref={ref}
      className={`fit ${className}`}
      // a language without rules in the hyphenator falls back to the browser's dictionary — see styles/fit.css
      lang={lang}
      style={style}
      data-check="text"
      data-slot={slot}
      data-value={value}
      data-field={field}
      data-lines={maxLines}
      // starts smaller because the text is long: the allocator may give that back
      data-tiered={tierSteps > 0 ? '1' : undefined}
      data-hyphens={multi && !hyphenator.knows(textLang) ? 'auto' : undefined}
      data-full={text}
      data-items={items && items.length > 1 ? JSON.stringify(items) : undefined}
    >
      <span className="fit__text" data-fit-text="">{render ? render(shown) : shown}</span>
      {items && items.length > 1 && (
        <span className="fit__more" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </Tag>
  )
}
