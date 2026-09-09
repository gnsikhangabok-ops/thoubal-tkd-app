import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

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

    // Decrement stock
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

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        {viewingHistory ? (
          <>
            <button className="btn btn-outline" style={{ marginBottom: 20 }} onClick={() => setViewingHistory(null)}>
              ← All Equipment
            </button>
            <h1>{viewingHistory.name} — Issuance History</h1>
            <p className="dash-lede">Every time this item was given to a student.</p>

            {issuedHistory.length === 0 ? (
              <p style={{ color: 'var(--charcoal)' }}>Not issued to anyone yet.</p>
            ) : (
              <div className="module-grid">
                {issuedHistory.map((rec) => (
                  <div className="module-card" key={rec.id}>
                    <h3>{rec.students?.full_name}</h3>
                    <p>Qty: {rec.quantity}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{rec.issued_on}</p>
                    <p style={{ fontSize: '0.8rem', color: rec.paid ? 'var(--red)' : '#999', marginTop: 4 }}>
                      {rec.paid ? `Paid ₹${rec.amount || 0}` : 'Not paid'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
              <h1>Equipment Record</h1>
              <button className="btn btn-primary" onClick={openAddItem}>+ Add Item</button>
            </div>
            <p className="dash-lede">Uniforms, gear, and belts — stock and issuance per center.</p>

            {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

            {showItemForm && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 460 }}>
                <h3 style={{ marginBottom: 16 }}>{itemForm.id ? 'Edit Item' : 'New Inventory Item'}</h3>
                <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text" placeholder="Item name (e.g. Dobok - Size M)" required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', textTransform: 'capitalize' }}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={itemForm.training_center_id}
                    onChange={(e) => setItemForm({ ...itemForm, training_center_id: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  >
                    <option value="">— No specific center —</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="number" placeholder="Stock quantity"
                      value={itemForm.stock_qty}
                      onChange={(e) => setItemForm({ ...itemForm, stock_qty: e.target.value })}
                      style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                    />
                    <input
                      type="number" placeholder="Unit price (₹)" step="0.01"
                      value={itemForm.unit_price}
                      onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                      style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingItem}>
                      {savingItem ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowItemForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {issuingFor && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 460 }}>
                <h3 style={{ marginBottom: 6 }}>Issue: {issuingFor.name}</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: 16, color: 'var(--charcoal)' }}>
                  In stock: {issuingFor.stock_qty}
                </p>
                <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select
                    required
                    value={issueForm.student_id}
                    onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
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
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      style={{ padding: 10, border: '1px solid var(--line)' }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingIssue}>
                      {savingIssue ? 'Issuing…' : 'Issue Item'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIssuingFor(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <p>Loading…</p>
            ) : items.length === 0 ? (
              <p style={{ color: 'var(--charcoal)' }}>No inventory items yet. Add your first one above.</p>
            ) : (
              <div className="module-grid">
                {items.map((item) => (
                  <div className="module-card" key={item.id} style={{ borderTopColor: item.stock_qty > 0 ? 'var(--red)' : '#999' }}>
                    <h3>{item.name}</h3>
                    <p style={{ textTransform: 'capitalize' }}>{item.category}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                      Stock: {item.stock_qty} {item.unit_price ? `· ₹${item.unit_price} each` : ''}
                    </p>
                    {item.training_centers?.name && (
                      <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{item.training_centers.name}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => openIssueForm(item)}
                        disabled={item.stock_qty <= 0}
                      >
                        Issue
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => openHistory(item)}
                      >
                        History
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => openEditItem(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => handleDeleteItem(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
