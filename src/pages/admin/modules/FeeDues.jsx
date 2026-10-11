import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone, ShieldCheck, X, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import { moduleTabs } from '../../../lib/moduleTabs'
import { rupees } from '../../../lib/documents'
import { FEE_SELECT, balance, daysOverdue, dueDate, shortMonth, reminderLink } from '../../../lib/fees'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import { useFeeSettings } from '../../../lib/feeSettings'
import DataTable, { StatusPill } from '../../../components/DataTable'
import PersonCell from '../../../components/PersonCell'
import DocumentModal from '../../../components/docs/DocumentModal'
import FeeReceipt from '../../../components/docs/FeeReceipt'
import PaymentSheet from '../fees/PaymentSheet'
import StudentLedger from '../fees/StudentLedger'

// Ageing buckets by days past the due date of the oldest unpaid month
const BUCKETS = [
  { key: 'upcoming', label: 'Not yet due', tone: 'info', color: 'var(--status-info)', test: (d) => d <= 0 },
  { key: 'd30', label: '1–30 days', tone: 'warn', color: '#E0A43A', test: (d) => d > 0 && d <= 30 },
  { key: 'd60', label: '31–60 days', tone: 'warn', color: '#D9772B', test: (d) => d > 30 && d <= 60 },
  { key: 'd90', label: '61–90 days', tone: 'bad', color: '#D14B3B', test: (d) => d > 60 && d <= 90 },
  { key: 'd90p', label: '90+ days', tone: 'bad', color: '#9F1D2C', test: (d) => d > 90 },
]
const BUCKET = Object.fromEntries(BUCKETS.map((b) => [b.key, b]))
const bucketFor = (days) => BUCKETS.find((b) => b.test(days)).key

export default function FeeDues() {
  const settings = useFeeSettings() // due day decides what counts as overdue
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ledgerFor, setLedgerFor] = useState(null)
  const [ledgerKey, setLedgerKey] = useState(0)
  const [paying, setPaying] = useState(null)
  const [receiptFor, setReceiptFor] = useState(null)
  const [flash, setFlash] = useState('')

  async function load() {
    const { data, error } = await supabase.from('fee_payments').select(FEE_SELECT).not('status', 'in', '(paid,waived)').order('period_month')
    if (error) setError(error.message)
    else setRows(data.filter((p) => balance(p) > 0))
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    load()
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(t)
  }, [flash])

  // One line per student: every unpaid month rolled up
  const debtors = useMemo(() => {
    const by = new Map()
    rows.forEach((p) => {
      const d = by.get(p.student_id) || { id: p.student_id, student: p.students, months: [], total: 0, oldest: p }
      d.months.push(p)
      d.total += balance(p)
      if (dueDate(p) < dueDate(d.oldest)) d.oldest = p
      by.set(p.student_id, d)
    })
    return [...by.values()].map((d) => {
      const late = new Date() > dueDate(d.oldest)
      const days = daysOverdue(d.oldest)
      return { ...d, days, bucket: bucketFor(late ? Math.max(1, days) : 0) }
    })
  // settings: the fee helpers read the due day from the settings store, so recompute when it loads
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, settings])

  const ageing = BUCKETS.map((b) => ({ ...b, amount: debtors.filter((d) => d.bucket === b.key).reduce((s, d) => s + d.total, 0), count: debtors.filter((d) => d.bucket === b.key).length }))
  const total = debtors.reduce((s, d) => s + d.total, 0)
  const overdueTotal = debtors.filter((d) => d.bucket !== 'upcoming').reduce((s, d) => s + d.total, 0)

  const list = useListTools(debtors, {
    search: (d) => [d.student?.full_name, d.student?.guardian_name, d.student?.guardian_phone, d.student?.batches?.name],
    filters: { bucket: (d) => d.bucket, center: (d) => d.student?.training_center_id },
    sorts: { amount: (a, b) => b.total - a.total, oldest: (a, b) => b.days - a.days, name: byText((d) => d.student?.full_name) },
    defaultSort: 'amount',
  })
  const tabs = moduleTabs(list, 'bucket', [['', 'All dues'], ...BUCKETS.map((b) => [b.key, b.label])])
  const centers = [...new Map(debtors.filter((d) => d.student?.training_center_id).map((d) => [d.student.training_center_id, d.student.training_centers?.name])).entries()]

  function handleExport() {
    exportCsv('fee-dues', list.result, [
      { label: 'Student', value: (d) => d.student?.full_name },
      { label: 'Guardian', value: (d) => d.student?.guardian_name },
      { label: 'Phone', value: (d) => d.student?.guardian_phone },
      { label: 'Centre', value: (d) => d.student?.training_centers?.name },
      { label: 'Batch', value: (d) => d.student?.batches?.name },
      { label: 'Unpaid months', value: (d) => d.months.map((p) => shortMonth(p.period_month)).join(' ') },
      { label: 'Total due (INR)', value: (d) => d.total },
      { label: 'Days overdue', value: (d) => d.days },
      { label: 'Ageing', value: (d) => BUCKET[d.bucket].label },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1320px] mx-auto">
      <ModuleHeader
        title="Fee Dues"
        description="Every unpaid balance across all months, aged by how late it is — with one-tap WhatsApp reminders."
        actions={<Link to="/admin/fees" className={btnOutline}>Collection desk</Link>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></p>}

      <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr]">
        <section className="pay-stat !p-6 relative overflow-hidden">
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">Total outstanding</p>
          <strong className="block text-4xl font-bold tabular-nums mt-1">{loading ? '…' : rupees(total)}</strong>
          <p className="text-sm text-white/80 mt-1">{debtors.length} student{debtors.length === 1 ? '' : 's'} · {rupees(overdueTotal)} past due</p>
          <p className="text-xs text-white/65 mt-4">{rows.length} unpaid monthly fee{rows.length === 1 ? '' : 's'}</p>
        </section>

        <section className="bg-surface rounded-2xl shadow-card p-5" aria-labelledby="ageing-h">
          <div className="flex items-center justify-between">
            <h2 id="ageing-h" className="font-semibold text-heading">Ageing</h2>
            <span className="text-xs text-subtle">by the oldest unpaid month</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-pay-line mt-4" aria-hidden="true">
            {ageing.filter((b) => b.amount > 0).map((b) => <span key={b.key} style={{ width: `${(b.amount / (total || 1)) * 100}%`, background: b.color }} title={b.label} />)}
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {ageing.map((b) => (
              <li key={b.key}>
                <button type="button" onClick={() => tabs.select(tabs.active === b.key ? '' : b.key)} aria-pressed={tabs.active === b.key}
                  className={`w-full text-left rounded-xl p-2.5 border transition ${tabs.active === b.key ? 'border-pay-action bg-pay-sky' : 'border-pay-line hover:bg-pay-bg'}`}>
                  <span className="flex items-center gap-1.5 text-[0.7rem] text-muted"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}</span>
                  <strong className="block text-heading tabular-nums mt-0.5">{rupees(b.amount)}</strong>
                  <span className="text-[0.68rem] text-subtle">{b.count} student{b.count === 1 ? '' : 's'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6" />
      <ListToolbar
        list={list}
        placeholder="Search student, guardian, phone, batch…"
        printTitle="Fee dues"
        onExport={handleExport}
        filters={centers.length > 1 ? [{ key: 'center', label: 'Centre', options: centers.map(([value, label]) => ({ value, label })) }] : []}
        sorts={[{ key: 'amount', label: 'Highest due' }, { key: 'oldest', label: 'Longest overdue' }, { key: 'name', label: 'Student A–Z' }]}
      />

      {loading ? <p className="text-muted">Loading…</p> : (
        <DataTable
          caption="Fee dues"
          rows={list.result}
          onRowClick={(d) => setLedgerFor(d.id)}
          rowAccent={(d) => BUCKET[d.bucket].color}
          empty={list.total === 0
            ? <span className="flex flex-col items-center gap-2"><ShieldCheck size={32} className="text-[color:var(--status-ok)]" />No outstanding fees — every student is up to date.</span>
            : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'student', header: 'Student', primary: true, width: '26%', sortValue: (d) => d.student?.full_name,
              render: (d) => <PersonCell name={d.student?.full_name} sub={[d.student?.batches?.name, d.student?.training_centers?.name].filter(Boolean).join(' · ')} /> },
            { key: 'months', header: 'Unpaid months', fullOnMobile: true,
              render: (d) => (
                <span className="flex flex-wrap gap-1">
                  {d.months.map((p) => <span key={p.id} className="rounded-md bg-pay-bg border border-pay-line px-1.5 py-0.5 text-[0.68rem] font-semibold text-body tabular-nums">{shortMonth(p.period_month)}</span>)}
                </span>
              ) },
            { key: 'total', header: 'Total due', align: 'right', sortValue: (d) => d.total, render: (d) => <strong className="text-heading tabular-nums">{rupees(d.total)}</strong> },
            { key: 'age', header: 'Ageing', sortValue: (d) => d.days,
              render: (d) => (
                <span className="block leading-tight">
                  <StatusPill tone={BUCKET[d.bucket].tone}>{BUCKET[d.bucket].label}</StatusPill>
                  {d.days > 0 && <span className="block text-[0.68rem] text-subtle mt-1">{d.days} days late</span>}
                </span>
              ) },
            { key: 'guardian', header: 'Guardian', hideOnMobile: true,
              render: (d) => <span className="block leading-tight">{d.student?.guardian_name || '—'}{d.student?.guardian_phone && <span className="block text-xs text-subtle tabular-nums">{d.student.guardian_phone}</span>}</span> },
          ]}
          actions={(d) => {
            const wa = reminderLink(d.student, d.total, d.months.map((p) => shortMonth(p.period_month)))
            return (
              <>
                <button className={`${btnPrimary} ${btnSm}`} onClick={() => setPaying(d.oldest)}>Collect</button>
                {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${btnOutline} ${btnSm}`} title="WhatsApp reminder"><MessageCircle size={13} /> Remind</a>}
                {d.student?.guardian_phone && <a href={`tel:${d.student.guardian_phone}`} className={`${btnOutline} ${btnSm}`} aria-label={`Call ${d.student.guardian_phone}`} title="Call"><Phone size={13} /></a>}
              </>
            )
          }}
        />
      )}

      {ledgerFor && (
        <StudentLedger studentId={ledgerFor} refreshKey={ledgerKey} onClose={() => setLedgerFor(null)} onPay={(p) => setPaying(p)} onReceipt={(p) => setReceiptFor(p)} />
      )}
      {paying && (
        <PaymentSheet
          payment={paying}
          onClose={() => setPaying(null)}
          onPaid={(row, warning) => { setLedgerKey((k) => k + 1); if (warning) setError(warning); setFlash('Payment recorded'); load() }}
          onReceipt={(row) => { setPaying(null); setReceiptFor(row) }}
        />
      )}
      {receiptFor && (
        <DocumentModal title={`Fee receipt — ${receiptFor.students?.full_name}`} size="a5" onClose={() => setReceiptFor(null)}>
          <FeeReceipt payment={receiptFor} studentName={receiptFor.students?.full_name} />
        </DocumentModal>
      )}
      {flash && (
        <div role="status" className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] rounded-full bg-pay-navy text-white text-sm font-semibold px-5 py-2.5 shadow-2xl inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> {flash}
        </div>
      )}
    </div>
  )
}
