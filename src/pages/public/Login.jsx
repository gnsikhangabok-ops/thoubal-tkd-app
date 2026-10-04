import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthShell from '../../components/site/AuthShell'
import PageLoader from '../../components/site/PageLoader'
import { TextField, PasswordField, Alert } from '../../components/site/FormField'
import { primaryButton } from '../../lib/ui'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in (or just signed in): let RoleRedirect pick the right area.
  if (session) return <Navigate to="/redirect" replace />
  if (loading) return <PageLoader />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error.message)
  }

  const notice = location.state?.notice

  return (
    <AuthShell
      title="Sign in"
      subtitle="Login for students, parents, coaches and academy staff"
      footer={
        <p className="text-charcoal">
          New to the academy portal?{' '}
          <Link to="/signup" className="font-semibold text-ink underline hover:text-brand-red">Register an account</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {notice && <Alert tone="success">{notice}</Alert>}
        <TextField
          label="Email address" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={`${primaryButton} mt-1`} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
