import { useState } from 'react'
import { Search, X, Download, Printer, SlidersHorizontal, Filter } from 'lucide-react'

/**
 * Search box, filter chips, sort menu, result count and Export / Print buttons.
 * `list` comes from useListTools(). filters: [{ key, label, options: [{ value, label }] }]
 */
export default function ListToolbar({ list, placeholder = 'Search…', filters = [], sorts = [], onExport, printTitle }) {
  const [showFilters, setShowFilters] = useState(false) // phones only; always shown from md up
  const activeFilters = Object.values(list.filterValues).filter(Boolean).length
  function handlePrint() {
    const prev = document.title
    if (printTitle) document.title = `${printTitle} — Thoubal Taekwondo Academy`
    window.print()
    document.title = prev
  }

  return (
    <div className="no-print bg-surface rounded-2xl shadow-card p-3 md:p-4 mb-5 flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap items-center">
        <label className="relative flex-1 min-w-[200px]">
          <span className="sr-only">Search</span>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            type="search"
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-full border border-pay-line bg-pay-bg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-pay-action focus:ring-2 focus:ring-pay-sky"
          />
        </label>

        {sorts.length > 0 && (
          <label className="inline-flex items-center gap-1.5 rounded-full border border-pay-line bg-surface pl-3 pr-1 text-sm text-muted">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Sort by</span>
            <select
              value={list.sort}
              onChange={(e) => list.setSort(e.target.value)}
              className="bg-transparent py-2 pr-2 text-sm font-medium text-heading focus:outline-none cursor-pointer"
            >
              {sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
        )}

        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="md:hidden inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-heading hover:bg-pay-bg"
          >
            <Filter size={16} /> Filters{activeFilters > 0 && <span className="grid place-items-center min-w-5 h-5 rounded-full bg-pay-action text-white text-[0.7rem] px-1">{activeFilters}</span>}
          </button>
        )}
        {onExport && (
          <button type="button" onClick={onExport} className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-heading hover:bg-pay-bg">
            <Download size={16} /> <span className="max-sm:hidden">Export</span> Excel
          </button>
        )}
        <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-heading hover:bg-pay-bg">
          <Printer size={16} /> Print<span className="max-sm:hidden"> / PDF</span>
        </button>
      </div>

      <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col gap-3`}>
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-1.5 flex-wrap" role="group" aria-label={f.label}>
          <span className="text-xs font-semibold text-subtle mr-1 w-full sm:w-auto">{f.label}</span>
          {[{ value: '', label: 'All' }, ...f.options].map((opt) => {
            const active = (list.filterValues[f.key] || '') === opt.value
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => list.setFilter(f.key, opt.value)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  active ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body hover:bg-pay-bg'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ))}
      </div>

      <div className="flex items-center justify-between text-xs text-subtle">
        <span>
          Showing <strong className="text-heading">{list.result.length}</strong> of {list.total}
        </span>
        {list.activeCount > 0 && (
          <button type="button" onClick={list.reset} className="inline-flex items-center gap-1 font-semibold text-pay-action hover:underline">
            <X size={13} /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

