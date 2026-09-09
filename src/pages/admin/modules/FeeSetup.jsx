import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { Wallet, Repeat, CircleDollarSign, Check } from 'lucide-react'

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

const emptyMonthlyForm = { batch_id: '', monthly_amount: '' }
const emptyOneTimeForm = { id: null, name: '', amount: '' }
const emptyCollectForm = { student_id: '', amount_paid: '', payment_method: 'Cash', receipt_no: '' }

export default function FeeSetup() {
  const [batches, setBatches] = useState([])
  const [feeStructures, setFeeStructures] = useState([])
  const [oneTimeFees, setOneTimeFees] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([]) // one_time_fee_payments
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [monthlyForm, setMonthlyForm] = useState(emptyMonthlyForm)
  const [showMonthlyForm, setShowMonthlyForm] = useState(false)
  const [savingMonthly, setSavingMonthly] = useState(false)

  const [oneTimeForm, setOneTimeForm] = useState(emptyOneTimeForm)
  const [showOneTimeForm, setShowOneTimeForm] = useState(false)
  const [savingOneTime, setSavingOneTime] = useState(false)

  const [collectingFor, setCollectingFor] = useState(null) // fee type being collected
  const [collectForm, setCollectForm] = useState(emptyCollectForm)
  const [savingCollect, setSavingCollect] = useState(false)
  const [viewingPaidFor, setViewingPaidFor] = useState(null) // fee type whose paid-list is shown

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [batchRes, structRes, oneTimeRes, studentRes, paymentRes] = await Promise.all([
      supabase.from('batches').select('id, name, training_centers(name)').eq('active', true).order('name'),
      supabase.from('fee_structures').select('*, batches(name)').order('effective_from', { ascending: false }),
      supabase.from('one_time_fee_types').select('*').order('created_at', { ascending: true }),
      supabase.from('students').select('id, full_name, training_center_id').eq('active', true).order('full_name'),
      supabase.from('one_time_fee_payments').select('*, students(full_name)'),
    ])

    if (batchRes.error) setError(batchRes.error.message)
    else setBatches(batchRes.data)

    if (structRes.error) setError((prev) => prev || structRes.error.message)
    else setFeeStructures(structRes.data)

    if (oneTimeRes.error) setError((prev) => prev || oneTimeRes.error.message)
    else setOneTimeFees(oneTimeRes.data)

    if (studentRes.error) setError((prev) => prev || studentRes.error.message)
    else setStudents(studentRes.data)

    if (paymentRes.error) setError((prev) => prev || paymentRes.error.message)
    else setPayments(paymentRes.data)

    setLoading(false)
  }

  function currentRateForBatch(batchId) {
    const rows = feeStructures.filter((f) => f.batch_id === batchId)
    if (rows.length === 0) return null
    return rows[0]
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

  function studentsPaidFor(feeTypeId) {
    return new Set(payments.filter((p) => p.fee_type_id === feeTypeId).map((p) => p.student_id))
  }

  function openCollectForm(feeType) {
    setCollectingFor(feeType)
    setCollectForm({ student_id: '', amount_paid: feeType.amount, payment_method: 'Cash', receipt_no: '' })
  }

  async function handleCollectSubmit(e) {
    e.preventDefault()
    setSavingCollect(true)
    setError('')

    const student = students.find((s) => s.id === collectForm.student_id)
    const amount = parseFloat(collectForm.amount_paid)

    const { error: payError } = await supabase.from('one_time_fee_payments').insert({
      fee_type_id: collectingFor.id,
      student_id: collectForm.student_id,
      amount_paid: amount,
      payment_method: collectForm.payment_method,
      receipt_no: collectForm.receipt_no || null,
    })

    if (payError) {
      setError(payError.message)
      setSavingCollect(false)
      return
    }

    // Post to Accounts as income, same pattern as monthly fee collection.
    const { error: acctError } = await supabase.from('accounts_transactions').insert({
      type: 'income',
      category: 'student_fee',
      amount,
      transaction_date: new Date().toISOString().slice(0, 10),
      training_center_id: student?.training_center_id || null,
      related_student_id: collectForm.student_id,
      description: `${collectingFor.name} — ${student?.full_name}`,
    })

    setSavingCollect(false)
    if (acctError) {
      setError(`Payment recorded, but failed to post to Accounts: ${acctError.message}`)
    }
    setCollectingFor(null)
    loadData()
  }

  const unpaidStudentsFor = (feeTypeId) => {
    const paidIds = studentsPaidFor(feeTypeId)
    return students.filter((s) => !paidIds.has(s.id))
  }

  return (
    <div className="p-12 max-md:p-6 max-w-[1000px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Fee Setup</h1>
      <p className="text-charcoal mb-9">
        Define monthly rates per batch and one-time fees (admission, form). Monthly rates feed{' '}
        <Link to="/admin/fees" className="underline">Fee Management</Link>; collected payments post to{' '}
        <Link to="/admin/accounts" className="underline">Accounts</Link>.
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

            {collectingFor && (
              <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-6 max-w-[420px]">
                <h3 className="font-semibold text-base text-ink mb-1.5">Collect: {collectingFor.name}</h3>
                <p className="text-[0.85rem] mb-4 text-charcoal">Standard amount: ₹{Number(collectingFor.amount).toLocaleString('en-IN')}</p>
                <form onSubmit={handleCollectSubmit} className="flex flex-col gap-3">
                  <select
                    required
                    value={collectForm.student_id}
                    onChange={(e) => setCollectForm({ ...collectForm, student_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">— Select student —</option>
                    {unpaidStudentsFor(collectingFor.id).map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <input
                    type="number" placeholder="Amount paid (₹)" required step="0.01"
                    value={collectForm.amount_paid}
                    onChange={(e) => setCollectForm({ ...collectForm, amount_paid: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={collectForm.payment_method}
                    onChange={(e) => setCollectForm({ ...collectForm, payment_method: e.target.value })}
                    className={inputCls}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="text" placeholder="Receipt number (optional)"
                    value={collectForm.receipt_no}
                    onChange={(e) => setCollectForm({ ...collectForm, receipt_no: e.target.value })}
                    className={inputCls}
                  />
                  <p className="text-[0.75rem] text-charcoal">This will also be recorded as income in Accounts.</p>
                  <div className="flex gap-2.5">
                    <button type="submit" className={btnPrimary} disabled={savingCollect}>
                      {savingCollect ? 'Saving…' : 'Record Collection'}
                    </button>
                    <button type="button" className={btnOutline} onClick={() => setCollectingFor(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {viewingPaidFor && (
              <div className="bg-white border border-black/10 border-t-[3px] border-t-gold p-6 mb-6 max-w-[420px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-base text-ink">Paid: {viewingPaidFor.name}</h3>
                  <button className="text-[0.75rem] underline text-charcoal" onClick={() => setViewingPaidFor(null)}>Close</button>
                </div>
                {payments.filter((p) => p.fee_type_id === viewingPaidFor.id).length === 0 ? (
                  <p className="text-sm text-charcoal">No one has paid this yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {payments.filter((p) => p.fee_type_id === viewingPaidFor.id).map((p) => (
                      <li key={p.id} className="text-sm flex justify-between items-center border-b border-black/5 pb-2">
                        <span className="flex items-center gap-1.5"><Check size={14} className="text-brand-red" />{p.students?.full_name}</span>
                        <span className="text-charcoal">₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {oneTimeFees.length === 0 ? (
              <p className="text-charcoal text-sm">No one-time fees set up yet. Add "Admission Fee" and "Form Fee" to match your registration form.</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {oneTimeFees.map((fee) => {
                  const paidCount = studentsPaidFor(fee.id).size
                  return (
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
                      <button
                        className="text-[0.8rem] text-charcoal underline mt-1 block"
                        onClick={() => setViewingPaidFor(fee)}
                      >
                        {paidCount} student{paidCount === 1 ? '' : 's'} paid
                      </button>
                      <p className="text-[0.8rem] mt-1.5" style={{ color: fee.active ? '#B3282D' : '#999' }}>
                        {fee.active ? 'Active' : 'Inactive'}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {fee.active && (
                          <button className={`${btnPrimary} ${btnSm}`} onClick={() => openCollectForm(fee)}>Collect</button>
                        )}
                        <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditOneTime(fee)}>Edit</button>
                        <button className={`${btnOutline} ${btnSm}`} onClick={() => toggleOneTimeActive(fee)}>
                          {fee.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}