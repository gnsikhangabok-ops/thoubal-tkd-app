import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'
import PersonCell from '../../../components/PersonCell'

const ROLES = ['student', 'coach', 'super_admin']
const ROLE_COLOR = { student: '#999', coach: '#D4A537', super_admin: 'var(--status-bad)' }


export default function Users() {
  const [profiles, setProfiles] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkingFor, setLinkingFor] = useState(null)
  const [linkStudentId, setLinkStudentId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [profileRes, studentRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('students').select('id, full_name, profile_id').order('full_name'),
    ])

    if (profileRes.error) setError(profileRes.error.message)
    else setProfiles(profileRes.data)

    if (studentRes.error) setError((prev) => prev || studentRes.error.message)
    else setStudents(studentRes.data)

    setLoading(false)
  }

  async function updateRole(profile, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profile.id)

    if (error) setError(error.message)
    else loadData()
  }

  function openLinkForm(profile) {
    setLinkingFor(profile)
    const existing = students.find((s) => s.profile_id === profile.id)
    setLinkStudentId(existing?.id || '')
  }

  async function handleLinkSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const currentlyLinked = students.find((s) => s.profile_id === linkingFor.id)
    if (currentlyLinked && currentlyLinked.id !== linkStudentId) {
      await supabase.from('students').update({ profile_id: null }).eq('id', currentlyLinked.id)
    }

    if (linkStudentId) {
      const { error } = await supabase
        .from('students')
        .update({ profile_id: linkingFor.id })
        .eq('id', linkStudentId)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setLinkingFor(null)
    loadData()
  }


  function linkedStudentName(profileId) {
    return students.find((s) => s.profile_id === profileId)?.full_name
  }


  const list = useListTools(profiles, {
    search: (p) => [p.full_name, linkedStudentName(p.id)],
    filters: {
      role: (p) => p.role,
      linked: (p) => (students.some((s) => s.profile_id === p.id) ? 'linked' : 'not_linked'),
    },
    sorts: { name: byText((p) => p.full_name), role: byText((p) => p.role) },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv('users', list.result, [
      { label: 'Name', value: (p) => p.full_name },
      { label: 'Role', value: (p) => p.role },
      { label: 'Linked student', value: (p) => linkedStudentName(p.id) },
    ])
  }

  const tabs = moduleTabs(list, 'role', [['', 'All users'], ['super_admin', 'Super admins'], ['coach', 'Coaches'], ['student', 'Students']])

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Users"
        description="Everyone who has signed up. Assign roles and link students to their portal login."
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {linkingFor && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-heading mb-1.5">Link Student Record</h3>
          <p className="text-[0.85rem] mb-4 text-charcoal">
            Connect {linkingFor.full_name}'s login to their student profile, so they can see their own attendance, fees, and belt progress.
          </p>
          <form onSubmit={handleLinkSubmit} className="flex flex-col gap-3">
            <select
              value={linkStudentId}
              onChange={(e) => setLinkStudentId(e.target.value)}
              className={inputCls}
            >
              <option value="">— No student linked —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.profile_id && s.profile_id !== linkingFor.id ? ' (already linked to another login)' : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2.5">
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Save Link'}
              </button>
              <button type="button" className={btnOutline} onClick={() => setLinkingFor(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ListToolbar
        list={list}
        placeholder="Search users…"
        printTitle="Users"
        onExport={handleExport}
        filters={[
          { key: 'linked', label: 'Student record', options: opts(['linked', 'not_linked']) },
        ]}
        sorts={[{ key: 'name', label: 'Name A–Z' }, { key: 'role', label: 'Role' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Users"
          rows={list.result}
          rowAccent={(p) => ROLE_COLOR[p.role]}
          empty={list.total === 0 ? 'No users found.' : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'name', header: 'User', primary: true, width: '30%', sortValue: (p) => p.full_name, render: (p) => <PersonCell name={p.full_name || '(no name)'} sub={p.role?.replace('_', ' ')} /> },
            { key: 'role', header: 'Role', sortValue: (p) => ROLES.indexOf(p.role),
              render: (p) => (
                <select
                  value={p.role}
                  onChange={(e) => updateRole(p, e.target.value)}
                  aria-label={`Role for ${p.full_name}`}
                  className="rounded-lg border border-pay-line bg-surface px-2 py-1 text-sm capitalize text-heading"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              ) },
            { key: 'linked', header: 'Student record',
              render: (p) => {
                const linked = linkedStudentName(p.id)
                if (p.role !== 'student') return <span className="text-subtle">—</span>
                return linked ? <StatusPill tone="ok">{linked}</StatusPill> : <StatusPill tone="warn">Not linked</StatusPill>
              } },
          ]}
          actions={(p) => p.role === 'student' && (
            <button className={`${btnOutline} ${btnSm}`} onClick={() => openLinkForm(p)}>{linkedStudentName(p.id) ? 'Change link' : 'Link to student'}</button>
          )}
        />
      )}
    </div>
  )
}
