import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Academy-wide fee policy, edited in Fee Setup (super admin) and stored in fee_settings.
export const FEE_DEFAULTS = {
  due_day: 10,                  // monthly fees fall due on this day of the month
  grace_days: 0,                // extra days before a late fee applies
  late_fee: { enabled: false, type: 'fixed', amount: 50 },   // type: fixed ₹ | percent of the month's fee
  sibling: { enabled: false, percent: 10 },                   // off the 2nd and later child of one guardian
  methods: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
  upi_id: '',
  payee_name: 'Thoubal Taekwondo Academy',
  bank_details: '',
  receipt_prefix: 'TTA-R',
  receipt_note: '',
}

let current = FEE_DEFAULTS
let pending = null
let missingTable = false
const listeners = new Set() // mounted useFeeSettings hooks, told when settings are saved

const merge = (s) => ({
  ...FEE_DEFAULTS, ...s,
  late_fee: { ...FEE_DEFAULTS.late_fee, ...s?.late_fee },
  sibling: { ...FEE_DEFAULTS.sibling, ...s?.sibling },
  methods: s?.methods?.length ? s.methods : FEE_DEFAULTS.methods,
})

/** Current settings (defaults until loaded). Synchronous, for helpers used during render. */
export const feeConfig = () => current
export const feeSettingsMissing = () => missingTable

export function loadFeeSettings(force = false) {
  if (pending && !force) return pending
  pending = supabase.from('fee_settings').select('settings').eq('id', 1).maybeSingle().then(({ data, error }) => {
    missingTable = !!error && /fee_settings/.test(error.message || '')
    current = merge(data?.settings || {})
    return current
  })
  return pending
}

/** Loads the settings once and re-renders the caller when they arrive. */
export function useFeeSettings() {
  const [settings, setSettings] = useState(current)
  useEffect(() => {
    let active = true
    loadFeeSettings().then((s) => { if (active) setSettings(s) })
    listeners.add(setSettings)
    return () => { active = false; listeners.delete(setSettings) }
  }, [])
  return settings
}

export async function saveFeeSettings(next) {
  const settings = merge(next)
  const { error } = await supabase.from('fee_settings').upsert({ id: 1, settings, updated_at: new Date().toISOString() })
  if (!error) {
    current = settings
    pending = Promise.resolve(settings)
    listeners.forEach((notify) => notify(settings))
  }
  return { error }
}

/** Late fee for an overdue monthly fee under the current policy (0 when not due yet). */
export function lateFeeFor(payment, daysLate) {
  const { late_fee: lf, grace_days } = current
  if (!lf.enabled || daysLate <= grace_days || /late fee/i.test(payment.notes || '')) return 0
  return lf.type === 'percent' ? Math.round((Number(payment.amount_due || 0) * Number(lf.amount || 0)) / 100) : Number(lf.amount || 0)
}

/** UPI deep link (also rendered as a QR code) for paying a specific amount */
export function upiLink(amount, note) {
  if (!current.upi_id) return null
  const q = new URLSearchParams({ pa: current.upi_id, pn: current.payee_name || 'Academy', am: String(amount), cu: 'INR', tn: note || 'Fee' })
  return `upi://pay?${q.toString()}`
}
