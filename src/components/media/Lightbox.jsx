import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useT } from '../../lib/i18n'

/**
 * Full-screen photo viewer. items: [{ src, alt, caption }]; index: open photo (null = closed).
 * Arrow keys / swipe to move, Esc or the backdrop to close; focus returns to the opener.
 */
export default function Lightbox({ items, index, onChange, onClose }) {
  const { t } = useT()
  const closeRef = useRef(null)
  const touchX = useRef(null)
  const open = index != null
  const count = items.length

  // Latest props for the key handler, so the effects below only run on open/close
  const live = useRef({})
  useEffect(() => {
    live.current = { index, count, onChange, onClose }
  })

  // Opening: focus the close button and lock page scroll; closing: restore both
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      opener?.focus?.({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      const { index: i, count: n, onChange: change, onClose: close } = live.current
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') change((i + 1) % n)
      if (e.key === 'ArrowLeft') change((i - 1 + n) % n)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const item = items[index]
  const go = (d) => onChange((index + d + count) % count)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || item.alt}
      className="fixed inset-0 z-[90] flex flex-col bg-black text-white"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-white/70 tabular-nums">{index + 1} / {count}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={t('Close')} className="grid place-items-center w-10 h-10 rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 md:px-16" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={item.src} src={item.src} alt={item.alt} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-[fadeIn_.25s_ease-out]" />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur">
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {item.caption && <p className="px-4 py-4 text-center text-sm md:text-base text-white/90">{item.caption}</p>}
    </div>,
    document.body,
  )
}
