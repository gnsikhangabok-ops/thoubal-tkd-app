import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

// Shared frame for login, signup and status pages: official header strip + centred form panel.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col bg-chalk font-body">
      <div className="tricolor" />
      <div className="bg-ink border-b-4 border-b-gold">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="" className="w-10 h-10 object-contain shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-bold text-chalk uppercase tracking-wide truncate">Thoubal Taekwondo Academy</span>
              <span className="text-[0.62rem] tracking-wide text-[#C9D3E6] uppercase truncate">Thoubal District Taekwondo Association</span>
            </div>
          </Link>
          <Link to="/" className="shrink-0 text-sm text-[#C9D3E6] hover:text-gold">← Homepage</Link>
        </div>
      </div>

      <main id="main" className="flex-1 flex items-start md:items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-line shadow-sm">
          <div className="bg-[#EAF0F8] border-b border-line border-l-4 border-l-brand-red px-6 py-4">
            <h1 className="text-xl text-ink">{title}</h1>
            {subtitle && <p className="text-sm text-charcoal mt-1 normal-case">{subtitle}</p>}
          </div>
          <div className="px-6 py-6">{children}</div>
          {footer && <div className="px-6 py-4 border-t border-line bg-chalk text-sm">{footer}</div>}
        </div>
      </main>

      <div className="text-center text-xs text-charcoal py-4">
        © {new Date().getFullYear()} Thoubal Taekwondo Academy
      </div>
    </div>
  )
}
