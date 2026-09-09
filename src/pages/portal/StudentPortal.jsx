import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/logo.png'

const BELT_LABELS = {
  white: 'White Belt', yellow: 'Yellow Belt', green: 'Green Belt',
  blue: 'Blue Belt', red: 'Red Belt', black_1: 'Black Belt 1st Dan',
  black_2: 'Black Belt 2nd Dan', black_3: 'Black Belt 3rd Dan', black_4_plus: 'Black Belt 4th Dan+',
}

const TABS = ['Overview', 'Attendance', 'Fees', 'Belt Progress', 'Certificates', 'Notices', 'Events']

const btnPrimary = "inline-block px-4 py-2 font-display font-semibold text-[0.8rem] uppercase tracking-wide bg-brand-red text-chalk"
const btnOutline = "inline-block px-4 py-2 font-display font-semibold text-[0.8rem] uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"

export default function StudentPortal() {
  const { profile, signOut } = useAuth()
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

  useEffect(() => {
    loadStudentAndData()
  }, [profile])

  async function loadStudentAndData() {
    if (!profile) return
    setLoading(true)
    setError('')

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*, training_centers(name), batches(name)')
      .eq('profile_id', profile.id)
      .single()

    if (studentError) {
      setError('Could not find your student record. Please contact the academy admin.')
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

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null
  const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue')
  const registeredEventIds = new Set(myRegistrations.map((r) => r.event_id))

  return (
    <div className="min-h-screen bg-chalk font-body">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-ink px-8 max-md:px-4 py-4 border-b-[3px] border-b-gold">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="w-11 h-11 max-md:w-8 max-md:h-8 object-contain" />
          <div className="flex flex-col leading-tight">
            <div className="font-display font-bold text-lg max-md:text-sm text-chalk">THOUBAL <span className="text-brand-red">TKD</span></div>
            <div className="hidden md:block text-[0.62rem] tracking-wide text-[#B8B6B0] uppercase mt-0.5">Thoubal District Taekwondo Association</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-chalk text-sm flex-wrap">
          <span className="max-md:hidden">{profile?.full_name}</span>
          <span className="bg-brand-red text-chalk font-display text-[0.7rem] tracking-wide px-2.5 py-0.5 uppercase">Student</span>
          <button
            onClick={signOut}
            className="bg-transparent border border-chalk text-chalk font-display text-sm px-4 py-2 cursor-pointer uppercase tracking-wide hover:bg-chalk hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-brand-red">{error}</p>
        ) : (
          <>
            <h1 className="font-display text-ink uppercase text-3xl mb-2">{student.full_name}</h1>
            <p className="text-charcoal mb-9">
              {student.training_centers?.name || 'No center'} {student.batches?.name ? `· ${student.batches.name}` : ''} · {BELT_LABELS[student.current_belt]}
            </p>

            <div className="flex gap-2 flex-wrap mb-7 border-b border-black/10 pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? btnPrimary : btnOutline}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
                  <strong className="block font-display text-4xl text-chalk">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</strong>
                  <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Attendance (last 30 sessions)</span>
                </div>
                <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
                  <strong className="block font-display text-2xl text-chalk">{BELT_LABELS[student.current_belt]}</strong>
                  <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Current Belt</span>
                </div>
                <div className="bg-ink px-5 py-6 border-b-[3px]" style={{ borderBottomColor: pendingFees.length > 0 ? '#B3282D' : '#D4A537' }}>
                  <strong className="block font-display text-4xl text-chalk">{pendingFees.length}</strong>
                  <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Pending Fee Payments</span>
                </div>
              </div>
            )}

            {activeTab === 'Attendance' && (
              <>
                <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
                    <strong className="block font-display text-4xl text-chalk">{presentCount} / {attendance.length}</strong>
                    <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Present (last 30 sessions)</span>
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <p className="text-charcoal">No attendance records yet.</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {attendance.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white border border-black/10 p-6"
                        style={{ borderTopWidth: 3, borderTopColor: a.status === 'present' ? '#B3282D' : '#999' }}
                      >
                        <h3 className="capitalize font-semibold text-[0.95rem] text-ink">{a.status}</h3>
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
                      className="bg-white border border-black/10 p-6"
                      style={{ borderTopWidth: 3, borderTopColor: f.status === 'paid' ? '#B3282D' : f.status === 'waived' ? '#999' : '#B8860B' }}
                    >
                      <h3 className="font-semibold text-base text-ink mb-1.5">{new Date(f.period_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
                      <p className="text-sm text-charcoal">Due: ₹{f.amount_due} · Paid: ₹{f.amount_paid || 0}</p>
                      <p className="text-[0.8rem] uppercase font-display mt-1.5" style={{ color: f.status === 'paid' ? '#B3282D' : '#B8860B' }}>
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
                <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-6 max-w-[400px]">
                  <h3 className="font-semibold text-base text-ink">Current Belt</h3>
                  <p className="text-2xl font-display text-brand-red mt-2">{BELT_LABELS[student.current_belt]}</p>
                </div>
                {gradingResults.length === 0 ? (
                  <p className="text-charcoal">No grading history yet.</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {gradingResults.map((g) => (
                      <div
                        key={g.id}
                        className="bg-white border border-black/10 p-6"
                        style={{ borderTopWidth: 3, borderTopColor: g.passed ? '#B3282D' : '#ccc' }}
                      >
                        <h3 className="font-semibold text-base text-ink mb-1.5">{g.grading_events?.title}</h3>
                        <p className="text-sm text-charcoal">{BELT_LABELS[g.from_belt]} → {BELT_LABELS[g.to_belt]}</p>
                        <p className="text-[0.8rem] mt-1.5" style={{ color: g.passed ? '#B3282D' : '#999' }}>
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
                    <div key={g.id} className="bg-white border border-black/10 p-6">
                      <h3 className="font-semibold text-base text-ink mb-1.5">{g.grading_events?.title}</h3>
                      <p className="text-sm text-charcoal">{BELT_LABELS[g.to_belt]}</p>
                      <a
                        href={g.certificate_url} target="_blank" rel="noreferrer"
                        className="inline-block mt-2.5 text-[0.75rem] px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-chalk"
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
                      className="bg-white border border-black/10 p-6"
                      style={{ borderTopWidth: 3, borderTopColor: n.pinned ? '#D4A537' : '#B3282D' }}
                    >
                      <h3 className="font-semibold text-base text-ink mb-1.5">{n.title}</h3>
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
                    <div key={ev.id} className="bg-white border border-black/10 p-6">
                      <h3 className="font-semibold text-base text-ink mb-1.5">{ev.title}</h3>
                      <p className="text-sm text-charcoal capitalize">{ev.event_type}</p>
                      <p className="text-[0.85rem] mt-1.5">{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                      {registeredEventIds.has(ev.id) ? (
                        <p className="text-[0.8rem] mt-2 text-brand-red">✓ You're registered</p>
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
