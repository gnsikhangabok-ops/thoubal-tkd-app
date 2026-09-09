import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/public/Home'
import Login from './pages/public/Login'
import RoleRedirect from './pages/public/RoleRedirect'
import Unauthorized from './pages/public/Unauthorized'
import AdminDashboard from './pages/admin/AdminDashboard'
import TrainingCenters from './pages/admin/modules/TrainingCenters'
import Coaches from './pages/admin/modules/Coaches'
import Students from './pages/admin/modules/Students'
import Batches from './pages/admin/modules/Batches'
import RulesAndRegulations from './pages/admin/modules/RulesAndRegulations'
import BeltExams from './pages/admin/modules/BeltExams'
import FeeManagement from './pages/admin/modules/FeeManagement'
import Attendance from './pages/admin/modules/Attendance'
import Achievements from './pages/admin/modules/Achievements'
import StudentPerformance from './pages/admin/modules/StudentPerformance'
import EquipmentRecord from './pages/admin/modules/EquipmentRecord'
import Accounts from './pages/admin/modules/Accounts'
import Enquiries from './pages/admin/modules/Enquiries'
import Events from './pages/admin/modules/Events'
import PublicRules from './pages/public/PublicRules'
import StudentPortal from './pages/portal/StudentPortal'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public site */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/redirect" element={<RoleRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/rules" element={<PublicRules />} />

          {/* Admin / Coach area */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/training-centers"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <TrainingCenters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coaches"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Coaches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Batches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rules"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <RulesAndRegulations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/belt-exams"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <BeltExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <FeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <StudentPerformance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/equipment"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <EquipmentRecord />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enquiries"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Enquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'coach']}>
                <Events />
              </ProtectedRoute>
            }
          />

          {/* Student / Parent portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
