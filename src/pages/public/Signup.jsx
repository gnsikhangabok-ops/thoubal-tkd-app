import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/site.css'
import logo from '../../assets/logo.png'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError('Signup succeeded but no user was returned. Please try logging in.')
      setSubmitting(false)
      return
    }

    // Create profile row with default role 'student'
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role: 'student',
      full_name: fullName,
    })

    setSubmitting(false)

    if (profileError) {
      setError(`Account created, but profile setup failed: ${profileError.message}. Please contact the academy admin.`)
      return
    }

    // If email confirmation is required, session may be null — send to login either way
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 28 }}>
          <img src={logo} alt="Thoubal Taekwondo Academy" className="brand-logo" />
          <div className="brand-text">
            <div className="logo">THOUBAL <span>TKD</span></div>
            <div className="brand-sub">Thoubal District Taekwondo Association</div>
          </div>
        </div>
        <h2>Create Account</h2>
        <p className="auth-sub">For students, parents, and staff. Access is assigned by the academy admin after signup.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <Link to="/login" className="auth-back">Already have an account? Sign in</Link>
        <Link to="/" className="auth-back">← Back to homepage</Link>
      </div>
    </div>
  )
}
