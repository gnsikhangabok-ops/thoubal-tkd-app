import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export default function RulesAndRegulations() {
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rules_and_regulations')
      .select('*')
      .order('version', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setHistory(data)
      setCurrent(data[0] || null)
      setError('')
    }
    setLoading(false)
  }

  function startEditing() {
    setDraft(current?.content || '')
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const nextVersion = current ? current.version + 1 : 1

    const { error } = await supabase
      .from('rules_and_regulations')
      .insert({ version: nextVersion, content: draft })

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setEditing(false)
      loadRules()
    }
  }

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1>Rules &amp; Regulations</h1>
          {!editing && (
            <button className="btn btn-primary" onClick={startEditing}>
              {current ? 'Edit (new version)' : 'Write Rules'}
            </button>
          )}
        </div>
        <p className="dash-lede">
          Shown to students/parents at registration and publicly on the website.
          Saving creates a new version — old versions stay in history.
        </p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        {editing ? (
          <form onSubmit={handleSave} className="module-card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Rules content {current && `(will be saved as version ${current.version + 1})`}
            </label>
            <textarea
              rows={16}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`e.g.\n\n1. Students must wear proper dobok during all training sessions.\n2. Punctuality is mandatory — late arrivals may not join warm-ups.\n3. Respect toward coaches and fellow students is required at all times.\n4. Fee payments are due by the 5th of every month.\n...`}
              style={{ padding: 14, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
              required
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Publish Version'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : loading ? (
          <p>Loading…</p>
        ) : !current ? (
          <p style={{ color: 'var(--charcoal)' }}>No rules published yet. Click "Write Rules" to add the first version.</p>
        ) : (
          <>
            <div className="module-card" style={{ maxWidth: 720, marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '0.8rem', color: 'var(--charcoal)' }}>
                <span>Current version: {current.version}</span>
                <span>Effective from: {current.effective_from}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.7 }}>
                {current.content}
              </div>
            </div>

            {history.length > 1 && (
              <>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Version History</h3>
                <div className="module-grid">
                  {history.slice(1).map((v) => (
                    <div className="module-card" key={v.id} style={{ borderTopColor: '#ccc' }}>
                      <h3>Version {v.version}</h3>
                      <p style={{ fontSize: '0.8rem', marginBottom: 8 }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                        {v.content.slice(0, 120)}{v.content.length > 120 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
