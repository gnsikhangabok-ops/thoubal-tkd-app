import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AuthShell from '../../components/site/AuthShell'
import PageLoader from '../../components/site/PageLoader'
import { TextField, PasswordField, Alert } from '../../components/site/FormField'
import { primaryButton } from '../../lib/ui'

export default function Signup() {
  const { session, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — but not while our own signup is still creating the profile.
  if (session && !submitting) return <Navigate to="/redirect" replace />
  if (loading && !submitting) return <PageLoader />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    // full_name in user metadata lets the on-signup database trigger create the profile
    // (see supabase/migrations). The client-side upsert below is a fallback.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    if (!data.session) {
      // Email confirmation is on: the user can't act until they confirm.
      setSubmitting(false)
      navigate('/login', {
        replace: true,
        state: { notice: `Registration received. Please check ${email} for a confirmation link, then sign in.` },
      })
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { id: data.user.id, role: 'student', full_name: fullName },
        { onConflict: 'id', ignoreDuplicates: true },
      )

    if (profileError) {
      console.error('Profile setup failed:', profileError.message)
    }

    await refreshProfile()
    setSubmitting(false)
    navigate('/redirect', { replace: true })
  }

  return (
    <AuthShell
      title="New Account Registration"
      subtitle="For students and parents. Coaches and staff should register here too — the academy admin will then grant staff access."
      footer={
        <p className="text-charcoal">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-ink underline hover:text-brand-red">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Full name" type="text" autoComplete="name" required
          value={fullName} onChange={(e) => setFullName(e.target.value)}
        />
        <TextField
          label="Email address" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password" autoComplete="new-password" required minLength={6}
          visible={showPassword} onToggle={() => setShowPassword((v) => !v)}
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm password" autoComplete="new-password" required
          visible={showPassword} showToggle={false}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <p className="text-xs text-charcoal -mt-1">Minimum 6 characters. Fields marked <span className="text-brand-red">*</span> are mandatory.</p>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={`${primaryButton} mt-1`} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
    </AuthShell>
  )
}
