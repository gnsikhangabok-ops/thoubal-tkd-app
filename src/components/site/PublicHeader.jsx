import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import Brand from './Brand'
import ThemeToggle from '../ThemeToggle'
import { useT } from '../../lib/i18n'
import LanguageSwitcher from '../LanguageSwitcher'

const NAV = [
  { label: 'About', href: '/#about' },
  { label: 'Programs', href: '/#programs' },
  { label: 'Achievements', href: '/#achievements' },
  { label: 'Coaches', href: '/#coaches' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Rules', to: '/rules' },
  { label: 'Contact', href: '/#enquiry' },
]

export default function PublicHeader() {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  const navLink = (item, cls) =>
    item.to ? (
      <Link key={item.label} to={item.to} className={cls} onClick={() => setOpen(false)}>{t(item.label)}</Link>
    ) : (
      <a key={item.label} href={item.href} className={cls} onClick={() => setOpen(false)}>{t(item.label)}</a>
    )

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-surface text-heading rounded-full px-4 py-2 shadow-card">
        {t('Skip to main content')}
      </a>

      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-pay-line">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-2.5 flex items-center justify-between gap-4">
          <Brand size="lg" />

          <nav aria-label="Main" className="hidden xl:flex items-center gap-0.5 shrink-0">
            {NAV.map((item) => navLink(item, 'rounded-full px-2.5 2xl:px-3 py-2 text-sm font-medium whitespace-nowrap text-body hover:bg-pay-bg hover:text-heading'))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <LanguageSwitcher className="hidden xl:block" />
            <ThemeToggle className="hidden xl:grid" />
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-heading hover:bg-pay-bg">
              <LogIn size={16} /> {t('Login')}
            </Link>
            <a href="/#enquiry" className="rounded-full bg-pay-action px-5 py-2 text-sm font-semibold text-white hover:bg-pay-action-dark">
              {t('Enroll Now')}
            </a>
          </div>

          <LanguageSwitcher className="shrink-0 -mr-2 xl:hidden" />
          <ThemeToggle className="shrink-0 -mr-1 xl:hidden" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="xl:hidden p-2 rounded-full text-heading hover:bg-pay-bg"
            aria-label={open ? t('Close menu') : t('Open menu')}
            aria-expanded={open}
            aria-controls="public-nav"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav id="public-nav" aria-label="Main" className="xl:hidden border-t border-pay-line px-4 pb-4 pt-2 flex flex-col">
            {NAV.map((item) => navLink(item, 'rounded-xl px-3 py-3 text-[0.95rem] font-medium text-heading hover:bg-pay-bg'))}
            <div className="md:hidden grid grid-cols-2 gap-2 mt-3">
              <Link to="/login" onClick={() => setOpen(false)} className="text-center rounded-full border border-pay-action px-4 py-2.5 text-sm font-semibold text-pay-action">
                {t('Login')}
              </Link>
              <a href="/#enquiry" onClick={() => setOpen(false)} className="text-center rounded-full bg-pay-action px-4 py-2.5 text-sm font-semibold text-white">
                {t('Enroll Now')}
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
