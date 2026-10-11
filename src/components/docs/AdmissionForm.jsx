import logo from '../../assets/logo.png'
import QrCode from './QrCode'
import { beltLabel } from '../../lib/belts'
import { ACADEMY, formatDate, rupees, amountInWords } from '../../lib/documents'
import { ageFrom } from '../../lib/people'
import { applicationNo, admissionQrText, netFee, balanceDue, DOCUMENTS, STAGE, SOURCE_LABEL } from '../../lib/admissions'

const Section = ({ title, rows }) => (
  <section className="mt-[5mm]">
    <h3 className="text-[2.8mm] font-bold uppercase tracking-[0.12em] text-[#0079C1] border-b border-[#D6E6F5] pb-[1mm] mb-[1.5mm]">{title}</h3>
    <div className="grid grid-cols-2 gap-x-[6mm]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-[2mm] py-[1.1mm] border-b border-dotted border-[#E3EAF3]">
          <span className="w-[32mm] shrink-0 text-[#5B6B82]">{k}</span>
          <span className="font-semibold break-words min-w-0">{v || '—'}</span>
        </div>
      ))}
    </div>
  </section>
)

// A4 admission form: the family's copy of the application, and the admission letter once enrolled.
// Fixed light colours on purpose: it is a printed document.
export default function AdmissionForm({ admission: a }) {
  const stamp = {
    enrolled: ['ADMITTED', '#047857'], approved: ['APPROVED', '#047857'], rejected: ['NOT ADMITTED', '#B91C1C'],
    waitlisted: ['WAITLISTED', '#5B6B82'], withdrawn: ['WITHDRAWN', '#5B6B82'],
  }[a.status] || ['PROVISIONAL', '#B45309']
  const age = ageFrom(a.dob)

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-[#0B2350] shadow-[0_8px_30px_rgba(0,0,0,0.25)] font-body relative text-[3.2mm] overflow-hidden">
      <div className="h-[3mm]" style={{ background: 'linear-gradient(90deg,#002E6E,#0057A8 60%,#00BAF2)' }} />
      <div className="px-[14mm] pt-[9mm] pb-[16mm]">
        <header className="flex items-center gap-[4mm] pb-[4mm] border-b-2 border-[#002E6E]">
          <img src={logo} alt="" className="w-[20mm] h-[20mm] object-contain" />
          <div className="flex-1 leading-tight">
            <div className="font-bold text-[6.2mm] tracking-tight">{ACADEMY.name}</div>
            <div className="text-[2.8mm] text-[#4A5A73] mt-[0.5mm]">{ACADEMY.body} · Regd. No. {ACADEMY.regNo}</div>
            <div className="text-[2.6mm] text-[#4A5A73]">{ACADEMY.affiliations}</div>
          </div>
          <div className="w-[26mm] h-[32mm] border border-dashed border-[#9FB3CC] rounded-[1.5mm] grid place-items-center text-center text-[2.4mm] text-[#8193AC] shrink-0">
            Affix<br />passport<br />photo
          </div>
        </header>

        <div className="flex items-end justify-between mt-[5mm]">
          <div>
            <div className="text-[2.8mm] uppercase tracking-[0.18em] text-[#5B6B82]">Admission Form</div>
            <div className="font-bold text-[5mm]">{applicationNo(a)}</div>
          </div>
          <div className="text-right text-[2.9mm] leading-snug">
            <div><span className="text-[#5B6B82]">Applied on</span> <strong>{formatDate(a.created_at)}</strong></div>
            <div><span className="text-[#5B6B82]">Status</span> <strong>{STAGE[a.status]?.label}</strong></div>
            <div><span className="text-[#5B6B82]">Source</span> <strong>{SOURCE_LABEL[a.source] || '—'}</strong></div>
          </div>
        </div>

        <Section title="Applicant" rows={[
          ['Full name', a.full_name],
          ['Date of birth', a.dob ? `${formatDate(a.dob)}${age != null ? ` (${age} yrs)` : ''}` : null],
          ['Gender', a.gender && a.gender.charAt(0).toUpperCase() + a.gender.slice(1)],
          ['Blood group', a.blood_group],
          ['School / college', a.school],
          ['Current belt', beltLabel(a.current_belt)],
        ]} />

        <Section title="Parent / Guardian" rows={[
          ['Name', a.guardian_name],
          ['Relation', a.guardian_relation],
          ['Phone', a.guardian_phone],
          ['Email', a.guardian_email],
          ['Emergency phone', a.emergency_phone],
          ['Address', a.address],
        ]} />

        <Section title="Training" rows={[
          ['Training centre', a.training_centers?.name],
          ['Batch', a.batches?.name],
          ['Prior experience', a.prior_experience],
          ['Trial class', a.trial_date ? `${formatDate(a.trial_date)}${a.trial_rating ? ` · rated ${a.trial_rating}/5` : ''}` : null],
        ]} />

        <section className="mt-[5mm] grid grid-cols-2 gap-[6mm]">
          <div>
            <h3 className="text-[2.8mm] font-bold uppercase tracking-[0.12em] text-[#0079C1] border-b border-[#D6E6F5] pb-[1mm] mb-[1.5mm]">Health</h3>
            <p className="min-h-[12mm] leading-snug">{a.medical_notes || 'No medical conditions declared.'}</p>
            <h3 className="mt-[4mm] text-[2.8mm] font-bold uppercase tracking-[0.12em] text-[#0079C1] border-b border-[#D6E6F5] pb-[1mm] mb-[1.5mm]">Documents</h3>
            <ul className="space-y-[1mm]">
              {DOCUMENTS.map(([k, label]) => (
                <li key={k} className="flex items-center gap-[2mm]">
                  <span className={`grid place-items-center w-[3.6mm] h-[3.6mm] border rounded-[0.6mm] text-[2.6mm] font-bold ${a.documents?.[k] ? 'bg-[#047857] border-[#047857] text-white' : 'border-[#9FB3CC]'}`}>
                    {a.documents?.[k] ? '✓' : ''}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[2.8mm] font-bold uppercase tracking-[0.12em] text-[#0079C1] border-b border-[#D6E6F5] pb-[1mm] mb-[1.5mm]">Fees</h3>
            <div className="rounded-[2mm] bg-[#F3F7FB] p-[3.5mm]">
              {[['Admission fee', a.admission_fee], ['Discount', -Number(a.discount || 0)], ['Net payable', netFee(a)], ['Paid', a.amount_paid], ['Balance', balanceDue(a)]].map(([k, v], i) => (
                <div key={k} className={`flex justify-between py-[0.8mm] ${i === 2 ? 'border-t border-[#d5dfec] mt-[1mm] pt-[1.5mm] font-bold' : ''} ${i === 4 ? 'font-bold' : ''}`}>
                  <span>{k}</span><span>{v < 0 ? `− ${rupees(-v)}` : rupees(v)}</span>
                </div>
              ))}
              {Number(a.amount_paid) > 0 && (
                <div className="mt-[1.5mm] pt-[1.5mm] border-t border-[#d5dfec] text-[2.6mm] italic">
                  {amountInWords(a.amount_paid)}{a.payment_method ? ` · ${a.payment_method}` : ''}{a.receipt_no ? ` · Rcpt ${a.receipt_no}` : ''}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-[5mm] text-[2.8mm] leading-snug">
          <h3 className="text-[2.8mm] font-bold uppercase tracking-[0.12em] text-[#0079C1] border-b border-[#D6E6F5] pb-[1mm] mb-[1.5mm]">Declaration</h3>
          <p>
            I declare that the details above are true. I have read and agree to the academy's rules & regulations
            {a.rules_acknowledged ? ' (acknowledged)' : ''}, and I confirm the applicant is medically fit to train in Taekwondo.
            {' '}{a.photo_consent ? 'I consent' : 'I do not consent'} to photographs of the applicant being used on the academy's website and social media.
          </p>
        </section>

        <div className="flex items-end justify-between mt-[12mm]">
          {['Signature of parent / guardian', 'Head coach', 'Authorised signatory'].map((s) => (
            <div key={s} className="text-center text-[2.7mm]">
              <div className="border-t border-[#0B2350] w-[48mm] mb-[1mm]" />
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-[8mm] inset-x-[14mm] flex items-end justify-between gap-[4mm]">
        <p className="text-[2.4mm] text-[#5B6B82] max-w-[130mm]">
          Computer-generated admission form. Scan the QR code to verify the application number and status.
        </p>
        <QrCode value={admissionQrText(a)} size={96} className="w-[22mm] h-[22mm]" />
      </div>

      <div
        className="absolute top-[58mm] right-[16mm] rotate-[-12deg] border-[1mm] rounded-[2mm] px-[4mm] py-[1mm] font-bold text-[6.5mm] tracking-widest opacity-75"
        style={{ color: stamp[1], borderColor: stamp[1] }}
      >
        {stamp[0]}
      </div>
    </div>
  )
}
