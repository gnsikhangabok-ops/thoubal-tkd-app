import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

import Home from './pages/public/Home'
import Login from './pages/public/Login'
import RoleRedirect from './pages/public/RoleRedirect'
import Unauthorized from './pages/public/Unauthorized'
import Signup from './pages/public/Signup'
import PageLoader from './components/site/PageLoader'
import OfflineBanner from './components/OfflineBanner'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'

// Admin, portal and secondary pages load on demand to keep the public bundle small
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const TrainingCenters = lazy(() => import('./pages/admin/modules/TrainingCenters'))
const Coaches = lazy(() => import('./pages/admin/modules/Coaches'))
const Students = lazy(() => import('./pages/admin/modules/Students'))
const Batches = lazy(() => import('./pages/admin/modules/Batches'))
const RulesAndRegulations = lazy(() => import('./pages/admin/modules/RulesAndRegulations'))
const BeltExams = lazy(() => import('./pages/admin/modules/BeltExams'))
const FeeManagement = lazy(() => import('./pages/admin/modules/FeeManagement'))
const FeeSetup = lazy(() => import('./pages/admin/modules/FeeSetup'))
const Attendance = lazy(() => import('./pages/admin/modules/Attendance'))
const Achievements = lazy(() => import('./pages/admin/modules/Achievements'))
const StudentPerformance = lazy(() => import('./pages/admin/modules/StudentPerformance'))
const EquipmentRecord = lazy(() => import('./pages/admin/modules/EquipmentRecord'))
const Accounts = lazy(() => import('./pages/admin/modules/Accounts'))
const Enquiries = lazy(() => import('./pages/admin/modules/Enquiries'))
const Events = lazy(() => import('./pages/admin/modules/Events'))
const Users = lazy(() => import('./pages/admin/modules/Users'))
const WebsiteContent = lazy(() => import('./pages/admin/modules/WebsiteContent'))
const Reports = lazy(() => import('./pages/admin/modules/Reports'))
const StudentFile = lazy(() => import('./pages/admin/StudentFile'))
const Notices = lazy(() => import('./pages/admin/modules/Notices'))
const ActivityLog = lazy(() => import('./pages/admin/modules/ActivityLog'))
const NotFound = lazy(() => import('./pages/public/NotFound'))
const PublicRules = lazy(() => import('./pages/public/PublicRules'))
const StudentPortal = lazy(() => import('./pages/portal/StudentPortal'))

function Admin({ allowedRoles, children }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>
        <ChunkErrorBoundary>
          <Suspense fallback={<div className="p-12 text-charcoal">Loading…</div>}>{children}</Suspense>
        </ChunkErrorBoundary>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ChunkErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public site */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/redirect" element={<RoleRedirect />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/rules" element={<PublicRules />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin / Coach area — all wrapped in the persistent sidebar layout */}
            <Route path="/admin" element={<Admin allowedRoles={['super_admin', 'coach']}><AdminDashboard /></Admin>} />
            <Route path="/admin/reports" element={<Admin allowedRoles={['super_admin', 'coach']}><Reports /></Admin>} />
            <Route path="/admin/training-centers" element={<Admin allowedRoles={['super_admin', 'coach']}><TrainingCenters /></Admin>} />
            <Route path="/admin/coaches" element={<Admin allowedRoles={['super_admin', 'coach']}><Coaches /></Admin>} />
            <Route path="/admin/students" element={<Admin allowedRoles={['super_admin', 'coach']}><Students /></Admin>} />
            <Route path="/admin/students/:id" element={<Admin allowedRoles={['super_admin', 'coach']}><StudentFile /></Admin>} />
            <Route path="/admin/batches" element={<Admin allowedRoles={['super_admin', 'coach']}><Batches /></Admin>} />
            <Route path="/admin/rules" element={<Admin allowedRoles={['super_admin', 'coach']}><RulesAndRegulations /></Admin>} />
            <Route path="/admin/belt-exams" element={<Admin allowedRoles={['super_admin', 'coach']}><BeltExams /></Admin>} />
            <Route path="/admin/fees" element={<Admin allowedRoles={['super_admin', 'coach']}><FeeManagement /></Admin>} />
            <Route path="/admin/fee-setup" element={<Admin allowedRoles={['super_admin']}><FeeSetup /></Admin>} />
            <Route path="/admin/attendance" element={<Admin allowedRoles={['super_admin', 'coach']}><Attendance /></Admin>} />
            <Route path="/admin/achievements" element={<Admin allowedRoles={['super_admin', 'coach']}><Achievements /></Admin>} />
            <Route path="/admin/performance" element={<Admin allowedRoles={['super_admin', 'coach']}><StudentPerformance /></Admin>} />
            <Route path="/admin/equipment" element={<Admin allowedRoles={['super_admin', 'coach']}><EquipmentRecord /></Admin>} />
            <Route path="/admin/accounts" element={<Admin allowedRoles={['super_admin', 'coach']}><Accounts /></Admin>} />
            <Route path="/admin/enquiries" element={<Admin allowedRoles={['super_admin', 'coach']}><Enquiries /></Admin>} />
            <Route path="/admin/events" element={<Admin allowedRoles={['super_admin', 'coach']}><Events /></Admin>} />
            <Route path="/admin/users" element={<Admin allowedRoles={['super_admin']}><Users /></Admin>} />
            <Route path="/admin/notices" element={<Admin allowedRoles={['super_admin', 'coach']}><Notices /></Admin>} />
            <Route path="/admin/activity" element={<Admin allowedRoles={['super_admin']}><ActivityLog /></Admin>} />
            <Route path="/admin/website" element={<Admin allowedRoles={['super_admin']}><WebsiteContent /></Admin>} />

            {/* Student / Parent portal */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPortal />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChunkErrorBoundary>
        <OfflineBanner />
      </BrowserRouter>
    </AuthProvider>
  )
}
