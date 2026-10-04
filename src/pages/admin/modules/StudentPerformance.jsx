import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, byDateDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const CATEGORIES = ['Sparring', 'Poomsae', 'Fitness', 'Discipline', 'Technique', 'Other']
const RATINGS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement']
const RATING_COLOR = {
  Excellent: 'var(--status-ok)',
  Good: 'var(--status-info)',
  Satisfactory: 'var(--status-warn)',
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


  const list = useListTools(filtered, {
    search: (r) => [r.students?.full_name, r.category, r.rating, r.remarks],
    filters: { category: (r) => r.category, rating: (r) => r.rating },
    sorts: { newest: byDateDesc((r) => r.recorded_on), student: byText((r) => r.students?.full_name) },
    defaultSort: 'newest',
  })

  function handleExport() {
    exportCsv('student-performance', list.result, [
      { label: 'Date', value: (r) => r.recorded_on },
      { label: 'Student', value: (r) => r.students?.full_name },
      { label: 'Category', value: (r) => r.category },
      { label: 'Rating', value: (r) => r.rating },
      { label: 'Remarks', value: (r) => r.remarks },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading">Student Performance</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Assessment</button>
      </div>
      <p className="text-muted mb-8">Ongoing coach evaluations — sparring, poomsae, fitness, discipline.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

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
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Assessment' : 'New Assessment'}</h3>
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

      <ListToolbar
        list={list}
        placeholder="Search student, remarks…"
        printTitle="Student Performance"
        onExport={handleExport}
        filters={[
          { key: 'category', label: 'Category', options: opts(CATEGORIES) },
          { key: 'rating', label: 'Rating', options: opts(RATINGS) },
        ]}
        sorts={[{ key: 'newest', label: 'Newest first' }, { key: 'student', label: 'Student A–Z' }]}
      />

      {loading ? (
        <p>Loading…</p>
      ) : list.result.length === 0 ? (
        <p className="text-muted">{list.total === 0 ? <>No performance records yet.</> : 'Nothing matches your search or filters.'}</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.result.map((r) => (
            <div
              key={r.id}
              className="bg-surface rounded-2xl shadow-card p-6"
              style={{ borderLeftWidth: 4, borderLeftColor: RATING_COLOR[r.rating] || 'var(--status-info)' }}
            >
              <h3 className="font-semibold text-base text-heading mb-1.5">{r.students?.full_name}</h3>
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
