import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/site.css'
import logo from '../../assets/logo.png'

export default function PublicRules() {
  const [rules, setRules] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('rules_and_regulations')
        .select('*')
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error) setError(error.message)
      else setRules(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="brand-logo" />
            <div className="brand-text">
              <div className="logo">THOUBAL <span>TKD</span></div>
              <div className="brand-sub">Thoubal District Taekwondo Association</div>
            </div>
          </Link>
          <Link to="/" className="btn btn-outline">← Home</Link>
        </div>
      </header>

      <section style={{ padding: '64px 0' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="section-head">
            <div className="kicker-line">Academy policy</div>
            <h2>Rules &amp; Regulations</h2>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p style={{ color: 'var(--red)' }}>Could not load rules right now.</p>
          ) : !rules ? (
            <p style={{ color: 'var(--charcoal)' }}>Rules have not been published yet. Please check back soon.</p>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.02rem', lineHeight: 1.8, color: 'var(--charcoal)' }}>
              {rules.content}
            </div>
          )}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-bottom">
            <span>© 2026 Thoubal Taekwondo Academy. All rights reserved.</span>
            <Link to="/login">Student &amp; Parent Login →</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
