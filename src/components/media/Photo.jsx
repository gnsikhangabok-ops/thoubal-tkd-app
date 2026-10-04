import { useState } from 'react'

/**
 * Premium image: shows a blurred preview instantly, fades the sharp photo in when it has
 * loaded, and lets the browser pick the small or full file for the screen.
 * `photo` is either a bundled photo object ({ src, sm, w, h, placeholder, alt }) or a URL
 * string (an admin upload).
 */
export default function Photo({ photo, alt, sizes = '100vw', className = '', imgClassName = '', eager = false }) {
  const [loaded, setLoaded] = useState(false)
  const p = typeof photo === 'string' ? { src: photo } : photo
  if (!p?.src) return null

  return (
    <div
      className={`relative overflow-hidden bg-pay-sky ${className}`}
      style={p.placeholder ? { backgroundImage: `url(${p.placeholder})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <img
        src={p.src}
        srcSet={p.sm ? `${p.sm} ${p.smW}w, ${p.src} ${p.w}w` : undefined}
        sizes={p.sm ? sizes : undefined}
        width={p.w}
        height={p.h}
        alt={alt ?? p.alt ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  )
}
