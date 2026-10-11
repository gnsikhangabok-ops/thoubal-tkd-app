import { Users, AlarmClock, CalendarDays, Smartphone, Landmark, ReceiptText, Check } from 'lucide-react'
import { inputCls } from '../../../lib/adminUi'
import { rupees } from '../../../lib/documents'
import QrCode from '../../../components/docs/QrCode'
import { ordinal } from '../../../lib/fees'

const ALL_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']

function Card({ icon: Icon, title, hint, children, aside }) {
  return (
    <section className="bg-surface rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-pay-sky text-pay-action shrink-0"><Icon size={18} /></span>
          <div className="min-w-0">
            <h3 className="font-semibold text-heading">{title}</h3>
            {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'bg-pay-action' : 'bg-pay-line'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

const Field = ({ label, hint, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-muted">{label}</span>
    {children}
    {hint && <span className="text-[0.7rem] text-subtle">{hint}</span>}
  </label>
)

/** Discounts & late fees, or payments & receipts, editing the shared settings draft. */
export default function FeePolicies({ section, draft, setDraft, siblingGroups, sampleFee }) {
  const set = (patch) => setDraft({ ...draft, ...patch })
  const lf = draft.late_fee
  const sib = draft.sibling
  const lateExample = lf.type === 'percent' ? Math.round((sampleFee * Number(lf.amount || 0)) / 100) : Number(lf.amount || 0)

  if (section === 'discounts') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={Users} title="Sibling discount" hint="Off the monthly fee of the 2nd and later child of the same guardian (matched by phone number)."
          aside={<Toggle on={sib.enabled} onChange={(v) => set({ sibling: { ...sib, enabled: v } })} label="Sibling discount" />}>
          <div className={sib.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <Field label="Discount (%)">
              <input type="number" min="0" max="100" className={inputCls} value={sib.percent} onChange={(e) => set({ sibling: { ...sib, percent: e.target.value } })} />
            </Field>
            <div className="mt-4 rounded-xl bg-pay-bg p-3 text-sm">
              <p className="text-body">Example on {rupees(sampleFee)}: 1st child pays <strong className="text-heading">{rupees(sampleFee)}</strong>, each sibling pays <strong className="text-heading">{rupees(sampleFee - Math.round((sampleFee * Number(sib.percent || 0)) / 100))}</strong>.</p>
              <p className="text-xs text-subtle mt-1">{siblingGroups} famil{siblingGroups === 1 ? 'y has' : 'ies have'} more than one active student. Applied when monthly fees are billed.</p>
            </div>
          </div>
        </Card>

        <Card icon={AlarmClock} title="Late fee" hint="Added when collecting a monthly fee paid after the due date and grace period. Staff can untick it per payment."
          aside={<Toggle on={lf.enabled} onChange={(v) => set({ late_fee: { ...lf, enabled: v } })} label="Late fee" />}>
          <div className={`grid gap-3 ${lf.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <div className="inline-flex rounded-full border border-pay-line bg-pay-bg p-0.5 self-start" role="group" aria-label="Late fee type">
              {[['fixed', 'Fixed ₹'], ['percent', '% of fee']].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={lf.type === k} onClick={() => set({ late_fee: { ...lf, type: k } })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${lf.type === k ? 'bg-pay-action text-white' : 'text-muted'}`}>{l}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={lf.type === 'percent' ? 'Late fee (%)' : 'Late fee (₹)'}>
                <input type="number" min="0" className={inputCls} value={lf.amount} onChange={(e) => set({ late_fee: { ...lf, amount: e.target.value } })} />
              </Field>
              <Field label="Grace period (days)">
                <input type="number" min="0" max="27" className={inputCls} value={draft.grace_days} onChange={(e) => set({ grace_days: e.target.value })} />
              </Field>
            </div>
            <p className="rounded-xl bg-pay-bg p-3 text-sm text-body">
              A {rupees(sampleFee)} fee due on the {ordinal(Number(draft.due_day) || 10)} gets <strong className="text-heading">{rupees(lateExample)}</strong> added if still unpaid after the {ordinal(Math.min(31, (Number(draft.due_day) || 10) + (Number(draft.grace_days) || 0)))}.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const upiPreview = draft.upi_id ? `upi://pay?${new URLSearchParams({ pa: draft.upi_id, pn: draft.payee_name || 'Academy', am: String(sampleFee), cu: 'INR', tn: 'Monthly fee' })}` : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card icon={CalendarDays} title="Due date" hint="Monthly fees fall due on this day; after it they show as overdue on the collection desk and in Fee Dues.">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Due day">
          {[1, 5, 7, 10, 15, 20, 25, 28].map((d) => (
            <button key={d} type="button" aria-pressed={Number(draft.due_day) === d} onClick={() => set({ due_day: d })}
              className={`min-w-11 rounded-xl px-3 py-2 text-sm font-semibold border ${Number(draft.due_day) === d ? 'bg-pay-action border-pay-action text-white' : 'border-pay-line text-body hover:bg-pay-bg'}`}>{ordinal(d)}</button>
          ))}
        </div>
        <p className="text-xs text-subtle mt-3">Currently due on the <strong className="text-heading">{ordinal(Number(draft.due_day) || 10)}</strong> of every month.</p>
      </Card>

      <Card icon={Check} title="Payment methods" hint="Offered when collecting fees, admission fees and one-time fees.">
        <div className="flex flex-wrap gap-2">
          {ALL_METHODS.map((m) => {
            const on = draft.methods.includes(m)
            return (
              <button key={m} type="button" aria-pressed={on}
                onClick={() => set({ methods: on ? (draft.methods.length > 1 ? draft.methods.filter((x) => x !== m) : draft.methods) : ALL_METHODS.filter((x) => x === m || draft.methods.includes(x)) })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold border ${on ? 'bg-pay-sky border-pay-action text-heading' : 'border-pay-line text-muted hover:bg-pay-bg'}`}>
                {on && <Check size={14} />} {m}
              </button>
            )
          })}
        </div>
        <p className="text-[0.7rem] text-subtle mt-3">At least one method stays on. The first is pre-selected.</p>
      </Card>

      <Card icon={Smartphone} title="UPI" hint="Shows a scan-to-pay QR code with the exact amount when staff choose UPI, and adds the UPI ID to WhatsApp reminders.">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
          <div className="grid gap-3">
            <Field label="UPI ID"><input className={inputCls} placeholder="academy@okaxis" value={draft.upi_id} onChange={(e) => set({ upi_id: e.target.value.trim() })} /></Field>
            <Field label="Payee name"><input className={inputCls} value={draft.payee_name} onChange={(e) => set({ payee_name: e.target.value })} /></Field>
          </div>
          <div className="rounded-2xl border border-pay-line bg-white p-2 w-[132px] h-[132px] grid place-items-center text-center text-[0.68rem] text-[#5B6B82]">
            {upiPreview ? <QrCode value={upiPreview} size={116} /> : 'QR preview appears here'}
          </div>
        </div>
      </Card>

      <Card icon={Landmark} title="Bank transfer details" hint="Shown to staff when the guardian pays by bank transfer.">
        <textarea rows={4} className={`${inputCls} w-full font-body`} placeholder={'Account name\nAccount number\nIFSC · Branch'} value={draft.bank_details} onChange={(e) => set({ bank_details: e.target.value })} />
      </Card>

      <Card icon={ReceiptText} title="Receipts" hint="Printed on every fee receipt, in the office and in the student portal.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Receipt number prefix" hint={`e.g. ${(draft.receipt_prefix || 'TTA-R')}-202610-1A2B3C4D`}>
            <input className={inputCls} maxLength={12} value={draft.receipt_prefix} onChange={(e) => set({ receipt_prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} />
          </Field>
          <Field label="Note on receipts" hint="Refund policy, thank-you line, office hours…">
            <input className={inputCls} maxLength={140} value={draft.receipt_note} onChange={(e) => set({ receipt_note: e.target.value })} />
          </Field>
        </div>
      </Card>
    </div>
  )
}
