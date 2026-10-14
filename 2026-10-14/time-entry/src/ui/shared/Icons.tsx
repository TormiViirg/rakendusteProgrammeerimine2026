import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'square' as const, 'aria-hidden': true };

export const LockIcon = (p: P) => (
  <svg viewBox="0 0 20 28" aria-hidden {...p}>
    <path d="M4.5 12V8a5.5 5.5 0 0 1 11 0v4" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <rect x="0.5" y="11.5" width="19" height="16" fill="currentColor" />
    <circle cx="10" cy="18" r="2.1" fill="var(--lock-hole, oklch(1 0 0))" />
    <rect x="9" y="18.5" width="2" height="5" fill="var(--lock-hole, oklch(1 0 0))" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth="3.4" {...p}>
    <path d="M4 13l5 7L20 3" strokeLinecap="butt" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth="2.6" {...p}>
    <path d="M3 3l18 18M21 3L3 21" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth="3.4" strokeLinecap="butt" {...p}>
    <path d="M12 2v20M2 12h20" />
  </svg>
);

export const ArrowUpIcon = (p: P) => (
  <svg viewBox="0 0 24 28" {...base} strokeWidth="2.6" {...p}>
    <path d="M12 27V3M2 13L12 3l10 10" />
  </svg>
);

export const ArrowRightIcon = (p: P) => (
  <svg viewBox="0 0 40 26" {...base} strokeWidth="3" {...p}>
    <path d="M1 13h36M26 2l11 11-11 11" />
  </svg>
);

export const ChevronIcon = ({ left, ...p }: P & { left?: boolean }) => (
  <svg viewBox="0 0 20 14" {...base} strokeWidth="2" style={left ? { transform: 'scaleX(-1)' } : undefined} {...p}>
    <path d="M1 7h17M13 2l5 5-5 5" />
  </svg>
);

export const TriangleIcon = ({ left, ...p }: P & { left?: boolean }) => (
  <svg viewBox="0 0 14 16" aria-hidden style={left ? { transform: 'scaleX(-1)' } : undefined} {...p}>
    <path d="M0 0l14 8-14 8z" fill="currentColor" />
  </svg>
);

export const HelpIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8.8 9.4a3.2 3.2 0 1 1 4.6 2.9c-.9.5-1.4 1.1-1.4 2.2v.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="17.8" r="1" fill="currentColor" />
  </svg>
);

/** The diamond "eye" from the mock-up: lashes on top, blue iris. Closed (lid down, lashes hanging) and struck through when the tip is hidden. */
export const EyeIcon = ({ off, ...p }: P & { off?: boolean }) => (
  <svg viewBox="0 0 30 34" aria-hidden {...p}>
    {off ? (
      <>
        <path d="M3 18c4 6 8 9 12 9s8-3 12-9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 22l-2.4 2.6M9.6 25.2l-2 3M13 27.2l-1 3.4M17 27.2l1 3.4M20.4 25.2l2 3M24 22l2.4 2.6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 31L27 7" stroke="currentColor" strokeWidth="2" />
      </>
    ) : (
      <>
        <path d="M15 8l12 12-12 12L3 20z" fill="oklch(1 0 0)" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 14l6 6-6 6-6-6z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M15 16.6l3.4 3.4-3.4 3.4-3.4-3.4z" fill="var(--eye)" />
        <path d="M5 13l-2.4-2.6M8.6 9.6L6.6 6.6M12.4 7l-1-3.4M17.6 7l1-3.4M21.4 9.6l2-3M25 13l2.4-2.6" stroke="currentColor" strokeWidth="1.4" />
      </>
    )}
  </svg>
);

/** A rectangle crossed corner to corner – "nothing can be entered here". */
export const Crossed = () => (
  <svg className="crossed" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
    <path d="M0 0L100 100M100 0L0 100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
  </svg>
);
