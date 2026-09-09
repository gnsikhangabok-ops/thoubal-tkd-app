import { useEffect, useState } from 'react'
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

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Accounts</h1>
        <div className="flex gap-2.5">
          <button className={btnPrimary} onClick={() => openAddForm('income')}>+ Add Income</button>
          <button className={btnOutline} onClick={() => openAddForm('expense')}>+ Add Expense</button>
        </div>
      </div>
      <p className="text-charcoal mb-9">Income vs expenses — profit &amp; loss overview.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">₹{Number(summary.total_income).toLocaleString('en-IN')}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Total Income</span>
        </div>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">₹{Number(summary.total_expense).toLocaleString('en-IN')}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Total Expenses</span>
        </div>
        <div className="bg-ink px-5 py-6 border-b-[3px]" style={{ borderBottomColor: summary.net_balance >= 0 ? '#D4A537' : '#B3282D' }}>
          <strong className="block font-display text-4xl" style={{ color: summary.net_balance >= 0 ? '#F7F5F0' : '#ff8b8b' }}>
            ₹{Number(summary.net_balance).toLocaleString('en-IN')}
          </strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Net Balance</span>
        </div>
      </div>

      <div className="my-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All transactions</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-ink mb-4 capitalize">Add {form.type}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Amount (₹)" required step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputCls}
            />
            <input
              type="date" required
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              className={inputCls}
            />
            <select
              value={form.training_center_id}
              onChange={(e) => setForm({ ...form, training_center_id: e.target.value })}
              className={inputCls}
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
              className={`${inputCls} font-body`}
            />
            <div className="flex gap-2.5">
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className={btnOutline} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-charcoal">No transactions recorded yet.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: tx.type === 'income' ? '#B3282D' : '#8B0000' }}
            >
              <h3 className="font-semibold text-base text-ink capitalize mb-1.5">{tx.type} · {CATEGORY_LABELS[tx.category] || tx.category}</h3>
              <p className="text-xl font-display" style={{ color: tx.type === 'income' ? '#B3282D' : '#8B0000' }}>
                {tx.type === 'income' ? '+' : '−'}₹{Number(tx.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-[0.85rem] mt-1">{tx.transaction_date}</p>
              {tx.training_centers?.name && <p className="text-[0.8rem]">{tx.training_centers.name}</p>}
              {tx.description && <p className="text-[0.85rem] mt-1.5">{tx.description}</p>}
              <button className={`${btnOutline} ${btnSm} mt-3`} onClick={() => handleDelete(tx)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
