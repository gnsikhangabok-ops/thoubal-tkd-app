import { supabase } from './supabaseClient'
import { ACADEMY, rupees } from './documents'
import { feeConfig } from './feeSettings'

// Monthly fees fall due on the due day set in Fee Setup; unpaid after that they show as overdue.
export const dueDay = () => feeConfig().due_day

/** 1 → 1st, 2 → 2nd, 11 → 11th, 22 → 22nd */
export function ordinal(n) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'
  return `${n}${suffix}`
}
export const paymentMethods = () => feeConfig().methods

export const monthFirst = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
export function shiftMonth(first, delta) {
  const [y, m] = first.split('-').map(Number)
  return monthFirst(new Date(y, m - 1 + delta, 1))
}
export const monthLabel = (first, opts = { month: 'long', year: 'numeric' }) => new Date(`${first.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', opts)
export const shortMonth = (first) => monthLabel(first, { month: 'short', year: '2-digit' })

export function dueDate(p) {
  const [y, m] = p.period_month.slice(0, 7).split('-').map(Number)
  const last = new Date(y, m, 0).getDate() // a due day of 31 means the month's last day
  return new Date(y, m - 1, Math.min(dueDay(), last), 23, 59, 59)
}
export const balance = (p) => (p.status === 'waived' ? 0 : Math.max(0, Number(p.amount_due || 0) - Number(p.amount_paid || 0)))

/** Status as shown: pending fees past the due date count as overdue, partly paid ones as partial. */
export function feeStatus(p) {
  if (p.status === 'paid' || p.status === 'waived') return p.status
  if (balance(p) === 0) return 'paid'
  if (p.status === 'overdue' || new Date() > dueDate(p)) return 'overdue'
  return Number(p.amount_paid) > 0 ? 'partial' : 'pending'
}
export const STATUS_TONE = { paid: 'ok', partial: 'info', pending: 'warn', overdue: 'bad', waived: 'neutral' }
export const STATUS_COLOR = { paid: 'var(--status-ok)', partial: 'var(--status-info)', pending: 'var(--status-warn)', overdue: 'var(--status-bad)', waived: 'var(--color-subtle)' }
export const daysOverdue = (p) => Math.max(0, Math.ceil((Date.now() - dueDate(p)) / 86400000))

/**
 * Record money received against a monthly fee row and post it to Accounts as income.
 * Returns { data, warning } or { error }.
 */
export async function collectFee(payment, { amount, method, receipt, notes, lateFee = 0 }) {
  const newPaid = Number(payment.amount_paid || 0) + amount
  const newDue = Number(payment.amount_due) + lateFee
  const status = newPaid >= newDue ? 'paid' : 'pending'
  const lateNote = lateFee ? `Late fee ${rupees(lateFee)}` : ''
  const { data, error } = await supabase
    .from('fee_payments')
    .update({
      ...(lateFee ? { amount_due: newDue } : {}),
      amount_paid: newPaid,
      status,
      paid_on: new Date().toISOString().slice(0, 10),
      payment_method: method,
      receipt_no: receipt || payment.receipt_no || null,
      notes: [payment.notes, lateNote, notes].filter(Boolean).join(' · ') || null,
    })
    .eq('id', payment.id)
    .select(FEE_SELECT)
    .single()
  if (error) return { error }

  const { error: acctError } = await supabase.from('accounts_transactions').insert({
    type: 'income',
    category: 'student_fee',
    amount,
    transaction_date: new Date().toISOString().slice(0, 10),
    training_center_id: payment.students?.training_center_id || null,
    related_student_id: payment.student_id,
    related_fee_payment_id: payment.id,
    description: `Monthly fee — ${payment.students?.full_name} — ${monthLabel(payment.period_month)}`,
  })
  return { data, warning: acctError ? `Payment recorded, but not posted to Accounts: ${acctError.message}` : '' }
}

export const FEE_SELECT = '*, students(full_name, guardian_name, guardian_phone, training_center_id, batch_id, training_centers(name), batches(name))'

/** WhatsApp link with a polite, pre-written fee reminder to the guardian */
export function reminderLink(student, amount, months) {
  const phone = String(student?.guardian_phone || '').replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')
  if (!phone) return null
  const text = [
    `Namaste${student.guardian_name ? ` ${student.guardian_name}` : ''},`,
    `This is a gentle reminder from ${ACADEMY.name} that ${student.full_name}'s training fee of ${rupees(amount)}${months?.length ? ` for ${months.join(', ')}` : ''} is due.`,
    feeConfig().upi_id ? `You can pay by UPI to ${feeConfig().upi_id}, or at the academy office.` : 'Please pay at the academy office at your earliest convenience.',
    'Thank you!',
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

const today = () => new Date().toISOString().slice(0, 10)

/** Rate in force today and any scheduled future rate for a batch (rows newest first). */
export function ratesFor(structures, batchId) {
  const rows = structures.filter((r) => r.batch_id === batchId)
  const current = rows.find((r) => !r.effective_from || r.effective_from <= today())
  const upcoming = rows.filter((r) => r.effective_from > today()).pop()
  return { current, upcoming, history: rows }
}
