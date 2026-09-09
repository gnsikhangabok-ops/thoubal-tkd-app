import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

const CATEGORIES = ['Sparring', 'Poomsae', 'Fitness', 'Discipline', 'Technique', 'Other']
const RATINGS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement']
const RATING_COLOR = {
  Excellent: 'var(--red)',
  Good: 'var(--gold)',
  Satisfactory: '#B8860B',
  'Needs Improvement': '#999',
}

const emptyForm = {
  id: null,
  student_id: '',
  recorded_on: new Date().toISOString().slice(0, 10),
  category: 'Sparring',
  rating: 'Good',
  remarks: '',
}

export default function StudentPerformance() {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [studentFilter, setStudentFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [perfRes, studentRes] = await Promise.all([
      supabase
        .from('student_performance')
        .select('*, students(full_name)')
        .order('recorded_on', { ascending: false }),
      supabase
        .from('students')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name'),
    ])

    if (perfRes.error) setError(perfRes.error.message)
    else setRecords(perfRes.data)

    if (studentRes.error) setError((prev) => prev || studentRes.error.message)
    else setStudents(studentRes.data)

    setLoading(false)
  }

  function openAddForm() {
    setForm({ ...emptyForm, student_id: studentFilter || '' })
    setShowForm(true)
  }

  function openEditForm(r) {
    setForm({
      id: r.id,
      student_id: r.student_id,
      recorded_on: r.recorded_on,
      category: r.category || 'Sparring',
      rating: r.rating || 'Good',
      remarks: r.remarks || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      student_id: form.student_id,
      recorded_on: form.recorded_on,
      category: form.category,
      rating: form.rating,
      remarks: form.remarks || null,
    }

    const { error } = form.id
      ? await supabase.from('student_performance').update(payload).eq('id', form.id)
      : await supabase.from('student_performance').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function handleDelete(r) {
    if (!confirm('Delete this performance record?')) return
    const { error } = await supabase.from('student_performance').delete().eq('id', r.id)
    if (error) setError(error.message)
    else loadData()
  }

  const filtered = studentFilter
    ? records.filter((r) => r.student_id === studentFilter)
    : records

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Student Performance</h1>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Assessment</button>
        </div>
        <p className="dash-lede">Ongoing coach evaluations — sparring, poomsae, fitness, discipline.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div style={{ marginBottom: 24 }}>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)', minWidth: 240 }}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 480 }}>
            <h3 style={{ marginBottom: 16 }}>{form.id ? 'Edit Assessment' : 'New Assessment'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                required
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
                type="date" required
                value={form.recorded_on}
                onChange={(e) => setForm({ ...form, recorded_on: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  style={{ padding: 10, border: '1px solid var(--line)', flex: 1 }}
                >
                  {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <textarea
                placeholder="Remarks"
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
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
          <p style={{ color: 'var(--charcoal)' }}>No performance records yet.</p>
        ) : (
          <div className="module-grid">
            {filtered.map((r) => (
              <div className="module-card" key={r.id} style={{ borderTopColor: RATING_COLOR[r.rating] || 'var(--red)' }}>
                <h3>{r.students?.full_name}</h3>
                <p>{r.category} · {r.rating}</p>
                <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{r.recorded_on}</p>
                {r.remarks && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{r.remarks}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => openEditForm(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => handleDelete(r)}
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
