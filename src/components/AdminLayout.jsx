import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import { Menu, X, LogOut } from 'lucide-react'
import { roleLabel } from '../lib/roles'
import { navForRole } from '../lib/adminNav'

export default function AdminLayout({ children }) {
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = navForRole(profile?.role)
  const initials = (profile?.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const brand = (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="Thoubal Taekwondo Academy" className="w-9 h-9 object-contain" />
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-[0.95rem] text-pay-navy">Thoubal <span className="text-pay-blue">TKD</span></span>
        <span className="text-[0.65rem] text-[#7A889E]">Management Portal</span>
      </div>
    </div>
  )

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2.5 px-5 py-4 border-b border-pay-line">
        {brand}
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-pay-navy p-1" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-pay-sky text-pay-navy font-semibold' : 'text-[#4A5A73] hover:bg-pay-bg hover:text-pay-navy'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${isActive ? 'bg-pay-action text-white' : 'bg-pay-bg text-pay-action'}`}>
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-pay-line">
        <div className="flex items-center gap-3 rounded-xl bg-pay-bg p-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-pay-navy to-pay-blue text-white text-sm font-bold shrink-0">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-pay-navy truncate">{profile?.full_name}</div>
            <div className="text-xs text-[#7A889E] capitalize">{roleLabel(profile?.role)}</div>
          </div>
          <button onClick={signOut} className="p-2 rounded-full text-[#4A5A73] hover:bg-white hover:text-red-600" aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="paytm flex min-h-screen font-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white flex-col border-r border-pay-line sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-pay-line shadow-card px-4 py-2.5">
        {brand}
        <button onClick={() => setMobileOpen(true)} className="text-pay-navy p-1.5 rounded-full hover:bg-pay-bg" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-pay-navy/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[82vw] bg-white flex flex-col h-full overflow-y-auto rounded-r-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  )
}
