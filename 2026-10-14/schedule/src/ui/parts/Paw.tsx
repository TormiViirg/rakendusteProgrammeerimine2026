import paw from '../assets/paw.png'

/** Wolf print — night shifts only (the ticket's `paw` slot). */
export function Paw({ className }: { className?: string }) {
  return <img className={className} src={paw} alt="" data-check="icon" data-slot="paw" />
}
