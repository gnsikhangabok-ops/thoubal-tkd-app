import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="font-display text-ink uppercase text-3xl">Rules &amp; Regulations</h1>
        {!editing && (
          <button className={btnPrimary} onClick={startEditing}>
            {current ? 'Edit (new version)' : 'Write Rules'}
          </button>
        )}
      </div>
      <p className="text-charcoal mb-9">
        Shown to students/parents at registration and publicly on the website.
        Saving creates a new version — old versions stay in history.
      </p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 max-w-[720px] flex flex-col gap-3.5">
          <label className="text-[0.85rem] font-semibold">
            Rules content {current && `(will be saved as version ${current.version + 1})`}
          </label>
          <textarea
            rows={16}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`e.g.\n\n1. Students must wear proper dobok during all training sessions.\n2. Punctuality is mandatory — late arrivals may not join warm-ups.\n3. Respect toward coaches and fellow students is required at all times.\n4. Fee payments are due by the 5th of every month.\n...`}
            className="p-3.5 border border-black/10 font-body text-[0.95rem] leading-relaxed resize-y"
            required
          />
          <div className="flex gap-2.5">
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : 'Publish Version'}
            </button>
            <button type="button" className={btnOutline} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : loading ? (
        <p>Loading…</p>
      ) : !current ? (
        <p className="text-charcoal">No rules published yet. Click "Write Rules" to add the first version.</p>
      ) : (
        <>
          <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 max-w-[720px] mb-7">
            <div className="flex justify-between mb-3.5 text-[0.8rem] text-charcoal">
              <span>Current version: {current.version}</span>
              <span>Effective from: {current.effective_from}</span>
            </div>
            <div className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">
              {current.content}
            </div>
          </div>

          {history.length > 1 && (
            <>
              <h3 className="text-lg font-display uppercase text-ink mb-3">Version History</h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {history.slice(1).map((v) => (
                  <div key={v.id} className="bg-white border border-black/10 border-t-[3px] border-t-[#ccc] p-6">
                    <h3 className="font-semibold text-base text-ink mb-1.5">Version {v.version}</h3>
                    <p className="text-[0.8rem] mb-2">
                      {new Date(v.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[0.85rem] text-charcoal">
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
  )
}
