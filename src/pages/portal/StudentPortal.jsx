import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/logo.png'
import ThemeToggle from '../../components/ThemeToggle'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { useT } from '../../lib/i18n'
import NotificationBell from '../../components/NotificationBell'
import { timeAgo } from '../../lib/adminNotifications'
import DocumentModal from '../../components/docs/DocumentModal'
import StudentIdCard from '../../components/docs/StudentIdCard'
import FeeReceipt from '../../components/docs/FeeReceipt'
import BeltCertificate from '../../components/docs/BeltCertificate'
import {
  LayoutGrid, CalendarCheck, Wallet, Award, FileBadge, Bell, Trophy, LogOut, IdCard, ReceiptText,
} from 'lucide-react'
import { BELT_LABELS } from '../../lib/belts'

const TABS = [
  { key: 'Overview', icon: LayoutGrid },
  { key: 'Attendance', icon: CalendarCheck },
  { key: 'Fees', icon: Wallet },
  { key: 'Belt Progress', icon: Award },
  { key: 'Certificates', icon: FileBadge },
  { key: 'Notices', icon: Bell },
  { key: 'Events', icon: Trophy },
]


export default function StudentPortal() {
  const { session, profile, signOut } = useAuth()
  const { t, lang } = useT()
  const belt = (b) => t(BELT_LABELS[b] || b || '')
  const dateLocale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [doc, setDoc] = useState(null) // { type: 'id' | 'receipt' | 'certificate', data }
  const [noticesSeenAt, setNoticesSeenAt] = useState(() => {
    try { return localStorage.getItem('tkd-notices-seen') || '' } catch { return '' }
  })

  const [attendance, setAttendance] = useState([])
  const [fees, setFees] = useState([])
  const [gradingResults, setGradingResults] = useState([])
  const [notices, setNotices] = useState([])
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])

  const profileId = profile?.id

  async function loadStudentAndData(profileId) {
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*, training_centers(name), batches(name)')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (studentError) {
      setError('load')
      setLoading(false)
      return
    }
    if (!studentData) {
      setError('unlinked')
      setLoading(false)
      return
    }

    setStudent(studentData)

    const [attRes, feeRes, gradeRes, noticeRes, eventRes, regRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('student_id', studentData.id).order('session_date', { ascending: false }).limit(30),
      supabase.from('fee_payments').select('*').eq('student_id', studentData.id).order('period_month', { ascending: false }),
      supabase.from('grading_results').select('*, grading_events(title, exam_date, location)').eq('student_id', studentData.id).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(20),
      supabase.from('events').select('*').order('event_date', { ascending: false }).limit(10),
      supabase.from('event_registrations').select('*, events(title, event_date)').eq('student_id', studentData.id),
    ])

    if (attRes.data) setAttendance(attRes.data)
    if (feeRes.data) setFees(feeRes.data)
    if (gradeRes.data) setGradingResults(gradeRes.data)
    if (noticeRes.data) setNotices(noticeRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    if (regRes.data) setMyRegistrations(regRes.data)

    setLoading(false)
  }

  useEffect(() => {
    if (profileId) loadStudentAndData(profileId)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- loader only uses state setters
  }, [profileId])

  // Opening the bell clears the badge; the "new" dots stay for this session's list
  const [dotsSince, setDotsSince] = useState(null)
  function markNoticesSeen() {
    const now = new Date().toISOString()
    try { localStorage.setItem('tkd-notices-seen', now) } catch { /* private mode: badge resets next visit */ }
    setDotsSince((prev) => prev ?? noticesSeenAt)
    setNoticesSeenAt(now)
  }

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null
  const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue')
  const registeredEventIds = new Set(myRegistrations.map((r) => r.event_id))

  return (
    <div className="paytm min-h-screen font-body">
      <header className="sticky top-0 z-30 bg-surface border-b border-pay-line shadow-card">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4 px-8 max-md:px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="w-9 h-9 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-[0.95rem] text-heading">Thoubal <span className="text-pay-blue">TKD</span></span>
              <span className="text-[0.65rem] text-subtle">{t('Student & Parent Portal')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
          <NotificationBell
            items={notices.slice(0, 6).map((n) => ({
              id: n.id, icon: Bell, title: n.title, body: n.body, time: timeAgo(n.created_at),
              unread: n.created_at > (dotsSince ?? noticesSeenAt), onClick: () => setActiveTab('Notices'),
            }))}
            unread={notices.filter((n) => n.created_at > noticesSeenAt).length}
            onOpen={markNoticesSeen}
            viewAll={notices.length ? { label: t('All notices'), onClick: () => setActiveTab('Notices') } : null}
            emptyText={t('No notices from the academy yet')}
          />
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 max-sm:px-2.5 py-2 text-sm font-semibold text-heading hover:bg-pay-bg"
          >
            <LogOut size={16} /> <span className="max-sm:sr-only">{t('Sign out')}</span>
          </button>
          </div>
        </div>
      </header>

      <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
        {loading ? (
          <p className="text-muted">{t('Loading…')}</p>
        ) : error === 'unlinked' ? (
          <div className="max-w-xl bg-surface rounded-2xl shadow-card border-l-4 border-l-pay-blue p-6">
            <h1 className="text-xl mb-2">{t('Welcome, {name}', { name: profile?.full_name || '' })}</h1>
            <p className="text-sm mb-3">{t("Your account is active, but it hasn't been linked to a student record yet.")}</p>
            <ol className="list-decimal pl-5 text-sm flex flex-col gap-1.5">
              <li>{t('Contact the academy office or your coach.')}</li>
              <li>{t('Ask them to link your login ({email}) to your student record.', { email: session?.user?.email })}</li>
              <li>{t('Refresh this page — your attendance, fees and belt progress will appear here.')}</li>
            </ol>
          </div>
        ) : error ? (
          <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{t('Could not load your records right now. Please refresh the page or try again later.')}</p>
        ) : (
          <>
            {/* Profile card */}
            <div className="pay-stat relative overflow-hidden flex flex-wrap items-center gap-4 !p-5 md:!p-6">
              <div className="absolute -right-12 -top-16 w-52 h-52 rounded-full bg-white/10" aria-hidden="true" />
              <span className="relative grid place-items-center w-14 h-14 rounded-full bg-surface text-heading text-lg font-bold shrink-0">
                {student.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div className="relative min-w-0 flex-1">
                <h1 className="!text-white text-xl md:text-2xl font-bold truncate">{student.full_name}</h1>
                <p className="text-white/85 text-sm">
                  {student.training_centers?.name || t('No center')}{student.batches?.name ? ` · ${student.batches.name}` : ''}
                </p>
                <span className="inline-block mt-2 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">{belt(student.current_belt)}</span>
              </div>
              <button
                onClick={() => setDoc({ type: 'id' })}
                className="relative ml-auto max-sm:ml-0 max-sm:w-full max-sm:justify-center shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white text-[#002E6E] px-4 py-2 text-sm font-semibold hover:bg-[#E6F7FD]"
              >
                <IdCard size={16} /> <span className="max-sm:hidden">{t('My ID Card')}</span><span className="sm:hidden">{t('ID Card')}</span>
              </button>
            </div>

            {/* Service tiles */}
            <nav aria-label={t('Portal sections')} className="bg-surface rounded-2xl shadow-card p-4 mt-4 mb-6 grid grid-cols-4 sm:grid-cols-7 gap-y-4 gap-x-1">
              {TABS.map(({ key, icon: Icon }) => {
                const active = activeTab === key
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1.5 text-center cursor-pointer"
                  >
                    <span className={`grid place-items-center w-12 h-12 rounded-2xl transition-colors ${active ? 'bg-pay-action text-white' : 'bg-pay-sky text-pay-action'}`}>
                      <Icon size={21} strokeWidth={1.9} />
                    </span>
                    <span className={`text-[0.72rem] leading-tight ${active ? 'font-bold text-heading' : 'font-medium text-body'}`}>{t(key)}</span>
                  </button>
                )
              })}
            </nav>

            {activeTab === 'Overview' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="pay-stat">
                  <strong className="block text-3xl font-bold text-white">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</strong>
                  <span className="text-sm text-white/85">{t('Attendance (last 30 sessions)')}</span>
                </div>
                <div className="pay-stat">
                  <strong className="block text-2xl font-bold text-white">{belt(student.current_belt)}</strong>
                  <span className="text-sm text-white/85">{t('Current Belt')}</span>
                </div>
                <div className="pay-stat border-b-4" style={{ borderBottomColor: pendingFees.length > 0 ? '#F59E0B' : 'transparent' }}>
                  <strong className="block text-3xl font-bold text-white">{pendingFees.length}</strong>
                  <span className="text-sm text-white/85">{t('Pending Fee Payments')}</span>
                </div>
              </div>
            )}

            {activeTab === 'Attendance' && (
              <>
                <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="pay-stat">
                    <strong className="block text-3xl font-bold text-white">{presentCount} / {attendance.length}</strong>
                    <span className="text-sm text-white/85">{t('Present (last 30 sessions)')}</span>
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <p className="text-charcoal">{t('No attendance records yet.')}</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {attendance.map((a) => (
                      <div
                        key={a.id}
                        className="bg-surface rounded-2xl shadow-card p-6"
                        style={{ borderLeftWidth: 4, borderLeftColor: a.status === 'present' ? 'var(--status-ok)' : '#999' }}
                      >
                        <h3 className="capitalize font-semibold text-[0.95rem] text-heading">{t(a.status)}</h3>
                        <p className="text-[0.85rem] mt-1">{a.session_date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Fees' && (
              fees.length === 0 ? (
                <p className="text-charcoal">{t('No fee records yet.')}</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {fees.map((f) => (
                    <div
                      key={f.id}
                      className="bg-surface rounded-2xl shadow-card p-6"
                      style={{ borderLeftWidth: 4, borderLeftColor: f.status === 'paid' ? 'var(--status-ok)' : f.status === 'waived' ? '#999' : 'var(--status-warn)' }}
                    >
                      <h3 className="font-semibold text-base text-heading mb-1.5">{new Date(f.period_month).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}</h3>
                      <p className="text-sm text-charcoal">{t('Due: {due} · Paid: {paid}', { due: `₹${f.amount_due}`, paid: `₹${f.amount_paid || 0}` })}</p>
                      <p className="text-[0.8rem] uppercase font-display mt-1.5" style={{ color: f.status === 'paid' ? 'var(--status-ok)' : 'var(--status-warn)' }}>
                        {t(f.status)}
                      </p>
                      {f.receipt_no && <p className="text-[0.8rem] mt-1">{t('Receipt: {no}', { no: f.receipt_no })}</p>}
                      {Number(f.amount_paid) > 0 && (
                        <button
                          onClick={() => setDoc({ type: 'receipt', data: f })}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-pay-action px-3.5 py-1.5 text-xs font-semibold text-pay-action hover:bg-pay-sky"
                        >
                          <ReceiptText size={14} /> {t('Download receipt')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Belt Progress' && (
              <>
                <div className="bg-surface rounded-2xl shadow-card p-6 mb-6 max-w-[400px]">
                  <h3 className="font-semibold text-base text-heading">{t('Current Belt')}</h3>
                  <p className="text-2xl font-display text-pay-action mt-2">{belt(student.current_belt)}</p>
                </div>
                {gradingResults.length === 0 ? (
                  <p className="text-charcoal">{t('No grading history yet.')}</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {gradingResults.map((g) => (
                      <div
                        key={g.id}
                        className="bg-surface rounded-2xl shadow-card p-6"
                        style={{ borderLeftWidth: 4, borderLeftColor: g.passed ? 'var(--status-ok)' : '#ccc' }}
                      >
                        <h3 className="font-semibold text-base text-heading mb-1.5">{g.grading_events?.title}</h3>
                        <p className="text-sm text-charcoal">{belt(g.from_belt)} → {belt(g.to_belt)}</p>
                        <p className="text-[0.8rem] mt-1.5" style={{ color: g.passed ? 'var(--status-ok)' : '#999' }}>
                          {g.passed ? t('Passed') : t('Did not pass')}
                        </p>
                        {g.certificate_url && (
                          <a href={g.certificate_url} target="_blank" rel="noreferrer" className="text-[0.8rem] underline block mt-1.5">
                            {t('View Certificate')}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Certificates' && (
              gradingResults.filter((g) => g.passed || g.certificate_url).length === 0 ? (
                <p className="text-muted">{t('No certificates yet. They appear here after you pass a belt grading.')}</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {gradingResults.filter((g) => g.passed || g.certificate_url).map((g) => (
                    <div key={g.id} className="bg-surface rounded-2xl shadow-card p-6">
                      <h3 className="font-semibold text-base text-heading mb-1.5">{g.grading_events?.title}</h3>
                      <p className="text-sm text-charcoal">{belt(g.to_belt)}</p>
                      <div className="flex gap-2 flex-wrap mt-3">
                        {g.passed && (
                          <button
                            onClick={() => setDoc({ type: 'certificate', data: g })}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-pay-action text-white hover:bg-pay-action-dark"
                          >
                            <Award size={14} /> {t('Certificate')}
                          </button>
                        )}
                        {g.certificate_url && (
                          <a
                            href={g.certificate_url} target="_blank" rel="noreferrer"
                            className="inline-block text-xs font-semibold px-3.5 py-1.5 rounded-full border border-pay-action text-pay-action hover:bg-pay-sky"
                          >
                            {t('Uploaded copy')}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Notices' && (
              notices.length === 0 ? (
                <p className="text-charcoal">{t('No notices yet.')}</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {notices.map((n) => (
                    <div
                      key={n.id}
                      className="bg-surface rounded-2xl shadow-card p-6"
                      style={{ borderLeftWidth: 4, borderLeftColor: n.pinned ? '#D4A537' : 'var(--status-bad)' }}
                    >
                      <h3 className="font-semibold text-base text-heading mb-1.5">{n.title}</h3>
                      <p className="text-sm text-charcoal mt-1.5">{n.body}</p>
                      <p className="text-[0.8rem] mt-2 text-charcoal">
                        {new Date(n.created_at).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Events' && (
              events.length === 0 ? (
                <p className="text-charcoal">{t('No upcoming events.')}</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {events.map((ev) => (
                    <div key={ev.id} className="bg-surface rounded-2xl shadow-card p-6">
                      <h3 className="font-semibold text-base text-heading mb-1.5">{ev.title}</h3>
                      <p className="text-sm text-charcoal capitalize">{ev.event_type}</p>
                      <p className="text-[0.85rem] mt-1.5">{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                      {registeredEventIds.has(ev.id) ? (
                        <p className="text-[0.8rem] mt-2 text-pay-action">{t("✓ You're registered")}</p>
                      ) : (
                        <p className="text-[0.8rem] mt-2 text-charcoal">{t('Contact your coach to register')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
      {doc && student && (
        <DocumentModal
          title={t({ id: 'Student ID card', receipt: 'Fee receipt', certificate: 'Belt certificate' }[doc.type])}
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
