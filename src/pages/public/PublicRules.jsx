import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
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
    <div className="font-body text-charcoal bg-chalk min-h-screen">
      <header className="sticky top-0 z-50 bg-chalk border-b border-black/10">
        <div className="max-w-[1180px] mx-auto px-7 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="w-11 h-11 object-contain" />
            <div className="flex flex-col leading-tight">
              <div className="font-display font-bold text-lg text-ink">THOUBAL <span className="text-brand-red">TKD</span></div>
              <div className="text-[0.62rem] tracking-wide text-charcoal uppercase mt-0.5">Thoubal District Taekwondo Association</div>
            </div>
          </Link>
          <Link to="/" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk">← Home</Link>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-[760px] mx-auto px-7">
          <div className="mb-9">
            <div className="text-brand-red font-display font-semibold text-sm mb-2">Academy policy</div>
            <h2 className="font-display text-ink uppercase text-3xl">Rules &amp; Regulations</h2>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p className="text-brand-red">Could not load rules right now.</p>
          ) : !rules ? (
            <p className="text-charcoal">Rules have not been published yet. Please check back soon.</p>
          ) : (
            <div className="whitespace-pre-wrap text-[1.02rem] leading-relaxed text-charcoal">
              {rules.content}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-ink text-[#C9C7C0] py-8">
        <div className="max-w-[1180px] mx-auto px-7 flex justify-between flex-wrap gap-3 text-sm">
          <span>© 2026 Thoubal Taekwondo Academy. All rights reserved.</span>
          <Link to="/login" className="hover:text-gold">Student &amp; Parent Login →</Link>
        </div>
      </footer>
    </div>
  )
}
