import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Add / edit form in a panel that slides in from the right, over the list it belongs to.
 * Used by the record modules in place of an inline form card. Escape or the backdrop closes it.
 */
export default function FormSheet({ title, subtitle, onClose, children, width = 'max-w-[520px]' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-pay-navy/50 backdrop-blur-[2px] cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className={`relative w-full ${width} h-full bg-surface shadow-2xl flex flex-col animate-[slideIn_.2s_ease-out]`}>
        <div className="pay-stat !rounded-none !px-6 !py-5 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {subtitle && <p className="text-xs text-white/75">{subtitle}</p>}
            <h2 className="!text-white text-xl font-bold leading-tight mt-0.5">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15 shrink-0" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="form-sheet flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  )
}
