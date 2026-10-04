import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSiteContent } from '../../lib/siteContent'
import PublicHeader from '../../components/site/PublicHeader'
import PublicFooter from '../../components/site/PublicFooter'
import { useT } from '../../lib/i18n'

export default function PublicRules() {
  const { c } = useSiteContent()
  const { t } = useT()
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
    <div className="paytm font-body text-charcoal min-h-screen flex flex-col">
      <PublicHeader />

      <div className="bg-gradient-to-br from-pay-navy via-[#0057A8] to-pay-blue rounded-b-[2rem]">
        <div className="max-w-[860px] mx-auto px-4 md:px-7 pt-8 pb-20">
          <nav aria-label="Breadcrumb" className="text-xs text-white/75 mb-2">
            <Link to="/" className="hover:text-white underline">{t('Home')}</Link>
            <span className="mx-1.5">›</span>
            <span aria-current="page">{t('Rules & Regulations')}</span>
          </nav>
          <h1 className="!text-white text-2xl md:text-3xl font-bold">{t('Rules & Regulations')}</h1>
          <p className="text-white/85 text-sm mt-1">{t('Academy policy every student and parent agrees to at registration.')}</p>
        </div>
      </div>

      <main id="main" className="flex-1 pb-12">
        <div className="max-w-[860px] mx-auto px-4 md:px-7 -mt-12">
          <article className="bg-surface rounded-3xl shadow-card overflow-hidden">
            <header className="flex items-center justify-between flex-wrap gap-2 px-6 md:px-8 py-4 border-b border-pay-line">
              <h2 className="text-base font-bold">{t('Academy policy document')}</h2>
              {rules?.version != null && (
                <span className="rounded-full bg-pay-sky text-pay-action text-xs font-semibold px-3 py-1">{t('Version {v}', { v: rules.version })}</span>
              )}
            </header>
            <div className="px-6 md:px-8 py-6 md:py-8">
              {loading ? (
                <p className="text-muted">{t('Loading…')}</p>
              ) : error ? (
                <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{t('Could not load rules right now. Please try again later.')}</p>
              ) : !rules ? (
                <p className="text-muted">{t('Rules have not been published yet. Please check back soon.')}</p>
              ) : (
                <div className="whitespace-pre-wrap text-[1.02rem] leading-relaxed text-body">{rules.content}</div>
              )}
            </div>
          </article>
        </div>
      </main>

      <PublicFooter c={c} />
    </div>
  )
}
