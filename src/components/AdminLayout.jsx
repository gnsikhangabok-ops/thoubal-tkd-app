import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import { Menu, X } from 'lucide-react'
import { roleLabel } from '../lib/roles'

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || profile?.role === 'super_admin'
  )

  const sidebarContent = (
    <>
      <div className="tricolor shrink-0" />
      <div className="flex items-center justify-between gap-2.5 px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="w-9 h-9 object-contain" />
          <div className="flex flex-col leading-tight">
            <div className="font-display font-bold text-sm text-chalk uppercase tracking-wide">Thoubal <span className="text-gold">TKD</span></div>
            <div className="text-[0.6rem] uppercase tracking-wide text-[#AEBBD3]">Management Portal</div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-chalk p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col py-3 flex-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `px-4.5 py-2.5 text-sm font-medium border-l-[3px] ${
                isActive
                  ? 'bg-gold/10 border-l-gold text-chalk font-semibold'
                  : 'border-l-transparent text-[#C9D3E6] hover:bg-white/5 hover:text-chalk'
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
          <span className="bg-gold text-ink font-display font-semibold text-[0.7rem] tracking-wide px-2.5 py-0.5 uppercase">
            {roleLabel(profile?.role)}
          </span>
        </div>
        <button
          onClick={signOut}
          className="mt-2.5 w-full bg-transparent border border-chalk text-chalk font-display text-sm px-4 py-2 cursor-pointer uppercase tracking-wide hover:bg-chalk hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-chalk font-body">
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-60 shrink-0 bg-ink flex-col border-r-[3px] border-r-gold sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile topbar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-ink border-b-[3px] border-b-gold px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="w-7 h-7 object-contain" />
          <div className="font-display font-bold text-sm text-chalk uppercase tracking-wide">Thoubal <span className="text-gold">TKD</span></div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-chalk p-1"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile slide-over overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-ink flex flex-col h-full overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  )
}