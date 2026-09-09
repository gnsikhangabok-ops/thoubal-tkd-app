import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

const LEVELS = ['district', 'state', 'national', 'international']
const MEDALS = ['gold', 'silver', 'bronze', 'none']
const MEDAL_COLOR = { gold: '#D4A537', silver: '#A8A8A8', bronze: '#B08D57', none: '#ccc' }

const emptyForm = {
  id: null,
  student_id: '',
  title: '',
  achievement_date: '',
  level: 'district',
  medal: 'gold',
  description: '',
  photo_url: '',
}

export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [levelFilter, setLevelFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [achRes, studentRes] = await Promise.all([
      supabase
        .from('achievements')
        .select('*, students(full_name)')
        .order('achievement_date', { ascending: false }),
      supabase
        .from('students')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name'),
    ])

    if (achRes.error) setError(achRes.error.message)
    else setAchievements(achRes.data)

    if (studentRes.error) setError((prev) => prev || studentRes.error.message)
    else setStudents(studentRes.data)

    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(a) {
    setForm({
      id: a.id,
      student_id: a.student_id || '',
      title: a.title,
      achievement_date: a.achievement_date || '',
      level: a.level || 'district',
      medal: a.medal || 'none',
      description: a.description || '',
      photo_url: a.photo_url || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      student_id: form.student_id || null,
      title: form.title,
      achievement_date: form.achievement_date || null,
      level: form.level,
      medal: form.medal === 'none' ? null : form.medal,
      description: form.description || null,
      photo_url: form.photo_url || null,
    }

    const { error } = form.id
      ? await supabase.from('achievements').update(payload).eq('id', form.id)
      : await supabase.from('achievements').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function handleDelete(a) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('achievements').delete().eq('id', a.id)
    if (error) setError(error.message)
    else loadData()
  }

  const filtered = levelFilter
    ? achievements.filter((a) => a.level === levelFilter)
    : achievements

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Achievements</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Achievement</button>
        </div>
        <p className="dash-lede">Medals and award highlights — shown publicly on the website.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div style={{ marginBottom: 24 }}>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)' }}
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => <option key={l} value={l} style={{ textTransform: 'capitalize' }}>{l}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 520 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Achievement' : 'New Achievement'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— Select student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>

              <input
                type="text" placeholder="Title (e.g. Gold Medal - State Championship 2026)" required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <input
                type="date"
                value={form.achievement_date}
                onChange={(e) => setForm({ ...form, achievement_date: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1, textTransform: 'capitalize' }}
                >
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <select
                  value={form.medal}
                  onChange={(e) => setForm({ ...form, medal: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1, textTransform: 'capitalize' }}
                >
                  {MEDALS.map((m) => <option key={m} value={m}>{m === 'none' ? 'No medal' : m}</option>)}
                </select>
              </div>

              <textarea
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
              />
              <input
                type="text" placeholder="Photo URL (optional, add after upload)"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
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
          <p style={{ color: 'var(--charcoal)' }}>No achievements recorded yet.</p>
        ) : (
          <div className="module-grid">
            {filtered.map((a) => (
              <div className="module-card" key={a.id} style={{ borderTopColor: a.medal ? MEDAL_COLOR[a.medal] : '#ccc' }}>
                <h3>{a.title}</h3>
                <p>{a.students?.full_name || 'Unnamed student'}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6, textTransform: 'capitalize' }}>
                  {a.level} {a.medal ? `· ${a.medal} medal` : ''}
                </p>
                {a.achievement_date && <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{a.achievement_date}</p>}
                {a.description && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{a.description}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => openEditForm(a)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => handleDelete(a)}
                  >
                    Delete
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
