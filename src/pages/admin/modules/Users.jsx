import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

const ROLES = ['student', 'coach', 'super_admin']
const ROLE_COLOR = { student: '#999', coach: 'var(--gold)', super_admin: 'var(--red)' }

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
    setError('')
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profile.id)
      .select()

    if (error) {
      setError(error.message)
    } else if (!data || data.length === 0) {
      setError('Role not updated — this account is not permitted to write to profiles (likely a Supabase RLS policy on the "profiles" table blocking the anon role).')
    } else {
      loadData()
    }
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

    // Unlink any student currently linked to this profile (in case of reassignment)
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
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <h1>Users</h1>
        <p className="dash-lede">Everyone who has signed up. Assign roles and link students to their portal login.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div style={{ marginBottom: 24 }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)' }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {linkingFor && (
          <div className="module-card" style={{ marginBottom: 28, maxWidth: 460 }}>
            <h3 style={{ marginBottom: 6 }}>Link Student Record</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 16, color: 'var(--charcoal)' }}>
              Connect {linkingFor.full_name}'s login to their student profile, so they can see their own attendance, fees, and belt progress.
            </p>
            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                style={{ padding: 10, border: '1px solid var(--line)' }}
              >
                <option value="">— No student linked —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.profile_id && s.profile_id !== linkingFor.id ? ' (already linked to another login)' : ''}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Link'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setLinkingFor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No users found.</p>
        ) : (
          <div className="module-grid">
            {filtered.map((p) => {
              const linked = linkedStudentName(p.id)
              return (
                <div className="module-card" key={p.id} style={{ borderTopColor: ROLE_COLOR[p.role] }}>
                  <h3>{p.full_name}</h3>
                  <p style={{ textTransform: 'capitalize', marginTop: 4 }}>{p.role?.replace('_', ' ')}</p>
                  {linked && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Linked to: {linked}</p>}
                  {p.role === 'student' && !linked && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: 6 }}>⚠ Not linked to a student record yet</p>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Role
                    </label>
                    <select
                      value={p.role}
                      onChange={(e) => updateRole(p, e.target.value)}
                      style={{ padding: 8, border: '1px solid var(--line)', fontSize: '0.85rem', textTransform: 'capitalize', marginBottom: 10 }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {p.role === 'student' && (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => openLinkForm(p)}
                    >
                      {linked ? 'Change Link' : 'Link to Student'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}