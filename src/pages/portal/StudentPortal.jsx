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
    <div className="dash-shell">
      <div className="dash-topbar">
        <div className="brand">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="brand-logo" />
          <div className="brand-text">
            <div className="logo">THOUBAL <span>TKD</span></div>
            <div className="brand-sub">Thoubal District Taekwondo Association</div>
          </div>
        </div>
        <div className="dash-user">
          <span>{profile?.full_name}</span>
          <span className="role-tag">Student</span>
          <button className="dash-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="dash-body">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p style={{ color: 'var(--red)' }}>{error}</p>
        ) : (
          <>
            <h1>{student.full_name}</h1>
            <p className="dash-lede">
              {student.training_centers?.name || 'No center'} {student.batches?.name ? `· ${student.batches.name}` : ''} · {BELT_LABELS[student.current_belt]}
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' && (
              <div className="stat-grid">
                <div className="stat-card">
                  <strong>{attendanceRate !== null ? `${attendanceRate}%` : '—'}</strong>
                  <span>Attendance (last 30 sessions)</span>
                </div>
                <div className="stat-card">
                  <strong>{BELT_LABELS[student.current_belt]}</strong>
                  <span>Current Belt</span>
                </div>
                <div className="stat-card" style={{ borderBottomColor: pendingFees.length > 0 ? 'var(--red)' : 'var(--gold)' }}>
                  <strong>{pendingFees.length}</strong>
                  <span>Pending Fee Payments</span>
                </div>
              </div>
            )}

            {activeTab === 'Attendance' && (
              <>
                <div className="stat-grid" style={{ marginBottom: 20 }}>
                  <div className="stat-card">
                    <strong>{presentCount} / {attendance.length}</strong>
                    <span>Present (last 30 sessions)</span>
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <p style={{ color: 'var(--charcoal)' }}>No attendance records yet.</p>
                ) : (
                  <div className="module-grid">
                    {attendance.map((a) => (
                      <div className="module-card" key={a.id} style={{ borderTopColor: a.status === 'present' ? 'var(--red)' : '#999' }}>
                        <h3 style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{a.status}</h3>
                        <p style={{ fontSize: '0.85rem' }}>{a.session_date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Fees' && (
              fees.length === 0 ? (
                <p style={{ color: 'var(--charcoal)' }}>No fee records yet.</p>
              ) : (
                <div className="module-grid">
                  {fees.map((f) => (
                    <div className="module-card" key={f.id} style={{ borderTopColor: f.status === 'paid' ? 'var(--red)' : f.status === 'waived' ? '#999' : '#B8860B' }}>
                      <h3>{new Date(f.period_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
                      <p>Due: ₹{f.amount_due} · Paid: ₹{f.amount_paid || 0}</p>
                      <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'Oswald', marginTop: 6, color: f.status === 'paid' ? 'var(--red)' : '#B8860B' }}>
                        {f.status}
                      </p>
                      {f.receipt_no && <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Receipt: {f.receipt_no}</p>}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Belt Progress' && (
              <>
                <div className="module-card" style={{ marginBottom: 24, maxWidth: 400 }}>
                  <h3>Current Belt</h3>
                  <p style={{ fontSize: '1.3rem', fontFamily: 'Oswald', color: 'var(--red)', marginTop: 8 }}>
                    {BELT_LABELS[student.current_belt]}
                  </p>
                </div>
                {gradingResults.length === 0 ? (
                  <p style={{ color: 'var(--charcoal)' }}>No grading history yet.</p>
                ) : (
                  <div className="module-grid">
                    {gradingResults.map((g) => (
                      <div className="module-card" key={g.id} style={{ borderTopColor: g.passed ? 'var(--red)' : '#ccc' }}>
                        <h3>{g.grading_events?.title}</h3>
                        <p>{BELT_LABELS[g.from_belt]} → {BELT_LABELS[g.to_belt]}</p>
                        <p style={{ fontSize: '0.8rem', marginTop: 6, color: g.passed ? 'var(--red)' : '#999' }}>
                          {g.passed ? 'Passed' : 'Did not pass'}
                        </p>
                        {g.certificate_url && (
                          <a href={g.certificate_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', textDecoration: 'underline', display: 'block', marginTop: 6 }}>
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
                <p style={{ color: 'var(--charcoal)' }}>No certificates uploaded yet.</p>
              ) : (
                <div className="module-grid">
                  {gradingResults.filter((g) => g.certificate_url).map((g) => (
                    <div className="module-card" key={g.id}>
                      <h3>{g.grading_events?.title}</h3>
                      <p>{BELT_LABELS[g.to_belt]}</p>
                      <a href={g.certificate_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px', marginTop: 10, display: 'inline-block' }}>
                        View / Download
                      </a>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Notices' && (
              notices.length === 0 ? (
                <p style={{ color: 'var(--charcoal)' }}>No notices yet.</p>
              ) : (
                <div className="module-grid">
                  {notices.map((n) => (
                    <div className="module-card" key={n.id} style={{ borderTopColor: n.pinned ? 'var(--gold)' : 'var(--red)' }}>
                      <h3>{n.title}</h3>
                      <p style={{ marginTop: 6 }}>{n.body}</p>
                      <p style={{ fontSize: '0.8rem', marginTop: 8, color: 'var(--charcoal)' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'Events' && (
              events.length === 0 ? (
                <p style={{ color: 'var(--charcoal)' }}>No upcoming events.</p>
              ) : (
                <div className="module-grid">
                  {events.map((ev) => (
                    <div className="module-card" key={ev.id}>
                      <h3>{ev.title}</h3>
                      <p style={{ textTransform: 'capitalize' }}>{ev.event_type}</p>
                      <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                      {registeredEventIds.has(ev.id) ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: 8 }}>✓ You're registered</p>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginTop: 8 }}>Contact your coach to register</p>
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
