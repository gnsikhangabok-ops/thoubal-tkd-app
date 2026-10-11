import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X, AlertTriangle, Power, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { btnOutline, inputCls } from '../lib/adminUi'
import { PHOTO_BUCKET } from '../lib/studentPhotos'

// Records that belong to a student and go with them. The accounts ledger is kept (only unlinked).
const LINKED = [
  ['attendance', 'Attendance marks'],
  ['fee_payments', 'Monthly fee records'],
  ['one_time_fee_payments', 'One-time fee payments'],
  ['grading_results', 'Belt grading results'],
  ['student_performance', 'Performance assessments'],
  ['achievements', 'Achievements'],
  ['event_registrations', 'Event registrations'],
  ['inventory_issued', 'Equipment issued'],
]
// A table this install doesn't have is simply skipped
const missingTable = (e) => e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|could not find the table/i.test(e.message || ''))

/**
 * Permanently delete a student. Shows what is linked to them, recommends deactivating when there
 * is history, and asks for the name to be typed. Accounts entries stay, unlinked from the student.
 */
export default function DeleteStudentDialog({ student, onClose, onDeleted, onDeactivate }) {
  const [counts, setCounts] = useState(null) // [{ table, label, n }]
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all(LINKED.map(([table, label]) =>
      supabase.from(table).select('*', { count: 'exact', head: true }).eq('student_id', student.id)
        .then(({ count, error }) => ({ table, label, n: missingTable(error) ? 0 : count || 0 })),
    )).then((rows) => { if (active) setCounts(rows) })
    return () => { active = false }
  }, [student.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const linked = (counts || []).filter((c) => c.n > 0)
  const total = linked.reduce((s, c) => s + c.n, 0)
  const confirmed = typed.trim().toLowerCase() === student.full_name.trim().toLowerCase()

  async function remove() {
    setBusy(true)
    setError('')
    try {
      // Keep the money ledger: unlink the student's income entries instead of deleting them
      const { data: feeRows } = await supabase.from('fee_payments').select('id').eq('student_id', student.id)
      const feeIds = (feeRows || []).map((f) => f.id)
      let res = await supabase.from('accounts_transactions').update({ related_student_id: null, related_fee_payment_id: null }).eq('related_student_id', student.id)
      if (res.error && !missingTable(res.error)) throw res.error
      if (feeIds.length) {
        res = await supabase.from('accounts_transactions').update({ related_fee_payment_id: null }).in('related_fee_payment_id', feeIds)
        if (res.error && !missingTable(res.error)) throw res.error
      }
      for (const { table, n } of linked) {
        if (!n) continue
        res = await supabase.from(table).delete().eq('student_id', student.id)
        if (res.error && !missingTable(res.error)) throw res.error
      }
      res = await supabase.from('students').delete().eq('id', student.id)
      if (res.error) throw res.error
      if (student.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([student.photo_path])
      onDeleted(student)
    } catch (e) {
      setBusy(false)
      setError(/foreign key|violates/i.test(e.message || '')
        ? `${e.message}. Another record still points at this student — deactivate them instead, or remove that record first.`
        : e.message)
    }
  }

  return createPortal(
    <div className="clinic paytm !bg-pay-navy/60 fixed inset-0 z-[70] grid place-items-center p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
      <div className="w-full max-w-[480px] bg-surface rounded-3xl shadow-2xl overflow-hidden animate-[slideIn_.18s_ease-out]">
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-red-50 text-red-600 shrink-0"><Trash2 size={22} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="del-title" className="text-lg font-bold text-heading">Delete {student.full_name}?</h2>
            <p className="text-sm text-muted mt-0.5">This permanently removes the student and can't be undone.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg shrink-0" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {counts == null ? <p className="text-sm text-muted">Checking linked records…</p> : linked.length > 0 ? (
            <>
              <div className="rounded-2xl border border-pay-line bg-pay-bg p-4">
                <p className="text-sm font-semibold text-heading inline-flex items-center gap-2"><AlertTriangle size={16} className="text-[color:var(--status-warn)]" /> {total} linked record{total === 1 ? '' : 's'} will also be deleted</p>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {linked.map((c) => <li key={c.table} className="flex justify-between gap-2 text-body"><span className="truncate">{c.label}</span><strong className="tabular-nums text-heading">{c.n}</strong></li>)}
                </ul>
                <p className="text-xs text-subtle mt-3">Income already posted to Accounts is kept, no longer linked to the student.</p>
              </div>
              {student.active && onDeactivate && (
                <div className="rounded-2xl border border-[var(--gold,var(--color-pay-line))] bg-pay-sky/40 p-4 flex items-start gap-3">
                  <Power size={18} className="text-pay-action shrink-0 mt-0.5" />
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-semibold text-heading">Recommended: deactivate instead</p>
                    <p className="text-muted text-xs mt-0.5">Hides them from registers and billing but keeps their history, receipts and certificates.</p>
                    <button type="button" className={`${btnOutline} !px-4 !py-1.5 !text-xs mt-2`} onClick={() => onDeactivate(student)} disabled={busy}>Deactivate {student.full_name.split(' ')[0]}</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-body rounded-2xl bg-pay-bg p-4">No attendance, fees or other records are linked to this student.</p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Type <strong className="text-heading">{student.full_name}</strong> to confirm</span>
            <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
          </label>

          {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm inline-flex gap-2"><ShieldAlert size={16} className="shrink-0 mt-0.5" />{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={remove} disabled={!confirmed || busy || counts == null}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 size={15} /> {busy ? 'Deleting…' : linked.length ? 'Delete student and records' : 'Delete student'}
            </button>
            <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
