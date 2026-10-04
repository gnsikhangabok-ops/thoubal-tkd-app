import { useState } from 'react'
import ChartFrame, { Tooltip } from './ChartFrame'

/** Horizontal bars, one series: label · bar (≤ 24px, 4px rounded end) · value at the tip. */
export default function BarList({ title, subtitle, data, color, swatches, loading, format = (v) => v }) {
  const [tip, setTip] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ChartFrame
      title={title} subtitle={subtitle} loading={loading}
      table={{ columns: ['', 'Count', 'Share'], rows: data.map((d) => [d.label, format(d.value), total ? `${Math.round((d.value / total) * 100)}%` : '—']) }}
    >
      <ul className="relative flex flex-col gap-2.5" onPointerLeave={() => setTip(null)}>
        {data.map((d) => (
          <li
            key={d.label}
            tabIndex={0}
            className="grid grid-cols-[minmax(84px,34%)_1fr] items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-pay-sky"
            onPointerMove={(e) => {
              const r = e.currentTarget.parentElement.getBoundingClientRect()
              setTip({ x: e.clientX - r.left, y: e.currentTarget.offsetTop, title: d.label, rows: [{ label: total ? `${Math.round((d.value / total) * 100)}% of total` : '', value: format(d.value) }] })
            }}
            onFocus={(e) => setTip({ x: e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop, title: d.label, rows: [{ label: '', value: format(d.value) }] })}
            onBlur={() => setTip(null)}
          >
            <span className="flex items-center gap-1.5 text-xs text-body truncate">
              {swatches?.[d.key] && <span className="w-2.5 h-2.5 rounded-full ring-1 ring-subtle/60 shrink-0" style={{ background: swatches[d.key] }} />}
              {d.label}
            </span>
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-4 rounded-r-[4px] shrink-0 transition-opacity"
                style={{ width: `${Math.max(d.value ? 2 : 0, (d.value / max) * 82)}%`, background: color, opacity: tip && tip.title !== d.label ? 0.55 : 1 }}
              />
              <span className="text-xs font-semibold text-heading tabular-nums">{format(d.value)}</span>
            </span>
          </li>
        ))}
        <Tooltip tip={tip} />
      </ul>
    </ChartFrame>
  )
}
