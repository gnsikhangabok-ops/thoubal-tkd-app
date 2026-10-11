import { supabase } from './supabaseClient'
import { ACADEMY, formatDate, rupees } from './documents'
import { feeConfig } from './feeSettings'

// Pipeline order. `open` stages still need action; the rest are outcomes.
export const STAGES = [
  { key: 'applied', label: 'Applied', tone: 'info', open: true, hint: 'New application received' },
  { key: 'under_review', label: 'Under review', tone: 'warn', open: true, hint: 'Checking documents & details' },
  { key: 'trial', label: 'Trial class', tone: 'warn', open: true, hint: 'Trial session booked' },
  { key: 'approved', label: 'Approved', tone: 'ok', open: true, hint: 'Ready to enrol' },
  { key: 'enrolled', label: 'Enrolled', tone: 'ok', hint: 'Now a student' },
  { key: 'waitlisted', label: 'Waitlisted', tone: 'neutral', open: true, hint: 'Batch full — waiting for a seat' },
  { key: 'rejected', label: 'Rejected', tone: 'bad', hint: 'Not admitted' },
  { key: 'withdrawn', label: 'Withdrawn', tone: 'neutral', hint: 'Family withdrew' },
]
export const STAGE = Object.fromEntries(STAGES.map((s) => [s.key, s]))
export const FUNNEL = ['applied', 'under_review', 'trial', 'approved', 'enrolled']
export const BOARD = ['applied', 'under_review', 'trial', 'approved', 'waitlisted', 'enrolled']
export const STAGE_COLOR = {
  applied: 'var(--status-info)', under_review: 'var(--status-warn)', trial: '#8B5CF6', approved: 'var(--status-ok)',
  enrolled: 'var(--status-ok)', waitlisted: 'var(--color-subtle)', rejected: 'var(--status-bad)', withdrawn: 'var(--color-pay-line)',
}
// The next step offered as the primary action on each stage
export const NEXT_STEP = { applied: 'under_review', under_review: 'trial', trial: 'approved', waitlisted: 'approved' }

export const SOURCES = [
  ['walk_in', 'Walk-in'], ['website', 'Website enquiry'], ['referral', 'Referral'],
  ['school_camp', 'School camp'], ['social_media', 'Social media'], ['other', 'Other'],
]
export const SOURCE_LABEL = Object.fromEntries(SOURCES)

export const DOCUMENTS = [
  ['photo', 'Passport photo'],
  ['birth_certificate', 'Birth certificate / age proof'],
  ['id_proof', 'Aadhaar / ID proof'],
  ['medical_certificate', 'Medical fitness certificate'],
  ['guardian_id', 'Guardian ID proof'],
]

// Blank values for the application wizard
export const emptyApplication = {
  id: null, source: 'walk_in', enquiry_id: null,
  full_name: '', dob: '', gender: '', blood_group: '', school: '',
  guardian_name: '', guardian_relation: '', guardian_phone: '', guardian_email: '', emergency_phone: '', address: '',
  training_center_id: '', batch_id: '', current_belt: 'white', prior_experience: '',
  medical_notes: '', documents: {},
  admission_fee: '', discount: '', collect_now: '', payment_method: 'Cash', receipt_no: '',
  rules_acknowledged: false, photo_consent: false, notes: '',
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const paymentMethods = () => feeConfig().methods

const year = (a) => new Date(a.created_at || Date.now()).getFullYear()
export const applicationNo = (a) => `TTA-A-${year(a)}-${String(a.seq ?? 0).padStart(4, '0')}`

export const netFee = (a) => Math.max(0, Number(a.admission_fee || 0) - Number(a.discount || 0))
export const balanceDue = (a) => Math.max(0, netFee(a) - Number(a.amount_paid || 0))
export const docsDone = (a) => DOCUMENTS.filter(([k]) => a.documents?.[k]).length

// When the application entered its current stage (last history entry, else creation)
export function stageSince(a) {
  const last = [...(a.history || [])].reverse().find((h) => h.status === a.status)
  return last?.at || a.created_at
}
export const daysSince = (d) => (d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000)) : 0)

/** Readiness score 0–100: details, documents, consent and fees. Shown as a ring on each application. */
export function readiness(a) {
  const checks = [
    !!a.full_name, !!a.dob, !!a.guardian_name, !!a.guardian_phone, !!a.address, !!a.training_center_id, !!a.batch_id,
    ...DOCUMENTS.map(([k]) => !!a.documents?.[k]),
    a.rules_acknowledged, balanceDue(a) === 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export const historyEntry = (status, by, note) => ({ status, at: new Date().toISOString(), by: by || null, note: note || null })

/** Post an admission fee payment to Accounts as income (the student may not exist yet). */
export async function postFeeToAccounts(admission, amount) {
  return supabase.from('accounts_transactions').insert({
    type: 'income',
    category: 'student_fee',
    amount,
    transaction_date: new Date().toISOString().slice(0, 10),
    training_center_id: admission.training_center_id || null,
    related_student_id: admission.student_id || null,
    description: `Admission fee — ${admission.full_name} (${applicationNo(admission)})`,
  })
}

/** Data packed into the QR code on the printed admission form */
export const admissionQrText = (a) =>
  [ACADEMY.name, `Application: ${applicationNo(a)}`, `Name: ${a.full_name}`, `Status: ${STAGE[a.status]?.label}`,
    `Applied: ${formatDate(a.created_at)}`, `Fee paid: ${rupees(a.amount_paid)} of ${rupees(netFee(a))}`].join('\n')
