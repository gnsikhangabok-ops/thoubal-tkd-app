import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../styles/site.css'
import logo from '../../assets/logo.png'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email, password)

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/redirect')
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
        <h2>Sign in</h2>
        <p className="auth-sub">Student, parent, and staff login</p>
        <form onSubmit={handleSubmit}>
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
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link to="/signup" className="auth-back">Don't have an account? Sign up</Link>
        <Link to="/" className="auth-back">← Back to homepage</Link>
      </div>
    </div>
  )
}
