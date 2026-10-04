import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, byNumberDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const CATEGORIES = ['uniform', 'gear', 'belt', 'other']

const emptyItemForm = {
  id: null, name: '', category: 'uniform', stock_qty: '', unit_price: '', training_center_id: '',
}
const emptyIssueForm = { student_id: '', quantity: 1, paid: false, amount: '' }


export default function EquipmentRecord() {
  const [items, setItems] = useState([])
  const [centers, setCenters] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [showItemForm, setShowItemForm] = useState(false)
  const [savingItem, setSavingItem] = useState(false)

  const [issuingFor, setIssuingFor] = useState(null)
  const [issueForm, setIssueForm] = useState(emptyIssueForm)
  const [savingIssue, setSavingIssue] = useState(false)

  const [viewingHistory, setViewingHistory] = useState(null)
  const [issuedHistory, setIssuedHistory] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [itemRes, centerRes, studentRes] = await Promise.all([
      supabase.from('inventory_items').select('*, training_centers(name)').order('name'),
      supabase.from('training_centers').select('id, name').eq('active', true).order('name'),
      supabase.from('students').select('id, full_name').eq('active', true).order('full_name'),
    ])

    if (itemRes.error) setError(itemRes.error.message)
    else setItems(itemRes.data)

    if (centerRes.error) setError((prev) => prev || centerRes.error.message)
    else setCenters(centerRes.data)

    if (studentRes.error) setError((prev) => prev || studentRes.error.message)
    else setStudents(studentRes.data)

    setLoading(false)
  }

  function openAddItem() {
    setItemForm(emptyItemForm)
    setShowItemForm(true)
  }

  function openEditItem(item) {
    setItemForm({
      id: item.id,
      name: item.name,
      category: item.category || 'uniform',
      stock_qty: item.stock_qty ?? '',
      unit_price: item.unit_price ?? '',
      training_center_id: item.training_center_id || '',
    })
    setShowItemForm(true)
  }

  async function handleItemSubmit(e) {
    e.preventDefault()
    setSavingItem(true)
    setError('')

    const payload = {
      name: itemForm.name,
      category: itemForm.category,
      stock_qty: itemForm.stock_qty ? parseInt(itemForm.stock_qty, 10) : 0,
      unit_price: itemForm.unit_price ? parseFloat(itemForm.unit_price) : null,
      training_center_id: itemForm.training_center_id || null,
    }

    const { error } = itemForm.id
      ? await supabase.from('inventory_items').update(payload).eq('id', itemForm.id)
      : await supabase.from('inventory_items').insert(payload)

    setSavingItem(false)
    if (error) {
      setError(error.message)
    } else {
      setShowItemForm(false)
      loadData()
    }
  }

  async function handleDeleteItem(item) {
    if (!confirm(`Delete "${item.name}" from inventory?`)) return
    const { error } = await supabase.from('inventory_items').delete().eq('id', item.id)
    if (error) setError(error.message)
    else loadData()
  }

  function openIssueForm(item) {
    setIssuingFor(item)
    setIssueForm(emptyIssueForm)
  }

  async function handleIssueSubmit(e) {
    e.preventDefault()
    setSavingIssue(true)
    setError('')

    const qty = parseInt(issueForm.quantity, 10)

    if (qty > issuingFor.stock_qty) {
      setError(`Only ${issuingFor.stock_qty} in stock — cannot issue ${qty}.`)
      setSavingIssue(false)
      return
    }

    const { error: issueError } = await supabase.from('inventory_issued').insert({
      item_id: issuingFor.id,
      student_id: issueForm.student_id,
      quantity: qty,
      paid: issueForm.paid,
      amount: issueForm.amount ? parseFloat(issueForm.amount) : null,
    })

    if (issueError) {
      setError(issueError.message)
      setSavingIssue(false)
      return
    }

    const { error: stockError } = await supabase
      .from('inventory_items')
      .update({ stock_qty: issuingFor.stock_qty - qty })
      .eq('id', issuingFor.id)

    setSavingIssue(false)
    if (stockError) {
      setError(stockError.message)
    } else {
      setIssuingFor(null)
      loadData()
    }
  }

  async function openHistory(item) {
    setViewingHistory(item)
    const { data, error } = await supabase
      .from('inventory_issued')
      .select('*, students(full_name)')
      .eq('item_id', item.id)
      .order('issued_on', { ascending: false })

    if (error) setError(error.message)
    else setIssuedHistory(data)
  }


  const list = useListTools(items, {
    search: (i) => [i.name, i.category, i.training_centers?.name],
    filters: {
      category: (i) => i.category,
      stock: (i) => (i.stock_qty > 0 ? 'in_stock' : 'out_of_stock'),
      center: (i) => i.training_center_id,
    },
    sorts: { name: byText((i) => i.name), stock: (a, b) => (a.stock_qty ?? 0) - (b.stock_qty ?? 0), price: byNumberDesc((i) => i.unit_price) },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv('equipment', list.result, [
      { label: 'Item', value: (i) => i.name },
      { label: 'Category', value: (i) => i.category },
      { label: 'Training center', value: (i) => i.training_centers?.name },
      { label: 'Stock', value: (i) => i.stock_qty },
      { label: 'Unit price (INR)', value: (i) => i.unit_price },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      {viewingHistory ? (
        <>
          <button className={`${btnOutline} mb-5`} onClick={() => setViewingHistory(null)}>
            ← All Equipment
          </button>
          <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading mb-2">{viewingHistory.name} — Issuance History</h1>
          <p className="text-muted mb-8">Every time this item was given to a student.</p>

          {issuedHistory.length === 0 ? (
            <p className="text-charcoal">Not issued to anyone yet.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {issuedHistory.map((rec) => (
                <div key={rec.id} className="bg-surface rounded-2xl shadow-card p-6">
                  <h3 className="font-semibold text-base text-heading mb-1.5">{rec.students?.full_name}</h3>
                  <p className="text-sm text-charcoal">Qty: {rec.quantity}</p>
                  <p className="text-[0.85rem] mt-1">{rec.issued_on}</p>
                  <p className="text-[0.8rem] mt-1" style={{ color: rec.paid ? 'var(--status-ok)' : '#999' }}>
                    {rec.paid ? `Paid ₹${rec.amount || 0}` : 'Not paid'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
            <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading">Equipment Record</h1>
            <button className={btnPrimary} onClick={openAddItem}>+ Add Item</button>
          </div>
          <p className="text-muted mb-8">Uniforms, gear, and belts — stock and issuance per center.</p>

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showItemForm && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
              <h3 className="font-semibold text-base text-heading mb-4">{itemForm.id ? 'Edit Item' : 'New Inventory Item'}</h3>
              <form onSubmit={handleItemSubmit} className="flex flex-col gap-3">
                <input
                  type="text" placeholder="Item name (e.g. Dobok - Size M)" required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className={inputCls}
                />
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className={`${inputCls} capitalize`}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={itemForm.training_center_id}
                  onChange={(e) => setItemForm({ ...itemForm, training_center_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— No specific center —</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <input
                    type="number" placeholder="Stock quantity"
                    value={itemForm.stock_qty}
                    onChange={(e) => setItemForm({ ...itemForm, stock_qty: e.target.value })}
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number" placeholder="Unit price (₹)" step="0.01"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                    className={`${inputCls} flex-1`}
                  />
                </div>
                <div className="flex gap-2.5">
                  <button type="submit" className={btnPrimary} disabled={savingItem}>
                    {savingItem ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" className={btnOutline} onClick={() => setShowItemForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {issuingFor && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
              <h3 className="font-semibold text-base text-heading mb-1.5">Issue: {issuingFor.name}</h3>
              <p className="text-[0.85rem] mb-4 text-charcoal">In stock: {issuingFor.stock_qty}</p>
              <form onSubmit={handleIssueSubmit} className="flex flex-col gap-3">
                <select
                  required
                  value={issueForm.student_id}
                  onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— Select student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <input
                  type="number" placeholder="Quantity" min="1" required
                  value={issueForm.quantity}
                  onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                  className={inputCls}
                />
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={issueForm.paid}
                    onChange={(e) => setIssueForm({ ...issueForm, paid: e.target.checked })}
                  />
                  Paid for
                </label>
                {issueForm.paid && (
                  <input
                    type="number" placeholder="Amount paid (₹)" step="0.01"
                    value={issueForm.amount}
                    onChange={(e) => setIssueForm({ ...issueForm, amount: e.target.value })}
                    className={inputCls}
                  />
                )}
                <div className="flex gap-2.5">
                  <button type="submit" className={btnPrimary} disabled={savingIssue}>
                    {savingIssue ? 'Issuing…' : 'Issue Item'}
                  </button>
                  <button type="button" className={btnOutline} onClick={() => setIssuingFor(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <ListToolbar
            list={list}
            placeholder="Search item, category, center…"
            printTitle="Equipment Record"
            onExport={handleExport}
            filters={[
              { key: 'category', label: 'Category', options: opts(CATEGORIES) },
              { key: 'stock', label: 'Stock', options: opts(['in_stock', 'out_of_stock']) },
              { key: 'center', label: 'Center', options: centers.map((c) => ({ value: c.id, label: c.name })) },
            ]}
            sorts={[{ key: 'name', label: 'Name A–Z' }, { key: 'stock', label: 'Lowest stock' }, { key: 'price', label: 'Highest price' }]}
          />

          {loading ? (
            <p>Loading…</p>
          ) : list.result.length === 0 ? (
            <p className="text-muted">{list.total === 0 ? <>No inventory items yet. Add your first one above.</> : 'Nothing matches your search or filters.'}</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {list.result.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface rounded-2xl shadow-card p-6"
                  style={{ borderLeftWidth: 4, borderLeftColor: item.stock_qty > 0 ? 'var(--status-ok)' : '#999' }}
                >
                  <h3 className="font-semibold text-base text-heading mb-1.5">{item.name}</h3>
                  <p className="text-sm text-charcoal capitalize">{item.category}</p>
                  <p className="text-[0.85rem] mt-1.5">
                    Stock: {item.stock_qty} {item.unit_price ? `· ₹${item.unit_price} each` : ''}
                  </p>
                  {item.training_centers?.name && (
                    <p className="text-[0.8rem] mt-1">{item.training_centers.name}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      className={`${btnPrimary} ${btnSm}`}
                      onClick={() => openIssueForm(item)}
                      disabled={item.stock_qty <= 0}
                    >
                      Issue
                    </button>
                    <button className={`${btnOutline} ${btnSm}`} onClick={() => openHistory(item)}>History</button>
                    <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditItem(item)}>Edit</button>
                    <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDeleteItem(item)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
