import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

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
import Users from './pages/admin/modules/Users'
import PublicRules from './pages/public/PublicRules'
import Signup from './pages/public/Signup'
import StudentPortal from './pages/portal/StudentPortal'

function Admin({ allowedRoles, children }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

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
          <Route path="/signup" element={<Signup />} />

          {/* Admin / Coach area — all wrapped in the persistent sidebar layout */}
          <Route path="/admin" element={<Admin allowedRoles={['super_admin', 'coach']}><AdminDashboard /></Admin>} />
          <Route path="/admin/training-centers" element={<Admin allowedRoles={['super_admin', 'coach']}><TrainingCenters /></Admin>} />
          <Route path="/admin/coaches" element={<Admin allowedRoles={['super_admin', 'coach']}><Coaches /></Admin>} />
          <Route path="/admin/students" element={<Admin allowedRoles={['super_admin', 'coach']}><Students /></Admin>} />
          <Route path="/admin/batches" element={<Admin allowedRoles={['super_admin', 'coach']}><Batches /></Admin>} />
          <Route path="/admin/rules" element={<Admin allowedRoles={['super_admin', 'coach']}><RulesAndRegulations /></Admin>} />
          <Route path="/admin/belt-exams" element={<Admin allowedRoles={['super_admin', 'coach']}><BeltExams /></Admin>} />
          <Route path="/admin/fees" element={<Admin allowedRoles={['super_admin', 'coach']}><FeeManagement /></Admin>} />
          <Route path="/admin/attendance" element={<Admin allowedRoles={['super_admin', 'coach']}><Attendance /></Admin>} />
          <Route path="/admin/achievements" element={<Admin allowedRoles={['super_admin', 'coach']}><Achievements /></Admin>} />
          <Route path="/admin/performance" element={<Admin allowedRoles={['super_admin', 'coach']}><StudentPerformance /></Admin>} />
          <Route path="/admin/equipment" element={<Admin allowedRoles={['super_admin', 'coach']}><EquipmentRecord /></Admin>} />
          <Route path="/admin/accounts" element={<Admin allowedRoles={['super_admin', 'coach']}><Accounts /></Admin>} />
          <Route path="/admin/enquiries" element={<Admin allowedRoles={['super_admin', 'coach']}><Enquiries /></Admin>} />
          <Route path="/admin/events" element={<Admin allowedRoles={['super_admin', 'coach']}><Events /></Admin>} />
          <Route path="/admin/users" element={<Admin allowedRoles={['super_admin']}><Users /></Admin>} />

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
