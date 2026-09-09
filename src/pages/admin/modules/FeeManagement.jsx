import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

function currentMonthFirst() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatMonth(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const emptyGenForm = { period_month: currentMonthFirst(), amount_due: '' }
const emptyPayForm = { amount_paid: '', payment_method: 'Cash', receipt_no: '', notes: '' }

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

export default function FeeManagement() {
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthFilter, setMonthFilter] = useState(currentMonthFirst())

  const [showGenForm, setShowGenForm] = useState(false)
  const [genForm, setGenForm] = useState(emptyGenForm)
  const [generating, setGenerating] = useState(false)

  const [payingFor, setPayingFor] = useState(null)
  const [payForm, setPayForm] = useState(emptyPayForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    loadPayments()
  }, [monthFilter])

  async function loadStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name')

    if (error) setError(error.message)
    else setStudents(data)
  }

  async function loadPayments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*, students(full_name)')
      .eq('period_month', monthFilter)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setPayments(data)
    setLoading(false)
  }

  function openGenForm() {
    setGenForm({ period_month: monthFilter, amount_due: '' })
    setShowGenForm(true)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    setError('')

    const existingIds = new Set(payments.map((p) => p.student_id))
    const toCreate = students
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({
        student_id: s.id,
        period_month: genForm.period_month,
        amount_due: parseFloat(genForm.amount_due),
        status: 'pending',
      }))

    if (toCreate.length === 0) {
      setError('All active students already have a fee record for this month.')
      setGenerating(false)
      return
    }

    const { error } = await supabase.from('fee_payments').insert(toCreate)

    setGenerating(false)
    if (error) {
      setError(error.message)
    } else {
      setShowGenForm(false)
      setMonthFilter(genForm.period_month)
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

    const newPaid = (payingFor.amount_paid || 0) + parseFloat(payForm.amount_paid || 0)
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

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setPayingFor(null)
      loadPayments()
    }
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

  const statusColor = { paid: '#B3282D', pending: '#B8860B', overdue: '#8B0000', waived: '#999' }

  return (
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Fee Management</h1>
        <button className={btnPrimary} onClick={openGenForm}>+ Generate Month's Fees</button>
      </div>
      <p className="text-charcoal mb-9">Track monthly dues, payments, and receipts.</p>

      <div className="mb-6">
        <label className="text-[0.85rem] font-semibold mr-2.5">Month:</label>
        <input
          type="month"
          value={monthFilter.slice(0, 7)}
          onChange={(e) => setMonthFilter(`${e.target.value}-01`)}
          className="px-2 py-2 border border-black/10"
        />
      </div>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="grid gap-4 mb-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">₹{totalDue.toLocaleString('en-IN')}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Total Due — {formatMonth(monthFilter)}</span>
        </div>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">₹{totalPaid.toLocaleString('en-IN')}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Total Collected</span>
        </div>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">{pendingCount}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Students Pending</span>
        </div>
      </div>

      {showGenForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[420px]">
          <h3 className="font-semibold text-base text-ink mb-4">Generate Fee Records</h3>
          <p className="text-[0.85rem] mb-3 text-charcoal">
            Creates a pending fee row for every active student who doesn't already have one for the selected month.
          </p>
          <form onSubmit={handleGenerate} className="flex flex-col gap-3">
            <input
              type="month"
              value={genForm.period_month.slice(0, 7)}
              onChange={(e) => setGenForm({ ...genForm, period_month: `${e.target.value}-01` })}
              required
              className={inputCls}
            />
            <input
              type="number" placeholder="Monthly amount (₹)" required step="0.01"
              value={genForm.amount_due}
              onChange={(e) => setGenForm({ ...genForm, amount_due: e.target.value })}
              className={inputCls}
            />
            <div className="flex gap-2.5">
              <button type="submit" className={btnPrimary} disabled={generating}>
                {generating ? 'Generating…' : 'Generate'}
              </button>
              <button type="button" className={btnOutline} onClick={() => setShowGenForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {payingFor && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[420px]">
          <h3 className="font-semibold text-base text-ink mb-1.5">Record Payment</h3>
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

      {loading ? (
        <p>Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-charcoal">No fee records for {formatMonth(monthFilter)} yet. Generate them above.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: statusColor[p.status] }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{p.students?.full_name}</h3>
              <p className="text-sm text-charcoal">Due: ₹{p.amount_due} · Paid: ₹{p.amount_paid || 0}</p>
              <p className="text-[0.8rem] mt-1.5 uppercase font-display" style={{ color: statusColor[p.status] }}>
                {p.status}
              </p>
              {p.receipt_no && <p className="text-[0.8rem] mt-1">Receipt: {p.receipt_no}</p>}
              {p.status !== 'paid' && p.status !== 'waived' && (
                <div className="flex gap-2 mt-3">
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => openPayForm(p)}>Record Payment</button>
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => markWaived(p)}>Waive</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
