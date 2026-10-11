// Circular progress for an application's readiness score (details, documents, consent, fees)
export default function ReadinessRing({ value, size = 40, light = false, label = 'ready' }) {
  const stroke = size > 44 ? 5 : 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = light ? 'var(--ring-light, #fff)' : value >= 80 ? 'var(--status-ok)' : value >= 50 ? 'var(--status-warn)' : 'var(--status-bad)'
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }} title={`${value}% ${label}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={light ? 'rgba(255,255,255,0.25)' : 'var(--color-pay-line)'} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={color} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className={`absolute ${size > 60 ? 'text-xl' : 'text-[0.62rem]'} font-bold tabular-nums ${light ? 'text-white' : 'text-heading'}`}>
        {value}{size > 60 && <span aria-hidden="true" className="text-xs">%</span>}<span className="sr-only">% {label}</span>
      </span>
    </span>
  )
}
