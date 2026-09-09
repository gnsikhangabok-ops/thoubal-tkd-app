import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// After login, this decides where each role lands.
export default function RoleRedirect() {
  const { role, loading } = useAuth()

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>

  if (role === 'super_admin' || role === 'coach') {
    return <Navigate to="/admin" replace />
  }
  if (role === 'student') {
    return <Navigate to="/portal" replace />
  }
  return <Navigate to="/login" replace />
}
