import {
  LayoutGrid, Users, Building2, UserCog, CalendarDays, CalendarCheck, Award, TrendingUp,
  Medal, Package, Wallet, PiggyBank, Trophy, Inbox, ScrollText, ShieldCheck,
  LayoutTemplate, Settings2, BarChart3, Megaphone, History,
} from 'lucide-react'

// Single source for the admin sidebar and the dashboard tiles.
export const ADMIN_NAV = [
  { label: 'Dashboard', short: 'Home', path: '/admin', end: true, icon: LayoutGrid },
  { group: 'Insights', label: 'Reports & Analytics', short: 'Reports', desc: 'Charts & monthly report', path: '/admin/reports', icon: BarChart3 },

  { group: 'People', label: 'Students', short: 'Students', desc: 'Profiles, batches, belt rank', path: '/admin/students', icon: Users },
  { group: 'People', label: 'Coaches', short: 'Coaches', desc: 'Instructor profiles', path: '/admin/coaches', icon: UserCog },
  { group: 'People', label: 'Training Centers', short: 'Centers', desc: 'Branches under the association', path: '/admin/training-centers', icon: Building2 },
  { group: 'People', label: 'Batches', short: 'Batches', desc: 'Class groups & timing', path: '/admin/batches', icon: CalendarDays },

  { group: 'Training', label: 'Attendance', short: 'Attendance', desc: 'Mark daily attendance', path: '/admin/attendance', icon: CalendarCheck },
  { group: 'Training', label: 'Belt Exams', short: 'Belt Exams', desc: 'Exams, results, certificates', path: '/admin/belt-exams', icon: Award },
  { group: 'Training', label: 'Student Performance', short: 'Performance', desc: 'Coach evaluations', path: '/admin/performance', icon: TrendingUp },
  { group: 'Training', label: 'Achievements', short: 'Achievements', desc: 'Medals & awards', path: '/admin/achievements', icon: Medal },
  { group: 'Training', label: 'Events', short: 'Events', desc: 'Tournaments & seminars', path: '/admin/events', icon: Trophy },

  { group: 'Payments & Operations', label: 'Fee Management', short: 'Collect Fees', desc: 'Monthly dues & receipts', path: '/admin/fees', icon: Wallet },
  { group: 'Payments & Operations', label: 'Fee Setup', short: 'Fee Setup', desc: 'Rates & one-time fees', path: '/admin/fee-setup', icon: Settings2, superAdminOnly: true },
  { group: 'Payments & Operations', label: 'Accounts', short: 'Accounts', desc: 'Income vs expenses', path: '/admin/accounts', icon: PiggyBank },
  { group: 'Payments & Operations', label: 'Equipment Record', short: 'Equipment', desc: 'Uniforms, gear & stock', path: '/admin/equipment', icon: Package },
  { group: 'Payments & Operations', label: 'Enquiries', short: 'Enquiries', desc: 'Website leads', path: '/admin/enquiries', icon: Inbox },

  { group: 'Administration', label: 'Notices', short: 'Notices', desc: 'Announcements to students', path: '/admin/notices', icon: Megaphone },
  { group: 'Administration', label: 'Rules & Regulations', short: 'Rules', desc: 'Academy policies', path: '/admin/rules', icon: ScrollText },
  { group: 'Administration', label: 'Website Content', short: 'Website', desc: 'Homepage text & photos', path: '/admin/website', icon: LayoutTemplate, superAdminOnly: true },
  { group: 'Administration', label: 'Users', short: 'Users', desc: 'Roles & student logins', path: '/admin/users', icon: ShieldCheck, superAdminOnly: true },
  { group: 'Administration', label: 'Activity Log', short: 'Activity', desc: 'Who changed what', path: '/admin/activity', icon: History, superAdminOnly: true },
]

export function navForRole(role) {
  return ADMIN_NAV.filter((item) => !item.superAdminOnly || role === 'super_admin')
}
