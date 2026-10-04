import { useEffect, useMemo, useState } from 'react'
import { Download, Printer, Wallet, Percent, CalendarCheck, Users, Inbox } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { BELT_RANKS, BELT_LABELS, BELT_COLORS } from '../../../lib/belts'
import { exportCsv } from '../../../lib/listTools'
import { rupees } from '../../../lib/documents'
import StackedColumns from '../../../components/charts/StackedColumns'
import LineChart from '../../../components/charts/LineChart'
import BarList from '../../../components/charts/BarList'
import ModuleHeader from '../../../components/ModuleHeader'

const PERIODS = [
  { months: 3, label: 'Last 3 months' },
  { months: 6, label: 'Last 6 months' },
  { months: 12, label: 'Last 12 months' },
]
const ENQUIRY_STATUSES = ['new', 'contacted', 'enrolled', 'closed']

const ymd = (d) => d.toISOString().slice(0, 10)
const monthKey = (d) => String(d).slice(0, 7)
const monthLabel = (key) => new Date(`${key}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

// First day of each month in the window, oldest first
function monthsBack(n) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (n - 1 - i), 1))
    return ymd(d).slice(0, 7)
  })
}

export default function Reports() {
  const [months, setMonths] = useState(6)
  const [center, setCenter] = useState('')
  const [centers, setCenters] = useState([])
  const [data, setData] = useState({ fees: [], attendance: [], students: [], enquiries: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const periodMonths = useMemo(() => monthsBack(months), [months])
  const from = `${periodMonths[0]}-01`

  useEffect(() => {
    supabase.from('training_centers').select('id, name').order('name').then(({ data }) => setCenters(data || []))
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [fees, attendance, students, enquiries] = await Promise.all([
        supabase.from('fee_payments').select('period_month, amount_due, amount_paid, status, students(training_center_id)').gte('period_month', from),
        supabase.from('attendance').select('session_date, status, students(training_center_id)').gte('session_date', from),
        supabase.from('students').select('id, current_belt, active, training_center_id, created_at'),
        supabase.from('enquiries').select('status, created_at').gte('created_at', from),
      ])
      if (!active) return
      const firstError = [fees, attendance, students, enquiries].find((r) => r.error)?.error
      setError(firstError ? firstError.message : '')
      setData({
        fees: fees.data || [],
        attendance: attendance.data || [],
        students: students.data || [],
        enquiries: enquiries.data || [],
      })
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [from])

  // Everything below is scoped by the centre filter (enquiries aren't tied to a centre)
  const inCenter = (centerId) => !center || centerId === center
  const fees = data.fees.filter((f) => inCenter(f.students?.training_center_id))
  const attendance = data.attendance.filter((a) => inCenter(a.students?.training_center_id))
  const students = data.students.filter((s) => inCenter(s.training_center_id))

  const monthly = periodMonths.map((key) => {
    const f = fees.filter((x) => monthKey(x.period_month) === key)
    const due = f.reduce((s, x) => s + Number(x.amount_due || 0), 0)
    const collected = f.reduce((s, x) => s + Number(x.amount_paid || 0), 0)
    const a = attendance.filter((x) => monthKey(x.session_date) === key)
    const present = a.filter((x) => x.status === 'present' || x.status === 'late').length
    return {
      key,
      label: monthLabel(key),
      due,
      collected,
      outstanding: Math.max(0, due - collected),
      attendanceRate: a.length ? Math.round((present / a.length) * 100) : null,
      sessions: a.length,
      newStudents: students.filter((s) => monthKey(s.created_at) === key).length,
      enquiries: data.enquiries.filter((e) => monthKey(e.created_at) === key).length,
    }
  })

  const totals = monthly.reduce((t, m) => ({
    due: t.due + m.due, collected: t.collected + m.collected,
  }), { due: 0, collected: 0 })
  const allMarks = attendance.length
  const allPresent = attendance.filter((x) => x.status === 'present' || x.status === 'late').length
  const activeStudents = students.filter((s) => s.active).length

  const tiles = [
    { label: 'Fees collected', value: rupees(totals.collected), icon: Wallet },
    { label: 'Collection rate', value: totals.due ? `${Math.round((totals.collected / totals.due) * 100)}%` : '—', icon: Percent },
    { label: 'Attendance rate', value: allMarks ? `${Math.round((allPresent / allMarks) * 100)}%` : '—', icon: CalendarCheck },
    { label: 'Active students', value: activeStudents, icon: Users },
    { label: 'Enquiries received', value: data.enquiries.length, icon: Inbox },
  ]

  const beltData = BELT_RANKS.map((b) => ({ key: b, label: BELT_LABELS[b], value: students.filter((s) => s.active && s.current_belt === b).length }))
  const enquiryData = ENQUIRY_STATUSES.map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), value: data.enquiries.filter((e) => e.status === s).length }))
  const centerName = centers.find((c) => c.id === center)?.name || 'All centres'
  const periodLabel = PERIODS.find((p) => p.months === months)?.label

  function downloadReport() {
    exportCsv(`academy-report-${months}m${center ? '-' + centerName.replace(/\s+/g, '-').toLowerCase() : ''}`, monthly, [
      { label: 'Month', value: (m) => new Date(`${m.key}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
      { label: 'Centre', value: () => centerName },
      { label: 'Fees due (INR)', value: (m) => m.due },
      { label: 'Fees collected (INR)', value: (m) => m.collected },
      { label: 'Outstanding (INR)', value: (m) => m.outstanding },
      { label: 'Collection rate %', value: (m) => (m.due ? Math.round((m.collected / m.due) * 100) : '') },
      { label: 'Attendance marks', value: (m) => m.sessions },
      { label: 'Attendance rate %', value: (m) => m.attendanceRate ?? '' },
      { label: 'New students', value: (m) => m.newStudents },
      { label: 'Enquiries', value: (m) => m.enquiries },
    ])
  }

  function printReport() {
    const prev = document.title
    document.title = `Academy report — ${periodLabel} — ${centerName}`
    window.print()
    document.title = prev
  }

  const chip = (active) =>
    `rounded-full px-3.5 py-1.5 text-xs font-semibold border ${active ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body bg-surface hover:bg-pay-bg'}`

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Reports & Analytics"
        description={`${periodLabel} · ${centerName}`}
        actions={
        <div className="no-print flex gap-2 flex-wrap">
          <button onClick={downloadReport} className="inline-flex items-center gap-1.5 rounded-full bg-pay-action px-5 py-2.5 text-sm font-semibold text-white hover:bg-pay-action-dark">
            <Download size={16} /> Monthly report (Excel)
          </button>
          <button onClick={printReport} className="inline-flex items-center gap-1.5 rounded-full border border-pay-line bg-surface px-5 py-2.5 text-sm font-semibold text-heading hover:bg-pay-bg">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
        }
      />

      {/* Filters: one row, above everything they scope */}
      <div className="no-print flex flex-wrap items-center gap-2 my-5">
        {PERIODS.map((p) => (
          <button key={p.months} type="button" onClick={() => setMonths(p.months)} aria-pressed={months === p.months} className={chip(months === p.months)}>
            {p.label}
          </button>
        ))}
        <span className="w-px h-6 bg-pay-line mx-1" aria-hidden="true" />
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-subtle">
          Centre
          <select value={center} onChange={(e) => setCenter(e.target.value)} className="rounded-full border border-pay-line bg-surface px-3 py-1.5 text-xs font-semibold text-heading">
            <option value="">All centres</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">Some data couldn't be loaded: {error}</p>}

      <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        {tiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface rounded-2xl shadow-card p-4 flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-pay-sky text-pay-action shrink-0"><Icon size={18} /></span>
            <div className="min-w-0">
              <div className="text-xs text-muted">{label}</div>
              <div className="text-xl font-bold text-heading truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <StackedColumns
          title="Fee collection by month"
          subtitle="Collected vs still outstanding; the full column is the amount due"
          data={monthly.map((m) => ({ label: m.label, values: { collected: m.collected, outstanding: m.outstanding } }))}
          series={[
            { key: 'collected', label: 'Collected', color: 'var(--viz-1)' },
            { key: 'outstanding', label: 'Outstanding', color: 'var(--viz-2)' },
          ]}
          format={rupees}
          loading={loading}
        />
        <LineChart
          title="Attendance rate"
          subtitle="Present or late, as a share of all attendance marks"
          data={monthly.map((m) => ({ label: m.label, value: m.attendanceRate }))}
          color="var(--viz-1)"
          loading={loading}
          emptyText="No attendance marked in this period"
        />
        <BarList
          title="Students by belt"
          subtitle="Active students, current rank"
          data={beltData}
          swatches={BELT_COLORS}
          color="var(--viz-1)"
          loading={loading}
        />
        <BarList
          title="Website enquiries by status"
          subtitle={`${periodLabel} · all centres`}
          data={enquiryData}
          color="var(--viz-1)"
          loading={loading}
        />
      </div>
    </div>
  )
}
