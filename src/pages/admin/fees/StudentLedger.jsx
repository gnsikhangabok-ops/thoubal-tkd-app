import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, ReceiptText, MessageCircle, Phone, ArrowUpRight } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { rupees, formatDate } from '../../../lib/documents'
import { initials } from '../../../lib/people'
import { StatusPill } from '../../../components/DataTable'
import { FEE_SELECT, STATUS_TONE, STATUS_COLOR, balance, feeStatus, monthLabel, shortMonth, reminderLink } from '../../../lib/fees'

/** A student's complete fee history: every month, one-time fees, totals and a reminder button. */
export default function StudentLedger({ studentId, refreshKey, onClose, onPay, onReceipt }) {
  const [rows, setRows] = useState(null)
  const [oneTime, setOneTime] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('fee_payments').select(FEE_SELECT).eq('student_id', studentId).order('period_month', { ascending: false }),
      supabase.from('one_time_fee_payments').select('*, one_time_fee_types(name)').eq('student_id', studentId),
    ]).then(([feeRes, otRes]) => {
      if (!active) return
      if (feeRes.error) setError(feeRes.error.message)
      setRows(feeRes.data || [])
      setOneTime(otRes.data || [])
    })
    return () => { active = false }
  }, [studentId, refreshKey])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const student = rows?.[0]?.students
  const outstanding = (rows || []).reduce((s, p) => s + balance(p), 0)
  const paid = (rows || []).reduce((s, p) => s + Number(p.amount_paid || 0), 0) + oneTime.reduce((s, p) => s + Number(p.amount_paid || 0), 0)
  const unpaid = (rows || []).filter((p) => balance(p) > 0)
  const settled = (rows || []).filter((p) => ['paid', 'waived'].includes(feeStatus(p))).length
  const wa = student && outstanding > 0 ? reminderLink(student, outstanding, unpaid.map((p) => shortMonth(p.period_month))) : null
  const last12 = [...(rows || [])].slice(0, 12).reverse()

  return createPortal(
    <div className="clinic paytm !bg-transparent fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Fee history">
      <button type="button" className="absolute inset-0 bg-pay-navy/50 backdrop-blur-[2px] cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative w-full max-w-[520px] h-full bg-pay-bg shadow-2xl flex flex-col animate-[slideIn_.2s_ease-out]">
        <div className="pay-stat !rounded-none !p-5 md:!p-6 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center w-12 h-12 rounded-full bg-white/15 text-white font-bold shrink-0">{initials(student?.full_name || '')}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/75">Fee ledger</p>
              <h2 className="!text-white text-xl font-bold leading-tight truncate">{student?.full_name || 'Loading…'}</h2>
              <p className="text-xs text-white/80 truncate">{[student?.training_centers?.name, student?.batches?.name].filter(Boolean).join(' · ')}</p>
            </div>
            <button type="button" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15" aria-label="Close"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            {[['Outstanding', rupees(outstanding)], ['Paid to date', rupees(paid)], ['Months paid', rows?.length ? `${settled}/${rows.length}` : '—']].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 py-2.5">
                <div className="text-[0.65rem] uppercase tracking-wider text-white/70">{k}</div>
                <strong className="block text-lg tabular-nums">{v}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">
          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${btnPrimary} ${btnSm}`}><MessageCircle size={14} /> WhatsApp reminder</a>}
            {student?.guardian_phone && <a href={`tel:${student.guardian_phone}`} className={`${btnOutline} ${btnSm}`}><Phone size={13} /> {student.guardian_phone}</a>}
            <Link to={`/admin/students/${studentId}`} className={`${btnOutline} ${btnSm}`}>Student file <ArrowUpRight size={13} /></Link>
          </div>

          {last12.length > 0 && (
            <section className="bg-surface rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-heading text-sm">Last {last12.length} months</h3>
              <ol className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(6, last12.length)}, minmax(0, 1fr))` }}>
                {last12.map((p) => {
                  const st = feeStatus(p)
                  return (
                    <li key={p.id} className="text-center" title={`${monthLabel(p.period_month)}: ${st}`}>
                      <span className="block h-2.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />
                      <span className="block text-[0.65rem] text-subtle mt-1">{shortMonth(p.period_month)}</span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          <section className="bg-surface rounded-2xl shadow-card overflow-hidden">
            <h3 className="font-semibold text-heading text-sm px-4 pt-4 pb-2">Monthly fees</h3>
            {rows == null ? <p className="px-4 pb-4 text-sm text-muted">Loading…</p> : rows.length === 0 ? <p className="px-4 pb-4 text-sm text-muted">No monthly fees billed yet.</p> : (
              <ul className="divide-y divide-pay-line">
                {rows.map((p) => {
                  const st = feeStatus(p)
                  return (
                    <li key={p.id} className="px-4 py-3 flex items-center gap-3" style={{ boxShadow: `inset 3px 0 0 ${STATUS_COLOR[st]}` }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-heading">{monthLabel(p.period_month)}</p>
                        <p className="text-xs text-subtle tabular-nums">
                          {rupees(p.amount_paid)} of {rupees(p.amount_due)}{p.paid_on ? ` · ${formatDate(p.paid_on)}` : ''}{p.payment_method ? ` · ${p.payment_method}` : ''}
                        </p>
                      </div>
                      <StatusPill tone={STATUS_TONE[st]}>{st}</StatusPill>
                      {balance(p) > 0
                        ? <button className={`${btnPrimary} ${btnSm}`} onClick={() => onPay(p)}>Collect</button>
                        : Number(p.amount_paid) > 0 && <button className={`${btnOutline} ${btnSm}`} onClick={() => onReceipt(p)} aria-label={`Receipt for ${monthLabel(p.period_month)}`}><ReceiptText size={13} /></button>}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {oneTime.length > 0 && (
            <section className="bg-surface rounded-2xl shadow-card overflow-hidden">
              <h3 className="font-semibold text-heading text-sm px-4 pt-4 pb-2">One-time fees</h3>
              <ul className="divide-y divide-pay-line">
                {oneTime.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-heading font-semibold">{p.one_time_fee_types?.name || 'Fee'}</span>
                    <span className="tabular-nums text-body">{rupees(p.amount_paid)}{p.payment_method ? <span className="text-xs text-subtle"> · {p.payment_method}</span> : null}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
