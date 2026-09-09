import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const emptyForm = {
  id: null,
  name: '',
  age_group: '',
  training_center_id: '',
  coach_id: '',
  schedule_days: [],
  start_time: '',
  end_time: '',
  capacity: '',
  active: true,
}

export default function Batches() {
  const [batches, setBatches] = useState([])
  const [centers, setCenters] = useState([])
  const [coaches, setCoaches] = useState([])
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
    const [batchRes, centerRes, coachRes] = await Promise.all([
      supabase
        .from('batches')
        .select('*, training_centers(name), coaches(full_name)')
        .order('created_at', { ascending: true }),
      supabase
        .from('training_centers')
        .select('id, name')
        .eq('active', true)
        .order('name'),
      supabase
        .from('coaches')
        .select('id, full_name, training_center_id')
        .eq('active', true)
        .order('full_name'),
    ])

    if (batchRes.error) setError(batchRes.error.message)
    else setBatches(batchRes.data)

    if (centerRes.error) setError((prev) => prev || centerRes.error.message)
    else setCenters(centerRes.data)

    if (coachRes.error) setError((prev) => prev || coachRes.error.message)
    else setCoaches(coachRes.data)

    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(batch) {
    setForm({
      id: batch.id,
      name: batch.name,
      age_group: batch.age_group || '',
      training_center_id: batch.training_center_id || '',
      coach_id: batch.coach_id || '',
      schedule_days: batch.schedule_days || [],
      start_time: batch.start_time || '',
      end_time: batch.end_time || '',
      capacity: batch.capacity ?? '',
      active: batch.active,
    })
    setShowForm(true)
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      schedule_days: f.schedule_days.includes(day)
        ? f.schedule_days.filter((d) => d !== day)
        : [...f.schedule_days, day],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      age_group: form.age_group || null,
      training_center_id: form.training_center_id || null,
      coach_id: form.coach_id || null,
      schedule_days: form.schedule_days.length ? form.schedule_days : null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      active: form.active,
    }

    const { error } = form.id
      ? await supabase.from('batches').update(payload).eq('id', form.id)
      : await supabase.from('batches').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function toggleActive(batch) {
    const { error } = await supabase
      .from('batches')
      .update({ active: !batch.active })
      .eq('id', batch.id)

    if (error) setError(error.message)
    else loadData()
  }

  const coachesForSelectedCenter = form.training_center_id
    ? coaches.filter((c) => c.training_center_id === form.training_center_id)
    : coaches

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Batches</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Batch</button>
        </div>
        <p className="dash-lede">Class groups with timing, coach, and center assignment.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        {centers.length === 0 && !loading && (
          <p style={{ color: 'var(--red)', marginBottom: 16, fontSize: '0.9rem' }}>
            No active training centers found. <Link to="/admin/training-centers" style={{ textDecoration: 'underline' }}>Add a training center first</Link>.
          </p>
        )}

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 520 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Batch' : 'New Batch'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text" placeholder="Batch name (e.g. Little Dragons - Morning)" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="text" placeholder="Age group (e.g. 5-8)"
                value={form.age_group}
                onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <select
                value={form.training_center_id}
                onChange={(e) => setForm({ ...form, training_center_id: e.target.value, coach_id: '' })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— Select training center —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={form.coach_id}
                onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— No coach assigned —</option>
                {coachesForSelectedCenter.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>

              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Schedule days</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DAYS.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={form.schedule_days.includes(day) ? 'btn btn-primary' : 'btn btn-outline'}
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Start time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>End time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', width: '100%' }}
                  />
                </div>
              </div>

              <input
                type="number" placeholder="Capacity (max students)"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
        ) : batches.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No batches yet. Add your first one above.</p>
        ) : (
          <div className="module-grid">
            {batches.map((b) => (
              <div className="module-card" key={b.id} style={{ borderTopColor: b.active ? 'var(--red)' : '#ccc' }}>
                <h3>{b.name}</h3>
                <p>{b.age_group ? `Ages ${b.age_group}` : 'All ages'}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                  {b.training_centers?.name || 'No center'}
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  {b.coaches?.full_name || 'No coach assigned'}
                </p>
                {b.schedule_days?.length > 0 && (
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{b.schedule_days.join(', ')}</p>
                )}
                {(b.start_time || b.end_time) && (
                  <p style={{ fontSize: '0.8rem' }}>{b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</p>
                )}
                {b.capacity && <p style={{ fontSize: '0.8rem' }}>Capacity: {b.capacity}</p>}
                <p style={{ fontSize: '0.8rem', color: b.active ? 'var(--red)' : '#999', marginTop: 6 }}>
                  {b.active ? 'Active' : 'Inactive'}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => openEditForm(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => toggleActive(b)}
                  >
                    {b.active ? 'Deactivate' : 'Activate'}
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
