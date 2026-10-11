import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import ConfirmDelete from '../../../components/ConfirmDelete'
import { countLinked, deleteError, deleteBtnCls } from '../../../lib/deletes'
import { useAuth } from '../../../context/AuthContext'
import { Trash2 } from 'lucide-react'
import StatStrip from '../../../components/StatStrip'
import FormSheet from '../../../components/FormSheet'
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

  // Delete: super admins only, and only when nothing is linked (otherwise deactivate)
  const { role } = useAuth()
  const [deleting, setDeleting] = useState(null) // { row, linked }
  async function openDelete(row) {
    setDeleting({ row, linked: await countLinked(supabase, row.id, [['students', 'training_center_id', 'Students'], ['batches', 'training_center_id', 'Batches'], ['coaches', 'training_center_id', 'Coaches'], ['admissions', 'training_center_id', 'Admissions'], ['inventory_items', 'training_center_id', 'Equipment items'], ['accounts_transactions', 'training_center_id', 'Account entries']]) })
  }
  async function confirmDelete() {
    const { error } = await supabase.from('training_centers').delete().eq('id', deleting.row.id)
    if (error) return deleteError(error)
    setDeleting(null)
    loadCenters()
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
      <StatStrip loading={loading} items={[
        { label: 'Active centres', value: centers.filter((c) => c.active).length, sub: 'under the association' },
        { label: 'All centres', value: centers.length, sub: 'including inactive', tone: 'gold' },
        { label: 'Inactive', value: centers.filter((c) => !c.active).length, sub: 'kept for history', tone: 'warn' },
      ]} />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {showForm && (
        <FormSheet title={form.id ? 'Edit Center' : 'New Training Center'} subtitle="Training Centres" onClose={() => setShowForm(false)}>
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
        </FormSheet>
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
              {role === 'super_admin' && <button className={`${btnOutline} ${btnSm} ${deleteBtnCls}`} onClick={() => openDelete(c)} aria-label={`Delete ${c.name}`} title="Delete"><Trash2 size={13} /></button>}
            </>
          )}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={`Delete ${deleting.row.name}?`}
          message="This permanently removes the centre."
          linked={deleting.linked}
          blocked={deleting.linked.some((l) => l.n > 0) ? 'Records still use this centre, so it can’t be deleted. Deactivate it instead — it disappears from lists and forms but its history stays.' : undefined}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
