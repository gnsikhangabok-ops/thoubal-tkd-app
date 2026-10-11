import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, ReceiptText, Banknote, Smartphone, Landmark, FileText } from 'lucide-react'
import { inputCls, btnPrimary, btnOutline } from '../../../lib/adminUi'
import { rupees, amountInWords } from '../../../lib/documents'
import { METHODS, STATUS_TONE, balance, collectFee, monthLabel, feeStatus } from '../../../lib/fees'
import { StatusPill } from '../../../components/DataTable'

const METHOD_ICON = { Cash: Banknote, UPI: Smartphone, 'Bank Transfer': Landmark, Cheque: FileText }

/** Quick payment sheet for one monthly fee: amount presets, method chips, then a receipt. */
export default function PaymentSheet({ payment, onClose, onPaid, onReceipt }) {
  const due = balance(payment)
  const [amount, setAmount] = useState(String(due))
  const [method, setMethod] = useState('Cash')
  const [receipt, setReceipt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // updated row after saving

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    const value = Number(amount)
    if (!(value > 0)) return setError('Enter the amount received.')
    if (value > due) return setError(`Only ${rupees(due)} is due for this month.`)
    setSaving(true)
    setError('')
    const res = await collectFee(payment, { amount: value, method, receipt, notes })
    setSaving(false)
    if (res.error) return setError(res.error.message)
    setDone(res.data)
    onPaid(res.data, res.warning)
  }

  const name = payment.students?.full_name

  return createPortal(
    <div className="clinic paytm fixed inset-0 z-[60] flex items-end md:items-center justify-center !bg-pay-navy/55 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label={`Collect fee from ${name}`}>
      <div className="w-full max-w-[460px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-[slideIn_.18s_ease-out]">
        <div className="pay-stat !rounded-none !p-5 relative overflow-hidden">
          <button type="button" onClick={onClose} className="absolute right-3 top-3 grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15" aria-label="Close"><X size={20} /></button>
          <p className="text-xs text-white/75">{monthLabel(payment.period_month)} · {payment.students?.batches?.name || 'Monthly fee'}</p>
          <h2 className="!text-white text-xl font-bold mt-0.5 pr-10 truncate">{name}</h2>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[['Billed', (done || payment).amount_due], ['Paid', (done || payment).amount_paid], ['Balance', balance(done || payment)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 py-2">
                <div className="text-[0.65rem] uppercase tracking-wider text-white/70">{k}</div>
                <strong className="block text-lg tabular-nums">{rupees(v)}</strong>
              </div>
            ))}
          </div>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <CheckCircle2 size={48} className="mx-auto text-[color:var(--status-ok)]" />
            <p className="text-lg font-bold text-heading mt-3">{rupees(amount)} received</p>
            <p className="text-sm text-muted mt-1">{amountInWords(amount)} · {method}</p>
            <div className="mt-2"><StatusPill tone={STATUS_TONE[feeStatus(done)]}>{feeStatus(done)}</StatusPill></div>
            <div className="flex gap-2 justify-center mt-6">
              <button className={btnPrimary} onClick={() => onReceipt(done)}><ReceiptText size={16} /> View receipt</button>
              <button className={btnOutline} onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 flex flex-col gap-4">
            <div>
              <label htmlFor="pay-amount" className="text-xs font-semibold text-muted">Amount received</label>
              <div className="relative mt-1.5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-subtle">₹</span>
                <input id="pay-amount" type="number" min="0" step="1" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)}
                  className={`${inputCls} w-full !pl-9 !py-3 text-2xl font-bold tabular-nums`} />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[['Full', due], ['Half', Math.round(due / 2)]].map(([l, v]) => (
                  <button key={l} type="button" onClick={() => setAmount(String(v))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${Number(amount) === v ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body hover:bg-pay-bg'}`}>
                    {l} · {rupees(v)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted">Method</span>
              <div className="grid grid-cols-4 gap-2 mt-1.5" role="group" aria-label="Payment method">
                {METHODS.map((m) => {
                  const Icon = METHOD_ICON[m]
                  const on = method === m
                  return (
                    <button key={m} type="button" aria-pressed={on} onClick={() => setMethod(m)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[0.7rem] font-semibold transition ${on ? 'border-pay-action bg-pay-sky text-heading ring-1 ring-pay-action' : 'border-pay-line text-muted hover:bg-pay-bg'}`}>
                      <Icon size={18} /> {m === 'Bank Transfer' ? 'Bank' : m}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder={method === 'UPI' ? 'UPI ref / receipt no.' : 'Receipt no. (auto if blank)'} value={receipt} onChange={(e) => setReceipt(e.target.value)} />
              <input className={inputCls} placeholder="Note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl px-4 py-2.5 text-sm">{error}</p>}
            <button type="submit" className={`${btnPrimary} !py-3 text-base`} disabled={saving}>
              {saving ? 'Saving…' : `Collect ${rupees(Number(amount) || 0)}`}
            </button>
            <p className="text-[0.7rem] text-subtle text-center -mt-2">Posted to Accounts automatically.</p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
