import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

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

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Batches</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Batch</button>
      </div>
      <p className="text-charcoal mb-9">Class groups with timing, coach, and center assignment.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      {centers.length === 0 && !loading && (
        <p className="text-brand-red mb-4 text-sm">
          No active training centers found. <Link to="/admin/training-centers" className="underline">Add a training center first</Link>.
        </p>
      )}

      {showForm && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[520px]">
          <h3 className="font-semibold text-base text-ink mb-4">{form.id ? 'Edit Batch' : 'New Batch'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text" placeholder="Batch name (e.g. Little Dragons - Morning)" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
            <input
              type="text" placeholder="Age group (e.g. 5-8)"
              value={form.age_group}
              onChange={(e) => setForm({ ...form, age_group: e.target.value })}
              className={inputCls}
            />

            <select
              value={form.training_center_id}
              onChange={(e) => setForm({ ...form, training_center_id: e.target.value, coach_id: '' })}
              className={inputCls}
            >
              <option value="">— Select training center —</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={form.coach_id}
              onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
              className={inputCls}
            >
              <option value="">— No coach assigned —</option>
              {coachesForSelectedCenter.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>

            <div>
              <p className="text-[0.85rem] font-semibold mb-2">Schedule days</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`text-[0.8rem] px-3.5 py-1.5 font-display font-semibold uppercase tracking-wide ${
                      form.schedule_days.includes(day)
                        ? 'bg-brand-red text-chalk'
                        : 'border border-ink text-ink hover:bg-ink hover:text-chalk'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[0.8rem] block mb-1">Start time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className={`${inputCls} w-full`}
                />
              </div>
              <div className="flex-1">
                <label className="text-[0.8rem] block mb-1">End time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>

            <input
              type="number" placeholder="Capacity (max students)"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className={inputCls}
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
      ) : batches.length === 0 ? (
        <p className="text-charcoal">No batches yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {batches.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: b.active ? '#B3282D' : '#ccc' }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{b.name}</h3>
              <p className="text-sm text-charcoal">{b.age_group ? `Ages ${b.age_group}` : 'All ages'}</p>
              <p className="text-[0.85rem] mt-1.5">{b.training_centers?.name || 'No center'}</p>
              <p className="text-[0.85rem]">{b.coaches?.full_name || 'No coach assigned'}</p>
              {b.schedule_days?.length > 0 && (
                <p className="text-[0.8rem] mt-1">{b.schedule_days.join(', ')}</p>
              )}
              {(b.start_time || b.end_time) && (
                <p className="text-[0.8rem]">{b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</p>
              )}
              {b.capacity && <p className="text-[0.8rem]">Capacity: {b.capacity}</p>}
              <p className="text-[0.8rem] mt-1.5" style={{ color: b.active ? '#B3282D' : '#999' }}>
                {b.active ? 'Active' : 'Inactive'}
              </p>
              <div className="flex gap-2 mt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(b)}>Edit</button>
                <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleActive(b)}>
                  {b.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
