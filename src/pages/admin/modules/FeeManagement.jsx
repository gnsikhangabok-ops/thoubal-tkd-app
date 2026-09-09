import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

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

export default function FeeManagement() {
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthFilter, setMonthFilter] = useState(currentMonthFirst())

  const [showGenForm, setShowGenForm] = useState(false)
  const [genForm, setGenForm] = useState(emptyGenForm)
  const [generating, setGenerating] = useState(false)

  const [payingFor, setPayingFor] = useState(null) // payment row being recorded
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

  // Generate pending fee rows for all active students who don't already have one this month
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

  const statusColor = { paid: 'var(--red)', pending: '#B8860B', overdue: '#8B0000', waived: '#999' }

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Fee Management</h1>
          <button className="btn btn-primary" onClick={openGenForm}>+ Generate Month's Fees</button>
        </div>
        <p className="dash-lede">Track monthly dues, payments, and receipts.</p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: 10 }}>Month:</label>
          <input
            type="month"
            value={monthFilter.slice(0, 7)}
            onChange={(e) => setMonthFilter(`${e.target.value}-01`)}
            style={{ padding: 8, border: '1px solid var(--line)' }}
          />
        </div>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div className="stat-grid">
          <div className="stat-card">
            <strong>₹{totalDue.toLocaleString('en-IN')}</strong>
            <span>Total Due — {formatMonth(monthFilter)}</span>
          </div>
          <div className="stat-card">
            <strong>₹{totalPaid.toLocaleString('en-IN')}</strong>
            <span>Total Collected</span>
          </div>
          <div className="stat-card">
            <strong>{pendingCount}</strong>
            <span>Students Pending</span>
          </div>
        </div>

        {showGenForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 420 }}>
            <h3 style={{ marginBottom: 16 }}>Generate Fee Records</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--charcoal)' }}>
              Creates a pending fee row for every active student who doesn't already have one for the selected month.
            </p>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="month"
                value={genForm.period_month.slice(0, 7)}
                onChange={(e) => setGenForm({ ...genForm, period_month: `${e.target.value}-01` })}
                required
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="number" placeholder="Monthly amount (₹)" required step="0.01"
                value={genForm.amount_due}
                onChange={(e) => setGenForm({ ...genForm, amount_due: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? 'Generating…' : 'Generate'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowGenForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {payingFor && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 420 }}>
            <h3 style={{ marginBottom: 6 }}>Record Payment</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 16, color: 'var(--charcoal)' }}>
              {payingFor.students?.full_name} — due ₹{payingFor.amount_due}, paid so far ₹{payingFor.amount_paid || 0}
            </p>
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="number" placeholder="Amount received (₹)" required step="0.01"
                value={payForm.amount_paid}
                onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <select
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
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
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <textarea
                placeholder="Notes (optional)"
                rows={2}
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Record Payment'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setPayingFor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No fee records for {formatMonth(monthFilter)} yet. Generate them above.</p>
        ) : (
          <div className="module-grid">
            {payments.map((p) => (
              <div className="module-card" key={p.id} style={{ borderTopColor: statusColor[p.status] }}>
                <h3>{p.students?.full_name}</h3>
                <p>Due: ₹{p.amount_due} · Paid: ₹{p.amount_paid || 0}</p>
                <p style={{ fontSize: '0.8rem', color: statusColor[p.status], marginTop: 6, textTransform: 'uppercase', fontFamily: 'Oswald' }}>
                  {p.status}
                </p>
                {p.receipt_no && <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Receipt: {p.receipt_no}</p>}
                {p.status !== 'paid' && p.status !== 'waived' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => openPayForm(p)}
                    >
                      Record Payment
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => markWaived(p)}
                    >
                      Waive
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
