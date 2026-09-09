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
const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Coaches</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Coach</button>
      </div>
      <p className="text-charcoal mb-9">Instructors are added by admin only. No self-registration.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      {centers.length === 0 && !loading && (
        <p className="text-brand-red mb-4 text-sm">
          No active training centers found. <Link to="/admin/training-centers" className="underline">Add a training center first</Link> so you can assign coaches to it.
        </p>
      )}

      {showForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[520px]">
          <h3 className="font-semibold text-base text-ink mb-4">{form.id ? 'Edit Coach' : 'New Coach'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Dan grade (e.g. 4th Dan)"
              value={form.dan_grade}
              onChange={(e) => setForm({ ...form, dan_grade: e.target.value })}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Designation (e.g. Chief Instructor)"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className={inputCls}
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
            <select
              value={form.training_center_id}
              onChange={(e) => setForm({ ...form, training_center_id: e.target.value })}
              className={inputCls}
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
              className={`${inputCls} font-body`}
            />
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
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
      ) : coaches.length === 0 ? (
        <p className="text-charcoal">No coaches yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {coaches.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: c.active ? '#B3282D' : '#ccc' }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{c.full_name}</h3>
              <p className="text-sm text-charcoal">{c.designation || 'Instructor'}{c.dan_grade ? ` · ${c.dan_grade}` : ''}</p>
              <p className="text-[0.85rem] mt-1.5">{c.training_centers?.name || 'No center assigned'}</p>
              {c.phone && <p className="text-[0.85rem]">{c.phone}</p>}
              <p className="text-[0.8rem] mt-2" style={{ color: c.active ? '#B3282D' : '#999' }}>
                {c.active ? 'Active' : 'Inactive'}
              </p>
              <div className="flex gap-2 mt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(c)}>Edit</button>
                <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleActive(c)}>
                  {c.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
