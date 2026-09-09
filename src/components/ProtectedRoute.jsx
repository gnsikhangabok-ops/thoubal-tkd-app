import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route element and only renders it if the logged-in user's
 * role is included in `allowedRoles`. Otherwise redirects to /login
 * (not logged in) or /unauthorized (wrong role).
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['super_admin','coach']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: 40 }}>Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
