import { useLayoutEffect, useState, type RefObject } from 'react'

/** Border-box size of an element in CSS px, kept up to date with ResizeObserver. */
export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setSize((p) => (Math.abs(p.w - r.width) < 0.01 && Math.abs(p.h - r.height) < 0.01 ? p : { w: r.width, h: r.height }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
