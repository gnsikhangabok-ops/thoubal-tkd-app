import logo from '../../assets/logo.png'
import QrCode from './QrCode'
import { beltLabel, BELT_COLORS } from '../../lib/belts'
import { ACADEMY, studentIdNo, idValidTill, formatDate, studentQrText } from '../../lib/documents'

// Two-sided CR80 identity card (85.6 × 54 mm), shown side by side for printing.
// Fixed light colours on purpose: it is a printed document, not themed UI.
export default function StudentIdCard({ student }) {
  const initials = student.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const card = 'w-[85.6mm] h-[54mm] rounded-[3mm] overflow-hidden bg-white text-[#0B2350] shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative font-body'

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {/* Front */}
      <div className={card}>
        <div className="h-[14mm] flex items-center gap-[2mm] px-[3mm] text-white" style={{ background: 'linear-gradient(135deg,#002E6E,#0057A8 60%,#00BAF2)' }}>
          <span className="grid place-items-center w-[10mm] h-[10mm] rounded-full bg-white shrink-0">
            <img src={logo} alt="" className="w-[8mm] h-[8mm] object-contain" />
          </span>
          <div className="leading-tight min-w-0">
            <div className="font-bold text-[3.1mm] truncate">{ACADEMY.name.toUpperCase()}</div>
            <div className="text-[2mm] opacity-90 truncate">{ACADEMY.body}</div>
          </div>
        </div>
        <div className="flex gap-[3mm] px-[3mm] pt-[2.5mm]">
          <div className="w-[19mm] h-[23mm] rounded-[1.5mm] bg-[#E6F7FD] border border-[#cfe3f2] grid place-items-center shrink-0 overflow-hidden">
            {student.photo_url
              ? <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
              : <span className="font-bold text-[7mm] text-[#0079C1]">{initials}</span>}
          </div>
          <div className="min-w-0 flex-1 text-[2.4mm] leading-[1.35]">
            <div className="font-bold text-[3.3mm] leading-tight mb-[1mm] truncate">{student.full_name}</div>
            <Row k="ID No." v={studentIdNo(student)} strong />
            <Row k="Belt" v={<span className="inline-flex items-center gap-[1mm]"><span className="w-[2.4mm] h-[2.4mm] rounded-full border border-black/20" style={{ background: BELT_COLORS[student.current_belt] }} />{beltLabel(student.current_belt)}</span>} />
            <Row k="Centre" v={student.training_centers?.name || '—'} />
            <Row k="Batch" v={student.batches?.name || '—'} />
            <Row k="D.O.B." v={formatDate(student.dob)} />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[5.5mm] flex items-center justify-between px-[3mm] bg-[#F3F7FB] text-[2.1mm]">
          <span>STUDENT IDENTITY CARD</span>
          <span>Valid till <b>{idValidTill()}</b></span>
        </div>
      </div>

      {/* Back */}
      <div className={card}>
        <div className="flex gap-[3mm] p-[3mm] h-full">
          <div className="flex-1 min-w-0 text-[2.3mm] leading-[1.45]">
            <div className="font-bold text-[2.8mm] mb-[1mm]">Emergency contact</div>
            <Row k="Guardian" v={student.guardian_name || '—'} />
            <Row k="Phone" v={student.guardian_phone || '—'} />
            {student.address && <Row k="Address" v={student.address} />}
            <div className="mt-[2mm] text-[2mm] text-[#4A5A73] leading-snug">
              This card is the property of {ACADEMY.name}. If found, please return it to the academy office.
              Regd. No. {ACADEMY.regNo}.
            </div>
          </div>
          <div className="flex flex-col items-center justify-between shrink-0">
            <QrCode value={studentQrText(student)} size={78} className="w-[21mm] h-[21mm]" />
            <div className="text-center text-[1.9mm] leading-tight">
              <div className="border-t border-[#0B2350] w-[22mm] mb-[0.6mm]" />
              Head Coach
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v, strong }) {
  return (
    <div className="flex gap-[1.5mm]">
      <span className="text-[#5B6B82] w-[11mm] shrink-0">{k}</span>
      <span className={`min-w-0 truncate ${strong ? 'font-bold' : 'font-medium'}`}>{v}</span>
    </div>
  )
}
