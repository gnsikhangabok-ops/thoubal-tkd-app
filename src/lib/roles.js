// Where each role lands after login. Returns null for an account with no usable role.
export function homePathForRole(role) {
  if (role === 'super_admin' || role === 'coach') return '/admin'
  if (role === 'student') return '/portal'
  return null
}

export function roleLabel(role) {
  return role ? role.replace('_', ' ') : ''
}
