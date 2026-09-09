import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import {
  Users, Building2, UserCog, CalendarCheck, Award, TrendingUp,
  Medal, Package, Wallet, PiggyBank, Trophy, Inbox,
  ScrollText, ShieldCheck, Bell, ArrowRight, AlertCircle,
} from 'lucide-react'

const SECTIONS = [
  {
    label: 'People',
    items: [
      { title: 'Students', desc: 'Profiles, batches, belt rank, documents', path: '/admin/students', icon: Users },
      { title: 'Coaches', desc: 'Instructor profiles & center assignment', path: '/admin/coaches', icon: UserCog },
      { title: 'Training Centers', desc: 'Branches under the association', path: '/admin/training-centers', icon: Building2 },
      { title: 'Batches', desc: 'Class groups, timing, coach assignment', path: '/admin/batches', icon: CalendarCheck },
    ],
  },
  {
    label: 'Training',
    items: [
      { title: 'Attendance', desc: 'Mark and review daily attendance', path: '/admin/attendance', icon: CalendarCheck },
      { title: 'Belt Exams', desc: 'Exam events, results, certificates', path: '/admin/belt-exams', icon: Award },
      { title: 'Student Performance', desc: 'Coach evaluations and progress log', path: '/admin/performance', icon: TrendingUp },
      { title: 'Achievements', desc: 'Medals and award highlights', path: '/admin/achievements', icon: Medal },
      { title: 'Events', desc: 'Tournaments, seminars, registrations', path: '/admin/events', icon: Trophy },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Fee Management', desc: 'Monthly dues, payments, receipts', path: '/admin/fees', icon: Wallet },
      { title: 'Accounts', desc: 'Income vs expenses, profit & loss', path: '/admin/accounts', icon: PiggyBank },
      { title: 'Equipment Record', desc: 'Uniforms, gear, stock & issuance', path: '/admin/equipment', icon: Package },
      { title: 'Enquiries', desc: 'Leads from the public website form', path: '/admin/enquiries', icon: Inbox },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Rules & Regulations', desc: 'Academy policies at registration', path: '/admin/rules', icon: ScrollText },
      { title: 'Users', desc: 'Assign roles and link student logins', path: '/admin/users', icon: ShieldCheck },
      { title: 'Notices', desc: 'Announcements to students & parents', path: null, icon: Bell },
    ],
  },
]

export default function AdminDashboard() {
  const { profile } = useAuth()
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
    { label: 'Athletes', value: stats.total_athletes, icon: Users },
    { label: 'Coaches', value: stats.total_coaches, icon: UserCog },
    { label: 'Training Centers', value: stats.total_centers, icon: Building2 },
    { label: 'New Enquiries', value: enquiryCount, icon: Inbox, accent: enquiryCount > 0 },
  ]

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="p-12 max-md:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-1">
        <div>
          <h1 className="font-display text-ink uppercase text-3xl tracking-wide">
            {firstName ? `Welcome back, ${firstName}` : 'Admin Dashboard'}
          </h1>
          <p className="text-charcoal mt-1.5">Here's what's happening across the academy today.</p>
        </div>
        <span className="hidden sm:inline-block text-xs font-display uppercase tracking-wide text-charcoal/70 border border-black/10 px-3 py-1.5 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {statsError && (
        <div className="flex items-center gap-2 text-brand-red text-sm mt-6 bg-brand-red/5 border border-brand-red/20 px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          Couldn't load stats: {statsError}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid gap-4 mt-8 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {STAT_CARDS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className={`relative overflow-hidden px-5 py-6 border-b-[3px] ${
                s.accent ? 'bg-brand-red border-b-gold' : 'bg-ink border-b-gold'
              }`}
            >
              <Icon size={20} className="text-gold/70 mb-3" strokeWidth={1.75} />
              <strong className="block font-display text-4xl text-chalk leading-none">
                {s.value === null ? '—' : s.value}
              </strong>
              <span className="text-xs text-[#B8B6B0] uppercase tracking-wide mt-2 block">{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Grouped modules */}
      <div className="flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-ink uppercase text-sm tracking-[0.08em]">{section.label}</h2>
              <div className="h-px flex-1 bg-black/10" />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
              {section.items.map((m) => {
                const Icon = m.icon
                if (!m.path) {
                  return (
                    <div
                      key={m.title}
                      className="relative flex gap-3.5 bg-white/60 border border-black/10 p-5 opacity-60"
                    >
                      <Icon size={20} className="text-charcoal/50 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[0.95rem] text-ink normal-case">{m.title}</h3>
                        <p className="text-[0.82rem] text-charcoal mt-0.5">{m.desc}</p>
                      </div>
                      <span className="absolute top-3 right-3 text-[0.6rem] uppercase tracking-wide text-charcoal font-display">Soon</span>
                    </div>
                  )
                }
                return (
                  <Link
                    to={m.path}
                    key={m.title}
                    className="group flex gap-3.5 bg-white border border-black/10 p-5 hover:border-brand-red hover:shadow-sm transition-all"
                  >
                    <Icon size={20} className="text-brand-red shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[0.95rem] text-ink normal-case">{m.title}</h3>
                      <p className="text-[0.82rem] text-charcoal mt-0.5">{m.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-transparent group-hover:text-brand-red transition-colors shrink-0 mt-1" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}