import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
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

    navigate('/login')
  }

  const inputClass = "px-3.5 py-3 border border-black/10 bg-white font-body text-[0.95rem] text-ink focus:outline-2 focus:outline-brand-red focus:outline-offset-1"

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-5 font-body">
      <div className="w-full max-w-sm bg-chalk px-9 py-10 border-t-4 border-t-brand-red">
        <div className="flex items-center gap-3 mb-7">
          <img src={logo} alt="Thoubal Taekwondo Academy" className="w-11 h-11 object-contain" />
          <div className="flex flex-col leading-tight">
            <div className="font-display font-bold text-lg text-ink">THOUBAL <span className="text-brand-red">TKD</span></div>
            <div className="text-[0.62rem] tracking-wide text-charcoal uppercase mt-0.5">Thoubal District Taekwondo Association</div>
          </div>
        </div>
        <h2 className="font-display text-ink uppercase text-2xl mb-1.5">Create Account</h2>
        <p className="text-charcoal text-sm mb-7">For students, parents, and staff. Access is assigned by the academy admin after signup.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-brand-red text-sm">{error}</p>}
          <button
            type="submit"
            className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark mt-1 w-full disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <Link to="/login" className="block text-center mt-5 text-sm text-charcoal hover:text-brand-red">Already have an account? Sign in</Link>
        <Link to="/" className="block text-center mt-2 text-sm text-charcoal hover:text-brand-red">← Back to homepage</Link>
      </div>
    </div>
  )
}
