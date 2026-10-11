import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, X, User, Users, Dumbbell, HeartPulse, Wallet, ClipboardCheck } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline } from '../../../lib/adminUi'
import { BELT_RANKS, BELT_LABELS, beltLabel } from '../../../lib/belts'
import { ageFrom } from '../../../lib/people'
import { rupees } from '../../../lib/documents'
import { SOURCES, SOURCE_LABEL, DOCUMENTS, BLOOD_GROUPS, paymentMethods, historyEntry, postFeeToAccounts } from '../../../lib/admissions'

const STEPS = [
  { key: 'applicant', label: 'Applicant', icon: User },
  { key: 'guardian', label: 'Guardian', icon: Users },
  { key: 'training', label: 'Training', icon: Dumbbell },
  { key: 'health', label: 'Health & docs', icon: HeartPulse },
  { key: 'fees', label: 'Fees & consent', icon: Wallet },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
]

const Field = ({ label, children, hint, span }) => (
  <label className={`flex flex-col gap-1.5 ${span ? 'sm:col-span-2' : ''}`}>
    <span className="text-xs font-semibold text-muted">{label}</span>
    {children}
    {hint && <span className="text-[0.7rem] text-subtle">{hint}</span>}
  </label>
)

/**
 * Six-step admission application. `initial` pre-fills the form (new, from an enquiry, or editing).
 * Saving creates/updates the admissions row; money collected now is posted to Accounts.
 */
export default function AdmissionWizard({ initial, centers, batches, monthlyRate, actorName, onCancel, onSaved }) {
  const [form, setForm] = useState(initial)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const editing = !!form.id

  const batchesForCenter = form.training_center_id ? batches.filter((b) => b.training_center_id === form.training_center_id) : batches
  const net = Math.max(0, (Number(form.admission_fee) || 0) - (Number(form.discount) || 0))
  const rate = form.batch_id ? monthlyRate(form.batch_id) : null
  const age = ageFrom(form.dob)

  // Minimum needed to move on from each step
  const stepError = [
    !form.full_name.trim() && 'Enter the applicant’s full name.',
    !form.guardian_phone.trim() && 'A guardian phone number is required so the academy can reach the family.',
    !form.training_center_id && 'Choose the training centre the applicant will join.',
    null,
    (Number(form.collect_now) || 0) > net && 'Amount collected can’t be more than the net fee.',
    null,
  ][step]

  function next() {
    if (stepError) return setError(stepError)
    setError('')
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const collect = editing ? 0 : Number(form.collect_now) || 0
    const payload = {
      source: form.source,
      enquiry_id: form.enquiry_id || null,
      full_name: form.full_name.trim(),
      dob: form.dob || null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      school: form.school || null,
      guardian_name: form.guardian_name || null,
      guardian_relation: form.guardian_relation || null,
      guardian_phone: form.guardian_phone || null,
      guardian_email: form.guardian_email || null,
      emergency_phone: form.emergency_phone || null,
      address: form.address || null,
      training_center_id: form.training_center_id || null,
      batch_id: form.batch_id || null,
      current_belt: form.current_belt,
      prior_experience: form.prior_experience || null,
      medical_notes: form.medical_notes || null,
      documents: form.documents,
      admission_fee: Number(form.admission_fee) || 0,
      discount: Number(form.discount) || 0,
      rules_acknowledged: form.rules_acknowledged,
      photo_consent: form.photo_consent,
      notes: form.notes || null,
    }
    if (collect > 0) {
      Object.assign(payload, {
        amount_paid: collect, payment_method: form.payment_method, receipt_no: form.receipt_no || null,
        paid_on: new Date().toISOString().slice(0, 10),
      })
    }

    const res = editing
      ? await supabase.from('admissions').update(payload).eq('id', form.id).select().single()
      : await supabase.from('admissions').insert({
          ...payload,
          history: [historyEntry('applied', actorName, collect > 0 ? `Application received · ${rupees(collect)} collected` : 'Application received')],
        }).select().single()

    if (res.error) {
      setSaving(false)
      return setError(res.error.message)
    }
    let warning = ''
    if (collect > 0) {
      const { error: acctError } = await postFeeToAccounts(res.data, collect)
      if (acctError) warning = `Application saved, but the payment wasn't posted to Accounts: ${acctError.message}`
    }
    if (!editing && form.enquiry_id) {
      await supabase.from('enquiries').update({ status: 'contacted' }).eq('id', form.enquiry_id).eq('status', 'new')
    }
    setSaving(false)
    onSaved(res.data, warning)
  }

  const centerName = centers.find((c) => c.id === form.training_center_id)?.name
  const batchName = batches.find((b) => b.id === form.batch_id)?.name

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch md:items-center justify-center bg-pay-navy/60 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label={editing ? 'Edit application' : 'New admission'}>
      <div className="relative flex w-full max-w-[980px] max-h-full md:max-h-[92vh] bg-surface md:rounded-3xl shadow-2xl overflow-hidden">
        {/* Step rail */}
        <aside className="hidden md:flex w-[250px] shrink-0 flex-col pay-stat !rounded-none !p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">{editing ? 'Edit application' : 'New admission'}</p>
          <h2 className="!text-white text-xl font-bold mt-1 leading-tight">{form.full_name || 'Applicant'}</h2>
          {age != null && <p className="text-white/80 text-sm">{age} years</p>}
          <ol className="mt-8 flex flex-col gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const state = i < step ? 'done' : i === step ? 'current' : 'todo'
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => (i <= step ? setStep(i) : next())}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition ${state === 'current' ? 'bg-white/15 text-white font-semibold' : 'text-white/75 hover:bg-white/10'}`}
                  >
                    <span className={`grid place-items-center w-7 h-7 rounded-full shrink-0 ${state === 'done' ? 'bg-white text-pay-action' : state === 'current' ? 'bg-white/90 text-pay-navy' : 'border border-white/40'}`}>
                      {state === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                    </span>
                    {s.label}
                  </button>
                </li>
              )
            })}
          </ol>
          {net > 0 && (
            <div className="mt-auto rounded-2xl bg-white/10 p-4 text-sm text-white">
              <div className="text-white/70 text-xs">Net admission fee</div>
              <div className="text-2xl font-bold">{rupees(net)}</div>
              {rate && <div className="text-white/75 text-xs mt-1">then {rupees(rate)} / month</div>}
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between gap-3 px-5 md:px-7 pt-5 pb-3 border-b border-pay-line">
            <div className="min-w-0">
              <p className="text-xs text-subtle">Step {step + 1} of {STEPS.length}</p>
              <h3 className="text-lg font-bold text-heading">{STEPS[step].label}</h3>
            </div>
            <button type="button" onClick={onCancel} className="grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg" aria-label="Close">
              <X size={20} />
            </button>
          </header>
          <div className="md:hidden h-1 bg-pay-line"><div className="h-full bg-pay-action transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

          <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5">
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name *" span><input className={inputCls} value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} autoFocus /></Field>
                <Field label="Date of birth" hint={age != null ? `${age} years old` : undefined}><input type="date" className={inputCls} value={form.dob} onChange={(e) => set({ dob: e.target.value })} /></Field>
                <Field label="Gender">
                  <select className={inputCls} value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
                    <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Blood group">
                  <select className={inputCls} value={form.blood_group} onChange={(e) => set({ blood_group: e.target.value })}>
                    <option value="">—</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="School / college"><input className={inputCls} value={form.school} onChange={(e) => set({ school: e.target.value })} /></Field>
                <Field label="How did they hear about us?" span>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCES.map(([v, l]) => (
                      <button key={v} type="button" aria-pressed={form.source === v} onClick={() => set({ source: v })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${form.source === v ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body hover:bg-pay-bg'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Parent / guardian name"><input className={inputCls} value={form.guardian_name} onChange={(e) => set({ guardian_name: e.target.value })} autoFocus /></Field>
                <Field label="Relation">
                  <select className={inputCls} value={form.guardian_relation} onChange={(e) => set({ guardian_relation: e.target.value })}>
                    <option value="">—</option>{['Father', 'Mother', 'Guardian', 'Self'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Phone *"><input type="tel" inputMode="tel" className={inputCls} value={form.guardian_phone} onChange={(e) => set({ guardian_phone: e.target.value })} /></Field>
                <Field label="Emergency phone"><input type="tel" inputMode="tel" className={inputCls} value={form.emergency_phone} onChange={(e) => set({ emergency_phone: e.target.value })} /></Field>
                <Field label="Email" span><input type="email" className={inputCls} value={form.guardian_email} onChange={(e) => set({ guardian_email: e.target.value })} /></Field>
                <Field label="Address" span><textarea rows={2} className={`${inputCls} font-body`} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Training centre *">
                  <select className={inputCls} value={form.training_center_id} onChange={(e) => set({ training_center_id: e.target.value, batch_id: '' })}>
                    <option value="">— Select —</option>{centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Preferred batch" hint={rate ? `Monthly fee for this batch: ${rupees(rate)}` : form.batch_id ? 'No monthly rate set for this batch yet' : undefined}>
                  <select className={inputCls} value={form.batch_id} onChange={(e) => set({ batch_id: e.target.value })}>
                    <option value="">— Decide later —</option>{batchesForCenter.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="Current belt">
                  <select className={inputCls} value={form.current_belt} onChange={(e) => set({ current_belt: e.target.value })}>
                    {BELT_RANKS.map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                  </select>
                </Field>
                <Field label="Prior martial-arts experience" span>
                  <textarea rows={2} className={`${inputCls} font-body`} placeholder="e.g. 1 year at school club, none" value={form.prior_experience} onChange={(e) => set({ prior_experience: e.target.value })} />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <Field label="Medical notes" hint="Allergies, asthma, injuries — anything the coach should know.">
                  <textarea rows={3} className={`${inputCls} font-body`} value={form.medical_notes} onChange={(e) => set({ medical_notes: e.target.value })} />
                </Field>
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">Documents received</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {DOCUMENTS.map(([k, label]) => {
                      const on = !!form.documents[k]
                      return (
                        <button key={k} type="button" aria-pressed={on} onClick={() => set({ documents: { ...form.documents, [k]: !on } })}
                          className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm text-left transition ${on ? 'border-pay-action bg-pay-sky text-heading font-semibold' : 'border-pay-line text-body hover:bg-pay-bg'}`}>
                          <span className={`grid place-items-center w-5 h-5 rounded-md border ${on ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line'}`}>{on && <Check size={13} strokeWidth={3} />}</span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[0.7rem] text-subtle mt-2">Missing documents can be ticked off later from the application.</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Admission fee (₹)"><input type="number" min="0" step="1" className={inputCls} value={form.admission_fee} onChange={(e) => set({ admission_fee: e.target.value })} /></Field>
                  <Field label="Discount / scholarship (₹)"><input type="number" min="0" step="1" className={inputCls} value={form.discount} onChange={(e) => set({ discount: e.target.value })} /></Field>
                </div>
                {!editing && net > 0 && (
                  <div className="rounded-2xl border border-pay-line bg-pay-bg p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-heading">Collect now?</p>
                      <div className="flex gap-1.5">
                        <button type="button" className="rounded-full px-3 py-1 text-xs font-semibold border border-pay-line hover:bg-surface" onClick={() => set({ collect_now: String(net) })}>Full {rupees(net)}</button>
                        <button type="button" className="rounded-full px-3 py-1 text-xs font-semibold border border-pay-line hover:bg-surface" onClick={() => set({ collect_now: '' })}>Later</button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-3">
                      <Field label="Amount (₹)"><input type="number" min="0" className={inputCls} value={form.collect_now} onChange={(e) => set({ collect_now: e.target.value })} /></Field>
                      <Field label="Method">
                        <select className={inputCls} value={form.payment_method} onChange={(e) => set({ payment_method: e.target.value })}>{paymentMethods().map((m) => <option key={m}>{m}</option>)}</select>
                      </Field>
                      <Field label="Receipt no."><input className={inputCls} value={form.receipt_no} onChange={(e) => set({ receipt_no: e.target.value })} /></Field>
                    </div>
                  </div>
                )}
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-0.5 w-4 h-4" checked={form.rules_acknowledged} onChange={(e) => set({ rules_acknowledged: e.target.checked })} />
                  <span>Guardian / applicant has read and agreed to the academy's rules & regulations</span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-0.5 w-4 h-4" checked={form.photo_consent} onChange={(e) => set({ photo_consent: e.target.checked })} />
                  <span>Consents to photos being used on the academy website and social media</span>
                </label>
                <Field label="Internal notes"><textarea rows={2} className={`${inputCls} font-body`} value={form.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
              </div>
            )}

            {step === 5 && (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Applicant', [form.full_name, age != null && `${age} yrs`, form.gender, form.blood_group].filter(Boolean).join(' · ')],
                  ['Source', SOURCE_LABEL[form.source]],
                  ['Guardian', [form.guardian_name, form.guardian_relation && `(${form.guardian_relation})`].filter(Boolean).join(' ') || '—'],
                  ['Contact', [form.guardian_phone, form.guardian_email].filter(Boolean).join(' · ')],
                  ['Centre / batch', [centerName, batchName].filter(Boolean).join(' · ') || '—'],
                  ['Belt', beltLabel(form.current_belt)],
                  ['Documents', `${DOCUMENTS.filter(([k]) => form.documents[k]).length} of ${DOCUMENTS.length} received`],
                  ['Fee', net > 0 ? `${rupees(net)}${Number(form.collect_now) > 0 && !editing ? ` · collecting ${rupees(form.collect_now)} now` : ''}` : 'No admission fee'],
                  ['Rules', form.rules_acknowledged ? 'Agreed' : 'Not yet agreed'],
                  ['Photo consent', form.photo_consent ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-pay-bg px-4 py-3">
                    <div className="text-[0.68rem] uppercase tracking-wider text-subtle">{k}</div>
                    <div className="font-semibold text-heading mt-0.5 break-words">{v || '—'}</div>
                  </div>
                ))}
                {form.medical_notes && (
                  <div className="sm:col-span-2 rounded-xl border border-[color:var(--status-warn)]/40 bg-pay-bg px-4 py-3">
                    <div className="text-[0.68rem] uppercase tracking-wider text-subtle">Medical</div>
                    <div className="text-heading mt-0.5">{form.medical_notes}</div>
                  </div>
                )}
              </div>
            )}

            {error && <p role="alert" className="mt-4 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}
          </div>

          <footer className="flex items-center justify-between gap-3 px-5 md:px-7 py-4 border-t border-pay-line bg-pay-bg/60">
            <button type="button" className={btnOutline} onClick={() => (step === 0 ? onCancel() : (setError(''), setStep(step - 1)))}>
              {step === 0 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className={btnPrimary} onClick={next}>Continue <ChevronRight size={16} /></button>
            ) : (
              <button type="button" className={btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Submit application'}
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  )
}
