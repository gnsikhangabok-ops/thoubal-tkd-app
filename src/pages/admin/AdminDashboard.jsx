import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { navForRole } from '../../lib/adminNav'
import { Users, Building2, UserCog, Inbox, AlertCircle, ChevronRight } from 'lucide-react'

export default function AdminDashboard() {
  const { profile, role } = useAuth()
  const [stats, setStats] = useState({
    total_athletes: null,
    total_coaches: null,
    total_centers: null,
  })
  const [enquiryCount, setEnquiryCount] = useState(null)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabase.from('dashboard_stats').select('*').single()
      if (error) {
        setStatsError(error.message)
        return
      }
      setStats(data)
    }
    async function loadEnquiries() {
      const { count } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      setEnquiryCount(count ?? 0)
    }
    loadStats()
    loadEnquiries()
  }, [])

  const STAT_CARDS = [
    { label: 'Athletes', value: stats.total_athletes, icon: Users, path: '/admin/students' },
    { label: 'Coaches', value: stats.total_coaches, icon: UserCog, path: '/admin/coaches' },
    { label: 'Training Centers', value: stats.total_centers, icon: Building2, path: '/admin/training-centers' },
    { label: 'New Enquiries', value: enquiryCount, icon: Inbox, path: '/admin/enquiries', alert: enquiryCount > 0 },
  ]

  // Group the role's modules for the tile grid (Dashboard itself is skipped)
  const groups = []
  navForRole(role).filter((item) => item.group).forEach((item) => {
    let g = groups.find((x) => x.label === item.group)
    if (!g) groups.push((g = { label: item.group, items: [] }))
    g.items.push(item)
  })

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="p-8 max-md:p-4 max-w-[1200px] mx-auto">
      {/* Greeting banner */}
      <div className="pay-stat relative overflow-hidden !px-6 !py-7 md:!px-8">
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute right-24 -bottom-20 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
        <p className="relative text-sm text-white/80">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="relative !text-white text-2xl md:text-3xl font-bold mt-1">
          {firstName ? `Hi ${firstName} 👋` : 'Admin Dashboard'}
        </h1>
        <p className="relative text-white/85 mt-1 text-sm md:text-base">Here's what's happening across the academy today.</p>
        <div className="relative flex gap-2.5 mt-5 flex-wrap">
          <Link to="/admin/fees" className="rounded-full bg-surface text-heading text-sm font-semibold px-5 py-2 hover:bg-pay-sky">Collect Fees</Link>
          <Link to="/admin/attendance" className="rounded-full border border-white/60 text-white text-sm font-semibold px-5 py-2 hover:bg-white/10">Mark Attendance</Link>
        </div>
      </div>

      {statsError && (
        <div className="flex items-center gap-2 text-red-700 text-sm mt-5 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          Couldn't load stats: {statsError}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-5">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.path} className="bg-surface rounded-2xl shadow-card p-4 md:p-5 flex items-center gap-3 hover:ring-2 hover:ring-pay-sky">
              <span className={`grid place-items-center w-11 h-11 rounded-full shrink-0 ${s.alert ? 'bg-red-50 text-red-600' : 'bg-pay-sky text-pay-action'}`}>
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <strong className="block text-2xl font-bold text-heading leading-none">{s.value === null ? '—' : s.value}</strong>
                <span className="text-xs text-muted mt-1 block">{s.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Module tiles, grouped */}
      <div className="flex flex-col gap-4 mt-5">
        {groups.map((group) => (
          <section key={group.label} className="bg-surface rounded-2xl shadow-card p-4 md:p-6">
            <h2 className="text-base font-bold mb-4">{group.label}</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-y-5 gap-x-2">
              {group.items.map((m) => {
                const Icon = m.icon
                return (
                  <Link key={m.path} to={m.path} title={m.desc} className="group flex flex-col items-center text-center gap-2">
                    <span className="grid place-items-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-pay-sky text-pay-action group-hover:bg-pay-action group-hover:text-white transition-colors">
                      <Icon size={22} strokeWidth={1.9} />
                    </span>
                    <span className="text-[0.72rem] md:text-xs font-medium text-heading leading-tight">{m.short}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <Link to="/admin/enquiries" className="mt-4 flex items-center justify-between bg-surface rounded-2xl shadow-card px-5 py-4 hover:ring-2 hover:ring-pay-sky">
        <span className="text-sm text-heading">
          <strong>{enquiryCount ?? '—'}</strong> new website {enquiryCount === 1 ? 'enquiry' : 'enquiries'} waiting for a reply
        </span>
        <ChevronRight size={18} className="text-pay-action" />
      </Link>
    </div>
  )
}
