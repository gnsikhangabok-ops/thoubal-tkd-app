import logo from '../../assets/logo.png'
import QrCode from './QrCode'
import { beltLabel, BELT_COLORS } from '../../lib/belts'
import { ACADEMY, certificateNo, formatDate, certificateQrText } from '../../lib/documents'

// A4 landscape promotion certificate. Fixed light colours: it is a printed document.
export default function BeltCertificate({ result, studentName, exam }) {
  return (
    <div className="w-[277mm] h-[188mm] bg-white text-[#0B2350] shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-[6mm] font-body">
      <div className="h-full border-[1.6mm] border-[#002E6E] p-[1.4mm]">
        <div className="h-full border-[0.5mm] border-[#C9A227] relative flex flex-col items-center text-center px-[18mm] pt-[10mm]">
          {/* belt-colour ribbon */}
          <div className="absolute top-0 inset-x-0 flex h-[2.5mm]">
            {['white', 'yellow', 'green', 'blue', 'red', 'black_1'].map((b) => (
              <span key={b} className="flex-1" style={{ background: BELT_COLORS[b] }} />
            ))}
          </div>

          <img src={logo} alt="" className="w-[24mm] h-[24mm] object-contain" />
          <div className="font-bold text-[6mm] tracking-wide mt-[2mm]">{ACADEMY.name.toUpperCase()}</div>
          <div className="text-[3.2mm] text-[#4A5A73]">{ACADEMY.body} · Regd. No. {ACADEMY.regNo}</div>

          <div className="mt-[6mm] text-[11mm] leading-none font-bold" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#8A6D12' }}>
            Certificate of Promotion
          </div>
          <div className="mt-[5mm] text-[4mm] text-[#4A5A73]">This is to certify that</div>
          <div className="mt-[3mm] text-[10mm] font-bold border-b-[0.4mm] border-[#C9A227] px-[10mm] pb-[1mm]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {studentName}
          </div>
          <p className="mt-[5mm] text-[4.2mm] leading-relaxed max-w-[200mm]">
            has successfully passed the grading examination <b>{exam?.title || ''}</b> held on <b>{formatDate(exam?.exam_date)}</b>
            {exam?.location ? <> at <b>{exam.location}</b></> : null} and is hereby promoted from{' '}
            <b>{beltLabel(result.from_belt)}</b> to
          </p>
          <div className="mt-[3mm] inline-flex items-center gap-[3mm] text-[7mm] font-bold">
            <span className="w-[16mm] h-[4mm] rounded-full border border-black/30" style={{ background: BELT_COLORS[result.to_belt] }} />
            {beltLabel(result.to_belt)}
          </div>

          <div className="mt-auto mb-[8mm] pt-[4mm] w-full flex items-end justify-between">
            <Signature label="Head Coach" />
            <div className="flex flex-col items-center">
              <QrCode value={certificateQrText(result, studentName, exam)} size={96} className="w-[24mm] h-[24mm]" />
              <div className="text-[2.8mm] mt-[1mm]">No. {certificateNo(result)}</div>
            </div>
            <Signature label="Secretary, District Association" />
          </div>
          <div className="absolute bottom-[3mm] inset-x-0 text-[2.6mm] text-[#5B6B82]">{ACADEMY.affiliations}</div>
        </div>
      </div>
    </div>
  )
}

function Signature({ label }) {
  return (
    <div className="text-center text-[3.4mm] w-[60mm]">
      <div className="border-t-[0.4mm] border-[#0B2350] mb-[1.5mm]" />
      {label}
    </div>
  )
}
