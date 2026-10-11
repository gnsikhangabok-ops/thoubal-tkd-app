import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, X, AlertTriangle, Save } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { rupees } from '../../../lib/documents'
import { ratesFor, ordinal } from '../../../lib/fees'
import { useFeeSettings, saveFeeSettings, feeSettingsMissing } from '../../../lib/feeSettings'
import ModuleHeader from '../../../components/ModuleHeader'
import TuitionRates from '../feeSetup/TuitionRates'
import FeeCatalogue from '../feeSetup/FeeCatalogue'
import FeePolicies from '../feeSetup/FeePolicies'

const clean = (d) => ({
  ...d,
  due_day: Math.min(31, Math.max(1, Number(d.due_day) || 10)),
  grace_days: Math.max(0, Number(d.grace_days) || 0),
  late_fee: { ...d.late_fee, amount: Math.max(0, Number(d.late_fee.amount) || 0) },
  sibling: { ...d.sibling, percent: Math.min(100, Math.max(0, Number(d.sibling.percent) || 0)) },
})

export default function FeeSetup() {
  const settings = useFeeSettings()
  const [tab, setTab] = useState('tuition')
  const [batches, setBatches] = useState([])
  const [structures, setStructures] = useState([])
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [draft, setDraft] = useState(settings)
  const [savingSettings, setSavingSettings] = useState(false)

  // Start editing from the stored settings once they arrive
  // oxlint-disable-next-line react/set-state-in-effect -- sync the draft when the stored settings load
  useEffect(() => { setDraft(settings) }, [settings])

  async function load() {
    const [b, f, o, s, p] = await Promise.all([
      supabase.from('batches').select('id, name, training_center_id, training_centers(name)').eq('active', true).order('name'),
      supabase.from('fee_structures').select('*').order('effective_from', { ascending: false }),
      supabase.from('one_time_fee_types').select('*').order('created_at', { ascending: true }),
      supabase.from('students').select('id, full_name, batch_id, training_center_id, guardian_phone').eq('active', true).order('full_name'),
      supabase.from('one_time_fee_payments').select('*'),
    ])
    const err = [b, f, o, s, p].find((r) => r.error)?.error
    if (err) setError(err.message)
    setBatches(b.data || [])
    setStructures(f.data || [])
    setItems(o.data || [])
    setStudents(s.data || [])
    setPayments(p.data || [])
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    load()
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(t)
  }, [flash])

  function saved(message) {
    setFlash(message)
    setError('')
    load()
  }

  async function saveSettings() {
    setSavingSettings(true)
    const { error } = await saveFeeSettings(clean(draft))
    setSavingSettings(false)
    if (error) return setError(/fee_settings/.test(error.message) ? `${error.message} — run supabase/migrations/20261012_fee_setup.sql first.` : error.message)
    setFlash('Fee settings saved')
    setError('')
  }

  const dirty = JSON.stringify(clean(draft)) !== JSON.stringify(clean(settings))

  const figures = useMemo(() => {
    const priced = batches.filter((b) => ratesFor(structures, b.id).current)
    const projected = batches.reduce((sum, b) => {
      const rate = ratesFor(structures, b.id).current
      return sum + (rate ? Number(rate.monthly_amount) * students.filter((s) => s.batch_id === b.id).length : 0)
    }, 0)
    // Worked examples use the rate of the batch with the most students
    const busiest = [...priced].sort((a, b) => students.filter((s) => s.batch_id === b.id).length - students.filter((s) => s.batch_id === a.id).length)[0]
    const phones = {}
    students.forEach((s) => { const k = String(s.guardian_phone || '').replace(/\D/g, '').slice(-10); if (k.length === 10) phones[k] = (phones[k] || 0) + 1 })
    return {
      priced: priced.length,
      projected,
      sampleFee: busiest ? Number(ratesFor(structures, busiest.id).current.monthly_amount) : 1000,
      siblingGroups: Object.values(phones).filter((n) => n > 1).length,
      activeItems: items.filter((i) => i.active !== false).length,
    }
  }, [batches, structures, students, items])

  const TABS = [
    { value: 'tuition', label: 'Monthly tuition', count: batches.length },
    { value: 'catalogue', label: 'Fee catalogue', count: items.length },
    { value: 'discounts', label: 'Discounts & late fees' },
    { value: 'payments', label: 'Payments & receipts' },
  ]

  const policyLine = [
    `Due ${ordinal(settings.due_day)}`,
    settings.late_fee.enabled ? `late fee ${settings.late_fee.type === 'percent' ? `${settings.late_fee.amount}%` : rupees(settings.late_fee.amount)}` : 'no late fee',
    settings.sibling.enabled ? `sibling ${settings.sibling.percent}% off` : 'no sibling discount',
  ].join(' · ')

  return (
    <div className="p-8 max-md:p-4 max-w-[1320px] mx-auto pb-28">
      <ModuleHeader
        title="Fee Setup"
        description={<>Every fee the academy charges and the rules for collecting them. Monthly rates feed the <Link to="/admin/fees" className="underline">collection desk</Link>; catalogue fees are collected here and in Admissions.</>}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
      />

      {feeSettingsMissing() && (
        <p className="flex gap-2 items-start bg-amber-50 text-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          Settings can't be saved yet. Run <code className="font-semibold">supabase/migrations/20261012_fee_setup.sql</code> in the Supabase SQL editor; until then the defaults below are used.
        </p>
      )}
      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></p>}

      {/* Overview */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="pay-stat !p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-white/75">Projected monthly billing</p>
          <strong className="block text-2xl md:text-3xl font-bold tabular-nums mt-1">{loading ? '…' : rupees(figures.projected)}</strong>
          <p className="text-[0.7rem] text-white/70 mt-0.5">{students.length} active students at current rates</p>
        </div>
        {[
          ['Batches priced', loading ? '…' : `${figures.priced}/${batches.length}`, figures.priced < batches.length ? `${batches.length - figures.priced} without a rate` : 'all batches have a rate', figures.priced < batches.length ? 'var(--status-warn)' : 'var(--status-ok)'],
          ['Catalogue fees', loading ? '…' : figures.activeItems, `${items.length - figures.activeItems} turned off`, 'var(--gold, var(--color-pay-action))'],
          ['Fee rules', ordinal(settings.due_day), policyLine.split(' · ').slice(1).join(' · '), 'var(--color-pay-action)'],
        ].map(([k, v, sub, c]) => (
          <div key={k} className="bg-surface rounded-2xl shadow-card p-4 relative overflow-hidden">
            <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: c }} aria-hidden="true" />
            <p className="text-xs text-muted">{k}</p>
            <p className="text-2xl font-bold text-heading tabular-nums mt-0.5">{v}</p>
            <p className="text-[0.7rem] text-subtle truncate">{sub}</p>
          </div>
        ))}
      </div>

      {loading ? <p className="text-muted">Loading…</p> : (
        <>
          {tab === 'tuition' && <TuitionRates batches={batches} structures={structures} students={students} onSaved={saved} onError={setError} />}
          {tab === 'catalogue' && <FeeCatalogue items={items} payments={payments} students={students} onSaved={saved} onError={setError} />}
          {(tab === 'discounts' || tab === 'payments') && (
            <FeePolicies section={tab} draft={draft} setDraft={setDraft} siblingGroups={figures.siblingGroups} sampleFee={figures.sampleFee} />
          )}
        </>
      )}

      {/* Unsaved settings */}
      {dirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 md:ml-32 z-40 flex items-center gap-2 rounded-full bg-pay-navy text-white pl-5 pr-2 py-2 shadow-2xl">
          <span className="text-sm font-semibold whitespace-nowrap">Unsaved fee settings</span>
          <button onClick={() => setDraft(settings)} className="rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">Discard</button>
          <button onClick={saveSettings} disabled={savingSettings} className="inline-flex items-center gap-1.5 rounded-full bg-white text-pay-navy px-4 py-1.5 text-xs font-bold hover:bg-pay-sky disabled:opacity-60">
            <Save size={14} /> {savingSettings ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      )}

      {flash && (
        <div role="status" className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] rounded-full bg-pay-navy text-white text-sm font-semibold px-5 py-2.5 shadow-2xl inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> {flash}
        </div>
      )}
    </div>
  )
}
