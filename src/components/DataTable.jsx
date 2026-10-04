import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'

/**
 * Records table in the style of hospital software: compact rows, sortable columns,
 * row actions on the right, and the whole row opens the record when onRowClick is set.
 * On phones the same columns render as stacked cards.
 *
 * columns: [{
 *   key, header,
 *   render?: (row) => node,          // cell content (defaults to row[key])
 *   sortValue?: (row) => string|number, // makes the column sortable
 *   align?: 'right' | 'center',
 *   primary?: true,                  // card title on phones
 *   hideOnMobile?: true,
 *   width?: string,                  // e.g. '30%'
 * }]
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, actions, empty = 'No records', caption, rowAccent }) {
  const [sort, setSort] = useState(null) // { key, dir: 1 | -1 }

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const x = col.sortValue(a), y = col.sortValue(b)
      if (x == null || x === '') return 1
      if (y == null || y === '') return -1
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true })) * sort.dir
    })
  }, [rows, sort, columns])

  const toggleSort = (key) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))
  const cell = (c, r) => (c.render ? c.render(r) : r[c.key] ?? '—')
  const primary = columns.find((c) => c.primary) || columns[0]

  if (rows.length === 0) {
    return <div className="bg-surface rounded-2xl shadow-card px-6 py-10 text-center text-sm text-muted">{empty}</div>
  }

  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden md:block bg-surface rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr className="bg-pay-bg border-b border-pay-line text-left">
                {columns.map((c) => {
                  const active = sort?.key === c.key
                  const Icon = !c.sortValue ? null : active ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                      className={`px-4 py-3 text-[0.7rem] font-bold uppercase tracking-wider text-subtle whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}
                    >
                      {c.sortValue ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-heading ${active ? 'text-heading' : ''}`}>
                          {c.header}
                          <Icon size={12} className={active ? '' : 'opacity-50'} aria-hidden="true" />
                        </button>
                      ) : c.header}
                    </th>
                  )
                })}
                {actions && <th scope="col" className="px-4 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-subtle">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-pay-line">
              {sorted.map((r) => (
                <tr
                  key={rowKey(r)}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={`group transition-colors hover:bg-pay-sky/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={rowAccent ? { boxShadow: `inset 3px 0 0 ${rowAccent(r)}` } : undefined}
                >
                  {columns.map((c, i) => (
                    <td key={c.key} className={`px-4 py-3 align-middle text-body ${c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : ''}`}>
                      {i === 0 && onRowClick ? (
                        // keyboard access to the record: the first cell is a real button
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRowClick(r) }} className="text-left font-semibold text-heading hover:text-pay-action hover:underline focus-visible:underline">
                          {cell(c, r)}
                        </button>
                      ) : cell(c, r)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">{actions(r)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones: cards */}
      <ul className="md:hidden flex flex-col gap-3">
        {sorted.map((r) => (
          <li key={rowKey(r)} className="bg-surface rounded-2xl shadow-card overflow-hidden" style={rowAccent ? { boxShadow: `inset 3px 0 0 ${rowAccent(r)}, var(--shadow-card)` } : undefined}>
            <div
              className={`p-4 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-heading">{cell(primary, r)}</div>
                {onRowClick && <ChevronRight size={18} className="text-subtle shrink-0 mt-0.5" aria-hidden="true" />}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {columns.filter((c) => c !== primary && !c.hideOnMobile).map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[0.68rem] uppercase tracking-wider text-subtle">{c.header}</dt>
                    <dd className="text-body truncate">{cell(c, r)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {actions && <div className="flex flex-wrap gap-1.5 px-4 pb-4">{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Status badge: coloured dot + label (never colour alone). tone: ok | warn | bad | info | neutral */
export function StatusPill({ tone = 'neutral', children }) {
  const color = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', bad: 'var(--status-bad)', info: 'var(--status-info)', neutral: 'var(--color-subtle)' }[tone]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-pay-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-body whitespace-nowrap capitalize">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {children}
    </span>
  )
}
