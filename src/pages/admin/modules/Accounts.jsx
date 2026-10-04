import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { Link2 } from 'lucide-react'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'

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
  const [sourceFilter, setSourceFilter] = useState('') // '', 'auto', 'manual'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [txRes, centerRes, summaryRes] = await Promise.all([
      supabase.from('accounts_transactions').select('*, training_centers(name), students(full_name)').order('transaction_date', { ascending: false }),
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
    if (tx.related_fee_payment_id || (tx.related_student_id && tx.category === 'student_fee')) {
      if (!confirm('This entry was auto-posted from a fee collection. Deleting it here will NOT undo the payment record in Fee Management/Fee Setup. Delete anyway?')) return
    } else if (!confirm('Delete this transaction?')) {
      return
    }
    const { error } = await supabase.from('accounts_transactions').delete().eq('id', tx.id)
    if (error) setError(error.message)
    else loadData()
  }

  let filtered = typeFilter ? transactions.filter((t) => t.type === typeFilter) : transactions
  if (sourceFilter === 'auto') filtered = filtered.filter((t) => t.related_student_id)
  if (sourceFilter === 'manual') filtered = filtered.filter((t) => !t.related_student_id)

  const categoryOptions = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl md:text-[1.7rem] font-bold text-pay-navy">Accounts</h1>
        <div className="flex gap-2.5">
          <button className={btnPrimary} onClick={() => openAddForm('income')}>+ Add Income</button>
          <button className={btnOutline} onClick={() => openAddForm('expense')}>+ Add Expense</button>
        </div>
      </div>
      <p className="text-[#5B6B82] mb-8">
        Income vs expenses — profit &amp; loss overview. Fee collections from{' '}
        <Link to="/admin/fees" className="underline">Fee Management</Link> and{' '}
        <Link to="/admin/fee-setup" className="underline">Fee Setup</Link> post here automatically.
      </p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">₹{Number(summary.total_income).toLocaleString('en-IN')}</strong>
          <span className="text-sm text-white/85">Total Income</span>
        </div>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">₹{Number(summary.total_expense).toLocaleString('en-IN')}</strong>
          <span className="text-sm text-white/85">Total Expenses</span>
        </div>
        <div className="pay-stat border-b-4" style={{ borderBottomColor: summary.net_balance >= 0 ? '#34D399' : '#F87171' }}>
          <strong className="block text-3xl font-bold" style={{ color: summary.net_balance >= 0 ? '#FFFFFF' : '#FECACA' }}>
            ₹{Number(summary.net_balance).toLocaleString('en-IN')}
          </strong>
          <span className="text-sm text-white/85">Net Balance</span>
        </div>
      </div>

      <div className="my-6 flex gap-3 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All transactions</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All sources</option>
          <option value="auto">Auto-posted from fees</option>
          <option value="manual">Manually entered</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-pay-navy mb-4 capitalize">Add {form.type}</h3>
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
          {filtered.map((tx) => {
            const isAuto = !!tx.related_student_id
            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl shadow-card p-6"
                style={{ borderLeftWidth: 4, borderLeftColor: tx.type === 'income' ? '#047857' : '#DC2626' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-base text-pay-navy capitalize">{tx.type} · {CATEGORY_LABELS[tx.category] || tx.category}</h3>
                  {isAuto && <Link2 size={14} className="text-charcoal/50 shrink-0" title="Auto-posted from fee collection" />}
                </div>
                <p className="text-xl font-display" style={{ color: tx.type === 'income' ? '#047857' : '#DC2626' }}>
                  {tx.type === 'income' ? '+' : '−'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </p>
                <p className="text-[0.85rem] mt-1">{tx.transaction_date}</p>
                {tx.students?.full_name && <p className="text-[0.8rem]">{tx.students.full_name}</p>}
                {tx.training_centers?.name && <p className="text-[0.8rem]">{tx.training_centers.name}</p>}
                {tx.description && <p className="text-[0.85rem] mt-1.5">{tx.description}</p>}
                {isAuto && (
                  <p className="text-[0.7rem] mt-2 text-charcoal/60 uppercase tracking-wide">Auto-posted</p>
                )}
                <button className={`${btnOutline} ${btnSm} mt-3`} onClick={() => handleDelete(tx)}>Delete</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}