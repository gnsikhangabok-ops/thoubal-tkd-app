import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  IdCard, Pencil, Printer, AlertTriangle, CalendarCheck, Wallet, Award, TrendingUp, Medal, Trophy,
  FileText, UserRound, LayoutDashboard, ReceiptText, Power,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { btnPrimary, btnOutline, btnSm } from '../../lib/adminUi'
import { beltLabel, BELT_COLORS } from '../../lib/belts'
import { ageFrom, initials } from '../../lib/people'
import { studentIdNo, formatDate, formatMonth, rupees, receiptNo, certificateNo } from '../../lib/documents'
import ModuleHeader from '../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../components/DataTable'
import DocumentModal from '../../components/docs/DocumentModal'
import StudentIdCard from '../../components/docs/StudentIdCard'
import FeeReceipt from '../../components/docs/FeeReceipt'
import BeltCertificate from '../../components/docs/BeltCertificate'

const TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { value: 'fees', label: 'Fees', icon: Wallet },
  { value: 'belts', label: 'Belt history', icon: Award },
  { value: 'performance', label: 'Performance', icon: TrendingUp },
  { value: 'achievements', label: 'Achievements', icon: Medal },
  { value: 'events', label: 'Events', icon: Trophy },
  { value: 'documents', label: 'Documents', icon: FileText },
]

const ATT_TONE = { present: 'ok', late: 'warn', absent: 'bad', excused: 'neutral' }
const FEE_TONE = { paid: 'ok', pending: 'warn', overdue: 'bad', waived: 'neutral' }
const RATING_TONE = { Excellent: 'ok', Good: 'info', Satisfactory: 'warn', 'Needs Improvement': 'bad' }

/**
 * A student's complete record, laid out like a patient chart: a summary banner that stays
 * the same on every tab, alerts (medical notes, unsigned rules, dues), and one tab per area.
 */
export default function StudentFile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview'
  const setTab = (value) => setParams(value === 'overview' ? {} : { tab: value }, { replace: true })

  const [student, setStudent] = useState(null)
  const [rec, setRec] = useState({ attendance: [], fees: [], grading: [], performance: [], achievements: [], events: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doc, setDoc] = useState(null) // { type: 'id' | 'receipt' | 'certificate', data }

  const load = useCallback(async () => {
    const [s, att, fees, grading, perf, ach, ev] = await Promise.all([
      supabase.from('students').select('*, training_centers(name), batches(name, schedule_days, start_time, end_time)').eq('id', id).maybeSingle(),
      supabase.from('attendance').select('*').eq('student_id', id).order('session_date', { ascending: false }),
      supabase.from('fee_payments').select('*').eq('student_id', id).order('period_month', { ascending: false }),
      supabase.from('grading_results').select('*, grading_events(title, exam_date, location)').eq('student_id', id).order('created_at', { ascending: false }),
      supabase.from('student_performance').select('*').eq('student_id', id).order('recorded_on', { ascending: false }),
      supabase.from('achievements').select('*').eq('student_id', id).order('achievement_date', { ascending: false }),
      supabase.from('event_registrations').select('*, events(title, event_date, event_type, location)').eq('student_id', id),
    ])
    if (s.error || !s.data) {
      setError(s.error?.message || 'Student not found.')
      setLoading(false)
      return
    }
    setStudent(s.data)
    setRec({
      attendance: att.data || [], fees: fees.data || [], grading: grading.data || [],
      performance: perf.data || [], achievements: ach.data || [], events: ev.data || [],
    })
    setLoading(false)
  }, [id])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    load()
  }, [load])

  async function toggleActive() {
    const { error } = await supabase.from('students').update({ active: !student.active }).eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  if (loading) return <div className="p-8 max-md:p-4 text-muted">Loading student file…</div>
  if (!student) {
    return (
      <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
        <ModuleHeader title="Student file" crumbs={[{ label: 'Not found' }]} />
        <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>
      </div>
    )
  }

  // --- figures used across tabs ---
  const last30 = rec.attendance.slice(0, 30)
  const attended = last30.filter((a) => a.status === 'present' || a.status === 'late').length
  const attendanceRate = last30.length ? Math.round((attended / last30.length) * 100) : null
  const dues = rec.fees.filter((f) => f.status === 'pending' || f.status === 'overdue')
  const outstanding = dues.reduce((sum, f) => sum + Math.max(0, (f.amount_due || 0) - (f.amount_paid || 0)), 0)
  const lastGrading = rec.grading[0]
  const age = ageFrom(student.dob)

  const alerts = [
    student.medical_notes && { tone: 'bad', title: 'Medical notes', body: student.medical_notes },
    !student.rules_acknowledged && { tone: 'warn', title: 'Rules not signed', body: 'The academy rules & regulations have not been acknowledged yet.' },
    outstanding > 0 && { tone: 'warn', title: 'Fees due', body: `${rupees(outstanding)} outstanding across ${dues.length} month${dues.length === 1 ? '' : 's'}.` },
    !student.active && { tone: 'neutral', title: 'Inactive', body: 'This student is marked inactive.' },
  ].filter(Boolean)

  const counts = {
    attendance: rec.attendance.length, fees: rec.fees.length, belts: rec.grading.length,
    performance: rec.performance.length, achievements: rec.achievements.length, events: rec.events.length,
  }

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Student file"
        crumbs={[{ label: student.full_name }]}
        actions={
          <>
            <button className={btnOutline} onClick={() => navigate(`/admin/students?edit=${id}`)}><Pencil size={15} /> Edit</button>
            <button className={btnOutline} onClick={() => setDoc({ type: 'id' })}><IdCard size={16} /> ID card</button>
            <button className={btnPrimary} onClick={() => window.print()}><Printer size={16} /> Print file</button>
          </>
        }
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {/* Summary banner — the "patient banner": identical on every tab */}
      <section aria-label="Student summary" className="bg-surface rounded-2xl shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 p-5 md:p-6 border-l-4" style={{ borderLeftColor: student.active ? 'var(--status-ok)' : 'var(--color-pay-line)' }}>
          <span className="grid place-items-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-pay-sky text-pay-action text-2xl font-bold shrink-0" aria-hidden="true">
            {initials(student.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-heading">{student.full_name}</h2>
              <StatusPill tone={student.active ? 'ok' : 'neutral'}>{student.active ? 'Active' : 'Inactive'}</StatusPill>
            </div>
            <p className="text-sm text-subtle mt-0.5 tabular-nums">{studentIdNo(student)}</p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 text-sm w-full lg:w-auto">
            <Fact label="Age / Gender" value={[age != null ? `${age} yrs` : null, student.gender].filter(Boolean).join(' · ') || '—'} />
            <Fact label="Date of birth" value={formatDate(student.dob)} />
            <Fact label="Belt" value={
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/15" style={{ background: BELT_COLORS[student.current_belt] }} aria-hidden="true" />
                {beltLabel(student.current_belt)}
              </span>
            } />
            <Fact label="Centre / Batch" value={[student.training_centers?.name, student.batches?.name].filter(Boolean).join(' · ') || '—'} />
            <Fact label="Guardian" value={student.guardian_phone ? <a href={`tel:${student.guardian_phone}`} className="hover:text-pay-action">{student.guardian_name || 'Call'} · {student.guardian_phone}</a> : student.guardian_name || '—'} />
          </dl>
        </div>
        {alerts.length > 0 && (
          <ul className="border-t border-pay-line bg-pay-bg/60 px-5 md:px-6 py-3 flex flex-wrap gap-2" aria-label="Alerts">
            {alerts.map((a) => (
              <li key={a.title} className="inline-flex items-start gap-2 rounded-xl bg-surface border border-pay-line px-3 py-2 text-sm max-w-full">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: `var(--status-${a.tone === 'neutral' ? 'info' : a.tone})` }} aria-hidden="true" />
                <span><strong className="text-heading">{a.title}:</strong> <span className="text-body">{a.body}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Record tabs */}
      <div role="tablist" aria-label="Student record" className="no-print mt-6 mb-5 flex gap-1 overflow-x-auto border-b border-pay-line [scrollbar-width:none]">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.value
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={`relative shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg ${active ? 'text-pay-action bg-surface' : 'text-muted hover:text-heading'}`}
            >
              <Icon size={15} aria-hidden="true" />
              {t.label}
              {counts[t.value] != null && <span className={`rounded-full px-1.5 text-[0.7rem] tabular-nums ${active ? 'bg-pay-action text-white' : 'bg-pay-line/70 text-body'}`}>{counts[t.value]}</span>}
              {active && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-pay-action" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab).label}>
        {tab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Tile icon={CalendarCheck} label="Attendance (last 30)" value={attendanceRate != null ? `${attendanceRate}%` : '—'} sub={`${attended} of ${last30.length} sessions`} onClick={() => setTab('attendance')} />
            <Tile icon={Wallet} label="Outstanding fees" value={rupees(outstanding)} sub={dues.length ? `${dues.length} month${dues.length === 1 ? '' : 's'} due` : 'All paid'} tone={outstanding > 0 ? 'warn' : 'ok'} onClick={() => setTab('fees')} />
            <Tile icon={Award} label="Last grading" value={lastGrading ? beltLabel(lastGrading.to_belt) : '—'} sub={lastGrading ? `${lastGrading.passed ? 'Passed' : 'Not passed'} · ${formatDate(lastGrading.grading_events?.exam_date)}` : 'No gradings yet'} onClick={() => setTab('belts')} />
            <Tile icon={Medal} label="Achievements" value={rec.achievements.length} sub={rec.achievements[0]?.title || 'None recorded'} onClick={() => setTab('achievements')} />
            <section className="md:col-span-2 bg-surface rounded-2xl shadow-card p-5">
              <h3 className="text-base font-bold mb-3">Latest performance notes</h3>
              {rec.performance.length === 0 ? <p className="text-sm text-muted">No assessments recorded.</p> : (
                <ul className="divide-y divide-pay-line">
                  {rec.performance.slice(0, 4).map((p) => (
                    <li key={p.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0"><strong className="text-heading">{p.category}</strong> <span className="text-muted">· {formatDate(p.recorded_on)}</span>{p.remarks && <span className="block text-body truncate">{p.remarks}</span>}</span>
                      <StatusPill tone={RATING_TONE[p.rating] || 'neutral'}>{p.rating}</StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="md:col-span-2 bg-surface rounded-2xl shadow-card p-5">
              <h3 className="text-base font-bold mb-3">Recent attendance</h3>
              {rec.attendance.length === 0 ? <p className="text-sm text-muted">No attendance marked yet.</p> : (
                <div className="flex flex-wrap gap-1.5" aria-label="Last 30 sessions, newest first">
                  {last30.map((a) => (
                    <span key={a.id} title={`${formatDate(a.session_date)} · ${a.status}`} className="w-6 h-6 rounded-md grid place-items-center text-[0.62rem] font-bold text-white" style={{ background: `var(--status-${ATT_TONE[a.status] === 'neutral' ? 'info' : ATT_TONE[a.status]})` }}>
                      {a.status[0].toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-subtle mt-3">P present · L late · A absent · E excused (newest first)</p>
            </section>
          </div>
        )}

        {tab === 'profile' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Personal">
              <Row k="Full name" v={student.full_name} />
              <Row k="Date of birth" v={formatDate(student.dob)} />
              <Row k="Age" v={age != null ? `${age} years` : '—'} />
              <Row k="Gender" v={student.gender} />
              <Row k="Religion" v={student.religion} />
              <Row k="Address" v={student.address} />
            </Panel>
            <Panel title="Guardian / emergency contact">
              <Row k="Guardian" v={student.guardian_name} />
              <Row k="Phone" v={student.guardian_phone && <a href={`tel:${student.guardian_phone}`} className="text-pay-action hover:underline">{student.guardian_phone}</a>} />
            </Panel>
            <Panel title="Training">
              <Row k="Student ID" v={studentIdNo(student)} />
              <Row k="Current belt" v={beltLabel(student.current_belt)} />
              <Row k="Training centre" v={student.training_centers?.name} />
              <Row k="Batch" v={student.batches?.name} />
              <Row k="Schedule" v={student.batches?.schedule_days?.length ? `${student.batches.schedule_days.join(', ')}${student.batches.start_time ? ` · ${student.batches.start_time.slice(0, 5)}–${student.batches.end_time?.slice(0, 5) || ''}` : ''}` : null} />
              <Row k="Registered" v={formatDate(student.created_at)} />
            </Panel>
            <Panel title="Medical & consent">
              <Row k="Medical notes" v={student.medical_notes} />
              <Row k="Rules acknowledged" v={student.rules_acknowledged ? `Yes${student.rules_acknowledged_on ? ` · ${formatDate(student.rules_acknowledged_on)}` : ''}` : 'Not yet'} />
              <Row k="Status" v={student.active ? 'Active' : 'Inactive'} />
              <div className="pt-3">
                <button className={`${btnOutline} ${btnSm}`} onClick={toggleActive}><Power size={13} /> {student.active ? 'Mark inactive' : 'Mark active'}</button>
              </div>
            </Panel>
          </div>
        )}

        {tab === 'attendance' && (
          <DataTable
            caption="Attendance"
            rows={rec.attendance}
            empty="No attendance marked yet."
            columns={[
              { key: 'date', header: 'Session date', primary: true, sortValue: (a) => a.session_date, render: (a) => formatDate(a.session_date) },
              { key: 'status', header: 'Status', sortValue: (a) => a.status, render: (a) => <StatusPill tone={ATT_TONE[a.status]}>{a.status}</StatusPill> },
              { key: 'notes', header: 'Notes', render: (a) => a.notes || '—' },
            ]}
          />
        )}

        {tab === 'fees' && (
          <DataTable
            caption="Fees"
            rows={rec.fees}
            empty="No fee records yet."
            columns={[
              { key: 'month', header: 'Month', primary: true, sortValue: (f) => f.period_month, render: (f) => formatMonth(f.period_month) },
              { key: 'due', header: 'Due', align: 'right', sortValue: (f) => f.amount_due, render: (f) => rupees(f.amount_due) },
              { key: 'paid', header: 'Paid', align: 'right', sortValue: (f) => f.amount_paid || 0, render: (f) => rupees(f.amount_paid) },
              { key: 'status', header: 'Status', render: (f) => <StatusPill tone={FEE_TONE[f.status]}>{f.status}</StatusPill> },
              { key: 'receipt', header: 'Receipt no.', hideOnMobile: true, render: (f) => (Number(f.amount_paid) > 0 ? receiptNo(f) : '—') },
            ]}
            actions={(f) => Number(f.amount_paid) > 0 && (
              <button className={`${btnOutline} ${btnSm}`} onClick={() => setDoc({ type: 'receipt', data: f })}><ReceiptText size={13} /> Receipt</button>
            )}
          />
        )}

        {tab === 'belts' && (
          rec.grading.length === 0 ? <Empty>No belt gradings yet.</Empty> : (
            <ol className="relative bg-surface rounded-2xl shadow-card p-5 md:p-6">
              {rec.grading.map((g, i) => (
                <li key={g.id} className="relative pl-8 pb-6 last:pb-0">
                  {i < rec.grading.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-pay-line" aria-hidden="true" />}
                  <span className="absolute left-0 top-0.5 w-6 h-6 rounded-full ring-4 ring-surface" style={{ background: BELT_COLORS[g.to_belt], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-heading">{beltLabel(g.from_belt)} → {beltLabel(g.to_belt)}</strong>
                    <StatusPill tone={g.passed ? 'ok' : 'bad'}>{g.passed ? 'Passed' : 'Not passed'}</StatusPill>
                  </div>
                  <p className="text-sm text-muted mt-0.5">{g.grading_events?.title} · {formatDate(g.grading_events?.exam_date)}{g.grading_events?.location ? ` · ${g.grading_events.location}` : ''}</p>
                  {g.remarks && <p className="text-sm text-body mt-1">{g.remarks}</p>}
                  {g.passed && <button className={`${btnOutline} ${btnSm} mt-2`} onClick={() => setDoc({ type: 'certificate', data: g })}><Award size={13} /> Certificate</button>}
                </li>
              ))}
            </ol>
          )
        )}

        {tab === 'performance' && (
          <DataTable
            caption="Performance"
            rows={rec.performance}
            empty="No assessments recorded."
            columns={[
              { key: 'date', header: 'Date', primary: true, sortValue: (p) => p.recorded_on, render: (p) => formatDate(p.recorded_on) },
              { key: 'category', header: 'Category', sortValue: (p) => p.category },
              { key: 'rating', header: 'Rating', render: (p) => <StatusPill tone={RATING_TONE[p.rating] || 'neutral'}>{p.rating}</StatusPill> },
              { key: 'remarks', header: 'Coach remarks', render: (p) => p.remarks || '—' },
            ]}
          />
        )}

        {tab === 'achievements' && (
          <DataTable
            caption="Achievements"
            rows={rec.achievements}
            empty="No achievements recorded."
            columns={[
              { key: 'title', header: 'Achievement', primary: true, sortValue: (a) => a.title },
              { key: 'date', header: 'Date', sortValue: (a) => a.achievement_date, render: (a) => formatDate(a.achievement_date) },
              { key: 'level', header: 'Level', render: (a) => <span className="capitalize">{a.level || '—'}</span> },
              { key: 'medal', header: 'Medal', render: (a) => (a.medal && a.medal !== 'none' ? <StatusPill tone={a.medal === 'gold' ? 'warn' : 'info'}>{a.medal}</StatusPill> : '—') },
            ]}
          />
        )}

        {tab === 'events' && (
          <DataTable
            caption="Events"
            rows={rec.events}
            empty="Not registered for any events."
            columns={[
              { key: 'title', header: 'Event', primary: true, sortValue: (r) => r.events?.title, render: (r) => r.events?.title || '—' },
              { key: 'date', header: 'Date', sortValue: (r) => r.events?.event_date, render: (r) => formatDate(r.events?.event_date) },
              { key: 'type', header: 'Type', render: (r) => <span className="capitalize">{r.events?.event_type || '—'}</span> },
              { key: 'result', header: 'Result', render: (r) => r.result || (r.medal && r.medal !== 'none' ? <span className="capitalize">{r.medal}</span> : '—') },
            ]}
          />
        )}

        {tab === 'documents' && (
          <div className="grid gap-4 md:grid-cols-3">
            <DocCard icon={IdCard} title="Student ID card" sub={`${studentIdNo(student)} · valid this academic year`} onOpen={() => setDoc({ type: 'id' })} />
            {rec.fees.filter((f) => Number(f.amount_paid) > 0).map((f) => (
              <DocCard key={f.id} icon={ReceiptText} title={`Fee receipt · ${formatMonth(f.period_month)}`} sub={`${receiptNo(f)} · ${rupees(f.amount_paid)}`} onOpen={() => setDoc({ type: 'receipt', data: f })} />
            ))}
            {rec.grading.filter((g) => g.passed).map((g) => (
              <DocCard key={g.id} icon={Award} title={`Certificate · ${beltLabel(g.to_belt)}`} sub={`${certificateNo(g)} · ${g.grading_events?.title || ''}`} onOpen={() => setDoc({ type: 'certificate', data: g })} />
            ))}
          </div>
        )}
      </div>

      <p className="no-print mt-8 text-xs text-subtle">
        <Link to="/admin/students" className="hover:text-pay-action hover:underline">← Back to all students</Link>
      </p>

      {doc && (
        <DocumentModal
          title={{ id: `ID Card — ${student.full_name}`, receipt: `Fee receipt — ${student.full_name}`, certificate: `Certificate — ${student.full_name}` }[doc.type]}
          size={{ id: 'card', receipt: 'a5', certificate: 'a4-landscape' }[doc.type]}
          onClose={() => setDoc(null)}
        >
          {doc.type === 'id' && <StudentIdCard student={student} />}
          {doc.type === 'receipt' && <FeeReceipt payment={doc.data} studentName={student.full_name} />}
          {doc.type === 'certificate' && <BeltCertificate result={doc.data} studentName={student.full_name} exam={doc.data.grading_events} />}
        </DocumentModal>
      )}
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="font-medium text-heading break-words">{value}</dd>
    </div>
  )
}

function Tile({ icon: Icon, label, value, sub, tone, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left bg-surface rounded-2xl shadow-card p-5 hover:ring-2 hover:ring-pay-sky transition">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
        <Icon size={15} className="text-pay-action" aria-hidden="true" /> {label}
      </span>
      <strong className="block text-2xl font-bold text-heading mt-2" style={tone ? { color: `var(--status-${tone})` } : undefined}>{value}</strong>
      <span className="block text-sm text-muted mt-0.5 truncate">{sub}</span>
    </button>
  )
}

function Panel({ title, children }) {
  return (
    <section className="bg-surface rounded-2xl shadow-card">
      <h3 className="px-5 py-3 border-b border-pay-line text-sm font-bold uppercase tracking-wider text-subtle">{title}</h3>
      <dl className="px-5 py-2 divide-y divide-pay-line">{children}</dl>
    </section>
  )
}

function Row({ k, v }) {
  return (
    <div className="grid grid-cols-[40%_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd className="text-heading font-medium break-words">{v || '—'}</dd>
    </div>
  )
}

function DocCard({ icon: Icon, title, sub, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="text-left flex items-center gap-3 bg-surface rounded-2xl shadow-card p-4 hover:ring-2 hover:ring-pay-sky transition">
      <span className="grid place-items-center w-11 h-11 rounded-xl bg-pay-sky text-pay-action shrink-0"><Icon size={20} /></span>
      <span className="min-w-0">
        <span className="block font-semibold text-heading truncate">{title}</span>
        <span className="block text-xs text-subtle truncate">{sub}</span>
      </span>
    </button>
  )
}

function Empty({ children }) {
  return <div className="bg-surface rounded-2xl shadow-card px-6 py-10 text-center text-sm text-muted">{children}</div>
}
