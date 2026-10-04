import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { BELT_RANKS, BELT_LABELS, beltLabel } from '../../../lib/belts'
import { useListTools, exportCsv, byText, byDateDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const emptyForm = {
  id: null,
  full_name: '',
  dob: '',
  gender: '',
  religion: '',
  guardian_name: '',
  guardian_phone: '',
  address: '',
  training_center_id: '',
  batch_id: '',
  current_belt: 'white',
  medical_notes: '',
  active: true,
  rules_acknowledged: false,
}


export default function Students() {
  const [students, setStudents] = useState([])
  const [centers, setCenters] = useState([])
  const [batches, setBatches] = useState([])
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
    const [studentRes, centerRes, batchRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, training_centers(name), batches(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('training_centers')
        .select('id, name')
        .eq('active', true)
        .order('name'),
      supabase
        .from('batches')
        .select('id, name, training_center_id')
        .eq('active', true)
        .order('name'),
    ])

    if (studentRes.error) setError(studentRes.error.message)
    else setStudents(studentRes.data)

    if (centerRes.error) setError((prev) => prev || centerRes.error.message)
    else setCenters(centerRes.data)

    if (batchRes.error) setError((prev) => prev || batchRes.error.message)
    else setBatches(batchRes.data)

    setLoading(false)
  }

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(student) {
    setForm({
      id: student.id,
      full_name: student.full_name,
      dob: student.dob || '',
      gender: student.gender || '',
      religion: student.religion || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      address: student.address || '',
      training_center_id: student.training_center_id || '',
      batch_id: student.batch_id || '',
      current_belt: student.current_belt || 'white',
      medical_notes: student.medical_notes || '',
      active: student.active,
      rules_acknowledged: student.rules_acknowledged || false,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      full_name: form.full_name,
      dob: form.dob || null,
      gender: form.gender || null,
      religion: form.religion || null,
      guardian_name: form.guardian_name || null,
      guardian_phone: form.guardian_phone || null,
      address: form.address || null,
      training_center_id: form.training_center_id || null,
      batch_id: form.batch_id || null,
      current_belt: form.current_belt,
      medical_notes: form.medical_notes || null,
      active: form.active,
      rules_acknowledged: form.rules_acknowledged,
      rules_acknowledged_on: form.rules_acknowledged ? new Date().toISOString() : null,
    }

    const { error } = form.id
      ? await supabase.from('students').update(payload).eq('id', form.id)
      : await supabase.from('students').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadData()
    }
  }

  async function toggleActive(student) {
    const { error } = await supabase
      .from('students')
      .update({ active: !student.active })
      .eq('id', student.id)

    if (error) setError(error.message)
    else loadData()
  }

  const batchesForSelectedCenter = form.training_center_id
    ? batches.filter((b) => b.training_center_id === form.training_center_id)
    : batches

  const list = useListTools(students, {
    search: (s) => [s.full_name, s.guardian_name, s.guardian_phone, s.training_centers?.name, s.batches?.name],
    filters: {
      status: (s) => (s.active ? 'active' : 'inactive'),
      belt: (s) => s.current_belt,
      center: (s) => s.training_center_id,
      rules: (s) => (s.rules_acknowledged ? 'yes' : 'no'),
    },
    sorts: {
      name: byText((s) => s.full_name),
      belt: (a, b) => BELT_RANKS.indexOf(b.current_belt) - BELT_RANKS.indexOf(a.current_belt),
      newest: byDateDesc((s) => s.created_at),
    },
    defaultSort: 'name',
  })
  const filteredStudents = list.result

  function handleExport() {
    exportCsv('students', filteredStudents, [
      { label: 'Name', value: (s) => s.full_name },
      { label: 'Date of birth', value: (s) => s.dob },
      { label: 'Gender', value: (s) => s.gender },
      { label: 'Belt', value: (s) => beltLabel(s.current_belt) },
      { label: 'Training center', value: (s) => s.training_centers?.name },
      { label: 'Batch', value: (s) => s.batches?.name },
      { label: 'Guardian', value: (s) => s.guardian_name },
      { label: 'Guardian phone', value: (s) => s.guardian_phone },
      { label: 'Address', value: (s) => s.address },
      { label: 'Rules acknowledged', value: (s) => (s.rules_acknowledged ? 'Yes' : 'No') },
      { label: 'Status', value: (s) => (s.active ? 'Active' : 'Inactive') },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading">Students / Registration</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ Register Student</button>
      </div>
      <p className="text-muted mb-8">All enrolled athletes across every training center.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {centers.length === 0 && !loading && (
        <p className="text-red-600 mb-4 text-sm">
          No active training centers found. <Link to="/admin/training-centers" className="underline">Add a training center first</Link>.
        </p>
      )}

      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[560px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Student' : 'New Student Registration'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text" placeholder="Full name" required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={inputCls}
            />

            <div className="flex gap-3">
              <input
                type="date" placeholder="Date of birth"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className={`${inputCls} flex-1`}
              />
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={`${inputCls} flex-1`}
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <input
              type="text" placeholder="Religion"
              value={form.religion}
              onChange={(e) => setForm({ ...form, religion: e.target.value })}
              className={inputCls}
            />

            <input
              type="text" placeholder="Guardian name"
              value={form.guardian_name}
              onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
              className={inputCls}
            />
            <input
              type="tel" placeholder="Guardian phone"
              value={form.guardian_phone}
              onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
              className={inputCls}
            />
            <textarea
              placeholder="Address" rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`${inputCls} font-body`}
            />

            <select
              value={form.training_center_id}
              onChange={(e) => setForm({ ...form, training_center_id: e.target.value, batch_id: '' })}
              className={inputCls}
            >
              <option value="">— Select training center —</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={form.batch_id}
              onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
              className={inputCls}
            >
              <option value="">— No batch assigned —</option>
              {batchesForSelectedCenter.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={form.current_belt}
              onChange={(e) => setForm({ ...form, current_belt: e.target.value })}
              className={inputCls}
            >
              {BELT_RANKS.map((b) => (
                <option key={b} value={b}>{BELT_LABELS[b]}</option>
              ))}
            </select>

            <textarea
              placeholder="Medical notes (allergies, conditions coach should know)"
              rows={2}
              value={form.medical_notes}
              onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
              className={`${inputCls} font-body`}
            />

            <label className="text-sm flex items-start gap-2">
              <input
                type="checkbox"
                checked={form.rules_acknowledged}
                onChange={(e) => setForm({ ...form, rules_acknowledged: e.target.checked })}
                className="mt-0.5"
              />
              <span>Guardian/student has read and agreed to the academy's rules & regulations</span>
            </label>

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

      {!showForm && (
        <ListToolbar
          list={list}
          placeholder="Search name, guardian, phone, center…"
          printTitle="Students"
          onExport={handleExport}
          filters={[
            { key: 'status', label: 'Status', options: opts(['active', 'inactive']) },
            { key: 'center', label: 'Center', options: centers.map((c) => ({ value: c.id, label: c.name })) },
            { key: 'belt', label: 'Belt', options: opts(BELT_RANKS, BELT_LABELS) },
            { key: 'rules', label: 'Rules acknowledged', options: opts(['yes', 'no']) },
          ]}
          sorts={[
            { key: 'name', label: 'Name A–Z' },
            { key: 'belt', label: 'Highest belt' },
            { key: 'newest', label: 'Newest first' },
          ]}
        />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : filteredStudents.length === 0 ? (
        <p className="text-muted">No students match your search or filters.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filteredStudents.map((s) => (
            <div
              key={s.id}
              className="bg-surface rounded-2xl shadow-card p-6"
              style={{ borderLeftWidth: 4, borderLeftColor: s.active ? 'var(--status-ok)' : '#ccc' }}
            >
              <h3 className="font-semibold text-base text-heading mb-1.5">{s.full_name}</h3>
              <p className="text-sm text-charcoal">{BELT_LABELS[s.current_belt] || s.current_belt}</p>
              <p className="text-[0.85rem] mt-1.5">
                {s.training_centers?.name || 'No center'} {s.batches?.name ? `· ${s.batches.name}` : ''}
              </p>
              {s.guardian_phone && <p className="text-[0.85rem]">{s.guardian_phone}</p>}
              <p className="text-[0.8rem] mt-1.5" style={{ color: s.rules_acknowledged ? 'var(--color-muted)' : 'var(--status-bad)' }}>
                {s.rules_acknowledged ? '✓ Rules acknowledged' : '⚠ Rules not acknowledged'}
              </p>
              <p className="text-[0.8rem] mt-1" style={{ color: s.active ? 'var(--status-ok)' : '#999' }}>
                {s.active ? 'Active' : 'Inactive'}
              </p>
              <div className="flex gap-2 mt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(s)}>Edit</button>
                <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleActive(s)}>
                  {s.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
