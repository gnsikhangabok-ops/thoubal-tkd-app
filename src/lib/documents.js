import { REGISTRATION_NO } from './siteContent'
import { beltLabel } from './belts'

export const ACADEMY = {
  name: 'Thoubal Taekwondo Academy',
  body: 'Thoubal District Taekwondo Association',
  regNo: REGISTRATION_NO,
  affiliations: 'Affiliated to AMTA · Taekwondo Federation of India · Asian Taekwondo Union',
}

// Short, stable reference numbers derived from database ids
const shortId = (id) => String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase()
export const studentIdNo = (student) => `TTA-S-${shortId(student.id)}`
export const receiptNo = (payment) => payment.receipt_no || `TTA-R-${String(payment.period_month || '').slice(0, 7).replace('-', '')}-${shortId(payment.id)}`
export const certificateNo = (result) => `TTA-C-${shortId(result.id)}`

// The academic year runs April–March; ID cards are valid until 31 March of the current one.
export function idValidTill(date = new Date()) {
  const y = date.getMonth() >= 3 ? date.getFullYear() + 1 : date.getFullYear()
  return `31 Mar ${y}`
}

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatMonth = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowThousand(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  const r = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ' ' + ONES[rest % 10] : ''}`
  return [h ? `${ONES[h]} Hundred` : '', r].filter(Boolean).join(' ')
}

/** Indian-system amount in words: 125000 → "Rupees One Lakh Twenty Five Thousand Only" */
export function amountInWords(amount) {
  let n = Math.round(Number(amount) || 0)
  if (n === 0) return 'Rupees Zero Only'
  const parts = []
  for (const [size, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']]) {
    if (n >= size) {
      parts.push(`${belowThousand(Math.floor(n / size))} ${name}`)
      n %= size
    }
  }
  if (n) parts.push(belowThousand(n))
  return `Rupees ${parts.join(' ')} Only`
}

// Text packed into each QR code so the document can be checked by scanning it
export const studentQrText = (s) =>
  [ACADEMY.name, `Student ID: ${studentIdNo(s)}`, `Name: ${s.full_name}`, `Belt: ${beltLabel(s.current_belt)}`,
    `Centre: ${s.training_centers?.name || '—'}`, `Valid till: ${idValidTill()}`].join('\n')

export const receiptQrText = (p, studentName) =>
  [ACADEMY.name, `Receipt: ${receiptNo(p)}`, `Student: ${studentName}`, `Period: ${formatMonth(p.period_month)}`,
    `Paid: ${rupees(p.amount_paid)} of ${rupees(p.amount_due)}`, `Status: ${p.status}`].join('\n')

export const certificateQrText = (r, studentName, exam) =>
  [ACADEMY.name, `Certificate: ${certificateNo(r)}`, `Name: ${studentName}`,
    `Promoted: ${beltLabel(r.from_belt)} → ${beltLabel(r.to_belt)}`, `Exam: ${exam?.title || '—'} (${formatDate(exam?.exam_date)})`].join('\n')
