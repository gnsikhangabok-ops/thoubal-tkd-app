import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/site.css'
import logo from '../../assets/logo.png'

// path: null = not built yet (shows as plain card, not clickable)
const MODULES = [
  { title: 'Students / Registration', desc: 'Profiles, batches, belt rank, religion, documents', path: '/admin/students' },
  { title: 'Batches', desc: 'Class groups, timing, coach & center assignment', path: '/admin/batches' },
  { title: 'Training Centers', desc: 'Branches under the association, coach assignment', path: '/admin/training-centers' },
  { title: 'Coaches', desc: 'Instructor profiles and center assignments (admin-added)', path: '/admin/coaches' },
  { title: 'Attendance', desc: 'Mark and review daily attendance', path: '/admin/attendance' },
  { title: 'Belt Exams', desc: 'Exam events, results, certificates', path: '/admin/belt-exams' },
  { title: 'Student Performance', desc: 'Competition & tournament performance log', path: '/admin/performance' },
  { title: 'Achievements', desc: 'Medals and award highlights', path: '/admin/achievements' },
  { title: 'Equipment Record', desc: 'Uniforms, gear, stock & issuance per center', path: '/admin/equipment' },
  { title: 'Fee Management', desc: 'Monthly dues, payments, receipts', path: '/admin/fees' },
  { title: 'Accounts', desc: 'Income vs expenses, profit & loss', path: '/admin/accounts' },
  { title: 'Events', desc: 'Tournaments, seminars, registrations', path: '/admin/events' },
  { title: 'Notices', desc: 'Announcements to students & parents', path: null },
  { title: 'Enquiries', desc: 'Leads from the public website form', path: '/admin/enquiries' },
  { title: 'Rules & Regulations', desc: 'Academy policies shown at registration', path: '/admin/rules' },
]

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const [stats, setStats] = useState({
    total_athletes: null,
    total_coaches: null,
    total_centers: null,
  })
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()

      if (error) {
        setStatsError(error.message)
        return
      }
      setStats(data)
    }
    loadStats()
  }, [])

  const STAT_CARDS = [
    { label: 'Athletes', value: stats.total_athletes },
    { label: 'Coaches', value: stats.total_coaches },
    { label: 'Training Centers', value: stats.total_centers },
  ]

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
          <span className="role-tag">{profile?.role?.replace('_', ' ')}</span>
          <button className="dash-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="dash-body">
        <h1>Admin Dashboard</h1>
        <p className="dash-lede">Manage students, centers, fees, and everything else from here.</p>

        {statsError && (
          <p style={{ color: 'var(--red)', marginBottom: 16, fontSize: '0.9rem' }}>
            Couldn't load stats: {statsError}
          </p>
        )}

        <div className="stat-grid">
          {STAT_CARDS.map((s) => (
            <div className="stat-card" key={s.label}>
              <strong>{s.value === null ? '…' : s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="module-grid">
          {MODULES.map((m) =>
            m.path ? (
              <Link to={m.path} className="module-card" key={m.title} style={{ cursor: 'pointer' }}>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </Link>
            ) : (
              <div className="module-card module-card-disabled" key={m.title}>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
                <span className="module-soon">Coming soon</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
