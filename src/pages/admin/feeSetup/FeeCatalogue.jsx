import { useMemo, useState } from 'react'
import { Plus, Pencil, Sparkles, Users, Power, X, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { rupees } from '../../../lib/documents'
import { BELT_RANKS, BELT_LABELS, BELT_COLORS, beltLabel } from '../../../lib/belts'
import { useFeeSettings } from '../../../lib/feeSettings'
import { StatusPill } from '../../../components/DataTable'
import { CATEGORIES, CATEGORY, FREQUENCIES, FREQUENCY, TEMPLATES } from '../../../lib/feeCatalogue'

const emptyItem = { id: null, name: '', category: 'admission', amount: '', frequency: 'one_time', belt: '', description: '' }
const migrationHint = (msg) => (/column|category|frequency|belt/i.test(msg) ? `${msg} — run supabase/migrations/20261012_fee_setup.sql first.` : msg)

export default function FeeCatalogue({ items, payments, students, onSaved, onError }) {
  const settings = useFeeSettings()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [templates, setTemplates] = useState(null) // [{ ...template, on, amount }]
  const [collecting, setCollecting] = useState(null) // { item, student_id, amount, method, receipt, query }
  const [paidFor, setPaidFor] = useState(null)
  const [saving, setSaving] = useState(false)

  const shown = items.filter((i) => !filter || (i.category || 'other') === filter)
  const paidBy = useMemo(() => {
    const m = {}
    payments.forEach((p) => { (m[p.fee_type_id] = m[p.fee_type_id] || []).push(p) })
    return m
  }, [payments])

  async function saveItem(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: editing.name.trim(), amount: Number(editing.amount), category: editing.category, frequency: editing.frequency,
      belt: editing.category === 'grading' ? editing.belt || null : null, description: editing.description || null,
    }
    const { error } = editing.id
      ? await supabase.from('one_time_fee_types').update(payload).eq('id', editing.id)
      : await supabase.from('one_time_fee_types').insert({ ...payload, active: true })
    setSaving(false)
    if (error) return onError(migrationHint(error.message))
    setEditing(null)
    onSaved(`${payload.name} saved`)
  }

  async function toggleActive(item) {
    const { error } = await supabase.from('one_time_fee_types').update({ active: item.active === false }).eq('id', item.id)
    if (error) return onError(error.message)
    onSaved(`${item.name} ${item.active === false ? 'turned on' : 'turned off'}`)
  }

  function openTemplates() {
    const have = new Set(items.map((i) => i.name.toLowerCase()))
    setTemplates(TEMPLATES.filter((t) => !have.has(t.name.toLowerCase())).map((t) => ({ ...t, on: true, amount: String(t.amount) })))
  }

  async function addTemplates() {
    const rows = templates.filter((t) => t.on).map(({ name, category, frequency, belt, description, amount }) => ({ name, category, frequency, belt: belt || null, description, amount: Number(amount), active: true }))
    if (!rows.length) return setTemplates(null)
    setSaving(true)
    const { error } = await supabase.from('one_time_fee_types').insert(rows)
    setSaving(false)
    if (error) return onError(migrationHint(error.message))
    setTemplates(null)
    onSaved(`${rows.length} fees added to the catalogue`)
  }

  async function collect(e) {
    e.preventDefault()
    const { item, student_id, amount, method, receipt } = collecting
    const student = students.find((s) => s.id === student_id)
    setSaving(true)
    const { error } = await supabase.from('one_time_fee_payments').insert({ fee_type_id: item.id, student_id, amount_paid: Number(amount), payment_method: method, receipt_no: receipt || null })
    if (error) { setSaving(false); return onError(error.message) }
    const { error: acctError } = await supabase.from('accounts_transactions').insert({
      type: 'income', category: 'student_fee', amount: Number(amount), transaction_date: new Date().toISOString().slice(0, 10),
      training_center_id: student?.training_center_id || null, related_student_id: student_id, description: `${item.name} — ${student?.full_name}`,
    })
    setSaving(false)
    setCollecting(null)
    if (acctError) onError(`Payment recorded, but not posted to Accounts: ${acctError.message}`)
    onSaved(`${rupees(amount)} collected from ${student?.full_name}`)
  }

  // A one-time fee is collected once per student; annual / per-occasion fees can repeat
  const eligible = collecting
    ? students.filter((s) => (collecting.item.frequency && collecting.item.frequency !== 'one_time') || !(paidBy[collecting.item.id] || []).some((p) => p.student_id === s.id))
      .filter((s) => !collecting.query || s.full_name.toLowerCase().includes(collecting.query.toLowerCase()))
    : []

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Category">
          {[['', 'All', items.length], ...CATEGORIES.map((c) => [c.key, c.label, items.filter((i) => (i.category || 'other') === c.key).length])].map(([k, l, n]) => (
            <button key={k || 'all'} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === k ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body hover:bg-pay-bg'}`}>
              {l} <span className="opacity-70">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className={btnOutline} onClick={openTemplates}><Sparkles size={15} /> Add common fees</button>
          <button className={btnPrimary} onClick={() => setEditing({ ...emptyItem, category: filter || 'admission' })}><Plus size={16} /> New fee</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-card p-10 text-center text-sm text-muted">
          No fees here yet. Use <strong>Add common fees</strong> to start from a ready list — admission, annual renewal, uniform, belt gradings and more.
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {shown.map((item) => {
            const cat = CATEGORY[item.category] || CATEGORY.other
            const Icon = cat.icon
            const paid = paidBy[item.id] || []
            const off = item.active === false
            return (
              <article key={item.id} className={`bg-surface rounded-2xl shadow-card p-4 flex flex-col relative overflow-hidden ${off ? 'opacity-60' : ''}`}>
                <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: cat.color }} aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-heading leading-tight">{item.name}</h3>
                    <p className="text-[0.7rem] text-subtle mt-0.5">{cat.label} · {FREQUENCY[item.frequency]?.label || 'One-time'}</p>
                  </div>
                  {off && <StatusPill tone="neutral">Off</StatusPill>}
                </div>
                {item.belt && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-body"><span className="w-3 h-3 rounded-full ring-1 ring-black/15" style={{ background: BELT_COLORS[item.belt] }} />Grading to {beltLabel(item.belt)}</p>
                )}
                {item.description && <p className="text-xs text-muted mt-2 line-clamp-2">{item.description}</p>}
                <p className="text-2xl font-bold text-heading tabular-nums mt-3">{rupees(item.amount)}</p>
                <button type="button" onClick={() => setPaidFor(paidFor === item.id ? null : item.id)} className="mt-1 self-start inline-flex items-center gap-1 text-xs text-muted hover:text-heading">
                  <Users size={12} /> {paid.length} paid · {rupees(paid.reduce((s, p) => s + Number(p.amount_paid || 0), 0))}
                </button>
                {paidFor === item.id && paid.length > 0 && (
                  <ul className="mt-2 max-h-36 overflow-y-auto text-xs divide-y divide-pay-line rounded-lg bg-pay-bg px-2.5">
                    {paid.map((p) => <li key={p.id} className="py-1.5 flex justify-between gap-2"><span className="truncate text-body">{students.find((s) => s.id === p.student_id)?.full_name || p.students?.full_name || 'Student'}</span><span className="tabular-nums text-heading">{rupees(p.amount_paid)}</span></li>)}
                  </ul>
                )}
                <div className="flex gap-1.5 mt-4 pt-3 border-t border-pay-line">
                  {!off && <button className={`${btnPrimary} ${btnSm}`} onClick={() => setCollecting({ item, student_id: '', amount: String(item.amount), method: settings.methods[0] || 'Cash', receipt: '', query: '' })}>Collect</button>}
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => setEditing({ ...emptyItem, ...item, amount: String(item.amount), belt: item.belt || '', description: item.description || '', category: item.category || 'other', frequency: item.frequency || 'one_time' })} aria-label={`Edit ${item.name}`}><Pencil size={12} /> Edit</button>
                  <button className={`${btnOutline} ${btnSm} ml-auto`} onClick={() => toggleActive(item)} aria-label={off ? `Turn on ${item.name}` : `Turn off ${item.name}`} title={off ? 'Turn on' : 'Turn off'}><Power size={12} /></button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* New / edit fee */}
      {editing && (
        <Modal title={editing.id ? 'Edit fee' : 'New fee'} subtitle="Fee catalogue" onClose={() => setEditing(null)}>
          <form onSubmit={saveItem} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-muted">Name</span>
              <input required autoFocus className={inputCls} placeholder="e.g. Admission fee" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <div>
              <span className="text-xs font-semibold text-muted">Category</span>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon
                  const on = editing.category === c.key
                  return (
                    <button key={c.key} type="button" aria-pressed={on} onClick={() => setEditing({ ...editing, category: c.key, frequency: c.frequency })}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[0.68rem] font-semibold text-center ${on ? 'border-pay-action bg-pay-sky text-heading ring-1 ring-pay-action' : 'border-pay-line text-muted hover:bg-pay-bg'}`}>
                      <Icon size={16} style={{ color: c.color }} /> {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-muted">Amount (₹)</span>
                <input type="number" min="0" step="1" required className={inputCls} value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-muted">Charged</span>
                <select className={inputCls} value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}>
                  {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select></label>
            </div>
            {editing.category === 'grading' && (
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-muted">Grading to belt</span>
                <select className={inputCls} value={editing.belt} onChange={(e) => setEditing({ ...editing, belt: e.target.value })}>
                  <option value="">Any belt</option>
                  {BELT_RANKS.filter((b) => b !== 'white').map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                </select></label>
            )}
            <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-muted">Description (optional)</span>
              <textarea rows={2} className={`${inputCls} font-body`} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save fee'}</button>
              <button type="button" className={btnOutline} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Common fees */}
      {templates && (
        <Modal title="Add common fees" subtitle="Tick the fees you charge and adjust the amounts" onClose={() => setTemplates(null)} wide>
          {templates.length === 0 ? <p className="text-sm text-muted">Every common fee is already in your catalogue.</p> : (
            <ul className="flex flex-col gap-1.5 max-h-[55vh] overflow-y-auto -mx-1 px-1">
              {templates.map((t, i) => {
                const cat = CATEGORY[t.category]
                return (
                  <li key={t.name} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${t.on ? 'border-pay-action/40 bg-pay-sky/40' : 'border-pay-line'}`}>
                    <input type="checkbox" checked={t.on} onChange={() => setTemplates(templates.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} aria-label={`Add ${t.name}`} className="w-4 h-4 accent-[var(--color-pay-action)]" />
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.belt ? BELT_COLORS[t.belt] : cat.color }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-heading truncate">{t.name}</span>
                      <span className="block text-[0.68rem] text-subtle">{cat.label} · {FREQUENCY[t.frequency].label}</span>
                    </span>
                    <span className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-subtle">₹</span>
                      <input type="number" min="0" value={t.amount} onChange={(e) => setTemplates(templates.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} aria-label={`${t.name} amount`} className={`${inputCls} w-full !py-1.5 !pl-6 text-sm tabular-nums`} />
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-[0.7rem] text-subtle mt-3">Amounts are a starting point — set them to your academy's actual fees.</p>
          <div className="flex gap-2 mt-4">
            <button className={btnPrimary} onClick={addTemplates} disabled={saving || !templates.some((t) => t.on)}><Check size={16} /> {saving ? 'Adding…' : `Add ${templates.filter((t) => t.on).length} fees`}</button>
            <button className={btnOutline} onClick={() => setTemplates(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Collect */}
      {collecting && (
        <Modal title={`Collect · ${collecting.item.name}`} subtitle={`${rupees(collecting.item.amount)} · ${FREQUENCY[collecting.item.frequency]?.label || 'One-time'}`} onClose={() => setCollecting(null)}>
          <form onSubmit={collect} className="flex flex-col gap-3">
            <input className={inputCls} placeholder="Search student…" value={collecting.query} onChange={(e) => setCollecting({ ...collecting, query: e.target.value })} aria-label="Search student" />
            <select required size={6} className={`${inputCls} !py-1`} value={collecting.student_id} onChange={(e) => setCollecting({ ...collecting, student_id: e.target.value })} aria-label="Student">
              {eligible.map((s) => <option key={s.id} value={s.id} className="py-1">{s.full_name}</option>)}
            </select>
            {eligible.length === 0 && <p className="text-xs text-muted">No students left to collect from{collecting.query ? ' for this search' : ' — everyone has paid'}.</p>}
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="0" required className={inputCls} value={collecting.amount} onChange={(e) => setCollecting({ ...collecting, amount: e.target.value })} aria-label="Amount" />
              <select className={inputCls} value={collecting.method} onChange={(e) => setCollecting({ ...collecting, method: e.target.value })} aria-label="Method">{settings.methods.map((m) => <option key={m}>{m}</option>)}</select>
              <input className={inputCls} placeholder="Receipt no." value={collecting.receipt} onChange={(e) => setCollecting({ ...collecting, receipt: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={saving || !collecting.student_id}>{saving ? 'Saving…' : `Collect ${rupees(collecting.amount)}`}</button>
              <button type="button" className={btnOutline} onClick={() => setCollecting(null)}>Cancel</button>
            </div>
            <p className="text-[0.7rem] text-subtle">Posted to Accounts automatically.</p>
          </form>
        </Modal>
      )}
    </>
  )
}

function Modal({ title, subtitle, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-pay-navy/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${wide ? 'max-w-[560px]' : 'max-w-[460px]'} bg-surface rounded-3xl shadow-2xl overflow-hidden`}>
        <div className="pay-stat !rounded-none !p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-white/75">{subtitle}</p>
            <h2 className="!text-white text-lg font-bold mt-0.5 truncate">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15 shrink-0" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
