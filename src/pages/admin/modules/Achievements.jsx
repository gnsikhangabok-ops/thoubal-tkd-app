import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, byDateDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

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


export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [students, setStudents] = useState([])
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



  const list = useListTools(achievements, {
    search: (a) => [a.title, a.description, a.students?.full_name],
    filters: { level: (a) => a.level, medal: (a) => a.medal || 'none' },
    sorts: { newest: byDateDesc((a) => a.achievement_date), title: byText((a) => a.title) },
    defaultSort: 'newest',
  })

  function handleExport() {
    exportCsv('achievements', list.result, [
      { label: 'Date', value: (a) => a.achievement_date },
      { label: 'Title', value: (a) => a.title },
      { label: 'Athlete', value: (a) => a.students?.full_name },
      { label: 'Level', value: (a) => a.level },
      { label: 'Medal', value: (a) => a.medal },
      { label: 'Description', value: (a) => a.description },
    ])
  }

  const tabs = moduleTabs(list, 'level', [['', 'All'], ...LEVELS.map((l) => [l, l.charAt(0).toUpperCase() + l.slice(1)])])

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Achievements"
        description="Medals and award highlights — shown publicly on the website."
        actions={<button className={btnPrimary} onClick={openAddForm}>+ Add achievement</button>}
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[520px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Achievement' : 'New Achievement'}</h3>
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

      <ListToolbar
        list={list}
        placeholder="Search title, athlete…"
        printTitle="Achievements"
        onExport={handleExport}
        filters={[
          { key: 'medal', label: 'Medal', options: opts(MEDALS, { none: 'No medal' }) },
        ]}
        sorts={[{ key: 'newest', label: 'Newest first' }, { key: 'title', label: 'Title A–Z' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Achievements"
          rows={list.result}
          rowAccent={(a) => MEDAL_COLOR[a.medal] || 'var(--color-pay-line)'}
          empty={list.total === 0 ? 'No achievements recorded yet.' : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'title', header: 'Achievement', primary: true, width: '30%', sortValue: (a) => a.title,
              render: (a) => (
                <span className="block leading-tight">
                  <strong className="text-heading">{a.title}</strong>
                  {a.description && <span className="block text-xs text-subtle line-clamp-1">{a.description}</span>}
                </span>
              ) },
            { key: 'athlete', header: 'Athlete', sortValue: (a) => a.students?.full_name, render: (a) => a.students?.full_name || '—' },
            { key: 'level', header: 'Level', sortValue: (a) => LEVELS.indexOf(a.level), render: (a) => <span className="capitalize">{a.level || '—'}</span> },
            { key: 'medal', header: 'Medal', sortValue: (a) => MEDALS.indexOf(a.medal),
              render: (a) => (a.medal && a.medal !== 'none' ? (
                <span className="inline-flex items-center gap-1.5 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: MEDAL_COLOR[a.medal] }} aria-hidden="true" />{a.medal}</span>
              ) : '—') },
            { key: 'date', header: 'Date', sortValue: (a) => a.achievement_date, render: (a) => <span className="tabular-nums whitespace-nowrap">{a.achievement_date || '—'}</span> },
          ]}
          actions={(a) => (
            <>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(a)}>Edit</button>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDelete(a)}>Delete</button>
            </>
          )}
        />
      )}
    </div>
  )
}
