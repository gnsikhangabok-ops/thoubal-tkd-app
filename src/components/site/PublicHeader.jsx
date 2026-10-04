import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import Brand from './Brand'

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
  const [open, setOpen] = useState(false)

  const navLink = (item, cls) =>
    item.to ? (
      <Link key={item.label} to={item.to} className={cls} onClick={() => setOpen(false)}>{item.label}</Link>
    ) : (
      <a key={item.label} href={item.href} className={cls} onClick={() => setOpen(false)}>{item.label}</a>
    )

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-white text-pay-navy rounded-full px-4 py-2 shadow-card">
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-pay-line">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-2.5 flex items-center justify-between gap-4">
          <Brand size="lg" />

          <nav aria-label="Main" className="hidden lg:flex items-center gap-0.5 min-w-0">
            {NAV.map((item) => navLink(item, 'rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-[#4A5A73] hover:bg-pay-bg hover:text-pay-navy'))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-pay-navy hover:bg-pay-bg">
              <LogIn size={16} /> Login
            </Link>
            <a href="/#enquiry" className="rounded-full bg-pay-action px-5 py-2 text-sm font-semibold text-white hover:bg-pay-action-dark">
              Enroll Now
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 rounded-full text-pay-navy hover:bg-pay-bg"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="public-nav"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav id="public-nav" aria-label="Main" className="lg:hidden border-t border-pay-line px-4 pb-4 pt-2 flex flex-col">
            {NAV.map((item) => navLink(item, 'rounded-xl px-3 py-3 text-[0.95rem] font-medium text-pay-navy hover:bg-pay-bg'))}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link to="/login" onClick={() => setOpen(false)} className="text-center rounded-full border border-pay-action px-4 py-2.5 text-sm font-semibold text-pay-action">
                Login
              </Link>
              <a href="/#enquiry" onClick={() => setOpen(false)} className="text-center rounded-full bg-pay-action px-4 py-2.5 text-sm font-semibold text-white">
                Enroll Now
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
