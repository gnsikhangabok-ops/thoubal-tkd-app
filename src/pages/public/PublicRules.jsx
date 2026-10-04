import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSiteContent } from '../../lib/siteContent'
import PublicHeader from '../../components/site/PublicHeader'
import PublicFooter from '../../components/site/PublicFooter'

export default function PublicRules() {
  const { c } = useSiteContent()
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
        .maybeSingle()

      if (error) setError(error.message)
      else setRules(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="font-body text-charcoal bg-chalk min-h-screen flex flex-col">
      <PublicHeader />

      {/* Page title band with breadcrumb */}
      <div className="bg-[#EAF0F8] border-b border-line">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-6">
          <nav aria-label="Breadcrumb" className="text-xs text-charcoal mb-2">
            <Link to="/" className="hover:text-brand-red underline">Home</Link>
            <span className="mx-1.5">›</span>
            <span aria-current="page">Rules &amp; Regulations</span>
          </nav>
          <h1 className="text-2xl md:text-3xl text-ink">Rules &amp; Regulations</h1>
        </div>
      </div>

      <main id="main" className="flex-1 py-10 md:py-14">
        <div className="max-w-[860px] mx-auto px-4 md:px-7">
          <article className="bg-white border border-line">
            <header className="flex items-center justify-between flex-wrap gap-2 px-5 md:px-8 py-4 border-b border-line border-l-4 border-l-brand-red">
              <h2 className="text-base text-ink">Academy Policy Document</h2>
              {rules?.version != null && (
                <span className="text-xs font-display uppercase tracking-wide bg-ink text-chalk px-2.5 py-1">Version {rules.version}</span>
              )}
            </header>
            <div className="px-5 md:px-8 py-6 md:py-8">
              {loading ? (
                <p>Loading…</p>
              ) : error ? (
                <p className="text-brand-red">Could not load rules right now. Please try again later.</p>
              ) : !rules ? (
                <p className="text-charcoal">Rules have not been published yet. Please check back soon.</p>
              ) : (
                <div className="whitespace-pre-wrap text-[1.02rem] leading-relaxed text-charcoal">{rules.content}</div>
              )}
            </div>
          </article>
        </div>
      </main>

      <PublicFooter c={c} />
    </div>
  )
}
