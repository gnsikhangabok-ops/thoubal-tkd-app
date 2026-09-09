import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

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
  { title: 'Users', desc: 'Assign roles and link student logins', path: '/admin/users' },
]

export default function AdminDashboard() {
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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Admin Dashboard</h1>
      <p className="text-charcoal mb-9">Manage students, centers, fees, and everything else from here.</p>

      {statsError && (
        <p className="text-brand-red mb-4 text-sm">Couldn't load stats: {statsError}</p>
      )}

      <div className="grid gap-4 mb-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
            <strong className="block font-display text-4xl text-chalk">{s.value === null ? '…' : s.value}</strong>
            <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {MODULES.map((m) =>
          m.path ? (
            <Link
              to={m.path}
              key={m.title}
              className="block bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 hover:border-t-gold transition-colors"
            >
              <h3 className="font-semibold text-base text-ink normal-case mb-1.5">{m.title}</h3>
              <p className="text-sm text-charcoal">{m.desc}</p>
            </Link>
          ) : (
            <div
              key={m.title}
              className="relative bg-white border border-black/10 border-t-[3px] border-t-[#ccc] p-6 opacity-55"
            >
              <h3 className="font-semibold text-base text-ink normal-case mb-1.5">{m.title}</h3>
              <p className="text-sm text-charcoal">{m.desc}</p>
              <span className="absolute top-3 right-4 text-[0.65rem] uppercase tracking-wide text-charcoal font-display">Coming soon</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
