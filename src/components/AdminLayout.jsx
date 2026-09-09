import { NavLink, useLocation } from 'react-router-dom'
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
  { label: 'Accounts', path: '/admin/accounts' },
  { label: 'Events', path: '/admin/events' },
  { label: 'Enquiries', path: '/admin/enquiries' },
  { label: 'Rules & Regulations', path: '/admin/rules' },
  { label: 'Users', path: '/admin/users', superAdminOnly: true },
]

export default function AdminLayout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || profile?.role === 'super_admin'
  )

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="brand-logo" />
          <div className="brand-text">
            <div className="logo">THOUBAL <span>TKD</span></div>
          </div>
        </div>

        <nav className="admin-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="dash-user" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span>{profile?.full_name}</span>
            <span className="role-tag">{profile?.role?.replace('_', ' ')}</span>
          </div>
          <button className="dash-signout" onClick={signOut} style={{ marginTop: 10, width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}
