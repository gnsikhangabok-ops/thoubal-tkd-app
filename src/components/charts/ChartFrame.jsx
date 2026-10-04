import { useState } from 'react'
import { Table2, BarChart3 } from 'lucide-react'

// Card wrapper shared by every chart: title, optional legend (2+ series), chart/table toggle.
export default function ChartFrame({ title, subtitle, legend, table, children, loading }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="viz bg-surface rounded-2xl shadow-card p-4 md:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="no-print shrink-0 inline-flex items-center gap-1 rounded-full border border-pay-line px-3 py-1 text-xs font-semibold text-heading hover:bg-pay-bg"
            aria-pressed={showTable}
          >
            {showTable ? <><BarChart3 size={13} /> Chart</> : <><Table2 size={13} /> Table</>}
          </button>
        )}
      </div>
      {legend && legend.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted" aria-label="Legend">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px]" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className={`relative flex-1 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        {showTable ? <DataTable {...table} /> : children}
      </div>
    </section>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-pay-line">
            {columns.map((c, i) => <th key={c} className={`py-2 pr-3 font-semibold ${i ? 'text-right' : ''}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-pay-line last:border-0">
              {r.map((v, j) => <td key={j} className={`py-2 pr-3 ${j ? 'text-right tabular-nums' : 'text-heading font-medium'}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Floating tooltip: value first (strong), label after.
export function Tooltip({ tip }) {
  if (!tip) return null
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-surface shadow-card border border-pay-line px-3 py-2 text-xs whitespace-nowrap"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <div className="text-subtle mb-1">{tip.title}</div>
      {tip.rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          {r.color && <span className="w-3 h-[3px] rounded" style={{ background: r.color }} />}
          <strong className="text-heading text-sm">{r.value}</strong>
          <span className="text-muted">{r.label}</span>
        </div>
      ))}
    </div>
  )
}
