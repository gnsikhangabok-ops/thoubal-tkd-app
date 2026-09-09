import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

const INCOME_CATEGORIES = ['student_fee', 'donation', 'sponsorship', 'other']
const EXPENSE_CATEGORIES = ['salary', 'equipment', 'rent', 'event', 'maintenance', 'other']

const CATEGORY_LABELS = {
  student_fee: 'Student Fee', donation: 'Donation', sponsorship: 'Sponsorship', other: 'Other',
  salary: 'Salary', equipment: 'Equipment', rent: 'Rent', event: 'Event', maintenance: 'Maintenance',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm = {
  id: null,
  type: 'income',
  category: 'student_fee',
  amount: '',
  transaction_date: today(),
  training_center_id: '',
  description: '',
}

export default function Accounts() {
  const [transactions, setTransactions] = useState([])
  const [centers, setCenters] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_balance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [txRes, centerRes, summaryRes] = await Promise.all([
      supabase.from('accounts_transactions').select('*, training_centers(name)').order('transaction_date', { ascending: false }),
      supabase.from('training_centers').select('id, name').eq('active', true).order('name'),
      supabase.from('accounts_summary').select('*').single(),
    ])

    if (txRes.error) setError(txRes.error.message)
    else setTransactions(txRes.data)

    if (centerRes.error) setError((prev) => prev || centerRes.error.message)
    else setCenters(centerRes.data)

    if (summaryRes.error) setError((prev) => prev || summaryRes.error.message)
    else setSummary(summaryRes.data)

    setLoading(false)
  }

  function openAddForm(type) {
    setForm({ ...emptyForm, type, category: type === 'income' ? 'student_fee' : 'salary' })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      transaction_date: form.transaction_date,
      training_center_id: form.training_center_id || null,
      description: form.description || null,
    }

    const { error } = await supabase.from('accounts_transactions').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function handleDelete(tx) {
    if (!confirm('Delete this transaction?')) return
    const { error } = await supabase.from('accounts_transactions').delete().eq('id', tx.id)
    if (error) setError(error.message)
    else loadData()
  }

  const filtered = typeFilter ? transactions.filter((t) => t.type === typeFilter) : transactions
  const categoryOptions = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Accounts</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => openAddForm('income')}>+ Add Income</button>
            <button className="btn btn-outline" onClick={() => openAddForm('expense')}>+ Add Expense</button>
          </div>
        </div>
        <p className="dash-lede">Income vs expenses — profit &amp; loss overview.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div className="stat-grid">
          <div className="stat-card">
            <strong>₹{Number(summary.total_income).toLocaleString('en-IN')}</strong>
            <span>Total Income</span>
          </div>
          <div className="stat-card">
            <strong>₹{Number(summary.total_expense).toLocaleString('en-IN')}</strong>
            <span>Total Expenses</span>
          </div>
          <div className="stat-card" style={{ borderBottomColor: summary.net_balance >= 0 ? 'var(--gold)' : 'var(--red)' }}>
            <strong style={{ color: summary.net_balance >= 0 ? 'var(--chalk)' : '#ff8b8b' }}>
              ₹{Number(summary.net_balance).toLocaleString('en-IN')}
            </strong>
            <span>Net Balance</span>
          </div>
        </div>

        <div style={{ margin: '24px 0' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)' }}
          >
            <option value="">All transactions</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>
        </div>

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 460 }}>
            <h3 style={{ marginBottom: 16, textTransform: 'capitalize' }}>Add {form.type}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <input
                type="number" placeholder="Amount (₹)" required step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="date" required
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <select
                value={form.training_center_id}
                onChange={(e) => setForm({ ...form, training_center_id: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— No specific center —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No transactions recorded yet.</p>
        ) : (
          <div className="module-grid">
            {filtered.map((tx) => (
              <div
                className="module-card"
                key={tx.id}
                style={{ borderTopColor: tx.type === 'income' ? 'var(--red)' : '#8B0000' }}
              >
                <h3 style={{ textTransform: 'capitalize' }}>{tx.type} · {CATEGORY_LABELS[tx.category] || tx.category}</h3>
                <p style={{ fontSize: '1.2rem', fontFamily: 'Oswald', color: tx.type === 'income' ? 'var(--red)' : '#8B0000' }}>
                  {tx.type === 'income' ? '+' : '−'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{tx.transaction_date}</p>
                {tx.training_centers?.name && <p style={{ fontSize: '0.8rem' }}>{tx.training_centers.name}</p>}
                {tx.description && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{tx.description}</p>}
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', marginTop: 12 }}
                  onClick={() => handleDelete(tx)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
