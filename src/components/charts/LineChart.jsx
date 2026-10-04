import { useState } from 'react'
import ChartFrame, { Tooltip } from './ChartFrame'
import { useWidth } from '../../lib/chartUtils'

/** Single-series line (2px) with a 10% area wash, end label, and a snapping crosshair. Values 0–100 (%). */
export default function LineChart({ title, subtitle, data, color, format = (v) => `${v}%`, loading, emptyText = 'No data for this period' }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const H = 220, PAD = { t: 14, r: 44, b: 26, l: 36 }
  const pts = data.filter((d) => d.value != null)
  const innerW = Math.max(0, width - PAD.l - PAD.r)
  const innerH = H - PAD.t - PAD.b
  const x = (i) => PAD.l + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2)
  const y = (v) => PAD.t + innerH - (v / 100) * innerH
  const idx = data.map((d, i) => (d.value != null ? i : null)).filter((i) => i != null)
  const line = idx.map((i, k) => `${k ? 'L' : 'M'}${x(i)},${y(data[i].value)}`).join(' ')
  const area = idx.length ? `${line} L${x(idx[idx.length - 1])},${y(0)} L${x(idx[0])},${y(0)} Z` : ''
  const last = idx[idx.length - 1]

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    let best = null
    for (const i of idx) if (best == null || Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    setHover(best)
  }

  return (
    <ChartFrame
      title={title} subtitle={subtitle} loading={loading}
      table={{ columns: ['', title], rows: data.map((d) => [d.label, d.value == null ? '—' : format(d.value)]) }}
    >
      <div ref={ref} className="relative">
        {width > 0 && (pts.length === 0 ? (
          <p className="h-[220px] grid place-items-center text-sm text-muted">{emptyText}</p>
        ) : (
          <svg
            width={width} height={H} role="img" aria-label={title}
            onPointerMove={onMove} onPointerLeave={() => setHover(null)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return
              const k = idx.indexOf(hover ?? last)
              setHover(idx[Math.max(0, Math.min(idx.length - 1, k + (e.key === 'ArrowRight' ? 1 : -1)))])
            }}
            onFocus={() => setHover(last)} onBlur={() => setHover(null)}
            className="outline-none focus-visible:ring-2 focus-visible:ring-pay-sky rounded"
          >
            {[0, 50, 100].map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-pay-line)" strokeWidth="1" />
                <text x={PAD.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle text-[10px] tabular-nums">{t}%</text>
              </g>
            ))}
            {data.map((d, i) => (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
              <text key={d.label} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[10px]">{d.label}</text>
            ))}
            <path d={area} fill={color} opacity="0.1" />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="var(--color-subtle)" strokeWidth="1" />}
            {[hover ?? last].filter((i) => i != null).map((i) => (
              <circle key={i} cx={x(i)} cy={y(data[i].value)} r="4.5" fill={color} stroke="var(--color-surface)" strokeWidth="2" />
            ))}
            {last != null && (
              <text x={x(last) + 8} y={y(data[last].value)} dy="0.32em" className="fill-heading text-[11px] font-semibold">{format(data[last].value)}</text>
            )}
          </svg>
        ))}
        <Tooltip tip={hover != null ? { x: x(hover), y: y(data[hover].value), title: data[hover].label, rows: [{ label: title, value: format(data[hover].value), color }] } : null} />
      </div>
    </ChartFrame>
  )
}
