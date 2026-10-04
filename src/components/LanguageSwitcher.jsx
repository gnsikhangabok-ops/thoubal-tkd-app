import { useEffect, useRef, useState } from 'react'
import { Languages, Check } from 'lucide-react'
import { LANGUAGES, setLanguage, useT } from '../lib/i18n'

export default function LanguageSwitcher({ className = '' }) {
  const { lang } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const currentLang = LANGUAGES.find((l) => l.code === lang)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Language: ${currentLang.label}`}
        className="inline-flex items-center gap-1 h-9 px-2 rounded-full text-heading hover:bg-pay-bg text-sm font-semibold"
      >
        <Languages size={18} />
        <span className="min-w-[1.4em]">{currentLang.short}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Choose language" className="absolute right-0 top-full mt-2 z-50 w-44 bg-surface rounded-2xl shadow-card border border-pay-line py-1.5">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                lang={l.code === 'mni' ? 'mni-Mtei' : l.code}
                onClick={() => { setLanguage(l.code); setOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-heading hover:bg-pay-bg"
              >
                {l.label}
                {l.code === lang && <Check size={16} className="text-pay-action" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
