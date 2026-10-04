import { useEffect, useState } from 'react'
import { Pin, PinOff, Megaphone } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byDateDesc, opts } from '../../../lib/listTools'
import { formatDate } from '../../../lib/documents'
import ListToolbar from '../../../components/ListToolbar'

const emptyForm = { id: null, title: '', body: '', pinned: false }

// Pinned first, then newest
const noticeOrder = (a, b) => (Boolean(b.pinned) === Boolean(a.pinned) ? byDateDesc((n) => n.created_at)(a, b) : b.pinned ? 1 : -1)

export default function Notices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadNotices() {
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setNotices(data)
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    loadNotices()
  }, [])

  function openAddForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(n) {
    setForm({ id: n.id, title: n.title || '', body: n.body || '', pinned: Boolean(n.pinned) })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { title: form.title.trim(), body: form.body.trim(), pinned: form.pinned }
    const { error } = form.id
      ? await supabase.from('notices').update(payload).eq('id', form.id)
      : await supabase.from('notices').insert(payload)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setShowForm(false)
      loadNotices()
    }
  }

  async function togglePin(n) {
    const { error } = await supabase.from('notices').update({ pinned: !n.pinned }).eq('id', n.id)
    if (error) setError(error.message)
    else loadNotices()
  }

  async function handleDelete(n) {
    if (!confirm(`Delete the notice "${n.title}"? Students will no longer see it.`)) return
    const { error } = await supabase.from('notices').delete().eq('id', n.id)
    if (error) setError(error.message)
    else loadNotices()
  }

  const list = useListTools(notices, {
    search: (n) => [n.title, n.body],
    filters: { pinned: (n) => (n.pinned ? 'pinned' : 'not_pinned') },
    sorts: { default: noticeOrder, newest: byDateDesc((n) => n.created_at) },
    defaultSort: 'default',
  })

  function handleExport() {
    exportCsv('notices', list.result, [
      { label: 'Posted', value: (n) => n.created_at?.slice(0, 10) },
      { label: 'Title', value: (n) => n.title },
      { label: 'Notice', value: (n) => n.body },
      { label: 'Pinned', value: (n) => (n.pinned ? 'Yes' : 'No') },
    ])
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading">Notices</h1>
        <button className={btnPrimary} onClick={openAddForm}>+ New Notice</button>
      </div>
      <p className="text-muted mb-8">Announcements shown to students and parents in their portal. Pinned notices stay at the top.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {showForm && (
        <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[620px]">
          <h3 className="font-semibold text-base text-heading mb-4">{form.id ? 'Edit Notice' : 'New Notice'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text" placeholder="Title (e.g. Belt grading on 20 October)" required maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
            <textarea
              placeholder="Notice text" rows={5} required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className={`${inputCls} font-body`}
            />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              Pin to the top of the student portal
            </label>
            <div className="flex gap-2.5 mt-1">
              <button type="submit" className={btnPrimary} disabled={saving}>{saving ? 'Publishing…' : form.id ? 'Save changes' : 'Publish notice'}</button>
              <button type="button" className={btnOutline} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <ListToolbar
          list={list}
          placeholder="Search notices…"
          printTitle="Notices"
          onExport={handleExport}
          filters={[{ key: 'pinned', label: 'Pinned', options: opts(['pinned', 'not_pinned']) }]}
          sorts={[{ key: 'default', label: 'Pinned first' }, { key: 'newest', label: 'Newest first' }]}
        />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : list.result.length === 0 ? (
        <p className="text-muted">{list.total === 0 ? 'No notices yet. Publish your first one above.' : 'Nothing matches your search or filters.'}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.result.map((n) => (
            <article
              key={n.id}
              className="bg-surface rounded-2xl shadow-card p-5 flex gap-4"
              style={{ borderLeftWidth: 4, borderLeftColor: n.pinned ? 'var(--status-warn)' : 'var(--status-info)' }}
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-pay-sky text-pay-action shrink-0">
                {n.pinned ? <Pin size={18} /> : <Megaphone size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base text-heading">{n.title}</h3>
                  {n.pinned && <span className="rounded-full bg-pay-sky text-pay-action text-[0.7rem] font-semibold px-2 py-0.5">Pinned</span>}
                </div>
                <p className="text-sm text-body mt-1 whitespace-pre-wrap">{n.body}</p>
                <p className="text-xs text-subtle mt-2">Posted {formatDate(n.created_at)}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditForm(n)}>Edit</button>
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => togglePin(n)}>
                    {n.pinned ? <><PinOff size={13} /> Unpin</> : <><Pin size={13} /> Pin</>}
                  </button>
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => handleDelete(n)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
