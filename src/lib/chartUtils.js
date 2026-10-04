import { useEffect, useRef, useState } from 'react'

// Measured width so an SVG chart fills its card at any screen size
export function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// Round axis maximum up to a clean number (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10^n)
export function niceMax(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((m) => m >= v)
}

export const compact = (n) =>
  Math.abs(n) >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : String(Math.round(n))
