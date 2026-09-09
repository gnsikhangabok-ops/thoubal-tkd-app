import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const ROLES = ['student', 'coach', 'super_admin']
const ROLE_COLOR = { student: '#999', coach: '#D4A537', super_admin: '#B3282D' }

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

export default function Users() {
  const [profiles, setProfiles] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
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

  const filtered = roleFilter ? profiles.filter((p) => p.role === roleFilter) : profiles

  function linkedStudentName(profileId) {
    return students.find((s) => s.profile_id === profileId)?.full_name
  }

  return (
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Users</h1>
      <p className="text-charcoal mb-9">Everyone who has signed up. Assign roles and link students to their portal login.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {linkingFor && (
        <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[460px]">
          <h3 className="font-semibold text-base text-ink mb-1.5">Link Student Record</h3>
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

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-charcoal">No users found.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map((p) => {
            const linked = linkedStudentName(p.id)
            return (
              <div
                key={p.id}
                className="bg-white border border-black/10 p-6"
                style={{ borderTopWidth: 3, borderTopColor: ROLE_COLOR[p.role] }}
              >
                <h3 className="font-semibold text-base text-ink mb-1.5">{p.full_name}</h3>
                <p className="text-sm text-charcoal capitalize">{p.role?.replace('_', ' ')}</p>
                {linked && <p className="text-[0.85rem] mt-1.5">Linked to: {linked}</p>}
                {p.role === 'student' && !linked && (
                  <p className="text-[0.8rem] mt-1.5 text-brand-red">⚠ Not linked to a student record yet</p>
                )}

                <div className="mt-3">
                  <label className="text-[0.75rem] block mb-1 uppercase tracking-wide">Role</label>
                  <select
                    value={p.role}
                    onChange={(e) => updateRole(p, e.target.value)}
                    className="px-2 py-2 border border-black/10 text-[0.85rem] capitalize mb-2.5"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {p.role === 'student' && (
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => openLinkForm(p)}>
                    {linked ? 'Change Link' : 'Link to Student'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
