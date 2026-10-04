import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useT } from '../../lib/i18n'

/**
 * Full-screen preview for a printable document. Printing hides everything except
 * the document (see .printing-doc rules in tailwind.css). `size` sets the page:
 * 'a4-landscape' | 'a5' | 'card'.
 */
// Paper size per document, applied only while printing
const PAGE_CSS = {
  'a4-landscape': '@page { size: A4 landscape; margin: 10mm; }',
  a5: '@page { size: A5; margin: 0; }',
  card: '@page { size: A4; margin: 15mm; }',
}

export default function DocumentModal({ title, size = 'a5', onClose, children }) {
  const { t } = useT()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handlePrint() {
    const prevTitle = document.title
    document.title = title
    const pageStyle = document.createElement('style')
    pageStyle.textContent = PAGE_CSS[size] || ''
    document.head.appendChild(pageStyle)
    document.body.classList.add('printing-doc')
    window.print()
    document.body.classList.remove('printing-doc')
    pageStyle.remove()
    document.title = prevTitle
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-pay-navy/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="no-print flex items-center justify-between gap-3 bg-surface px-4 py-3 shadow-card">
        <h2 className="font-bold text-heading truncate normal-case tracking-normal font-body">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-full bg-pay-action px-5 py-2 text-sm font-semibold text-white hover:bg-pay-action-dark">
            <Printer size={16} /> {t('Print / Save PDF')}
          </button>
          <button type="button" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg" aria-label={t('Close')}>
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
        <div className="print-doc" data-size={size}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
