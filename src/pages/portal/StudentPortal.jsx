import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/logo.png'
import {
  LayoutGrid, CalendarCheck, Wallet, Award, FileBadge, Bell, Trophy, LogOut,
} from 'lucide-react'

const BELT_LABELS = {
  white: 'White Belt', yellow: 'Yellow Belt', green: 'Green Belt',
  blue: 'Blue Belt', red: 'Red Belt', black_1: 'Black Belt 1st Dan',
  black_2: 'Black Belt 2nd Dan', black_3: 'Black Belt 3rd Dan', black_4_plus: 'Black Belt 4th Dan+',
}

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
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

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
      supabase.from('grading_results').select('*, grading_events(title, exam_date)').eq('student_id', studentData.id).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(10),
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

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null
  const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue')
  const registeredEventIds = new Set(myRegistrations.map((r) => r.event_id))

  return (
    <div className="paytm min-h-screen font-body">
      <header className="sticky top-0 z-30 bg-white border-b border-pay-line shadow-card">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4 px-8 max-md:px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="w-9 h-9 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-[0.95rem] text-pay-navy">Thoubal <span className="text-pay-blue">TKD</span></span>
              <span className="text-[0.65rem] text-[#7A889E]">Student &amp; Parent Portal</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-pay-line px-4 py-2 text-sm font-semibold text-pay-navy hover:bg-pay-bg"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
        {loading ? (
          <p className="text-[#5B6B82]">Loading…</p>
        ) : error === 'unlinked' ? (
          <div className="max-w-xl bg-white rounded-2xl shadow-card border-l-4 border-l-pay-blue p-6">
            <h1 className="text-xl mb-2">Welcome, {profile?.full_name || 'student'}</h1>
            <p className="text-sm mb-3">Your account is active, but it hasn't been linked to a student record yet.</p>
            <ol className="list-decimal pl-5 text-sm flex flex-col gap-1.5">
              <li>Contact the academy office or your coach.</li>
              <li>Ask them to link your login (<strong>{session?.user?.email}</strong>) to your student record.</li>
              <li>Refresh this page — your attendance, fees and belt progress will appear here.</li>
            </ol>
          </div>
        ) : error ? (
          <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">Could not load your records right now. Please refresh the page or try again later.</p>
        ) : (
          <>
            {/* Profile card */}
            <div className="pay-stat relative overflow-hidden flex items-center gap-4 !p-5 md:!p-6">
              <div className="absolute -right-12 -top-16 w-52 h-52 rounded-full bg-white/10" aria-hidden="true" />
              <span className="relative grid place-items-center w-14 h-14 rounded-full bg-white text-pay-navy text-lg font-bold shrink-0">
                {student.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div className="relative min-w-0">
                <h1 className="!text-white text-xl md:text-2xl font-bold truncate">{student.full_name}</h1>
                <p className="text-white/85 text-sm">
                  {student.training_centers?.name || 'No center'}{student.batches?.name ? ` · ${student.batches.name}` : ''}
                </p>
                <span className="inline-block mt-2 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">{BELT_LABELS[student.current_belt]}</span>
              </div>
            </div>

            {/* Service tiles */}
            <nav aria-label="Portal sections" className="bg-white rounded-2xl shadow-card p-4 mt-4 mb-6 grid grid-cols-4 sm:grid-cols-7 gap-y-4 gap-x-1">
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
                    <span className={`text-[0.72rem] leading-tight ${active ? 'font-bold text-pay-navy' : 'font-medium text-[#4A5A73]'}`}>{key}</span>
                  </button>
                )
              })}
            </nav>

            {activeTab === 'Overview' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="pay-stat">
                  <strong className="block text-3xl font-bold text-white">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</strong>
                  <span className="text-sm text-white/85">Attendance (last 30 sessions)</span>
                </div>
                <div className="pay-stat">
                  <strong className="block text-2xl font-bold text-white">{BELT_LABELS[student.current_belt]}</strong>
                  <span className="text-sm text-white/85">Current Belt</span>
                </div>
                <div className="pay-stat border-b-4" style={{ borderBottomColor: pendingFees.length > 0 ? '#F59E0B' : 'transparent' }}>
                  <strong className="block text-3xl font-bold text-white">{pendingFees.length}</strong>
                  <span className="text-sm text-white/85">Pending Fee Payments</span>
                </div>
              </div>
            )}

            {activeTab === 'Attendance' && (
              <>
                <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="pay-stat">
                    <strong className="block text-3xl font-bold text-white">{presentCount} / {attendance.length}</strong>
                    <span className="text-sm text-white/85">Present (last 30 sessions)</span>
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <p className="text-charcoal">No attendance records yet.</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {attendance.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white rounded-2xl shadow-card p-6"
                        style={{ borderLeftWidth: 4, borderLeftColor: a.status === 'present' ? '#047857' : '#999' }}
                      >
                        <h3 className="capitalize font-semibold text-[0.95rem] text-pay-navy">{a.status}</h3>
                        <p className="text-[0.85rem] mt-1">{a.session_date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Fees' && (
              fees.length === 0 ? (
                <p className="text-charcoal">No fee records yet.</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {fees.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white rounded-2xl shadow-card p-6"
                      style={{ borderLeftWidth: 4, borderLeftColor: f.status === 'paid' ? '#047857' : f.status === 'waived' ? '#999' : '#B45309' }}
                    >
                      <h3 className="font-semibold text-base text-pay-navy mb-1.5">{new Date(f.period_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
                      <p className="text-sm text-charcoal">Due: ₹{f.amount_due} · Paid: ₹{f.amount_paid || 0}</p>
                      <p className="text-[0.8rem] uppercase font-display mt-1.5" style={{ color: f.status === 'paid' ? '#047857' : '#B45309' }}>
                        {f.status}
                      </p>
                      {f.receipt_no && <p className="text-[0.8rem] mt-1">Receipt: {f.receipt_no}</p>}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Belt Progress' && (
              <>
                <div className="bg-white rounded-2xl shadow-card p-6 mb-6 max-w-[400px]">
                  <h3 className="font-semibold text-base text-pay-navy">Current Belt</h3>
                  <p className="text-2xl font-display text-pay-action mt-2">{BELT_LABELS[student.current_belt]}</p>
                </div>
                {gradingResults.length === 0 ? (
                  <p className="text-charcoal">No grading history yet.</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {gradingResults.map((g) => (
                      <div
                        key={g.id}
                        className="bg-white rounded-2xl shadow-card p-6"
                        style={{ borderLeftWidth: 4, borderLeftColor: g.passed ? '#047857' : '#ccc' }}
                      >
                        <h3 className="font-semibold text-base text-pay-navy mb-1.5">{g.grading_events?.title}</h3>
                        <p className="text-sm text-charcoal">{BELT_LABELS[g.from_belt]} → {BELT_LABELS[g.to_belt]}</p>
                        <p className="text-[0.8rem] mt-1.5" style={{ color: g.passed ? '#047857' : '#999' }}>
                          {g.passed ? 'Passed' : 'Did not pass'}
                        </p>
                        {g.certificate_url && (
                          <a href={g.certificate_url} target="_blank" rel="noreferrer" className="text-[0.8rem] underline block mt-1.5">
                            View Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Certificates' && (
              gradingResults.filter((g) => g.certificate_url).length === 0 ? (
                <p className="text-charcoal">No certificates uploaded yet.</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {gradingResults.filter((g) => g.certificate_url).map((g) => (
                    <div key={g.id} className="bg-white rounded-2xl shadow-card p-6">
                      <h3 className="font-semibold text-base text-pay-navy mb-1.5">{g.grading_events?.title}</h3>
                      <p className="text-sm text-charcoal">{BELT_LABELS[g.to_belt]}</p>
                      <a
                        href={g.certificate_url} target="_blank" rel="noreferrer"
                        className="inline-block mt-2.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-pay-action text-pay-action hover:bg-pay-sky"
                      >
                        View / Download
                      </a>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Notices' && (
              notices.length === 0 ? (
                <p className="text-charcoal">No notices yet.</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {notices.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white rounded-2xl shadow-card p-6"
                      style={{ borderLeftWidth: 4, borderLeftColor: n.pinned ? '#D4A537' : '#DC2626' }}
                    >
                      <h3 className="font-semibold text-base text-pay-navy mb-1.5">{n.title}</h3>
                      <p className="text-sm text-charcoal mt-1.5">{n.body}</p>
                      <p className="text-[0.8rem] mt-2 text-charcoal">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Events' && (
              events.length === 0 ? (
                <p className="text-charcoal">No upcoming events.</p>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {events.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-2xl shadow-card p-6">
                      <h3 className="font-semibold text-base text-pay-navy mb-1.5">{ev.title}</h3>
                      <p className="text-sm text-charcoal capitalize">{ev.event_type}</p>
                      <p className="text-[0.85rem] mt-1.5">{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                      {registeredEventIds.has(ev.id) ? (
                        <p className="text-[0.8rem] mt-2 text-pay-action">✓ You're registered</p>
                      ) : (
                        <p className="text-[0.8rem] mt-2 text-charcoal">Contact your coach to register</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
