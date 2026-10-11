import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ReceiptText, MessageCircle, Sparkles, Wallet, CheckCircle2, Ban, X, CalendarDays } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import { moduleTabs } from '../../../lib/moduleTabs'
import { rupees } from '../../../lib/documents'
import {
  FEE_SELECT, STATUS_TONE, STATUS_COLOR, balance, feeStatus, daysOverdue, collectFee,
  monthFirst, shiftMonth, monthLabel, shortMonth, reminderLink, ordinal,
} from '../../../lib/fees'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import PersonCell from '../../../components/PersonCell'
import DocumentModal from '../../../components/docs/DocumentModal'
import FeeReceipt from '../../../components/docs/FeeReceipt'
import PaymentSheet from '../fees/PaymentSheet'
import StudentLedger from '../fees/StudentLedger'
import ReadinessRing from '../admissions/ReadinessRing'
import { useFeeSettings } from '../../../lib/feeSettings'


export default function FeeManagement() {
  const settings = useFeeSettings()
  const [month, setMonth] = useState(monthFirst())
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [paying, setPaying] = useState(null)
  const [receiptFor, setReceiptFor] = useState(null)
  const [ledgerFor, setLedgerFor] = useState(null)
  const [ledgerKey, setLedgerKey] = useState(0)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [gen, setGen] = useState(null) // { month, preview, busy }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('fee_payments').select(FEE_SELECT).eq('period_month', month).order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setPayments(data)
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reload when the month changes
    load()
    setSelected(new Set())
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(t)
  }, [flash])

  function replaceRow(row) {
    setPayments((list) => list.map((p) => (p.id === row.id ? row : p)))
    setLedgerKey((k) => k + 1)
  }

  // ---------- Generate the month's fees ----------
  async function buildPreview(periodMonth) {
    setGen({ month: periodMonth, preview: null, busy: false })
    const [studentRes, existingRes, structRes] = await Promise.all([
      supabase.from('students').select('id, full_name, batch_id, guardian_phone, created_at').eq('active', true).order('created_at'),
      supabase.from('fee_payments').select('student_id').eq('period_month', periodMonth),
      supabase.from('fee_structures').select('*').order('effective_from', { ascending: false }),
    ])
    const err = studentRes.error || existingRes.error || structRes.error
    if (err) { setError(err.message); setGen(null); return }
    const existing = new Set(existingRes.data.map((p) => p.student_id))
    // The rate in force for this month: the latest one that started on or before the month's end
    const monthEnd = shiftMonth(periodMonth, 1)
    const rate = {}
    structRes.data.forEach((r) => {
      if (r.effective_from && r.effective_from >= monthEnd) return
      if (!(r.batch_id in rate)) rate[r.batch_id] = r.monthly_amount
    })
    // Sibling discount: the 2nd and later active child of the same guardian phone
    const sib = settings.sibling
    const childNo = {}
    const phoneKey = (s) => String(s.guardian_phone || '').replace(/\D/g, '').slice(-10)
    const toCreate = [], noRate = [], noBatch = []
    let siblingCount = 0, siblingOff = 0
    studentRes.data.forEach((s) => {
      const key = phoneKey(s)
      const n = key.length === 10 ? (childNo[key] = (childNo[key] || 0) + 1) : 1
      if (existing.has(s.id)) return
      if (!s.batch_id) return noBatch.push(s)
      if (rate[s.batch_id] === undefined) return noRate.push(s)
      const full = Number(rate[s.batch_id])
      const off = sib.enabled && n > 1 ? Math.round((full * Number(sib.percent || 0)) / 100) : 0
      if (off) { siblingCount++; siblingOff += off }
      toCreate.push({ student_id: s.id, period_month: periodMonth, amount_due: full - off, status: 'pending', ...(off ? { notes: `Sibling discount ${sib.percent}% (−₹${off})` } : {}) })
    })
    setGen({ month: periodMonth, busy: false, preview: { toCreate, noRate, noBatch, siblingCount, siblingOff, total: toCreate.reduce((s, r) => s + Number(r.amount_due), 0) } })
  }

  async function generate() {
    setGen((g) => ({ ...g, busy: true }))
    const { error } = await supabase.from('fee_payments').insert(gen.preview.toCreate)
    if (error) { setError(error.message); setGen((g) => ({ ...g, busy: false })); return }
    setFlash(`${gen.preview.toCreate.length} fees billed for ${monthLabel(gen.month)}`)
    const m = gen.month
    setGen(null)
    if (m === month) load()
    else setMonth(m)
  }

  // ---------- Bulk actions ----------
  const selectedRows = payments.filter((p) => selected.has(p.id))
  const collectable = selectedRows.filter((p) => balance(p) > 0)

  async function bulkCollect() {
    const total = collectable.reduce((s, p) => s + balance(p), 0)
    if (!window.confirm(`Record ${rupees(total)} in cash from ${collectable.length} student(s), paying each balance in full?`)) return
    setBulkBusy(true)
    let ok = 0, warning = ''
    for (const p of collectable) {
      const res = await collectFee(p, { amount: balance(p), method: 'Cash' })
      if (res.error) { setError(res.error.message); break }
      if (res.warning) warning = res.warning
      ok++
    }
    setBulkBusy(false)
    setSelected(new Set())
    if (warning) setError(warning)
    setFlash(`${ok} payment${ok === 1 ? '' : 's'} recorded`)
    load()
  }

  async function waive(rows) {
    if (!window.confirm(`Waive the fee for ${rows.length} student(s) for ${monthLabel(month)}? Their balance is written off.`)) return
    const { error } = await supabase.from('fee_payments').update({ status: 'waived' }).in('id', rows.map((r) => r.id))
    if (error) return setError(error.message)
    setSelected(new Set())
    setFlash(`${rows.length} fee${rows.length === 1 ? '' : 's'} waived`)
    load()
  }

  // ---------- Figures ----------
  const stats = useMemo(() => {
    const live = payments.filter((p) => p.status !== 'waived')
    const billed = live.reduce((s, p) => s + Number(p.amount_due || 0), 0)
    const collected = payments.reduce((s, p) => s + Number(p.amount_paid || 0), 0)
    const today = new Date().toISOString().slice(0, 10)
    const methods = {}
    payments.filter((p) => Number(p.amount_paid) > 0).forEach((p) => { const m = p.payment_method || 'Other'; methods[m] = (methods[m] || 0) + Number(p.amount_paid) })
    return {
      billed, collected,
      outstanding: payments.reduce((s, p) => s + balance(p), 0),
      rate: billed ? Math.round((Math.min(collected, billed) / billed) * 100) : 0,
      overdue: payments.filter((p) => feeStatus(p) === 'overdue'),
      paidCount: payments.filter((p) => feeStatus(p) === 'paid').length,
      today: payments.filter((p) => p.paid_on === today).reduce((s, p) => s + Number(p.amount_paid || 0), 0),
      methods: Object.entries(methods).sort((a, b) => b[1] - a[1]),
    }
  // settings: the fee helpers read the due day from the settings store, so recompute when it loads
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, settings])

  const centers = useMemo(() => [...new Map(payments.filter((p) => p.students?.training_center_id).map((p) => [p.students.training_center_id, p.students.training_centers?.name])).entries()], [payments])
  const batches = useMemo(() => [...new Map(payments.filter((p) => p.students?.batch_id).map((p) => [p.students.batch_id, p.students.batches?.name])).entries()], [payments])

  const list = useListTools(payments, {
    search: (p) => [p.students?.full_name, p.students?.guardian_name, p.students?.guardian_phone, p.receipt_no],
    filters: {
      status: (p) => feeStatus(p),
      center: (p) => p.students?.training_center_id,
      batch: (p) => p.students?.batch_id,
    },
    sorts: {
      name: byText((p) => p.students?.full_name),
      balance: (a, b) => balance(b) - balance(a),
      overdue: (a, b) => (feeStatus(b) === 'overdue') - (feeStatus(a) === 'overdue') || balance(b) - balance(a),
    },
    defaultSort: 'overdue',
  })
  const tabs = moduleTabs(list, 'status', [['', 'All'], ['overdue', 'Overdue'], ['pending', 'Pending'], ['partial', 'Part paid'], ['paid', 'Paid'], ['waived', 'Waived']])

  const visibleIds = list.result.map((p) => p.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visibleIds))

  function handleExport() {
    exportCsv(`fees-${month.slice(0, 7)}`, list.result, [
      { label: 'Month', value: () => monthLabel(month) },
      { label: 'Student', value: (p) => p.students?.full_name },
      { label: 'Centre', value: (p) => p.students?.training_centers?.name },
      { label: 'Batch', value: (p) => p.students?.batches?.name },
      { label: 'Guardian phone', value: (p) => p.students?.guardian_phone },
      { label: 'Billed (INR)', value: (p) => p.amount_due },
      { label: 'Paid (INR)', value: (p) => p.amount_paid || 0 },
      { label: 'Balance (INR)', value: balance },
      { label: 'Status', value: feeStatus },
      { label: 'Method', value: (p) => p.payment_method },
      { label: 'Receipt no.', value: (p) => p.receipt_no },
      { label: 'Paid on', value: (p) => p.paid_on },
    ])
  }

  const isCurrent = month === monthFirst()

  return (
    <div className="p-8 max-md:p-4 max-w-[1320px] mx-auto pb-28">
      <ModuleHeader
        title="Fee Management"
        description={<>Collection desk for monthly fees. Rates come from <Link to="/admin/fee-setup" className="underline">Fee Setup</Link>; every payment posts to <Link to="/admin/accounts" className="underline">Accounts</Link>. Fees fall due on the {ordinal(settings.due_day)}.</>}
        actions={<>
          <Link to="/admin/fee-dues" className={btnOutline}>Dues & reminders</Link>
          <button className={btnPrimary} onClick={() => buildPreview(month)}><Sparkles size={16} /> Bill {shortMonth(month)}</button>
        </>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {/* Month navigator */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="inline-flex items-center rounded-full border border-pay-line bg-surface shadow-card">
          <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="grid place-items-center w-10 h-10 rounded-full text-heading hover:bg-pay-bg" aria-label="Previous month"><ChevronLeft size={18} /></button>
          <label className="relative inline-flex items-center gap-2 px-2 text-sm font-bold text-heading min-w-[150px] justify-center cursor-pointer">
            <CalendarDays size={15} className="text-pay-action" /> {monthLabel(month)}
            <input type="month" value={month.slice(0, 7)} onChange={(e) => e.target.value && setMonth(`${e.target.value}-01`)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Choose month" />
          </label>
          <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="grid place-items-center w-10 h-10 rounded-full text-heading hover:bg-pay-bg" aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        {!isCurrent && <button className={`${btnOutline} ${btnSm}`} onClick={() => setMonth(monthFirst())}>This month</button>}
      </div>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></p>}

      {/* Hero: collection progress + key figures */}
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <section className="pay-stat relative overflow-hidden !p-6">
          <div className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-white/5" aria-hidden="true" />
          <div className="relative flex items-center gap-5">
            <div className="relative shrink-0">
              <ReadinessRing value={stats.rate} size={92} light label="collected" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">Collected · {monthLabel(month)}</p>
              <strong className="block text-3xl md:text-4xl font-bold tabular-nums mt-1">{loading ? '…' : rupees(stats.collected)}</strong>
              <p className="text-sm text-white/80 mt-0.5">of {rupees(stats.billed)} billed · {stats.paidCount}/{payments.length} students settled</p>
            </div>
          </div>
          {stats.methods.length > 0 && (
            <div className="relative mt-5">
              <div className="flex h-2 rounded-full overflow-hidden bg-white/10" aria-hidden="true">
                {stats.methods.map(([m, v], i) => <span key={m} style={{ width: `${(v / stats.collected) * 100}%`, background: ['#E6C877', '#8FB3FF', '#9BE3C8', '#F4A6B8', '#CBD5E1'][i % 5] }} />)}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/80">
                {stats.methods.map(([m, v], i) => (
                  <li key={m} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ['#E6C877', '#8FB3FF', '#9BE3C8', '#F4A6B8', '#CBD5E1'][i % 5] }} />{m} {rupees(v)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Outstanding', rupees(stats.outstanding), `${payments.filter((p) => balance(p) > 0).length} students`, 'var(--status-warn)'],
            ['Overdue', stats.overdue.length, stats.overdue.length ? `${rupees(stats.overdue.reduce((s, p) => s + balance(p), 0))} past due` : 'none past due', 'var(--status-bad)'],
            ['Collected today', rupees(stats.today), new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), 'var(--status-ok)'],
            ['Collection rate', `${stats.rate}%`, isCurrent ? `due ${settings.due_day} ${monthLabel(month, { month: 'short' })}` : 'final', 'var(--color-pay-action)'],
          ].map(([k, v, sub, c]) => (
            <div key={k} className="bg-surface rounded-2xl shadow-card p-4 relative overflow-hidden">
              <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: c }} aria-hidden="true" />
              <p className="text-xs text-muted">{k}</p>
              <p className="text-xl md:text-2xl font-bold text-heading tabular-nums mt-0.5 truncate">{loading ? '…' : v}</p>
              <p className="text-[0.7rem] text-subtle truncate">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6" />
      <ListToolbar
        list={list}
        placeholder="Search student, guardian, phone, receipt…"
        printTitle={`Fees — ${monthLabel(month)}`}
        onExport={handleExport}
        filters={[
          ...(centers.length > 1 ? [{ key: 'center', label: 'Centre', options: centers.map(([value, label]) => ({ value, label })) }] : []),
          ...(batches.length > 1 ? [{ key: 'batch', label: 'Batch', options: batches.map(([value, label]) => ({ value, label })) }] : []),
        ]}
        sorts={[{ key: 'overdue', label: 'Overdue first' }, { key: 'balance', label: 'Highest balance' }, { key: 'name', label: 'Student A–Z' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption={`Fees for ${monthLabel(month)}`}
          rows={list.result}
          rowAccent={(p) => STATUS_COLOR[feeStatus(p)]}
          empty={list.total === 0
            ? <span className="flex flex-col items-center gap-3"><Wallet size={32} className="text-subtle" />No fees billed for {monthLabel(month)} yet.<button className={btnPrimary} onClick={() => buildPreview(month)}><Sparkles size={16} /> Bill {shortMonth(month)} now</button></span>
            : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'select', hideOnMobile: true, width: '40px',
              header: <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all shown" className="w-4 h-4 accent-[var(--color-pay-action)]" />,
              render: (p) => <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.students?.full_name}`} className="w-4 h-4 accent-[var(--color-pay-action)]" /> },
            { key: 'student', header: 'Student', primary: true, width: '26%', sortValue: (p) => p.students?.full_name,
              render: (p) => (
                <button type="button" onClick={() => setLedgerFor(p.student_id)} className="text-left hover:underline decoration-pay-action">
                  <PersonCell name={p.students?.full_name} sub={[p.students?.batches?.name, p.students?.training_centers?.name].filter(Boolean).join(' · ')} />
                </button>
              ) },
            { key: 'billed', header: 'Billed', align: 'right', sortValue: (p) => Number(p.amount_due), render: (p) => rupees(p.amount_due) },
            { key: 'progress', header: 'Paid', sortValue: (p) => Number(p.amount_paid || 0),
              render: (p) => {
                const pct = p.status === 'waived' ? 100 : Math.min(100, (Number(p.amount_paid || 0) / Number(p.amount_due || 1)) * 100)
                return (
                  <span className="block min-w-[110px]">
                    <span className="flex justify-between text-xs tabular-nums"><span className="text-heading font-semibold">{rupees(p.amount_paid)}</span>{balance(p) > 0 && <span className="text-[color:var(--status-warn)] font-semibold">{rupees(balance(p))} due</span>}</span>
                    <span className="block h-1.5 rounded-full bg-pay-line mt-1 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${pct}%`, background: STATUS_COLOR[feeStatus(p)] }} /></span>
                  </span>
                )
              } },
            { key: 'status', header: 'Status', sortValue: (p) => ['overdue', 'pending', 'partial', 'paid', 'waived'].indexOf(feeStatus(p)),
              render: (p) => {
                const st = feeStatus(p)
                return (
                  <span className="block leading-tight">
                    <StatusPill tone={STATUS_TONE[st]}>{st === 'partial' ? 'part paid' : st}</StatusPill>
                    {st === 'overdue' && <span className="block text-[0.68rem] text-[color:var(--status-bad)] mt-1">{daysOverdue(p)} days late</span>}
                    {st === 'paid' && p.paid_on && <span className="block text-[0.68rem] text-subtle mt-1">{new Date(p.paid_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {p.payment_method || '—'}</span>}
                  </span>
                )
              } },
          ]}
          actions={(p) => {
            const due = balance(p)
            const wa = due > 0 ? reminderLink(p.students, due, [shortMonth(p.period_month)]) : null
            return (
              <>
                {due > 0 && <button className={`${btnPrimary} ${btnSm}`} onClick={() => setPaying(p)}>Collect</button>}
                {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${btnOutline} ${btnSm}`} aria-label={`WhatsApp reminder to ${p.students?.full_name}'s guardian`} title="WhatsApp reminder"><MessageCircle size={13} /></a>}
                {Number(p.amount_paid) > 0 && <button className={`${btnOutline} ${btnSm}`} onClick={() => setReceiptFor(p)} aria-label={`Receipt for ${p.students?.full_name}`} title="Receipt"><ReceiptText size={13} /></button>}
              </>
            )
          }}
        />
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 md:ml-32 z-40 flex items-center gap-2 rounded-full bg-pay-navy text-white pl-5 pr-2 py-2 shadow-2xl">
          <span className="text-sm font-semibold whitespace-nowrap">{selected.size} selected</span>
          {collectable.length > 0 && (
            <button disabled={bulkBusy} onClick={bulkCollect} className="inline-flex items-center gap-1.5 rounded-full bg-white text-pay-navy px-4 py-1.5 text-xs font-bold hover:bg-pay-sky disabled:opacity-60">
              <CheckCircle2 size={14} /> {bulkBusy ? 'Recording…' : `Paid in cash · ${rupees(collectable.reduce((s, p) => s + balance(p), 0))}`}
            </button>
          )}
          {collectable.length > 0 && <button disabled={bulkBusy} onClick={() => waive(collectable)} className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"><Ban size={13} /> Waive</button>}
          <button onClick={() => setSelected(new Set())} className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/10" aria-label="Clear selection"><X size={16} /></button>
        </div>
      )}

      {/* Generate fees */}
      {gen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-pay-navy/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Bill monthly fees">
          <div className="w-full max-w-[460px] bg-surface rounded-3xl shadow-2xl overflow-hidden">
            <div className="pay-stat !rounded-none !p-5">
              <p className="text-xs text-white/75">Bill monthly fees</p>
              <div className="flex items-center gap-2 mt-1">
                <button className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/15" onClick={() => buildPreview(shiftMonth(gen.month, -1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
                <h2 className="!text-white text-xl font-bold flex-1 text-center">{monthLabel(gen.month)}</h2>
                <button className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/15" onClick={() => buildPreview(shiftMonth(gen.month, 1))} aria-label="Next month"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="p-5 text-sm">
              {!gen.preview ? <p className="text-muted">Checking students and rates…</p> : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-pay-bg p-3"><p className="text-xs text-muted">Students to bill</p><p className="text-2xl font-bold text-heading">{gen.preview.toCreate.length}</p></div>
                    <div className="rounded-xl bg-pay-bg p-3"><p className="text-xs text-muted">Total to bill</p><p className="text-2xl font-bold text-heading tabular-nums">{rupees(gen.preview.total)}</p></div>
                  </div>
                  {gen.preview.siblingCount > 0 && <p className="mt-3 text-[color:var(--status-ok)]">Includes {gen.preview.siblingCount} sibling discount{gen.preview.siblingCount === 1 ? '' : 's'} (−{rupees(gen.preview.siblingOff)}).</p>}
                  {gen.preview.noRate.length > 0 && <p className="mt-3 text-[color:var(--status-warn)]">{gen.preview.noRate.length} skipped — their batch has no rate in <Link to="/admin/fee-setup" className="underline">Fee Setup</Link>.</p>}
                  {gen.preview.noBatch.length > 0 && <p className="mt-2 text-[color:var(--status-warn)]">{gen.preview.noBatch.length} skipped — not assigned to a batch.</p>}
                  {gen.preview.toCreate.length === 0 && !gen.preview.noRate.length && !gen.preview.noBatch.length && <p className="mt-3 text-muted">Every active student already has a fee for this month.</p>}
                </>
              )}
              <div className="flex gap-2 mt-5">
                <button className={btnPrimary} onClick={generate} disabled={gen.busy || !gen.preview?.toCreate.length}>{gen.busy ? 'Billing…' : 'Bill students'}</button>
                <button className={btnOutline} onClick={() => setGen(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ledgerFor && (
        <StudentLedger
          studentId={ledgerFor}
          refreshKey={ledgerKey}
          onClose={() => setLedgerFor(null)}
          onPay={(p) => setPaying(p)}
          onReceipt={(p) => setReceiptFor(p)}
        />
      )}
      {paying && (
        <PaymentSheet
          payment={paying}
          onClose={() => setPaying(null)}
          onPaid={(row, warning) => { replaceRow(row); if (warning) setError(warning) }}
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
