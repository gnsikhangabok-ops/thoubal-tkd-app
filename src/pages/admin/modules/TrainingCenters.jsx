import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

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

  const tabs = moduleTabs(list, 'status', [['', 'All centres'], ['active', 'Active'], ['inactive', 'Inactive']])

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Training Centers"
        description="Branches operating under Thoubal District Taekwondo Association."
        actions={<button className={btnPrimary} onClick={openAddForm}>+ Add center</button>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

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
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Training centres"
          rows={list.result}
          rowAccent={(c) => (c.active ? 'var(--status-ok)' : 'var(--color-pay-line)')}
          empty={list.total === 0 ? 'No training centers yet. Add your first one above.' : 'Nothing matches this view or search.'}
          columns={[
            { key: 'name', header: 'Centre', primary: true, width: '35%', sortValue: (c) => c.name, render: (c) => <strong className="text-heading">{c.name}</strong> },
            { key: 'location', header: 'Location', sortValue: (c) => c.location, render: (c) => c.location || '—' },
            { key: 'status', header: 'Status', sortValue: (c) => (c.active ? 0 : 1),
              render: (c) => <StatusPill tone={c.active ? 'ok' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</StatusPill> },
          ]}
          actions={(c) => (
            <>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(c)}>Edit</button>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleActive(c)}>{c.active ? 'Deactivate' : 'Activate'}</button>
            </>
          )}
        />
      )}
    </div>
  )
}
