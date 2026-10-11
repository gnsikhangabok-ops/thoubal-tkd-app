/**
 * Row of headline figures at the top of a module: the first is the navy hero card,
 * the rest are white cards with a coloured accent bar.
 *   <StatStrip loading={loading} items={[{ label, value, sub, tone: 'ok' | 'warn' | 'bad' | 'info' | 'gold' }]} />
 */
const TONE = {
  ok: 'var(--status-ok)', warn: 'var(--status-warn)', bad: 'var(--status-bad)', info: 'var(--status-info)',
  gold: 'var(--gold, var(--color-pay-action))', navy: 'var(--color-pay-action)',
}

export default function StatStrip({ items, loading }) {
  const [hero, ...rest] = items
  return (
    <div className={`grid gap-3 grid-cols-2 mb-6 ${items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      <div className="pay-stat !p-5 col-span-2 lg:col-span-1 relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/5" aria-hidden="true" />
        <p className="relative text-xs text-white/75">{hero.label}</p>
        <strong className="relative block text-3xl font-bold tabular-nums mt-1 truncate">{loading ? '…' : hero.value}</strong>
        {hero.sub && <p className="relative text-[0.7rem] text-white/70 mt-0.5 truncate">{hero.sub}</p>}
      </div>
      {rest.map((s) => (
        <div key={s.label} className="bg-surface rounded-2xl shadow-card p-4 relative overflow-hidden">
          <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: TONE[s.tone] || TONE.navy }} aria-hidden="true" />
          <p className="text-xs text-muted">{s.label}</p>
          <p className="text-2xl font-bold text-heading tabular-nums mt-0.5 truncate">{loading ? '…' : s.value}</p>
          {s.sub && <p className="text-[0.7rem] text-subtle truncate">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}
