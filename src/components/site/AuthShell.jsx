import { Link } from 'react-router-dom'
import Brand from './Brand'
import ThemeToggle from '../ThemeToggle'
import { useT } from '../../lib/i18n'
import LanguageSwitcher from '../LanguageSwitcher'

// Shared frame for login, signup and status pages: app bar + gradient band + centred card.
export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useT()
  return (
    <div className="paytm min-h-screen flex flex-col font-body">
      <header className="bg-surface border-b border-pay-line">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-2.5 flex items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to="/" className="shrink-0 rounded-full border border-pay-line px-4 py-1.5 text-sm font-semibold text-heading hover:bg-pay-bg">
            {t('Home')}
          </Link>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 relative">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-pay-navy via-[#0057A8] to-pay-blue" aria-hidden="true" />
        <div className="relative flex justify-center px-4 pt-10 pb-12">
          <div className="w-full max-w-md bg-surface rounded-3xl shadow-card overflow-hidden">
            <div className="px-6 pt-7 pb-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
            </div>
            <div className="px-6 pt-4 pb-7">{children}</div>
            {footer && <div className="px-6 py-4 bg-pay-bg text-sm text-center">{footer}</div>}
          </div>
        </div>
      </main>

      <div className="text-center text-xs text-subtle py-4">
        {t('© {year} Thoubal Taekwondo Academy. All rights reserved.', { year: new Date().getFullYear() })}
      </div>
    </div>
  )
}
