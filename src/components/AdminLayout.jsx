import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', end: true },
  { label: 'Students', path: '/admin/students' },
  { label: 'Training Centers', path: '/admin/training-centers' },
  { label: 'Coaches', path: '/admin/coaches' },
  { label: 'Batches', path: '/admin/batches' },
  { label: 'Attendance', path: '/admin/attendance' },
  { label: 'Belt Exams', path: '/admin/belt-exams' },
  { label: 'Student Performance', path: '/admin/performance' },
  { label: 'Achievements', path: '/admin/achievements' },
  { label: 'Equipment Record', path: '/admin/equipment' },
  { label: 'Fee Management', path: '/admin/fees' },
  { label: 'Fee Setup', path: '/admin/fee-setup', superAdminOnly: true },
  { label: 'Accounts', path: '/admin/accounts' },
  { label: 'Events', path: '/admin/events' },
  { label: 'Enquiries', path: '/admin/enquiries' },
  { label: 'Rules & Regulations', path: '/admin/rules' },
  { label: 'Website Content', path: '/admin/website', superAdminOnly: true },
  { label: 'Users', path: '/admin/users', superAdminOnly: true },
]

export default function AdminLayout({ children }) {
  const { profile, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || profile?.role === 'super_admin'
  )

  return (
    <div className="flex min-h-screen bg-chalk font-body">
      <aside className="w-60 md:w-60 max-md:w-[170px] shrink-0 bg-ink flex flex-col border-r-[3px] border-r-gold sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="w-8 h-8 object-contain" />
          <div className="font-display font-bold text-sm text-chalk">THOUBAL <span className="text-brand-red">TKD</span></div>
        </div>

        <nav className="flex flex-col py-3 flex-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `px-4.5 py-2.5 text-sm max-md:text-[0.78rem] font-medium border-l-[3px] ${
                  isActive
                    ? 'bg-gold/10 border-l-gold text-chalk font-semibold'
                    : 'border-l-transparent text-[#C9C7C0] hover:bg-white/5 hover:text-chalk'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4.5 py-4 border-t border-white/10">
          <div className="flex flex-col items-start gap-1.5 text-chalk text-sm">
            <span>{profile?.full_name}</span>
            <span className="bg-brand-red text-chalk font-display text-[0.7rem] tracking-wide px-2.5 py-0.5 uppercase">
              {profile?.role?.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={signOut}
            className="mt-2.5 w-full bg-transparent border border-chalk text-chalk font-display text-sm px-4 py-2 cursor-pointer uppercase tracking-wide hover:bg-chalk hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
