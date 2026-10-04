import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ADMIN_NAV } from '../lib/adminNav'

/**
 * Standard header for every management module, in the style of hospital software:
 * breadcrumb · title + description · actions on the right · tabs underneath.
 *
 * tabs: [{ value, label, count? }]  — use moduleTabs() to bind them to a list filter.
 * crumbs: extra trail after the module (e.g. a student's name on their file).
 */
export default function ModuleHeader({ title, description, actions, tabs, activeTab, onTabChange, crumbs = [] }) {
  const { pathname } = useLocation()
  const nav = ADMIN_NAV.filter((n) => n.path !== '/admin').find((n) => pathname === n.path || pathname.startsWith(n.path + '/'))
  const trail = [
    { label: 'Dashboard', to: '/admin' },
    ...(nav?.group ? [{ label: nav.group }] : []),
    ...(nav ? [{ label: nav.label, to: crumbs.length ? nav.path : undefined }] : []),
    ...crumbs,
  ]

  return (
    <header className="mb-6">
      <nav aria-label="Breadcrumb" className="no-print mb-2">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-subtle">
          {trail.map((c, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="opacity-60" aria-hidden="true" />}
              {c.to && i < trail.length - 1
                ? <Link to={c.to} className="hover:text-pay-action hover:underline">{c.label}</Link>
                : <span aria-current={i === trail.length - 1 ? 'page' : undefined} className={i === trail.length - 1 ? 'text-body font-medium' : ''}>{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-[1.6rem] font-bold text-heading leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted mt-1 max-w-[70ch]">{description}</p>}
        </div>
        {actions && <div className="no-print flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div role="tablist" aria-label={`${title} views`} className="no-print mt-5 flex gap-1 overflow-x-auto border-b border-pay-line [scrollbar-width:none]">
          {tabs.map((t) => {
            const active = (activeTab ?? '') === t.value
            return (
              <button
                key={t.value || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(t.value)}
                className={`relative shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors ${
                  active ? 'text-pay-action bg-surface' : 'text-muted hover:text-heading hover:bg-surface/60'
                }`}
              >
                {t.label}
                {t.count != null && (
                  <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-[0.7rem] tabular-nums ${active ? 'bg-pay-action text-white' : 'bg-pay-line/70 text-body'}`}>
                    {t.count}
                  </span>
                )}
                {active && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-pay-action" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
