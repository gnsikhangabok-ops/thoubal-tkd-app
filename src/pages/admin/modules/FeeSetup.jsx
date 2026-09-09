import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Wallet, Repeat, CircleDollarSign } from 'lucide-react'

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

const emptyMonthlyForm = { batch_id: '', monthly_amount: '' }
const emptyOneTimeForm = { id: null, name: '', amount: '' }

export default function FeeSetup() {
  const [batches, setBatches] = useState([])
  const [feeStructures, setFeeStructures] = useState([])
  const [oneTimeFees, setOneTimeFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [monthlyForm, setMonthlyForm] = useState(emptyMonthlyForm)
  const [showMonthlyForm, setShowMonthlyForm] = useState(false)
  const [savingMonthly, setSavingMonthly] = useState(false)

  const [oneTimeForm, setOneTimeForm] = useState(emptyOneTimeForm)
  const [showOneTimeForm, setShowOneTimeForm] = useState(false)
  const [savingOneTime, setSavingOneTime] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [batchRes, structRes, oneTimeRes] = await Promise.all([
      supabase.from('batches').select('id, name, training_centers(name)').eq('active', true).order('name'),
      supabase.from('fee_structures').select('*, batches(name)').order('effective_from', { ascending: false }),
      supabase.from('one_time_fee_types').select('*').order('created_at', { ascending: true }),
    ])

    if (batchRes.error) setError(batchRes.error.message)
    else setBatches(batchRes.data)

    if (structRes.error) setError((prev) => prev || structRes.error.message)
    else setFeeStructures(structRes.data)

    if (oneTimeRes.error) setError((prev) => prev || oneTimeRes.error.message)
    else setOneTimeFees(oneTimeRes.data)

    setLoading(false)
  }

  // Latest fee structure per batch (most recent effective_from wins)
  function currentRateForBatch(batchId) {
    const rows = feeStructures.filter((f) => f.batch_id === batchId)
    if (rows.length === 0) return null
    return rows[0] // already sorted desc by effective_from
  }

  function openAddMonthly(batchId) {
    const existing = currentRateForBatch(batchId)
    setMonthlyForm({ batch_id: batchId, monthly_amount: existing?.monthly_amount ?? '' })
    setShowMonthlyForm(true)
  }

  async function handleMonthlySubmit(e) {
    e.preventDefault()
    setSavingMonthly(true)
    setError('')

    const { error } = await supabase.from('fee_structures').insert({
      batch_id: monthlyForm.batch_id,
      monthly_amount: parseFloat(monthlyForm.monthly_amount),
    })

    setSavingMonthly(false)
    if (error) {
      setError(error.message)
    } else {
      setShowMonthlyForm(false)
      loadData()
    }
  }

  function openAddOneTime() {
    setOneTimeForm(emptyOneTimeForm)
    setShowOneTimeForm(true)
  }

  function openEditOneTime(fee) {
    setOneTimeForm({ id: fee.id, name: fee.name, amount: fee.amount })
    setShowOneTimeForm(true)
  }

  async function handleOneTimeSubmit(e) {
    e.preventDefault()
    setSavingOneTime(true)
    setError('')

    const payload = { name: oneTimeForm.name, amount: parseFloat(oneTimeForm.amount) }

    const { error } = oneTimeForm.id
      ? await supabase.from('one_time_fee_types').update(payload).eq('id', oneTimeForm.id)
      : await supabase.from('one_time_fee_types').insert(payload)

    setSavingOneTime(false)
    if (error) {
      setError(error.message)
    } else {
      setShowOneTimeForm(false)
      loadData()
    }
  }

  async function toggleOneTimeActive(fee) {
    const { error } = await supabase
      .from('one_time_fee_types')
      .update({ active: !fee.active })
      .eq('id', fee.id)

    if (error) setError(error.message)
    else loadData()
  }

  return (
    <div className="p-12 max-md:p-6 max-w-[1000px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Fee Setup</h1>
      <p className="text-charcoal mb-9">
        Define monthly rates per batch and one-time fees (admission, form). These feed into Fee Management.
      </p>

      {error && <p className="text-brand-red mb-6">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="flex flex-col gap-12">
          {/* MONTHLY RATES PER BATCH */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Repeat size={16} className="text-brand-red" />
              <h2 className="font-display text-ink uppercase text-sm tracking-[0.08em]">Monthly Rates by Batch</h2>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            {batches.length === 0 ? (
              <p className="text-charcoal text-sm">No active batches yet — add one in the Batches module first.</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {batches.map((b) => {
                  const rate = currentRateForBatch(b.id)
                  return (
                    <div
                      key={b.id}
                      className="bg-white border border-black/10 p-6"
                      style={{ borderTopWidth: 3, borderTopColor: rate ? '#B3282D' : '#ccc' }}
                    >
                      <h3 className="font-semibold text-base text-ink mb-1.5">{b.name}</h3>
                      <p className="text-sm text-charcoal">{b.training_centers?.name}</p>
                      <p className="text-2xl font-display text-brand-red mt-2.5">
                        {rate ? `₹${Number(rate.monthly_amount).toLocaleString('en-IN')}` : '— Not set —'}
                      </p>
                      <p className="text-[0.75rem] text-charcoal mt-1">per month</p>
                      <button className={`${btnOutline} ${btnSm} mt-3`} onClick={() => openAddMonthly(b.id)}>
                        {rate ? 'Update Rate' : 'Set Rate'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {showMonthlyForm && (
              <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mt-6 max-w-[420px]">
                <h3 className="font-semibold text-base text-ink mb-1.5">
                  Set rate for {batches.find((b) => b.id === monthlyForm.batch_id)?.name}
                </h3>
                <p className="text-[0.85rem] mb-4 text-charcoal">
                  This becomes the new current rate. Past months already generated keep their original amount.
                </p>
                <form onSubmit={handleMonthlySubmit} className="flex flex-col gap-3">
                  <input
                    type="number" placeholder="Monthly amount (₹)" required step="0.01"
                    value={monthlyForm.monthly_amount}
                    onChange={(e) => setMonthlyForm({ ...monthlyForm, monthly_amount: e.target.value })}
                    className={inputCls}
                  />
                  <div className="flex gap-2.5">
                    <button type="submit" className={btnPrimary} disabled={savingMonthly}>
                      {savingMonthly ? 'Saving…' : 'Save Rate'}
                    </button>
                    <button type="button" className={btnOutline} onClick={() => setShowMonthlyForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ONE-TIME FEES */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <CircleDollarSign size={16} className="text-brand-red" />
                <h2 className="font-display text-ink uppercase text-sm tracking-[0.08em]">One-Time Fees</h2>
              </div>
              <button className={`${btnPrimary} ${btnSm}`} onClick={openAddOneTime}>+ Add Fee Type</button>
            </div>
            <div className="h-px bg-black/10 mb-4" />

            {showOneTimeForm && (
              <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-6 max-w-[420px]">
                <h3 className="font-semibold text-base text-ink mb-4">{oneTimeForm.id ? 'Edit Fee Type' : 'New One-Time Fee'}</h3>
                <form onSubmit={handleOneTimeSubmit} className="flex flex-col gap-3">
                  <input
                    type="text" placeholder="Fee name (e.g. Admission Fee)" required
                    value={oneTimeForm.name}
                    onChange={(e) => setOneTimeForm({ ...oneTimeForm, name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number" placeholder="Amount (₹)" required step="0.01"
                    value={oneTimeForm.amount}
                    onChange={(e) => setOneTimeForm({ ...oneTimeForm, amount: e.target.value })}
                    className={inputCls}
                  />
                  <div className="flex gap-2.5">
                    <button type="submit" className={btnPrimary} disabled={savingOneTime}>
                      {savingOneTime ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className={btnOutline} onClick={() => setShowOneTimeForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {oneTimeFees.length === 0 ? (
              <p className="text-charcoal text-sm">No one-time fees set up yet. Add "Admission Fee" and "Form Fee" to match your registration form.</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {oneTimeFees.map((fee) => (
                  <div
                    key={fee.id}
                    className="bg-white border border-black/10 p-6"
                    style={{ borderTopWidth: 3, borderTopColor: fee.active ? '#B3282D' : '#ccc' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Wallet size={16} className="text-brand-red" />
                      <h3 className="font-semibold text-base text-ink">{fee.name}</h3>
                    </div>
                    <p className="text-2xl font-display text-brand-red">₹{Number(fee.amount).toLocaleString('en-IN')}</p>
                    <p className="text-[0.8rem] mt-1.5" style={{ color: fee.active ? '#B3282D' : '#999' }}>
                      {fee.active ? 'Active' : 'Inactive'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditOneTime(fee)}>Edit</button>
                      <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleOneTimeActive(fee)}>
                        {fee.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
