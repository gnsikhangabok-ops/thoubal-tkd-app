import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import DocumentModal from '../../../components/docs/DocumentModal'
import FeeReceipt from '../../../components/docs/FeeReceipt'
import { ReceiptText } from 'lucide-react'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

function currentMonthFirst() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatMonth(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const emptyPayForm = { amount_paid: '', payment_method: 'Cash', receipt_no: '', notes: '' }


export default function FeeManagement() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthFilter, setMonthFilter] = useState(currentMonthFirst())

  const [showGenForm, setShowGenForm] = useState(false)
  const [genMonth, setGenMonth] = useState(currentMonthFirst())
  const [generating, setGenerating] = useState(false)
  const [genPreview, setGenPreview] = useState(null)

  const [payingFor, setPayingFor] = useState(null)
  const [payForm, setPayForm] = useState(emptyPayForm)
  const [saving, setSaving] = useState(false)
  const [receiptFor, setReceiptFor] = useState(null)

  useEffect(() => {
    loadPayments()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reload when the month filter changes
  }, [monthFilter])

  async function loadPayments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*, students(full_name, training_center_id)')
      .eq('period_month', monthFilter)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setPayments(data)
    setLoading(false)
  }

  async function openGenForm() {
    setGenMonth(monthFilter)
    setShowGenForm(true)
    await buildPreview(monthFilter)
  }

  async function buildPreview(periodMonth) {
    setError('')

    const [studentRes, existingRes, structRes] = await Promise.all([
      supabase.from('students').select('id, full_name, batch_id').eq('active', true).order('full_name'),
      supabase.from('fee_payments').select('student_id').eq('period_month', periodMonth),
      supabase.from('fee_structures').select('*').order('effective_from', { ascending: false }),
    ])

    if (studentRes.error || existingRes.error || structRes.error) {
      setError(studentRes.error?.message || existingRes.error?.message || structRes.error?.message)
      return
    }

    const existingIds = new Set(existingRes.data.map((p) => p.student_id))
    const rateByBatch = {}
    structRes.data.forEach((row) => {
      if (!(row.batch_id in rateByBatch)) rateByBatch[row.batch_id] = row.monthly_amount
    })

    const toCreate = []
    const skippedNoRate = []
    const skippedNoBatch = []

    studentRes.data
      .filter((s) => !existingIds.has(s.id))
      .forEach((s) => {
        if (!s.batch_id) {
          skippedNoBatch.push(s)
          return
        }
        const rate = rateByBatch[s.batch_id]
        if (rate === undefined) {
          skippedNoRate.push(s)
          return
        }
        toCreate.push({
          student_id: s.id,
          period_month: periodMonth,
          amount_due: rate,
          status: 'pending',
        })
      })

    setGenPreview({ toCreate, skippedNoRate, skippedNoBatch, allDone: toCreate.length === 0 && skippedNoRate.length === 0 && skippedNoBatch.length === 0 })
  }

  async function handleGenerate() {
    if (!genPreview || genPreview.toCreate.length === 0) return
    setGenerating(true)
    setError('')

    const { error } = await supabase.from('fee_payments').insert(genPreview.toCreate)

    setGenerating(false)
    if (error) {
      setError(error.message)
    } else {
      setShowGenForm(false)
      setMonthFilter(genMonth)
    }
  }

  function openPayForm(payment) {
    setPayingFor(payment)
    setPayForm({
      amount_paid: payment.amount_due - (payment.amount_paid || 0),
      payment_method: 'Cash',
      receipt_no: '',
      notes: '',
    })
  }

  async function handlePaySubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const paidNow = parseFloat(payForm.amount_paid || 0)
    const newPaid = (payingFor.amount_paid || 0) + paidNow
    const newStatus = newPaid >= payingFor.amount_due ? 'paid' : 'pending'

    const { error } = await supabase
      .from('fee_payments')
      .update({
        amount_paid: newPaid,
        status: newStatus,
        paid_on: newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : payingFor.paid_on,
        payment_method: payForm.payment_method,
        receipt_no: payForm.receipt_no || null,
        notes: payForm.notes || null,
      })
      .eq('id', payingFor.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // Post this collection to Accounts as income — keeps the ledger in sync
    // without the admin having to re-enter it manually.
    const { error: acctError } = await supabase.from('accounts_transactions').insert({
      type: 'income',
      category: 'student_fee',
      amount: paidNow,
      transaction_date: new Date().toISOString().slice(0, 10),
      training_center_id: payingFor.students?.training_center_id || null,
      related_student_id: payingFor.student_id,
      related_fee_payment_id: payingFor.id,
      description: `Monthly fee — ${payingFor.students?.full_name} — ${formatMonth(payingFor.period_month)}`,
    })

    setSaving(false)
    if (acctError) {
      // Payment itself succeeded; surface the accounts sync issue separately.
      setError(`Payment recorded, but failed to post to Accounts: ${acctError.message}`)
    }
    setPayingFor(null)
    loadPayments()
  }

  async function markWaived(payment) {
    const { error } = await supabase
      .from('fee_payments')
      .update({ status: 'waived' })
      .eq('id', payment.id)

    if (error) setError(error.message)
    else loadPayments()
  }

  const totalDue = payments.reduce((sum, p) => sum + parseFloat(p.amount_due), 0)
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0)
  const pendingCount = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').length

  const statusColor = { paid: 'var(--status-ok)', pending: 'var(--status-warn)', overdue: 'var(--status-bad)', waived: '#999' }


  const list = useListTools(payments, {
    search: (p) => [p.students?.full_name, p.receipt_no, p.payment_method],
    filters: { status: (p) => p.status },
    sorts: {
      name: byText((p) => p.students?.full_name),
      due: (a, b) => ((b.amount_due || 0) - (b.amount_paid || 0)) - ((a.amount_due || 0) - (a.amount_paid || 0)),
    },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv(`fees-${monthFilter.slice(0, 7)}`, list.result, [
      { label: 'Month', value: () => formatMonth(monthFilter) },
      { label: 'Student', value: (p) => p.students?.full_name },
      { label: 'Amount due (INR)', value: (p) => p.amount_due },
      { label: 'Amount paid (INR)', value: (p) => p.amount_paid || 0 },
      { label: 'Balance (INR)', value: (p) => (p.amount_due || 0) - (p.amount_paid || 0) },
      { label: 'Status', value: (p) => p.status },
      { label: 'Payment method', value: (p) => p.payment_method },
      { label: 'Receipt no.', value: (p) => p.receipt_no },
      { label: 'Paid on', value: (p) => p.paid_on },
    ])
  }

  const tabs = moduleTabs(list, 'status', [['', 'All'], ['pending', 'Pending'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['waived', 'Waived']])
  const FEE_TONE = { paid: 'ok', pending: 'warn', overdue: 'bad', waived: 'neutral' }

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Fee Management"
        description={<>Track monthly dues, payments, and receipts. Rates come from <Link to="/admin/fee-setup" className="underline">Fee Setup</Link>. Payments post automatically to <Link to="/admin/accounts" className="underline">Accounts</Link>.</>}
        actions={<button className={btnPrimary} onClick={openGenForm}>+ Generate month's fees</button>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      <div className="mb-6">
        <label className="text-[0.85rem] font-semibold mr-2.5">Month:</label>
        <input
          type="month"
          value={monthFilter.slice(0, 7)}
          onChange={(e) => setMonthFilter(`${e.target.value}-01`)}
          className="px-2 py-2 border border-pay-line rounded-xl"
        />
      </div>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="grid gap-4 mb-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">₹{totalDue.toLocaleString('en-IN')}</strong>
          <span className="text-sm text-white/85">Total Due — {formatMonth(monthFilter)}</span>
        </div>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">₹{totalPaid.toLocaleString('en-IN')}</strong>
          <span className="text-sm text-white/85">Total Collected</span>
        </div>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">{pendingCount}</strong>
          <span className="text-sm text-white/85">Students Pending</span>
        </div>
      </div>

      {showGenForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-heading mb-4">Generate Fee Records</h3>

          <label className="text-[0.85rem] font-semibold block mb-1.5">Month</label>
          <input
            type="month"
            value={genMonth.slice(0, 7)}
            onChange={(e) => {
              const m = `${e.target.value}-01`
              setGenMonth(m)
              buildPreview(m)
            }}
            className={`${inputCls} mb-4`}
          />

          {genPreview && (
            <div className="mb-4 text-sm">
              <p className="text-charcoal">
                <strong className="text-ink">{genPreview.toCreate.length}</strong> student{genPreview.toCreate.length === 1 ? '' : 's'} will be billed using their batch's rate.
              </p>
              {genPreview.skippedNoRate.length > 0 && (
                <p className="text-red-600 mt-2">
                  {genPreview.skippedNoRate.length} student(s) skipped — their batch has no rate set in{' '}
                  <Link to="/admin/fee-setup" className="underline">Fee Setup</Link>.
                </p>
              )}
              {genPreview.skippedNoBatch.length > 0 && (
                <p className="text-red-600 mt-2">
                  {genPreview.skippedNoBatch.length} student(s) skipped — not assigned to a batch yet.
                </p>
              )}
              {genPreview.allDone && (
                <p className="text-charcoal mt-2">All active students already have a fee record for this month.</p>
              )}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              className={btnPrimary}
              onClick={handleGenerate}
              disabled={generating || !genPreview || genPreview.toCreate.length === 0}
            >
              {generating ? 'Generating…' : 'Generate'}
            </button>
            <button className={btnOutline} onClick={() => setShowGenForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {payingFor && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[420px]">
          <h3 className="font-semibold text-base text-heading mb-1.5">Record Payment</h3>
          <p className="text-[0.85rem] mb-4 text-charcoal">
            {payingFor.students?.full_name} — due ₹{payingFor.amount_due}, paid so far ₹{payingFor.amount_paid || 0}
          </p>
          <form onSubmit={handlePaySubmit} className="flex flex-col gap-3">
            <input
              type="number" placeholder="Amount received (₹)" required step="0.01"
              value={payForm.amount_paid}
              onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })}
              className={inputCls}
            />
            <select
              value={payForm.payment_method}
              onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
              className={inputCls}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank Transfer</option>
              <option>Other</option>
            </select>
            <input
              type="text" placeholder="Receipt number (optional)"
              value={payForm.receipt_no}
              onChange={(e) => setPayForm({ ...payForm, receipt_no: e.target.value })}
              className={inputCls}
            />
            <textarea
              placeholder="Notes (optional)"
              rows={2}
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              className={`${inputCls} font-body`}
            />
            <p className="text-[0.75rem] text-charcoal">This will also be recorded as income in Accounts.</p>
            <div className="flex gap-2.5">
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
              <button type="button" className={btnOutline} onClick={() => setPayingFor(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ListToolbar
        list={list}
        placeholder="Search student or receipt no.…"
        printTitle={`Fees — ${formatMonth(monthFilter)}`}
        onExport={handleExport}
        sorts={[{ key: 'name', label: 'Student A–Z' }, { key: 'due', label: 'Highest balance' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption={`Fees for ${formatMonth(monthFilter)}`}
          rows={list.result}
          rowAccent={(p) => statusColor[p.status]}
          empty={list.total === 0 ? `No fee records for ${formatMonth(monthFilter)} yet. Generate them above.` : 'Nothing matches this view or search.'}
          columns={[
            { key: 'student', header: 'Student', primary: true, width: '26%', sortValue: (p) => p.students?.full_name, render: (p) => <strong className="text-heading">{p.students?.full_name}</strong> },
            { key: 'due', header: 'Due', align: 'right', sortValue: (p) => Number(p.amount_due), render: (p) => `₹${Number(p.amount_due || 0).toLocaleString('en-IN')}` },
            { key: 'paid', header: 'Paid', align: 'right', sortValue: (p) => Number(p.amount_paid || 0), render: (p) => `₹${Number(p.amount_paid || 0).toLocaleString('en-IN')}` },
            { key: 'balance', header: 'Balance', align: 'right', sortValue: (p) => (p.amount_due || 0) - (p.amount_paid || 0),
              render: (p) => { const b = Math.max(0, (p.amount_due || 0) - (p.amount_paid || 0)); return <strong className="tabular-nums" style={{ color: b > 0 ? 'var(--status-warn)' : undefined }}>₹{b.toLocaleString('en-IN')}</strong> } },
            { key: 'status', header: 'Status', sortValue: (p) => p.status, render: (p) => <StatusPill tone={FEE_TONE[p.status]}>{p.status}</StatusPill> },
            { key: 'receipt', header: 'Receipt', hideOnMobile: true, render: (p) => <span className="tabular-nums">{p.receipt_no || '—'}</span> },
          ]}
          actions={(p) => (
            <>
              {Number(p.amount_paid) > 0 && <button className={`${btnOutline} ${btnSm}`} onClick={() => setReceiptFor(p)}><ReceiptText size={13} /> Receipt</button>}
              {p.status !== 'paid' && p.status !== 'waived' && (
                <>
                  <button className={`${btnPrimary} ${btnSm}`} onClick={() => openPayForm(p)}>Record payment</button>
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => markWaived(p)}>Waive</button>
                </>
              )}
            </>
          )}
        />
      )}
      {receiptFor && (
        <DocumentModal title={`Fee receipt — ${receiptFor.students?.full_name}`} size="a5" onClose={() => setReceiptFor(null)}>
          <FeeReceipt payment={receiptFor} studentName={receiptFor.students?.full_name} />
        </DocumentModal>
      )}
    </div>
  )
}