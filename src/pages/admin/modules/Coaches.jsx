import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

const emptyForm = {
  id: null,
  full_name: '',
  dan_grade: '',
  designation: '',
  phone: '',
  bio: '',
  training_center_id: '',
  active: true,
}

export default function Coaches() {
  const [coaches, setCoaches] = useState([])
  const [centers, setCenters] = useState([])
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
    const [coachRes, centerRes] = await Promise.all([
      supabase
        .from('coaches')
        .select('*, training_centers(name)')
        .order('created_at', { ascending: true }),
      supabase
        .from('training_centers')
        .select('id, name')
        .eq('active', true)
        .order('name'),
    ])

    if (coachRes.error) {
      setError(coachRes.error.message)
    } else {
      setCoaches(coachRes.data)
      setError('')
    }
    if (centerRes.error) {
      setError((prev) => prev || centerRes.error.message)
    } else {
      setCenters(centerRes.data)
    }
    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(coach) {
    setForm({
      id: coach.id,
      full_name: coach.full_name,
      dan_grade: coach.dan_grade || '',
      designation: coach.designation || '',
      phone: coach.phone || '',
      bio: coach.bio || '',
      training_center_id: coach.training_center_id || '',
      active: coach.active,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      full_name: form.full_name,
      dan_grade: form.dan_grade || null,
      designation: form.designation || null,
      phone: form.phone || null,
      bio: form.bio || null,
      training_center_id: form.training_center_id || null,
      active: form.active,
    }

    const { error } = form.id
      ? await supabase.from('coaches').update(payload).eq('id', form.id)
      : await supabase.from('coaches').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function toggleActive(coach) {
    const { error } = await supabase
      .from('coaches')
      .update({ active: !coach.active })
      .eq('id', coach.id)

    if (error) {
      setError(error.message)
    } else {
      loadData()
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
          <h1>Coaches</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Coach</button>
        </div>
        <p className="dash-lede">Instructors are added by admin only. No self-registration.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        {centers.length === 0 && !loading && (
          <p style={{ color: 'var(--red)', marginBottom: 16, fontSize: '0.9rem' }}>
            No active training centers found. <Link to="/admin/training-centers" style={{ textDecoration: 'underline' }}>Add a training center first</Link> so you can assign coaches to it.
          </p>
        )}

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 520 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Coach' : 'New Coach'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="text"
                placeholder="Dan grade (e.g. 4th Dan)"
                value={form.dan_grade}
                onChange={(e) => setForm({ ...form, dan_grade: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="text"
                placeholder="Designation (e.g. Chief Instructor)"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <select
                value={form.training_center_id}
                onChange={(e) => setForm({ ...form, training_center_id: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— No center assigned —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Short bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
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
        ) : coaches.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No coaches yet. Add your first one above.</p>
        ) : (
          <div className="module-grid">
            {coaches.map((c) => (
              <div className="module-card" key={c.id} style={{ borderTopColor: c.active ? 'var(--red)' : '#ccc' }}>
                <h3>{c.full_name}</h3>
                <p>{c.designation || 'Instructor'}{c.dan_grade ? ` · ${c.dan_grade}` : ''}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                  {c.training_centers?.name || 'No center assigned'}
                </p>
                {c.phone && <p style={{ fontSize: '0.85rem' }}>{c.phone}</p>}
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
