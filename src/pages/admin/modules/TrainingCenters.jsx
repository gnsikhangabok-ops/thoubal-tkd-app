import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const emptyForm = { id: null, name: '', location: '', active: true }

export default function TrainingCenters() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCenters()
  }, [])

  async function loadCenters() {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_centers')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setCenters(data)
      setError('')
    }
    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(center) {
    setForm({ id: center.id, name: center.name, location: center.location || '', active: center.active })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (form.id) {
      const { error } = await supabase
        .from('training_centers')
        .update({ name: form.name, location: form.location, active: form.active })
        .eq('id', form.id)

      if (error) setError(error.message)
    } else {
      const { error } = await supabase
        .from('training_centers')
        .insert({ name: form.name, location: form.location, active: form.active })

      if (error) setError(error.message)
    }

    setSaving(false)
    if (!error) {
      setShowForm(false)
      loadCenters()
    }
  }

  async function toggleActive(center) {
    const { error } = await supabase
      .from('training_centers')
      .update({ active: !center.active })
      .eq('id', center.id)

    if (error) {
      setError(error.message)
    } else {
      loadCenters()
    }
  }


  const list = useListTools(centers, {
    search: (c) => [c.name, c.location],
    filters: { status: (c) => (c.active ? 'active' : 'inactive') },
    sorts: { name: byText((c) => c.name) },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv('training-centers', list.result, [
      { label: 'Name', value: (c) => c.name },
      { label: 'Location', value: (c) => c.location },
      { label: 'Status', value: (c) => (c.active ? 'Active' : 'Inactive') },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading">Training Centers</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Add Center</button>
      </div>
      <p className="text-muted mb-8">Branches operating under Thoubal District Taekwondo Association.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Center' : 'New Training Center'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Center name (e.g. Khangabok Main Center)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Location / address"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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
        placeholder="Search center or location…"
        printTitle="Training Centers"
        onExport={handleExport}
        filters={[{ key: 'status', label: 'Status', options: opts(['active', 'inactive']) }]}
      />

      {loading ? (
        <p>Loading…</p>
      ) : list.result.length === 0 ? (
        <p className="text-muted">{list.total === 0 ? <>No training centers yet. Add your first one above.</> : 'Nothing matches your search or filters.'}</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.result.map((c) => (
            <div
              key={c.id}
              className="bg-surface rounded-2xl shadow-card p-6"
              style={{ borderLeftWidth: 4, borderLeftColor: c.active ? 'var(--status-ok)' : '#ccc' }}
            >
              <h3 className="font-semibold text-base text-heading mb-1.5">{c.name}</h3>
              <p className="text-sm text-charcoal">{c.location || 'No location set'}</p>
              <p className="text-[0.8rem] mt-2" style={{ color: c.active ? 'var(--status-ok)' : '#999' }}>
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
