import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  X, Phone, Mail, MapPin, Pencil, Printer, GraduationCap, CalendarClock, Star, Check, Wallet,
  ArrowRight, Clock, MessageSquarePlus, Ban, PauseCircle, Undo2, HeartPulse, FileCheck2, Trash2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { beltLabel } from '../../../lib/belts'
import { ageFrom } from '../../../lib/people'
import { formatDate, rupees } from '../../../lib/documents'
import { StatusPill } from '../../../components/DataTable'
import {
  STAGE, FUNNEL, NEXT_STEP, SOURCE_LABEL, DOCUMENTS, paymentMethods, applicationNo, netFee, balanceDue,
  readiness, historyEntry, postFeeToAccounts, daysSince, stageSince,
} from '../../../lib/admissions'
import ReadinessRing from './ReadinessRing'
import ConfirmDelete from '../../../components/ConfirmDelete'
import { deleteError } from '../../../lib/deletes'
import { useAuth } from '../../../context/AuthContext'

export const ADMISSION_SELECT = '*, training_centers(name), batches(name)'

export default function AdmissionDrawer({ admission: a, actorName, admissionFeeType, onClose, onChanged, onEdit, onPrint, onDeleted }) {
  const { role } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null) // 'trial' | 'payment' | 'note' | 'close'
  const [trial, setTrial] = useState({ date: a.trial_date || '', rating: a.trial_rating || 0, notes: a.trial_notes || '' })
  const [pay, setPay] = useState({ amount: String(balanceDue(a) || ''), method: a.payment_method || 'Cash', receipt: '' })
  const [note, setNote] = useState('')
  const [closeAs, setCloseAs] = useState('rejected')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function patch(changes, entry, message) {
    setBusy(true)
    setError('')
    const history = entry ? [...(a.history || []), entry] : a.history
    const { data, error } = await supabase.from('admissions').update({ ...changes, history }).eq('id', a.id).select(ADMISSION_SELECT).single()
    setBusy(false)
    if (error) { setError(error.message); return null }
    setPanel(null)
    onChanged(data, message)
    return data
  }

  const moveTo = (status, note) => patch({ status }, historyEntry(status, actorName, note), `Moved to ${STAGE[status].label}`)

  async function saveTrial() {
    const changes = { trial_date: trial.date || null, trial_rating: trial.rating || null, trial_notes: trial.notes || null }
    const toTrial = a.status !== 'trial' && ['applied', 'under_review'].includes(a.status)
    if (toTrial) changes.status = 'trial'
    const note = trial.rating ? `Trial rated ${trial.rating}/5${trial.notes ? ` — ${trial.notes}` : ''}` : trial.date ? `Trial class booked for ${formatDate(trial.date)}` : 'Trial details updated'
    await patch(changes, historyEntry(changes.status || a.status, actorName, note), 'Trial class saved')
  }

  async function recordPayment() {
    const amount = Number(pay.amount) || 0
    if (amount <= 0) return setError('Enter the amount received.')
    if (amount > balanceDue(a)) return setError(`Only ${rupees(balanceDue(a))} is due.`)
    const updated = await patch(
      { amount_paid: Number(a.amount_paid || 0) + amount, payment_method: pay.method, receipt_no: pay.receipt || a.receipt_no, paid_on: new Date().toISOString().slice(0, 10) },
      historyEntry(a.status, actorName, `${rupees(amount)} received by ${pay.method}`),
      `${rupees(amount)} recorded`,
    )
    if (!updated) return
    const { error } = await postFeeToAccounts(updated, amount)
    if (error) setError(`Payment saved, but not posted to Accounts: ${error.message}`)
    // An enrolled student's payment also shows against the admission fee in Fee Setup
    if (updated.student_id && admissionFeeType) {
      await supabase.from('one_time_fee_payments').insert({
        fee_type_id: admissionFeeType.id, student_id: updated.student_id, amount_paid: amount, payment_method: pay.method, receipt_no: pay.receipt || null,
      })
    }
  }

  const toggleDoc = (k) => patch({ documents: { ...a.documents, [k]: !a.documents?.[k] } })

  async function enrol() {
    if (!window.confirm(`Enrol ${a.full_name} as a student? This creates their student record.`)) return
    setBusy(true)
    setError('')
    const { data: student, error } = await supabase.from('students').insert({
      full_name: a.full_name,
      dob: a.dob,
      gender: a.gender,
      guardian_name: a.guardian_name,
      guardian_phone: a.guardian_phone,
      address: a.address,
      training_center_id: a.training_center_id,
      batch_id: a.batch_id,
      current_belt: a.current_belt,
      medical_notes: [a.blood_group && `Blood group ${a.blood_group}`, a.medical_notes].filter(Boolean).join('. ') || null,
      active: true,
      rules_acknowledged: a.rules_acknowledged,
      rules_acknowledged_on: a.rules_acknowledged ? new Date().toISOString() : null,
    }).select('id').single()
    setBusy(false)
    if (error) return setError(`Couldn't create the student: ${error.message}`)

    const updated = await patch({ status: 'enrolled', student_id: student.id }, historyEntry('enrolled', actorName, 'Enrolled — student record created'), `${a.full_name} is now a student`)
    if (!updated) return
    if (Number(a.amount_paid) > 0 && admissionFeeType) {
      await supabase.from('one_time_fee_payments').insert({
        fee_type_id: admissionFeeType.id, student_id: student.id, amount_paid: Number(a.amount_paid), payment_method: a.payment_method, receipt_no: a.receipt_no,
      })
    }
    if (a.enquiry_id) await supabase.from('enquiries').update({ status: 'enrolled' }).eq('id', a.enquiry_id)
  }

  const stage = STAGE[a.status]
  const next = NEXT_STEP[a.status]
  const age = ageFrom(a.dob)
  const score = readiness(a)
  const funnelIndex = FUNNEL.indexOf(a.status)
  const closed = ['enrolled', 'rejected', 'withdrawn'].includes(a.status)

  return createPortal(
    <div className="clinic paytm fixed inset-0 z-[60] flex justify-end !bg-transparent" role="dialog" aria-modal="true" aria-label={`Application ${a.full_name}`}>
      <button type="button" className="absolute inset-0 bg-pay-navy/50 backdrop-blur-[2px] cursor-default" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative w-full max-w-[560px] h-full bg-pay-bg shadow-2xl flex flex-col animate-[slideIn_.2s_ease-out]">
        {/* Header */}
        <div className="pay-stat !rounded-none !p-5 md:!p-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/75 tracking-wider">{applicationNo(a)} · {SOURCE_LABEL[a.source]}</p>
              <h2 className="!text-white text-xl md:text-2xl font-bold leading-tight mt-1 truncate">{a.full_name}</h2>
              <p className="text-sm text-white/85 mt-0.5">
                {[age != null && `${age} yrs`, a.gender, beltLabel(a.current_belt)].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ReadinessRing value={score} size={52} light />
              <button type="button" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15" aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Stage stepper */}
          <ol className="relative mt-5 flex items-center gap-1" aria-label="Admission progress">
            {FUNNEL.map((s, i) => {
              const done = funnelIndex >= 0 && i <= funnelIndex
              return (
                <li key={s} className="flex-1 min-w-0">
                  <div className={`h-1.5 rounded-full ${done ? 'bg-white' : 'bg-white/25'}`} />
                  <span className={`block mt-1.5 text-[0.65rem] truncate ${i === funnelIndex ? 'text-white font-semibold' : 'text-white/65'}`}>{STAGE[s].label}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">
          {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}

          {/* Status + primary actions */}
          <section className="bg-surface rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <StatusPill tone={stage.tone}>{stage.label}</StatusPill>
                <span className="text-xs text-subtle inline-flex items-center gap-1"><Clock size={12} /> {daysSince(stageSince(a))}d in stage</span>
              </div>
              <div className="flex gap-1.5">
                <button className={`${btnOutline} ${btnSm}`} onClick={onPrint}><Printer size={13} /> Form</button>
                {!closed && <button className={`${btnOutline} ${btnSm}`} onClick={onEdit}><Pencil size={13} /> Edit</button>}
              </div>
            </div>
            <p className="text-xs text-muted mt-2">{stage.hint}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {a.status === 'approved' && (
                <button className={btnPrimary} onClick={enrol} disabled={busy}><GraduationCap size={16} /> Enrol as student</button>
              )}
              {next && (
                <button className={a.status === 'approved' ? btnOutline : btnPrimary} disabled={busy}
                  onClick={() => (next === 'trial' ? setPanel('trial') : moveTo(next))}>
                  {next === 'trial' ? <CalendarClock size={16} /> : <ArrowRight size={16} />} {next === 'trial' ? 'Book trial class' : `Move to ${STAGE[next].label}`}
                </button>
              )}
              {['under_review', 'applied'].includes(a.status) && (
                <button className={btnOutline} disabled={busy} onClick={() => moveTo('approved', 'Approved without trial')}><Check size={16} /> Approve directly</button>
              )}
              {a.status === 'enrolled' && a.student_id && (
                <Link to={`/admin/students/${a.student_id}`} className={btnPrimary}><GraduationCap size={16} /> Open student file</Link>
              )}
              {['rejected', 'withdrawn'].includes(a.status) && (
                <button className={btnOutline} disabled={busy} onClick={() => moveTo('under_review', 'Application reopened')}><Undo2 size={16} /> Reopen</button>
              )}
            </div>

            {!closed && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-pay-line text-xs font-semibold">
                {a.status !== 'waitlisted' && <button className="inline-flex items-center gap-1 text-muted hover:text-heading" onClick={() => moveTo('waitlisted', 'Batch full — added to waitlist')}><PauseCircle size={14} /> Waitlist</button>}
                <button className="inline-flex items-center gap-1 text-muted hover:text-[color:var(--status-bad)]" onClick={() => setPanel(panel === 'close' ? null : 'close')}><Ban size={14} /> Reject / withdraw</button>
              </div>
            )}
            {panel === 'close' && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {['rejected', 'withdrawn'].map((s) => (
                    <button key={s} type="button" aria-pressed={closeAs === s} onClick={() => setCloseAs(s)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border ${closeAs === s ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line'}`}>{STAGE[s].label}</button>
                  ))}
                </div>
                <input className={inputCls} placeholder="Reason (kept in the timeline)" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className={`${btnPrimary} self-start`} disabled={busy} onClick={() => moveTo(closeAs, note || undefined).then(() => setNote(''))}>Confirm</button>
              </div>
            )}
          </section>

          {/* Trial */}
          {(panel === 'trial' || a.trial_date || a.status === 'trial') && (
            <section className="bg-surface rounded-2xl shadow-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-heading inline-flex items-center gap-2"><CalendarClock size={16} className="text-pay-action" /> Trial class</h3>
                {panel !== 'trial' && <button className={`${btnOutline} ${btnSm}`} onClick={() => setPanel('trial')}>Update</button>}
              </div>
              {panel === 'trial' ? (
                <div className="mt-3 flex flex-col gap-3">
                  <input type="date" className={inputCls} value={trial.date} onChange={(e) => setTrial({ ...trial, date: e.target.value })} aria-label="Trial date" />
                  <div className="flex items-center gap-1" role="group" aria-label="Coach rating">
                    <span className="text-xs text-muted mr-2">Coach rating</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setTrial({ ...trial, rating: trial.rating === n ? 0 : n })} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={trial.rating >= n}>
                        <Star size={22} className={trial.rating >= n ? 'fill-amber-400 text-amber-400' : 'text-pay-line'} />
                      </button>
                    ))}
                  </div>
                  <textarea rows={2} className={`${inputCls} font-body`} placeholder="Coach's observations — flexibility, focus, attitude…" value={trial.notes} onChange={(e) => setTrial({ ...trial, notes: e.target.value })} />
                  <div className="flex gap-2">
                    <button className={btnPrimary} onClick={saveTrial} disabled={busy}>Save trial</button>
                    <button className={btnOutline} onClick={() => setPanel(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-body">
                  <p>{a.trial_date ? formatDate(a.trial_date) : 'Not booked yet'}</p>
                  {a.trial_rating && <p className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} className={a.trial_rating >= n ? 'fill-amber-400 text-amber-400' : 'text-pay-line'} />)}</p>}
                  {a.trial_notes && <p className="mt-1 text-muted italic">“{a.trial_notes}”</p>}
                </div>
              )}
            </section>
          )}

          {/* Fees */}
          <section className="bg-surface rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-heading inline-flex items-center gap-2"><Wallet size={16} className="text-pay-action" /> Admission fee</h3>
              {balanceDue(a) > 0 && panel !== 'payment' && <button className={`${btnPrimary} ${btnSm}`} onClick={() => setPanel('payment')}>Record payment</button>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[['Net fee', netFee(a)], ['Paid', a.amount_paid], ['Balance', balanceDue(a)]].map(([k, v], i) => (
                <div key={k} className="rounded-xl bg-pay-bg py-2.5">
                  <div className="text-[0.68rem] uppercase tracking-wider text-subtle">{k}</div>
                  <div className={`font-bold tabular-nums ${i === 2 && v > 0 ? 'text-[color:var(--status-warn)]' : 'text-heading'}`}>{rupees(v)}</div>
                </div>
              ))}
            </div>
            {netFee(a) > 0 && (
              <div className="mt-3 h-2 rounded-full bg-pay-line overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-[color:var(--status-ok)]" style={{ width: `${Math.min(100, (Number(a.amount_paid) / netFee(a)) * 100)}%` }} />
              </div>
            )}
            {Number(a.discount) > 0 && <p className="text-xs text-subtle mt-2">Includes a {rupees(a.discount)} discount on {rupees(a.admission_fee)}.</p>}
            {panel === 'payment' && (
              <div className="mt-3 grid sm:grid-cols-3 gap-2">
                <input type="number" min="0" className={inputCls} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} aria-label="Amount" />
                <select className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} aria-label="Method">{paymentMethods().map((m) => <option key={m}>{m}</option>)}</select>
                <input className={inputCls} placeholder="Receipt no." value={pay.receipt} onChange={(e) => setPay({ ...pay, receipt: e.target.value })} />
                <div className="sm:col-span-3 flex gap-2">
                  <button className={btnPrimary} onClick={recordPayment} disabled={busy}>Save payment</button>
                  <button className={btnOutline} onClick={() => setPanel(null)}>Cancel</button>
                </div>
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="bg-surface rounded-2xl shadow-card p-4">
            <h3 className="font-semibold text-heading inline-flex items-center gap-2"><FileCheck2 size={16} className="text-pay-action" /> Documents & consent</h3>
            <ul className="mt-3 flex flex-col gap-1">
              {DOCUMENTS.map(([k, label]) => {
                const on = !!a.documents?.[k]
                return (
                  <li key={k}>
                    <button type="button" disabled={busy || closed} onClick={() => toggleDoc(k)} aria-pressed={on}
                      className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-left hover:bg-pay-bg disabled:hover:bg-transparent">
                      <span className={`grid place-items-center w-5 h-5 rounded-md border ${on ? 'bg-[color:var(--status-ok)] border-transparent text-white' : 'border-pay-line'}`}>{on && <Check size={13} strokeWidth={3} />}</span>
                      <span className={on ? 'text-heading' : 'text-muted'}>{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-2 flex-wrap mt-3">
              <StatusPill tone={a.rules_acknowledged ? 'ok' : 'warn'}>Rules {a.rules_acknowledged ? 'agreed' : 'pending'}</StatusPill>
              <StatusPill tone={a.photo_consent ? 'ok' : 'neutral'}>Photo consent {a.photo_consent ? 'yes' : 'no'}</StatusPill>
            </div>
          </section>

          {/* Details */}
          <section className="bg-surface rounded-2xl shadow-card p-4 text-sm">
            <h3 className="font-semibold text-heading mb-3">Family & training</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                ['Guardian', [a.guardian_name, a.guardian_relation && `(${a.guardian_relation})`].filter(Boolean).join(' ')],
                ['Emergency', a.emergency_phone],
                ['Centre', a.training_centers?.name],
                ['Batch', a.batches?.name],
                ['School', a.school],
                ['Blood group', a.blood_group],
                ['Experience', a.prior_experience],
                ['Applied', formatDate(a.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[0.68rem] uppercase tracking-wider text-subtle">{k}</dt>
                  <dd className="text-body break-words">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2 mt-4">
              {a.guardian_phone && <a href={`tel:${a.guardian_phone}`} className={`${btnOutline} ${btnSm}`}><Phone size={13} /> {a.guardian_phone}</a>}
              {a.guardian_phone && <a href={`https://wa.me/${a.guardian_phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`} target="_blank" rel="noreferrer" className={`${btnOutline} ${btnSm}`}>WhatsApp</a>}
              {a.guardian_email && <a href={`mailto:${a.guardian_email}`} className={`${btnOutline} ${btnSm}`}><Mail size={13} /> Email</a>}
            </div>
            {a.address && <p className="mt-3 text-muted inline-flex gap-1.5"><MapPin size={14} className="shrink-0 mt-0.5" /> {a.address}</p>}
            {a.medical_notes && (
              <p className="mt-3 rounded-xl bg-pay-bg px-3 py-2 text-body inline-flex gap-2"><HeartPulse size={15} className="shrink-0 mt-0.5 text-[color:var(--status-bad)]" /> {a.medical_notes}</p>
            )}
            {a.notes && <p className="mt-3 text-muted italic">Note: {a.notes}</p>}
          </section>

          {/* Timeline */}
          <section className="bg-surface rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-heading">Timeline</h3>
              <button className={`${btnOutline} ${btnSm}`} onClick={() => setPanel(panel === 'note' ? null : 'note')}><MessageSquarePlus size={13} /> Add note</button>
            </div>
            {panel === 'note' && (
              <div className="mt-3 flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="e.g. Called father, visiting Saturday" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className={btnPrimary} disabled={busy || !note.trim()} onClick={() => patch({}, historyEntry(a.status, actorName, note.trim()), 'Note added').then(() => setNote(''))}>Add</button>
              </div>
            )}
            <ol className="mt-4 relative border-l-2 border-pay-line ml-2 flex flex-col gap-4">
              {[...(a.history || [])].reverse().map((h, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-surface" style={{ background: i === 0 ? 'var(--color-pay-action)' : 'var(--color-pay-line)' }} aria-hidden="true" />
                  <p className="text-sm text-heading font-semibold">{STAGE[h.status]?.label}{h.note ? <span className="font-normal text-body"> — {h.note}</span> : null}</p>
                  <p className="text-xs text-subtle">
                    {new Date(h.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {h.by ? ` · ${h.by}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Enrolled applications stay: the student record was created from them */}
          {role === 'super_admin' && a.status !== 'enrolled' && (
            <button type="button" onClick={() => setDeleting(true)} className="self-center inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-600 py-2">
              <Trash2 size={13} /> Delete this application
            </button>
          )}
        </div>
      </div>
      {deleting && (
        <ConfirmDelete
          title={`Delete the application for ${a.full_name}?`}
          message={`For duplicate or test applications. ${Number(a.amount_paid) > 0 ? 'Admission fee income already posted to Accounts is kept.' : ''}`}
          onConfirm={async () => {
            const { error } = await supabase.from('admissions').delete().eq('id', a.id)
            if (error) return deleteError(error)
            onDeleted(a)
          }}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>,
    document.body,
  )
}
