import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byDateDesc, byNumberDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

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


  const categoryOptions = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES


  const list = useListTools(transactions, {
    search: (t) => [t.description, t.category, t.students?.full_name, t.training_centers?.name],
    filters: {
      type: (t) => t.type,
      source: (t) => (t.related_student_id ? 'auto' : 'manual'),
      category: (t) => t.category,
    },
    sorts: {
      newest: byDateDesc((t) => t.transaction_date),
      amount: byNumberDesc((t) => t.amount),
    },
    defaultSort: 'newest',
  })

  function handleExport() {
    exportCsv('accounts', list.result, [
      { label: 'Date', value: (t) => t.transaction_date },
      { label: 'Type', value: (t) => t.type },
      { label: 'Category', value: (t) => CATEGORY_LABELS[t.category] || t.category },
      { label: 'Amount (INR)', value: (t) => t.amount },
      { label: 'Description', value: (t) => t.description },
      { label: 'Student', value: (t) => t.students?.full_name },
      { label: 'Training center', value: (t) => t.training_centers?.name },
      { label: 'Source', value: (t) => (t.related_student_id ? 'Auto (fees)' : 'Manual') },
    ])
  }

  const tabs = moduleTabs(list, 'type', [['', 'All transactions'], ['income', 'Income'], ['expense', 'Expenses']])

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Accounts"
        description={<>Income vs expenses — profit &amp; loss overview. Fee collections from <Link to="/admin/fees" className="underline">Fee Management</Link> and <Link to="/admin/fee-setup" className="underline">Fee Setup</Link> post here automatically.</>}
        actions={
          <>
            <button className={btnPrimary} onClick={() => openAddForm('income')}>+ Add income</button>
            <button className={btnOutline} onClick={() => openAddForm('expense')}>+ Add expense</button>
          </>
        }
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

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

      <div className="mt-6" />
      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-heading mb-4 capitalize">Add {form.type}</h3>
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

      <ListToolbar
        list={list}
        placeholder="Search description, category, student…"
        printTitle="Accounts"
        onExport={handleExport}
        filters={[
          { key: 'source', label: 'Source', options: opts(['auto', 'manual'], { auto: 'Auto-posted from fees', manual: 'Manual entry' }) },
          { key: 'category', label: 'Category', options: opts([...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])], CATEGORY_LABELS) },
        ]}
        sorts={[{ key: 'newest', label: 'Newest first' }, { key: 'amount', label: 'Highest amount' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Transactions"
          rows={list.result}
          rowAccent={(tx) => (tx.type === 'income' ? 'var(--status-ok)' : 'var(--status-bad)')}
          empty={list.total === 0 ? 'No transactions recorded yet.' : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'date', header: 'Date', primary: true, sortValue: (tx) => tx.transaction_date, render: (tx) => <span className="tabular-nums whitespace-nowrap font-semibold text-heading">{tx.transaction_date}</span> },
            { key: 'category', header: 'Category', sortValue: (tx) => CATEGORY_LABELS[tx.category] || tx.category,
              render: (tx) => (
                <span className="block leading-tight">
                  <span className="capitalize">{CATEGORY_LABELS[tx.category] || tx.category}</span>
                  <span className="block text-xs text-subtle capitalize">{tx.type}</span>
                </span>
              ) },
            { key: 'details', header: 'Details',
              render: (tx) => (
                <span className="block leading-tight">
                  {tx.description || '—'}
                  {(tx.students?.full_name || tx.training_centers?.name) && (
                    <span className="block text-xs text-subtle">{[tx.students?.full_name, tx.training_centers?.name].filter(Boolean).join(' · ')}</span>
                  )}
                </span>
              ) },
            { key: 'source', header: 'Source', render: (tx) => (tx.related_student_id ? <StatusPill tone="info">Auto · fees</StatusPill> : <StatusPill>Manual</StatusPill>) },
            { key: 'amount', header: 'Amount', align: 'right', sortValue: (tx) => (tx.type === 'income' ? 1 : -1) * Number(tx.amount),
              render: (tx) => (
                <strong className="tabular-nums whitespace-nowrap" style={{ color: tx.type === 'income' ? 'var(--status-ok)' : 'var(--status-bad)' }}>
                  {tx.type === 'income' ? '+' : '−'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </strong>
              ) },
          ]}
          actions={(tx) => <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDelete(tx)}>Delete</button>}
        />
      )}
    </div>
  )
}