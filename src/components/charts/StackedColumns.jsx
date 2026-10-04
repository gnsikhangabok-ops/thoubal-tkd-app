import { useState } from 'react'
import ChartFrame, { Tooltip } from './ChartFrame'
import { useWidth, niceMax, compact } from '../../lib/chartUtils'

/**
 * Stacked columns. data: [{ label, values: { key: number } }], series: [{ key, label, color }]
 * Columns ≤ 24px wide, 4px rounded top, square at the baseline, 2px surface gap between segments.
 */
export default function StackedColumns({ title, subtitle, data, series, format = (v) => v, loading }) {
  const [ref, width] = useWidth()
  const [tip, setTip] = useState(null)
  const H = 220, PAD = { t: 12, r: 8, b: 26, l: 40 }
  const innerW = Math.max(0, width - PAD.l - PAD.r)
  const innerH = H - PAD.t - PAD.b
  const totals = data.map((d) => series.reduce((s, x) => s + (d.values[x.key] || 0), 0))
  const max = niceMax(Math.max(0, ...totals))
  const band = data.length ? innerW / data.length : 0
  const barW = Math.min(24, band * 0.6)
  const y = (v) => PAD.t + innerH - (v / max) * innerH
  const ticks = [0, max / 2, max]

  function show(i, cx) {
    const d = data[i]
    setTip({
      x: cx, y: y(totals[i]) , title: d.label,
      rows: [...series].reverse().map((s) => ({ label: s.label, value: format(d.values[s.key] || 0), color: s.color })),
    })
  }

  return (
    <ChartFrame
      title={title} subtitle={subtitle} loading={loading}
      legend={series.map((s) => ({ label: s.label, color: s.color }))}
      table={{ columns: ['', ...series.map((s) => s.label), 'Total'], rows: data.map((d, i) => [d.label, ...series.map((s) => format(d.values[s.key] || 0)), format(totals[i])]) }}
    >
      <div ref={ref} className="relative" onPointerLeave={() => setTip(null)}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={title}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-pay-line)" strokeWidth="1" />
                <text x={PAD.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle text-[10px] tabular-nums">{compact(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD.l + band * i + band / 2
              let acc = 0
              const segs = series.map((s) => {
                const v = d.values[s.key] || 0
                const top = y(acc + v), bottom = y(acc)
                acc += v
                return { s, v, top, bottom }
              }).filter((g) => g.v > 0)
              return (
                <g key={d.label}>
                  {segs.map((g, k) => {
                    const isTop = k === segs.length - 1
                    const gap = k > 0 ? 2 : 0 // surface gap between stacked segments
                    const h = Math.max(0, g.bottom - g.top - gap)
                    const r = isTop ? Math.min(4, h) : 0
                    const x0 = cx - barW / 2, y0 = g.top, y1 = g.top + h
                    const path = `M${x0},${y1} L${x0},${y0 + r} Q${x0},${y0} ${x0 + r},${y0} L${x0 + barW - r},${y0} Q${x0 + barW},${y0} ${x0 + barW},${y0 + r} L${x0 + barW},${y1} Z`
                    return <path key={g.s.key} d={path} fill={g.s.color} opacity={tip && tip.title !== d.label ? 0.55 : 1} />
                  })}
                  {/* hit target: the whole band */}
                  <rect
                    x={PAD.l + band * i} y={PAD.t} width={band} height={innerH} fill="transparent"
                    tabIndex={0} aria-label={`${d.label}: ${series.map((s) => `${s.label} ${format(d.values[s.key] || 0)}`).join(', ')}`}
                    onPointerMove={() => show(i, cx)} onFocus={() => show(i, cx)} onBlur={() => setTip(null)}
                    className="outline-none"
                  />
                  <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted text-[10px]">{d.label}</text>
                </g>
              )
            })}
          </svg>
        )}
        <Tooltip tip={tip} />
      </div>
    </ChartFrame>
  )
}
