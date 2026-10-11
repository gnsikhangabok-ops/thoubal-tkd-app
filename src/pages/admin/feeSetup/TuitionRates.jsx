import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Pencil, Layers, Trash2 } from 'lucide-react'
import ConfirmDelete from '../../../components/ConfirmDelete'
import { deleteError } from '../../../lib/deletes'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { rupees, formatDate } from '../../../lib/documents'
import { monthFirst, monthLabel, ratesFor } from '../../../lib/fees'

const today = () => new Date().toISOString().slice(0, 10)
import DataTable, { StatusPill } from '../../../components/DataTable'

export default function TuitionRates({ batches, structures, students, onSaved, onError }) {
  const [selected, setSelected] = useState(() => new Set())
  const [editing, setEditing] = useState(null) // { ids, amount, from }
  const [historyFor, setHistoryFor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null) // a fee_structures row

  const count = (id) => students.filter((s) => s.batch_id === id).length
  const rows = batches.map((b) => ({ ...b, ...ratesFor(structures, b.id), students: count(b.id) }))
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  function open(ids) {
    const first = rows.find((r) => r.id === ids[0])
    setEditing({ ids, amount: ids.length === 1 && first?.current ? String(first.current.monthly_amount) : '', from: monthFirst() })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('fee_structures').insert(
      editing.ids.map((id) => ({ batch_id: id, monthly_amount: Number(editing.amount), effective_from: editing.from })),
    )
    setSaving(false)
    if (error) return onError(error.message)
    setEditing(null)
    setSelected(new Set())
    onSaved(`Rate set for ${editing.ids.length} batch${editing.ids.length === 1 ? '' : 'es'}`)
  }

  if (batches.length === 0) {
    return <div className="bg-surface rounded-2xl shadow-card p-8 text-center text-sm text-muted">No active batches yet. <Link to="/admin/batches" className="underline text-pay-action">Add a batch</Link> first.</div>
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="text-sm text-muted max-w-[70ch]">The monthly fee for each batch. A new rate takes effect from the month you choose; months already billed keep their amount. Rates feed the <Link to="/admin/fees" className="underline">collection desk</Link>.</p>
        {selected.size > 0 && <button className={btnPrimary} onClick={() => open([...selected])}><Layers size={16} /> Set rate for {selected.size} batches</button>}
      </div>

      <DataTable
        caption="Monthly tuition by batch"
        rows={rows}
        rowAccent={(r) => (r.current ? 'var(--status-ok)' : 'var(--status-warn)')}
        columns={[
          { key: 'select', hideOnMobile: true, width: '40px',
            header: <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Select all batches" className="w-4 h-4 accent-[var(--color-pay-action)]" />,
            render: (r) => <input type="checkbox" checked={selected.has(r.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n })} aria-label={`Select ${r.name}`} className="w-4 h-4 accent-[var(--color-pay-action)]" /> },
          { key: 'batch', header: 'Batch', primary: true, sortValue: (r) => r.name,
            render: (r) => <span className="block leading-tight"><strong className="text-heading">{r.name}</strong><span className="block text-xs text-subtle">{r.training_centers?.name || '—'}</span></span> },
          { key: 'students', header: 'Students', align: 'right', sortValue: (r) => r.students, render: (r) => r.students },
          { key: 'rate', header: 'Monthly fee', align: 'right', sortValue: (r) => Number(r.current?.monthly_amount ?? -1),
            render: (r) => r.current
              ? <span className="block leading-tight"><strong className="text-heading text-base tabular-nums">{rupees(r.current.monthly_amount)}</strong>{r.current.effective_from && <span className="block text-[0.68rem] text-subtle">since {formatDate(r.current.effective_from)}</span>}</span>
              : <StatusPill tone="warn">Not set</StatusPill> },
          { key: 'next', header: 'Scheduled', hideOnMobile: true,
            render: (r) => r.upcoming ? <span className="text-xs"><strong className="text-heading">{rupees(r.upcoming.monthly_amount)}</strong> from {monthLabel(r.upcoming.effective_from)}</span> : <span className="text-subtle">—</span> },
          { key: 'projection', header: 'Per month', align: 'right', sortValue: (r) => r.students * Number(r.current?.monthly_amount || 0),
            render: (r) => <span className="tabular-nums">{r.current ? rupees(r.students * Number(r.current.monthly_amount)) : '—'}</span> },
        ]}
        actions={(r) => (
          <>
            <button className={`${btnPrimary} ${btnSm}`} onClick={() => open([r.id])}><Pencil size={12} /> {r.current ? 'Change' : 'Set rate'}</button>
            {r.history.length > 0 && <button className={`${btnOutline} ${btnSm}`} onClick={() => setHistoryFor(historyFor === r.id ? null : r.id)} aria-label={`Rate history for ${r.name}`} title="Rate history"><History size={13} /></button>}
          </>
        )}
      />

      {historyFor && (() => {
        const r = rows.find((x) => x.id === historyFor)
        return (
          <section className="bg-surface rounded-2xl shadow-card p-5 mt-4 max-w-[520px]">
            <h3 className="font-semibold text-heading">Rate history · {r.name}</h3>
            <ol className="mt-3 relative border-l-2 border-pay-line ml-2 flex flex-col gap-3">
              {r.history.map((h, i) => (
                <li key={h.id || i} className="pl-4 relative text-sm">
                  <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full" style={{ background: h === r.current ? 'var(--status-ok)' : 'var(--color-pay-line)' }} />
                  <strong className="text-heading tabular-nums">{rupees(h.monthly_amount)}</strong>
                  <span className="text-muted"> from {h.effective_from ? formatDate(h.effective_from) : 'the start'}</span>
                  {h === r.current && <span className="ml-2"><StatusPill tone="ok">current</StatusPill></span>}
                  {h.effective_from > today() && <span className="ml-2"><StatusPill tone="info">scheduled</StatusPill></span>}
                  <button type="button" onClick={() => setDeleting({ ...h, batch: r.name })} className="ml-2 align-middle inline-grid place-items-center w-6 h-6 rounded-full text-subtle hover:text-red-600 hover:bg-red-50" aria-label={`Delete the ${rupees(h.monthly_amount)} rate`} title="Delete this rate"><Trash2 size={12} /></button>
                </li>
              ))}
            </ol>
          </section>
        )
      })()}

      {deleting && (
        <ConfirmDelete
          title={`Delete the ${rupees(deleting.monthly_amount)} rate for ${deleting.batch}?`}
          message={deleting.effective_from > today()
            ? 'Cancels this scheduled fee revision. The current rate stays in force.'
            : 'Use this for a rate entered by mistake. Months already billed keep their amounts; future bills use the next most recent rate.'}
          onConfirm={async () => {
            const { error } = await supabase.from('fee_structures').delete().eq('id', deleting.id)
            if (error) return deleteError(error)
            setDeleting(null)
            onSaved('Rate deleted')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
      {editing && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-pay-navy/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Set monthly rate">
          <form onSubmit={save} className="w-full max-w-[420px] bg-surface rounded-3xl shadow-2xl overflow-hidden">
            <div className="pay-stat !rounded-none !p-5">
              <p className="text-xs text-white/75">Monthly tuition</p>
              <h2 className="!text-white text-lg font-bold mt-0.5">{editing.ids.length === 1 ? rows.find((r) => r.id === editing.ids[0])?.name : `${editing.ids.length} batches`}</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Fee per month (₹)</span>
                <input type="number" min="0" step="1" required autoFocus className={`${inputCls} text-xl font-bold`} value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Takes effect from</span>
                <input type="month" required className={inputCls} value={editing.from.slice(0, 7)} onChange={(e) => e.target.value && setEditing({ ...editing, from: `${e.target.value}-01` })} />
                <span className="text-[0.7rem] text-subtle">Months already billed keep their amount. Choose a later month to schedule a fee revision.</span>
              </label>
              <div className="flex gap-2">
                <button className={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save rate'}</button>
                <button type="button" className={btnOutline} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
