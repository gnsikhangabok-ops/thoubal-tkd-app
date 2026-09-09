import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

const emptyForm = { id: null, name: '', location: '', active: true }

export default function TrainingCenters() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCenters()
  }, [])

  async function loadCenters() {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_centers')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setCenters(data)
      setError('')
    }
    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(center) {
    setForm({ id: center.id, name: center.name, location: center.location || '', active: center.active })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (form.id) {
      // Update
      const { error } = await supabase
        .from('training_centers')
        .update({ name: form.name, location: form.location, active: form.active })
        .eq('id', form.id)

      if (error) setError(error.message)
    } else {
      // Insert
      const { error } = await supabase
        .from('training_centers')
        .insert({ name: form.name, location: form.location, active: form.active })

      if (error) setError(error.message)
    }

    setSaving(false)
    if (!error) {
      setShowForm(false)
      loadCenters()
    }
  }

  async function toggleActive(center) {
    const { error } = await supabase
      .from('training_centers')
      .update({ active: !center.active })
      .eq('id', center.id)

    if (error) {
      setError(error.message)
    } else {
      loadCenters()
    }
  }

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1>Training Centers</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Center</button>
        </div>
        <p className="dash-lede">Branches operating under Thoubal District Taekwondo Association.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 480 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Center' : 'New Training Center'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Center name (e.g. Khangabok Main Center)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="text"
                placeholder="Location / address"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
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
        ) : centers.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No training centers yet. Add your first one above.</p>
        ) : (
          <div className="module-grid">
            {centers.map((c) => (
              <div className="module-card" key={c.id} style={{ borderTopColor: c.active ? 'var(--red)' : '#ccc' }}>
                <h3>{c.name}</h3>
                <p>{c.location || 'No location set'}</p>
                <p style={{ fontSize: '0.8rem', color: c.active ? 'var(--red)' : '#999', marginTop: 8 }}>
                  {c.active ? 'Active' : 'Inactive'}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => openEditForm(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => toggleActive(c)}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
