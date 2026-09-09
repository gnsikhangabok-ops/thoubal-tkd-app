import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const CATEGORIES = ['Sparring', 'Poomsae', 'Fitness', 'Discipline', 'Technique', 'Other']
const RATINGS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement']
const RATING_COLOR = {
  Excellent: '#B3282D',
  Good: '#D4A537',
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

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Student Performance</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Assessment</button>
      </div>
      <p className="text-charcoal mb-9">Ongoing coach evaluations — sparring, poomsae, fitness, discipline.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="mb-6">
        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className={`${inputCls} min-w-[240px]`}
        >
          <option value="">All students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[480px]">
          <h3 className="font-semibold text-base text-ink mb-4">{form.id ? 'Edit Assessment' : 'New Assessment'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
              required
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className={inputCls}
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
              className={inputCls}
            />

            <div className="flex gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputCls} flex-1`}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className={`${inputCls} flex-1`}
              >
                {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <textarea
              placeholder="Remarks"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
        <p className="text-charcoal">No performance records yet.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: RATING_COLOR[r.rating] || '#B3282D' }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{r.students?.full_name}</h3>
              <p className="text-sm text-charcoal">{r.category} · {r.rating}</p>
              <p className="text-[0.8rem] mt-1">{r.recorded_on}</p>
              {r.remarks && <p className="text-[0.85rem] mt-1.5">{r.remarks}</p>}
              <div className="flex gap-2 mt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(r)}>Edit</button>
                <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDelete(r)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
