import { supabase } from './supabaseClient'
import { ACADEMY, rupees } from './documents'

// Monthly fees fall due on this day of the billed month; unpaid after that they show as overdue.
export const DUE_DAY = 10
export const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']

export const monthFirst = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
export function shiftMonth(first, delta) {
  const [y, m] = first.split('-').map(Number)
  return monthFirst(new Date(y, m - 1 + delta, 1))
}
export const monthLabel = (first, opts = { month: 'long', year: 'numeric' }) => new Date(`${first.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', opts)
export const shortMonth = (first) => monthLabel(first, { month: 'short', year: '2-digit' })

export const dueDate = (p) => new Date(`${p.period_month.slice(0, 7)}-${String(DUE_DAY).padStart(2, '0')}T23:59:59`)
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
export async function collectFee(payment, { amount, method, receipt, notes }) {
  const newPaid = Number(payment.amount_paid || 0) + amount
  const status = newPaid >= Number(payment.amount_due) ? 'paid' : 'pending'
  const { data, error } = await supabase
    .from('fee_payments')
    .update({
      amount_paid: newPaid,
      status,
      paid_on: new Date().toISOString().slice(0, 10),
      payment_method: method,
      receipt_no: receipt || payment.receipt_no || null,
      notes: notes || payment.notes || null,
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
    'Please pay at the academy or by UPI at your earliest convenience. Thank you!',
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
