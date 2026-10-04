import logo from '../../assets/logo.png'
import QrCode from './QrCode'
import { ACADEMY, receiptNo, formatDate, formatMonth, rupees, amountInWords, receiptQrText } from '../../lib/documents'

// A5 fee receipt. Fixed light colours: it is a printed document.
export default function FeeReceipt({ payment, studentName }) {
  const balance = Math.max(0, (payment.amount_due || 0) - (payment.amount_paid || 0))
  const stamp = { paid: ['PAID', '#047857'], waived: ['WAIVED', '#5B6B82'] }[payment.status] || ['PART PAID', '#B45309']

  return (
    <div className="w-[148mm] min-h-[200mm] bg-white text-[#0B2350] rounded-[2mm] shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-[9mm] font-body relative text-[3.4mm]">
      <div className="flex items-center gap-[3mm] pb-[4mm] border-b-2 border-[#002E6E]">
        <img src={logo} alt="" className="w-[15mm] h-[15mm] object-contain" />
        <div className="flex-1 leading-tight">
          <div className="font-bold text-[5mm]">{ACADEMY.name}</div>
          <div className="text-[2.8mm] text-[#4A5A73]">{ACADEMY.body} · Regd. No. {ACADEMY.regNo}</div>
        </div>
      </div>

      <div className="flex items-end justify-between mt-[5mm]">
        <div>
          <div className="text-[2.8mm] uppercase tracking-wider text-[#5B6B82]">Fee Receipt</div>
          <div className="font-bold text-[4.2mm]">{receiptNo(payment)}</div>
        </div>
        <div className="text-right">
          <div className="text-[2.8mm] text-[#5B6B82]">Date</div>
          <div className="font-semibold">{formatDate(payment.paid_on || new Date())}</div>
        </div>
      </div>

      <table className="w-full mt-[6mm] border-collapse">
        <tbody>
          {[
            ['Received from', studentName],
            ['Towards', `Monthly training fee — ${formatMonth(payment.period_month)}`],
            ['Payment method', payment.payment_method || '—'],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-[#E3EAF3]">
              <td className="py-[2.2mm] text-[#5B6B82] w-[38mm]">{k}</td>
              <td className="py-[2.2mm] font-semibold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-[6mm] rounded-[2mm] bg-[#F3F7FB] p-[4mm]">
        {[['Amount due', payment.amount_due], ['Amount paid', payment.amount_paid], ['Balance', balance]].map(([k, v], i) => (
          <div key={k} className={`flex justify-between py-[1.2mm] ${i === 1 ? 'font-bold text-[4.6mm]' : ''}`}>
            <span>{k}</span><span>{rupees(v)}</span>
          </div>
        ))}
        <div className="mt-[2mm] pt-[2mm] border-t border-[#d5dfec] text-[3mm] italic">{amountInWords(payment.amount_paid)}</div>
      </div>

      <div className="flex items-end justify-between mt-[10mm]">
        <QrCode value={receiptQrText(payment, studentName)} size={96} className="w-[26mm] h-[26mm]" />
        <div className="text-center text-[3mm]">
          <div className="border-t border-[#0B2350] w-[45mm] mb-[1mm]" />
          Authorised signatory
        </div>
      </div>

      <div
        className="absolute top-[52mm] right-[12mm] rotate-[-14deg] border-[1mm] rounded-[2mm] px-[4mm] py-[1mm] font-bold text-[7mm] tracking-widest opacity-80"
        style={{ color: stamp[1], borderColor: stamp[1] }}
      >
        {stamp[0]}
      </div>

      <p className="absolute bottom-[7mm] inset-x-[9mm] text-center text-[2.6mm] text-[#5B6B82]">
        This is a computer-generated receipt. Scan the QR code to read the payment details.
      </p>
    </div>
  )
}
