import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

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

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Achievements</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Achievement</button>
      </div>
      <p className="text-charcoal mb-9">Medals and award highlights — shown publicly on the website.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="mb-6">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[520px]">
          <h3 className="font-semibold text-base text-ink mb-4">{form.id ? 'Edit Achievement' : 'New Achievement'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
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
              type="text" placeholder="Title (e.g. Gold Medal - State Championship 2026)" required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />

            <input
              type="date"
              value={form.achievement_date}
              onChange={(e) => setForm({ ...form, achievement_date: e.target.value })}
              className={inputCls}
            />

            <div className="flex gap-3">
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={`${inputCls} flex-1 capitalize`}
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={form.medal}
                onChange={(e) => setForm({ ...form, medal: e.target.value })}
                className={`${inputCls} flex-1 capitalize`}
              >
                {MEDALS.map((m) => <option key={m} value={m}>{m === 'none' ? 'No medal' : m}</option>)}
              </select>
            </div>

            <textarea
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputCls} font-body`}
            />
            <input
              type="text" placeholder="Photo URL (optional, add after upload)"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              className={inputCls}
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
        <p className="text-charcoal">No achievements recorded yet.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: a.medal ? MEDAL_COLOR[a.medal] : '#ccc' }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{a.title}</h3>
              <p className="text-sm text-charcoal">{a.students?.full_name || 'Unnamed student'}</p>
              <p className="text-[0.85rem] mt-1.5 capitalize">
                {a.level} {a.medal ? `· ${a.medal} medal` : ''}
              </p>
              {a.achievement_date && <p className="text-[0.8rem] mt-1">{a.achievement_date}</p>}
              {a.description && <p className="text-[0.85rem] mt-1.5">{a.description}</p>}
              <div className="flex gap-2 mt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(a)}>Edit</button>
                <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDelete(a)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
