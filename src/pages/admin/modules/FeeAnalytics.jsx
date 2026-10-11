import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, IndianRupee, Clock4, Target, Wallet } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { btnOutline } from '../../../lib/adminUi'
import { rupees } from '../../../lib/documents'
import { compact } from '../../../lib/chartUtils'
import { balance, dueDate, monthFirst, shiftMonth, shortMonth, monthLabel } from '../../../lib/fees'
import ModuleHeader from '../../../components/ModuleHeader'
import StackedColumns from '../../../components/charts/StackedColumns'
import LineChart from '../../../components/charts/LineChart'
import BarList from '../../../components/charts/BarList'

const RANGES = [[6, '6 months'], [12, '12 months'], [24, '24 months']]

export default function FeeAnalytics() {
  const [range, setRange] = useState(12)
  const [rows, setRows] = useState([])
  const [oneTime, setOneTime] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const end = monthFirst()
  const start = shiftMonth(end, -(range - 1))

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('fee_payments').select('period_month, amount_due, amount_paid, status, paid_on, payment_method, students(training_center_id, training_centers(name))').gte('period_month', start).lte('period_month', end),
      supabase.from('one_time_fee_payments').select('amount_paid, created_at, one_time_fee_types(name)').gte('created_at', start),
    ]).then(([feeRes, otRes]) => {
      if (!active) return
      if (feeRes.error) setError(feeRes.error.message)
      setRows(feeRes.data || [])
      setOneTime(otRes.data || [])
      setLoading(false)
    })
    return () => { active = false }
  }, [start, end])

  const a = useMemo(() => {
    const months = Array.from({ length: range }, (_, i) => shiftMonth(start, i))
    const monthly = months.map((m) => {
      const r = rows.filter((p) => p.period_month.slice(0, 7) === m.slice(0, 7))
      const billed = r.filter((p) => p.status !== 'waived').reduce((s, p) => s + Number(p.amount_due || 0), 0)
      const collected = r.reduce((s, p) => s + Number(p.amount_paid || 0), 0)
      return { m, label: shortMonth(m), billed, collected, outstanding: r.reduce((s, p) => s + balance(p), 0), rate: billed ? Math.round((Math.min(collected, billed) / billed) * 100) : null }
    })
    const billed = monthly.reduce((s, x) => s + x.billed, 0)
    const collected = monthly.reduce((s, x) => s + x.collected, 0)
    const paid = rows.filter((p) => p.paid_on && Number(p.amount_paid) > 0)
    const onTime = paid.filter((p) => new Date(p.paid_on) <= dueDate(p)).length
    const daysToPay = paid.map((p) => Math.max(0, (new Date(p.paid_on) - new Date(`${p.period_month.slice(0, 7)}-01`)) / 86400000))
    const methods = {}, centres = {}, otTypes = {}
    paid.forEach((p) => { const k = p.payment_method || 'Other'; methods[k] = (methods[k] || 0) + Number(p.amount_paid) })
    rows.forEach((p) => {
      const k = p.students?.training_centers?.name || 'Unassigned'
      centres[k] = centres[k] || { billed: 0, collected: 0 }
      if (p.status !== 'waived') centres[k].billed += Number(p.amount_due || 0)
      centres[k].collected += Number(p.amount_paid || 0)
    })
    oneTime.forEach((p) => { const k = p.one_time_fee_types?.name || 'Other'; otTypes[k] = (otTypes[k] || 0) + Number(p.amount_paid || 0) })
    const best = [...monthly].filter((x) => x.collected).sort((x, y) => y.collected - x.collected)[0]
    return {
      monthly, billed, collected,
      outstanding: monthly.reduce((s, x) => s + x.outstanding, 0),
      rate: billed ? Math.round((Math.min(collected, billed) / billed) * 100) : 0,
      onTime: paid.length ? Math.round((onTime / paid.length) * 100) : null,
      avgDays: daysToPay.length ? Math.round(daysToPay.reduce((s, d) => s + d, 0) / daysToPay.length) : null,
      best,
      oneTimeTotal: oneTime.reduce((s, p) => s + Number(p.amount_paid || 0), 0),
      methods: Object.entries(methods).sort((x, y) => y[1] - x[1]).map(([label, value]) => ({ label, value })),
      centres: Object.entries(centres).map(([label, v]) => ({ label: `${label} · ${v.billed ? Math.round((Math.min(v.collected, v.billed) / v.billed) * 100) : 0}%`, value: v.collected })).sort((x, y) => y.value - x.value),
      otTypes: Object.entries(otTypes).map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value),
    }
  }, [rows, oneTime, range, start])

  const KPIS = [
    { icon: IndianRupee, label: 'Collected', value: rupees(a.collected), sub: `of ${rupees(a.billed)} billed` },
    { icon: Target, label: 'Collection rate', value: `${a.rate}%`, sub: `${rupees(a.outstanding)} still due` },
    { icon: Clock4, label: 'Paid on time', value: a.onTime == null ? '—' : `${a.onTime}%`, sub: a.avgDays == null ? 'no payments yet' : `avg ${a.avgDays} days into the month` },
    { icon: TrendingUp, label: 'Best month', value: a.best ? shortMonth(a.best.m) : '—', sub: a.best ? rupees(a.best.collected) : '' },
    { icon: Wallet, label: 'One-time fees', value: rupees(a.oneTimeTotal), sub: 'admission, kit, exams…' },
  ]

  return (
    <div className="p-8 max-md:p-4 max-w-[1320px] mx-auto">
      <ModuleHeader
        title="Fee Analytics"
        description={`Collection performance from ${monthLabel(start)} to ${monthLabel(end)}.`}
        actions={<>
          <div className="inline-flex rounded-full border border-pay-line bg-surface p-0.5" role="group" aria-label="Period">
            {RANGES.map(([n, l]) => (
              <button key={n} type="button" aria-pressed={range === n} onClick={() => { setLoading(true); setRange(n) }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${range === n ? 'bg-pay-action text-white' : 'text-muted hover:text-heading'}`}>{l}</button>
            ))}
          </div>
          <Link to="/admin/fees" className={btnOutline}>Collection desk</Link>
        </>}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-4">
        {KPIS.map(({ icon: Icon, label, value, sub }, i) => (
          <div key={label} className={i === 0 ? 'pay-stat !p-4' : 'bg-surface rounded-2xl shadow-card p-4'}>
            <div className="flex items-center gap-2">
              <span className={`grid place-items-center w-8 h-8 rounded-full ${i === 0 ? 'bg-white/15 text-white' : 'bg-pay-sky text-pay-action'}`}><Icon size={15} /></span>
              <span className={`text-xs ${i === 0 ? 'text-white/80' : 'text-muted'}`}>{label}</span>
            </div>
            {i === 0
              ? <strong className="block text-2xl font-bold tabular-nums mt-2 truncate">{loading ? '…' : value}</strong>
              : <p className="text-2xl font-bold text-heading tabular-nums mt-2 truncate">{loading ? '…' : value}</p>}
            <p className={`text-[0.7rem] truncate ${i === 0 ? 'text-white/70' : 'text-subtle'}`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <StackedColumns
          title="Billed vs collected"
          subtitle="Each column is the month's billing; the gold part is still outstanding"
          data={a.monthly.map((m) => ({ label: m.label, values: { collected: m.collected, outstanding: m.outstanding } }))}
          series={[
            { key: 'collected', label: 'Collected', color: 'var(--viz-1)' },
            { key: 'outstanding', label: 'Outstanding', color: 'var(--viz-2)' },
          ]}
          format={(v) => `₹${compact(v)}`}
          loading={loading}
        />
        <LineChart
          title="Collection rate"
          subtitle="Share of each month's billing collected so far"
          data={a.monthly.map((m) => ({ label: m.label, value: m.rate }))}
          color="var(--viz-1)"
          loading={loading}
          emptyText="No fees billed in this period"
        />
        <BarList title="Payment methods" subtitle="Monthly fees collected, by method" data={a.methods} color="var(--viz-1)" format={rupees} loading={loading} />
        <BarList title="By training centre" subtitle="Collected · collection rate" data={a.centres} color="var(--viz-1)" format={rupees} loading={loading} />
        {a.otTypes.length > 0 && <BarList title="One-time fees" subtitle="Admission, uniform, exam and other fees" data={a.otTypes} color="var(--viz-2)" format={rupees} loading={loading} />}
      </div>
    </div>
  )
}
