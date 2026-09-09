import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

const BELT_RANKS = [
  'white', 'yellow', 'green', 'blue', 'red',
  'black_1', 'black_2', 'black_3', 'black_4_plus',
]

const BELT_LABELS = {
  white: 'White Belt',
  yellow: 'Yellow Belt',
  green: 'Green Belt',
  blue: 'Blue Belt',
  red: 'Red Belt',
  black_1: 'Black Belt 1st Dan',
  black_2: 'Black Belt 2nd Dan',
  black_3: 'Black Belt 3rd Dan',
  black_4_plus: 'Black Belt 4th Dan+',
}

const emptyForm = {
  id: null,
  full_name: '',
  dob: '',
  gender: '',
  religion: '',
  guardian_name: '',
  guardian_phone: '',
  address: '',
  training_center_id: '',
  batch_id: '',
  current_belt: 'white',
  medical_notes: '',
  active: true,
  rules_acknowledged: false,
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [centers, setCenters] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [studentRes, centerRes, batchRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, training_centers(name), batches(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('training_centers')
        .select('id, name')
        .eq('active', true)
        .order('name'),
      supabase
        .from('batches')
        .select('id, name, training_center_id')
        .eq('active', true)
        .order('name'),
    ])

    if (studentRes.error) setError(studentRes.error.message)
    else setStudents(studentRes.data)

    if (centerRes.error) setError((prev) => prev || centerRes.error.message)
    else setCenters(centerRes.data)

    if (batchRes.error) setError((prev) => prev || batchRes.error.message)
    else setBatches(batchRes.data)

    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(student) {
    setForm({
      id: student.id,
      full_name: student.full_name,
      dob: student.dob || '',
      gender: student.gender || '',
      religion: student.religion || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      address: student.address || '',
      training_center_id: student.training_center_id || '',
      batch_id: student.batch_id || '',
      current_belt: student.current_belt || 'white',
      medical_notes: student.medical_notes || '',
      active: student.active,
      rules_acknowledged: student.rules_acknowledged || false,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      full_name: form.full_name,
      dob: form.dob || null,
      gender: form.gender || null,
      religion: form.religion || null,
      guardian_name: form.guardian_name || null,
      guardian_phone: form.guardian_phone || null,
      address: form.address || null,
      training_center_id: form.training_center_id || null,
      batch_id: form.batch_id || null,
      current_belt: form.current_belt,
      medical_notes: form.medical_notes || null,
      active: form.active,
      rules_acknowledged: form.rules_acknowledged,
      rules_acknowledged_on: form.rules_acknowledged ? new Date().toISOString() : null,
    }

    const { error } = form.id
      ? await supabase.from('students').update(payload).eq('id', form.id)
      : await supabase.from('students').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function toggleActive(student) {
    const { error } = await supabase
      .from('students')
      .update({ active: !student.active })
      .eq('id', student.id)

    if (error) setError(error.message)
    else loadData()
  }

  const batchesForSelectedCenter = form.training_center_id
    ? batches.filter((b) => b.training_center_id === form.training_center_id)
    : batches

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Students / Registration</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Register Student</button>
        </div>
        <p className="dash-lede">All enrolled athletes across every training center.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        {centers.length === 0 && !loading && (
          <p style={{ color: 'var(--red)', marginBottom: 16, fontSize: '0.9rem' }}>
            No active training centers found. <Link to="/admin/training-centers" style={{ textDecoration: 'underline' }}>Add a training center first</Link>.
          </p>
        )}

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 560 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Student' : 'New Student Registration'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text" placeholder="Full name" required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="date" placeholder="Date of birth"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <input
                type="text" placeholder="Religion"
                value={form.religion}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <input
                type="text" placeholder="Guardian name"
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <input
                type="tel" placeholder="Guardian phone"
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />
              <textarea
                placeholder="Address" rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
              />

              <select
                value={form.training_center_id}
                onChange={(e) => setForm({ ...form, training_center_id: e.target.value, batch_id: '' })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— Select training center —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={form.batch_id}
                onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— No batch assigned —</option>
                {batchesForSelectedCenter.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={form.current_belt}
                onChange={(e) => setForm({ ...form, current_belt: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                {BELT_RANKS.map((b) => (
                  <option key={b} value={b}>{BELT_LABELS[b]}</option>
                ))}
              </select>

              <textarea
                placeholder="Medical notes (allergies, conditions coach should know)"
                rows={2}
                value={form.medical_notes}
                onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
              />

              <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.rules_acknowledged}
                  onChange={(e) => setForm({ ...form, rules_acknowledged: e.target.checked })}
                  style={{ marginTop: 3 }}
                />
                <span>Guardian/student has read and agreed to the academy's rules & regulations</span>
              </label>

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

        {!showForm && (
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)', marginBottom: 20, width: '100%', maxWidth: 320 }}
          />
        )}

        {loading ? (
          <p>Loading…</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No students found.</p>
        ) : (
          <div className="module-grid">
            {filteredStudents.map((s) => (
              <div className="module-card" key={s.id} style={{ borderTopColor: s.active ? 'var(--red)' : '#ccc' }}>
                <h3>{s.full_name}</h3>
                <p>{BELT_LABELS[s.current_belt] || s.current_belt}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                  {s.training_centers?.name || 'No center'} {s.batches?.name ? `· ${s.batches.name}` : ''}
                </p>
                {s.guardian_phone && <p style={{ fontSize: '0.85rem' }}>{s.guardian_phone}</p>}
                <p style={{ fontSize: '0.8rem', color: s.rules_acknowledged ? 'var(--charcoal)' : 'var(--red)', marginTop: 6 }}>
                  {s.rules_acknowledged ? '✓ Rules acknowledged' : '⚠ Rules not acknowledged'}
                </p>
                <p style={{ fontSize: '0.8rem', color: s.active ? 'var(--red)' : '#999', marginTop: 4 }}>
                  {s.active ? 'Active' : 'Inactive'}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => openEditForm(s)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => toggleActive(s)}
                  >
                    {s.active ? 'Deactivate' : 'Activate'}
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
