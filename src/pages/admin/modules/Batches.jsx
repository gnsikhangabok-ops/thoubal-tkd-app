import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

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


  const list = useListTools(batches, {
    search: (b) => [b.name, b.age_group, b.training_centers?.name, b.coaches?.full_name],
    filters: {
      status: (b) => (b.active ? 'active' : 'inactive'),
      center: (b) => b.training_center_id,
      day: { match: (b, day) => Boolean(b.schedule_days?.includes(day)) },
    },
    sorts: { name: byText((b) => b.name), time: byText((b) => b.start_time), center: byText((b) => b.training_centers?.name) },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv('batches', list.result, [
      { label: 'Batch', value: (b) => b.name },
      { label: 'Training center', value: (b) => b.training_centers?.name },
      { label: 'Coach', value: (b) => b.coaches?.full_name },
      { label: 'Age group', value: (b) => b.age_group },
      { label: 'Days', value: (b) => b.schedule_days?.join(' ') },
      { label: 'Start', value: (b) => b.start_time?.slice(0, 5) },
      { label: 'End', value: (b) => b.end_time?.slice(0, 5) },
      { label: 'Capacity', value: (b) => b.capacity },
      { label: 'Status', value: (b) => (b.active ? 'Active' : 'Inactive') },
    ])
  }

  const tabs = moduleTabs(list, 'status', [['', 'All batches'], ['active', 'Active'], ['inactive', 'Inactive']])

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Batches"
        description="Class groups with timing, coach, and center assignment."
        actions={<button className={btnPrimary} onClick={openAddForm}>+ Add batch</button>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {centers.length === 0 && !loading && (
        <p className="text-red-600 mb-4 text-sm">
          No active training centers found. <Link to="/admin/training-centers" className="underline">Add a training center first</Link>.
        </p>
      )}

      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[520px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Batch' : 'New Batch'}</h3>
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
                    className={`text-[0.8rem] px-3.5 py-1.5 font-semibold rounded-full ${
                      form.schedule_days.includes(day)
                        ? 'bg-pay-action text-white border border-pay-action'
                        : 'border border-pay-line text-heading bg-surface hover:bg-pay-sky'
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

      <ListToolbar
        list={list}
        placeholder="Search batch, coach, center…"
        printTitle="Batches"
        onExport={handleExport}
        filters={[
          { key: 'center', label: 'Center', options: centers.map((c) => ({ value: c.id, label: c.name })) },
          { key: 'day', label: 'Training day', options: opts(DAYS) },
        ]}
        sorts={[{ key: 'name', label: 'Name A–Z' }, { key: 'time', label: 'Start time' }, { key: 'center', label: 'Center' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Batches"
          rows={list.result}
          rowAccent={(b) => (b.active ? 'var(--status-ok)' : 'var(--color-pay-line)')}
          empty={list.total === 0 ? 'No batches yet. Add your first one above.' : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'name', header: 'Batch', primary: true, width: '22%', sortValue: (b) => b.name,
              render: (b) => (
                <span className="block leading-tight">
                  <strong className="text-heading">{b.name}</strong>
                  <span className="block text-xs text-subtle">{b.age_group ? `Ages ${b.age_group}` : 'All ages'}</span>
                </span>
              ) },
            { key: 'center', header: 'Centre', sortValue: (b) => b.training_centers?.name, render: (b) => b.training_centers?.name || '—' },
            { key: 'coach', header: 'Coach', sortValue: (b) => b.coaches?.full_name, render: (b) => b.coaches?.full_name || 'Not assigned' },
            { key: 'days', header: 'Days', render: (b) => (b.schedule_days?.length ? (
              <span className="inline-flex flex-wrap gap-1">
                {b.schedule_days.map((d) => <span key={d} className="rounded-md bg-pay-sky text-pay-action px-1.5 py-0.5 text-[0.7rem] font-semibold">{d}</span>)}
              </span>
            ) : '—') },
            { key: 'time', header: 'Time', sortValue: (b) => b.start_time, render: (b) => (b.start_time ? <span className="tabular-nums whitespace-nowrap">{b.start_time.slice(0, 5)}–{b.end_time?.slice(0, 5) || ''}</span> : '—') },
            { key: 'capacity', header: 'Capacity', align: 'right', sortValue: (b) => b.capacity ?? -1, render: (b) => b.capacity ?? '—' },
            { key: 'status', header: 'Status', sortValue: (b) => (b.active ? 0 : 1),
              render: (b) => <StatusPill tone={b.active ? 'ok' : 'neutral'}>{b.active ? 'Active' : 'Inactive'}</StatusPill> },
          ]}
          actions={(b) => (
            <>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(b)}>Edit</button>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleActive(b)}>{b.active ? 'Deactivate' : 'Activate'}</button>
            </>
          )}
        />
      )}
    </div>
  )
}
