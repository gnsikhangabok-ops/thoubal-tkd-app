import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import logo from '../../assets/logo.png'
import { REGISTRATION_NO } from '../../lib/siteContent'

const NAV = [
  { label: 'Home', href: '/#top' },
  { label: 'About', href: '/#about' },
  { label: 'Programs', href: '/#programs' },
  { label: 'Achievements', href: '/#achievements' },
  { label: 'Coaches', href: '/#coaches' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Rules & Regulations', to: '/rules' },
  { label: 'Contact', href: '/#enquiry' },
]

export default function PublicHeader() {
  const [open, setOpen] = useState(false)

  const navLink = (item, extra = '') => {
    const cls = `block font-display font-medium text-sm uppercase tracking-wide text-chalk hover:bg-white/10 ${extra}`
    return item.to ? (
      <Link key={item.label} to={item.to} className={cls} onClick={() => setOpen(false)}>{item.label}</Link>
    ) : (
      <a key={item.label} href={item.href} className={cls} onClick={() => setOpen(false)}>{item.label}</a>
    )
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-chalk text-ink px-3 py-2">
        Skip to main content
      </a>
      <div className="tricolor" />

      {/* Utility bar */}
      <div className="bg-ink-deep text-[#C9D3E6] text-xs">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-1.5 flex items-center justify-between gap-4">
          <span className="truncate">
            <span className="hidden sm:inline">Registered under Thoubal District Taekwondo Association · </span>
            Regd. No. {REGISTRATION_NO}
          </span>
          <Link to="/login" className="shrink-0 inline-flex items-center gap-1.5 hover:text-gold">
            <LogIn size={13} /> Student &amp; Staff Login
          </Link>
        </div>
      </div>

      {/* Identity header */}
      <header className="bg-white border-b border-line">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 md:gap-4 min-w-0">
            <img src={logo} alt="" className="w-12 h-12 md:w-16 md:h-16 object-contain shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[0.62rem] md:text-xs tracking-wide text-charcoal uppercase">Thoubal District Taekwondo Association</span>
              <span className="font-display font-bold text-lg md:text-2xl text-ink uppercase tracking-wide">Thoubal Taekwondo Academy</span>
              <span className="hidden md:block text-xs text-charcoal mt-0.5">Khangabok, Thoubal, Manipur · Affiliated to AMTA · TFI · Asian Taekwondo Union</span>
            </div>
          </Link>
          <a
            href="/#enquiry"
            className="hidden md:inline-block shrink-0 px-5 py-2.5 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark"
          >
            Admission Enquiry
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-ink p-1.5 border border-line"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="public-nav"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Primary navigation */}
      <nav id="public-nav" aria-label="Main" className="sticky top-0 z-50 bg-ink border-b-4 border-b-gold">
        <div className="hidden md:flex max-w-[1180px] mx-auto px-4 md:px-7 flex-wrap">
          {NAV.map((item) => navLink(item, 'px-4 py-3 border-r border-white/10 first:border-l'))}
        </div>
        {open && (
          <div className="md:hidden flex flex-col py-1">
            {NAV.map((item) => navLink(item, 'px-5 py-3 border-b border-white/10'))}
            <a
              href="/#enquiry"
              onClick={() => setOpen(false)}
              className="m-4 text-center px-5 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk"
            >
              Admission Enquiry
            </a>
          </div>
        )}
      </nav>
    </>
  )
}
