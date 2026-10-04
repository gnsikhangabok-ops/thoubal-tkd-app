import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSiteContent, telHref } from '../../lib/siteContent'
import { inputClass } from '../../lib/ui'
import PublicHeader from '../../components/site/PublicHeader'
import PublicFooter from '../../components/site/PublicFooter'
import { Alert } from '../../components/site/FormField'
import { useT } from '../../lib/i18n'
import {
  ShieldCheck, Users2, Medal, Sparkles, Target, HeartPulse,
  GraduationCap, Globe2, Trophy, Flag, FileText,
  ClipboardList, LogIn, Award, Megaphone, MapPin, Phone, Mail, Clock, BadgeCheck,
} from 'lucide-react'

const WHY_FEATURES = [
  { icon: ShieldCheck, title: 'Certified Coaches', desc: 'Trained under NIS and SAI-certified instructors with national referee experience.' },
  { icon: Users2, title: 'Small Batch Sizes', desc: 'Focused attention per student across every age group and skill level.' },
  { icon: Medal, title: 'Structured Belt System', desc: 'A clear, disciplined path from white belt to black belt.' },
  { icon: Sparkles, title: 'Discipline First', desc: 'Respect, punctuality, and self-control are built into every session.' },
  { icon: Target, title: 'Competition Exposure', desc: 'Regular access to district, state, and national tournaments.' },
  { icon: HeartPulse, title: 'Fitness & Self-Defense', desc: 'Practical skills alongside conditioning for all fitness levels.' },
  { icon: GraduationCap, title: 'Regular Gradings', desc: 'Scheduled belt exams to track and reward real progress.' },
  { icon: Flag, title: 'Govt. Registered Academy', desc: 'Officially registered under Thoubal District Taekwondo Association.', national: true },
  { icon: Globe2, title: 'Affiliated Nationally', desc: 'Recognized by AMTA, Taekwondo Federation of India, and Asian Taekwondo Union.', national: true },
  { icon: Trophy, title: 'Olympic Sport Pathway', desc: 'Taekwondo is an Olympic discipline — train with a pathway to the highest stage.', national: true },
]

const PROGRAMS = [
  { age: 'Ages 5–8', title: 'Little Dragons', desc: 'Coordination, discipline basics, and fun introduction to stances and kicks.' },
  { age: 'Ages 9–14', title: 'Junior Program', desc: 'Poomsae fundamentals, controlled sparring, and belt-grading preparation.' },
  { age: 'Ages 15+', title: 'Senior Program', desc: 'Advanced Kyorugi, competition training, and black belt curriculum.' },
  { age: 'All levels', title: 'Competition Squad', desc: 'Selective training for state and national tournament representation.' },
  { age: 'Adults', title: 'Self-Defense & Fitness', desc: 'Practical self-defense and conditioning for adult beginners.' },
]

const QUICK_LINKS = [
  { icon: ClipboardList, label: 'Admission Enquiry', href: '#enquiry' },
  { icon: FileText, label: 'Rules & Regulations', to: '/rules' },
  { icon: Award, label: 'Belt Grading Programs', href: '#programs' },
  { icon: Trophy, label: 'Achievements & Results', href: '#achievements' },
  { icon: LogIn, label: 'Student / Parent Login', to: '/login' },
]

const MEDAL_COLOR = { gold: '#D4A537', silver: '#A8A8A8', bronze: '#B08D57' }
const EMPTY_ENQUIRY = { child_name: '', age: '', guardian_phone: '', program_interested: 'Little Dragons (5–8)', message: '' }

function SectionHeading({ kicker, title, light = false }) {
  const { t } = useT()
  return (
    <div className="mb-8">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-2.5 ${light ? 'bg-white/15 text-white' : 'bg-pay-sky text-pay-action'}`}>{t(kicker)}</span>
      <h2 className={`text-2xl md:text-3xl font-bold ${light ? '!text-white' : ''}`}>{t(title)}</h2>
    </div>
  )
}

function PhotoPlaceholder({ label, className = '' }) {
  const { t } = useT()
  return (
    <div className={`bg-gradient-to-br from-pay-sky to-pay-sky-2 rounded-2xl flex items-center justify-center text-subtle text-sm font-medium ${className}`}>
      {t(label)}
    </div>
  )
}

export default function Home() {
  const { content, c } = useSiteContent()
  const { t } = useT()
  const [recentAchievements, setRecentAchievements] = useState([])
  const [enquiryForm, setEnquiryForm] = useState(EMPTY_ENQUIRY)
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquiryStatus, setEnquiryStatus] = useState('')

  useEffect(() => {
    supabase
      .from('achievements')
      .select('*, students(full_name)')
      .order('achievement_date', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setRecentAchievements(data) })
  }, [])

  async function handleEnquirySubmit(e) {
    e.preventDefault()
    setEnquirySubmitting(true)
    setEnquiryStatus('')

    const { error } = await supabase.from('enquiries').insert({
      child_name: enquiryForm.child_name,
      age: enquiryForm.age ? parseInt(enquiryForm.age, 10) : null,
      guardian_phone: enquiryForm.guardian_phone,
      program_interested: enquiryForm.program_interested,
      message: enquiryForm.message || null,
    })

    setEnquirySubmitting(false)
    if (error) {
      setEnquiryStatus('error')
    } else {
      setEnquiryStatus('success')
      setEnquiryForm(EMPTY_ENQUIRY)
    }
  }

  const setField = (key) => (e) => setEnquiryForm({ ...enquiryForm, [key]: e.target.value })
  const galleryKeys = ['gallery_1', 'gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6']
  const hasGalleryImages = galleryKeys.some((k) => content[k])
  const phoneHref = telHref(c('contact_phone'))
  const sectionCls = 'py-12 md:py-16 scroll-mt-20'
  const container = 'max-w-[1180px] mx-auto px-4 md:px-7'

  return (
    <div id="top" className="paytm font-body text-charcoal">
      <PublicHeader />

      <main id="main">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-pay-navy via-[#0057A8] to-pay-blue rounded-b-[2rem] md:rounded-b-[3rem]">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute right-40 -bottom-32 w-72 h-72 rounded-full bg-white/10" aria-hidden="true" />
          <div className={`${container} relative pt-12 md:pt-16 pb-28 md:pb-32`}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white mb-5">
              <BadgeCheck size={14} /> {t('Registered Academy · Olympic Sport')}
            </span>
            <p className="text-[#8FE3FF] font-semibold text-sm mb-2">{c('hero_kicker')}</p>
            <h1 className="!text-white font-bold leading-[1.1] max-w-[18ch] text-4xl md:text-6xl">{c('hero_headline')}</h1>
            <p className="text-white/85 text-base md:text-lg max-w-[52ch] my-6">{c('hero_body')}</p>
            <div className="flex gap-3 flex-wrap">
              <a href="#enquiry" className="rounded-full bg-surface px-6 py-3 text-sm font-bold text-heading shadow-card hover:bg-pay-sky">{t('Enroll Now')}</a>
              <a href="#programs" className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">{t('View Programs')}</a>
            </div>
          </div>
        </section>

        {/* QUICK SERVICES — overlaps the hero like an app service grid */}
        <div className={`${container} relative -mt-20 md:-mt-24`}>
          <div className="bg-surface rounded-3xl shadow-card p-5 md:p-7">
            <h2 className="text-base font-bold mb-5">{t('Quick Services')}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-6 gap-x-2">
              {QUICK_LINKS.map(({ icon: Icon, label, href, to }) => {
                const cls = 'group flex flex-col items-center text-center gap-2'
                const inner = (
                  <>
                    <span className="grid place-items-center w-14 h-14 rounded-2xl bg-pay-sky text-pay-action group-hover:bg-pay-action group-hover:text-white transition-colors">
                      <Icon size={24} strokeWidth={1.9} />
                    </span>
                    <span className="text-xs md:text-sm font-medium text-heading leading-tight">{t(label)}</span>
                  </>
                )
                return to
                  ? <Link key={label} to={to} className={cls}>{inner}</Link>
                  : <a key={label} href={href} className={cls}>{inner}</a>
              })}
            </div>
          </div>

          {/* Announcement banner */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FFF6E5] px-4 py-3 overflow-hidden">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-[#FFE2A8] text-[#9A5B00]">
              <Megaphone size={17} />
            </span>
            <div className="flex-1 overflow-hidden text-sm text-[#6B4300]">
              <p className="ticker whitespace-nowrap"><strong>{t('Latest update:')}</strong> {c('announcement')}</p>
            </div>
          </div>

          {/* Key figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
            {[
              { n: c('stat_students'), l: 'Students trained', icon: Users2 },
              { n: c('stat_medals'), l: 'State & national medals', icon: Medal },
              { n: c('stat_belts'), l: 'Belt ranks taught', icon: Award },
              { n: PROGRAMS.length, l: 'Training programs', icon: Target },
            ].map(({ n, l, icon: Icon }) => (
              <div key={l} className="bg-surface rounded-2xl shadow-card p-4 md:p-5 flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-pay-sky text-pay-action shrink-0"><Icon size={20} /></span>
                <div className="min-w-0">
                  <strong className="block text-2xl font-bold text-heading leading-none">{n}</strong>
                  <span className="text-xs text-muted">{t(l)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section id="about" className={sectionCls}>
          <div className={`${container} grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-center`}>
            {content.about_image ? (
              <img src={content.about_image} alt="Training at Thoubal Taekwondo Academy" className="aspect-[4/3] w-full object-cover rounded-3xl shadow-card" />
            ) : (
              <PhotoPlaceholder label="Academy photo" className="aspect-[4/3]" />
            )}
            <div>
              <SectionHeading kicker="About the academy" title={c('about_heading')} />
              <p className="mb-4 text-[1.02rem] text-body">{c('about_paragraph_1')}</p>
              <p className="mb-6 text-[1.02rem] text-body">{c('about_paragraph_2')}</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Governing body', t('Thoubal District Taekwondo Association')],
                  ['Affiliations', 'AMTA · TFI · Asian Taekwondo Union'],
                  ['Disciplines', t('Poomsae, Kyorugi, Self-defense')],
                  ['Location', c('contact_address')],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface rounded-2xl shadow-card px-4 py-3">
                    <div className="text-xs text-subtle">{t(k)}</div>
                    <div className="font-semibold text-heading mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Training programs" title="A path for every age and level" />
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-visible snap-x [scrollbar-width:none]">
              {PROGRAMS.map((p, i) => (
                <div key={p.title} className="snap-start shrink-0 w-[240px] md:w-auto bg-surface rounded-2xl shadow-card p-5 flex flex-col">
                  <span className="grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-pay-navy to-pay-blue text-white text-sm font-bold mb-4">{i + 1}</span>
                  <span className="self-start rounded-full bg-pay-sky text-pay-action text-xs font-semibold px-2.5 py-0.5 mb-2">{t(p.age)}</span>
                  <h3 className="text-lg font-bold mb-1.5">{t(p.title)}</h3>
                  <p className="text-sm text-muted">{t(p.desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section id="achievements" className={sectionCls}>
          <div className={container}>
            <div className="rounded-3xl bg-gradient-to-br from-pay-navy via-[#0057A8] to-pay-blue p-6 md:p-10 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" aria-hidden="true" />
              <div className="relative">
                <SectionHeading light kicker="Achievements" title="Results on the mat" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { n: '12', l: 'Gold medals, state-level' },
                    { n: '3', l: 'National qualifiers' },
                    { n: '40+', l: 'Black belts awarded' },
                    { n: '9', l: 'Years of training' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-2xl bg-white/10 px-4 py-5">
                      <strong className="block text-3xl md:text-4xl font-bold text-white">{s.n}</strong>
                      <span className="text-sm text-white/80">{t(s.l)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {recentAchievements.length > 0 && (
              <div className="bg-surface rounded-2xl shadow-card mt-4 p-2 md:p-3">
                <h3 className="text-base font-bold px-3 pt-2 pb-3">{t('Recent results')}</h3>
                <ul className="divide-y divide-pay-line">
                  {recentAchievements.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-3 py-3">
                      <span
                        className="grid place-items-center w-10 h-10 rounded-full shrink-0 text-white"
                        style={{ background: a.medal ? MEDAL_COLOR[a.medal] : 'var(--status-info)' }}
                      >
                        <Medal size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-heading truncate">{a.title}</div>
                        <div className="text-xs text-muted capitalize">
                          {a.students?.full_name ? `${a.students.full_name} · ` : ''}{a.level || ''}
                        </div>
                      </div>
                      {a.medal && <span className="rounded-full bg-pay-bg px-2.5 py-0.5 text-xs font-semibold capitalize text-heading">{a.medal}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* WHY TRAIN WITH US */}
        <section id="why-us" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Why train with us" title="Serious training, backed by real recognition" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              {WHY_FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="bg-surface rounded-2xl shadow-card p-5 flex flex-col gap-3">
                    <span className={`grid place-items-center w-11 h-11 rounded-full ${f.national ? 'bg-[#FFF6E5] text-[#B45309]' : 'bg-pay-sky text-pay-action'}`}>
                      <Icon size={20} strokeWidth={1.9} />
                    </span>
                    <h3 className="font-bold text-[0.95rem] leading-snug">{t(f.title)}</h3>
                    <p className="text-[0.82rem] text-muted leading-relaxed">{t(f.desc)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* COACHES */}
        <section id="coaches" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Our instructors" title="Meet the coaches" />
            <div className="grid gap-4 sm:grid-cols-2 max-w-[720px]">
              {[1, 2].map((n) => (
                <div key={n} className="bg-surface rounded-3xl shadow-card p-3">
                  {content[`coach_${n}_photo`] ? (
                    <img src={content[`coach_${n}_photo`]} alt={c(`coach_${n}_name`)} className="aspect-[4/3] w-full object-cover rounded-2xl" />
                  ) : (
                    <PhotoPlaceholder label="Photo" className="aspect-[4/3]" />
                  )}
                  <div className="px-2 pt-4 pb-2">
                    <h3 className="text-lg font-bold">{c(`coach_${n}_name`)}</h3>
                    <span className="text-sm text-pay-action font-medium">{c(`coach_${n}_role`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Photo gallery" title="From the dojang and the podium" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ gridAutoRows: 140 }}>
              {galleryKeys.map((key, i) => {
                const span = `${i === 0 ? 'col-span-2 row-span-2' : ''} ${i === 5 ? 'col-span-2' : ''}`
                return content[key] ? (
                  <img key={key} src={content[key]} alt={`Academy gallery photo ${i + 1}`} className={`object-cover w-full h-full rounded-2xl ${span}`} />
                ) : !hasGalleryImages ? (
                  <div key={key} className={`rounded-2xl bg-gradient-to-br from-pay-sky to-pay-sky-2 ${span}`} />
                ) : null
              })}
            </div>
          </div>
        </section>

        {/* ENQUIRY */}
        <section id="enquiry" className={sectionCls}>
          <div className={`${container} grid lg:grid-cols-[1.4fr_1fr] gap-4 md:gap-6`}>
            <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
              <div className="bg-gradient-to-br from-pay-navy via-[#0057A8] to-pay-blue px-6 md:px-8 py-6">
                <h2 className="!text-white text-xl md:text-2xl font-bold">{t('Admission Enquiry')}</h2>
                <p className="text-white/85 text-sm mt-1">{t('Enroll your child, or yourself. Our team will call you back.')}</p>
              </div>
              <form className="grid sm:grid-cols-2 gap-4 p-6 md:p-8" onSubmit={handleEnquirySubmit}>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-heading">{t("Student's full name")} <span className="text-red-600">*</span></span>
                  <input type="text" required value={enquiryForm.child_name} onChange={setField('child_name')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-heading">{t('Age')} <span className="text-red-600">*</span></span>
                  <input type="number" min="3" max="99" required value={enquiryForm.age} onChange={setField('age')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-heading">{t('Parent / guardian phone')} <span className="text-red-600">*</span></span>
                  <input type="tel" required value={enquiryForm.guardian_phone} onChange={setField('guardian_phone')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-heading">{t('Program interested in')}</span>
                  <select value={enquiryForm.program_interested} onChange={setField('program_interested')} className={inputClass}>
                    {/* value stays English: it is what gets saved with the enquiry */}
                    {['Little Dragons (5–8)', 'Junior Program (9–14)', 'Senior Program (15+)', 'Self-Defense & Fitness (Adults)'].map((o) => (
                      <option key={o} value={o}>{t(o)}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-heading">{t('Message')}</span>
                  <textarea rows="3" value={enquiryForm.message} onChange={setField('message')} className={inputClass} />
                </label>
                <div className="sm:col-span-2 flex flex-col gap-3">
                  {enquiryStatus === 'success' && <Alert tone="success">{t("Thank you! Your enquiry has been received. We'll get back to you soon.")}</Alert>}
                  {enquiryStatus === 'error' && <Alert>{t('Something went wrong. Please try again or call the academy.')}</Alert>}
                  <button
                    type="submit"
                    className="w-full sm:w-auto sm:self-end rounded-full bg-pay-action px-10 py-3 text-sm font-semibold text-white hover:bg-pay-action-dark disabled:opacity-60"
                    disabled={enquirySubmitting}
                  >
                    {enquirySubmitting ? t('Submitting…') : t('Submit Enquiry')}
                  </button>
                </div>
              </form>
            </div>

            <aside className="bg-surface rounded-3xl shadow-card p-6 self-start">
              <h2 className="text-lg font-bold mb-4">{t('Contact the academy')}</h2>
              <ul className="flex flex-col gap-4 text-sm">
                {[
                  { icon: MapPin, body: c('contact_address') },
                  { icon: Phone, body: phoneHref ? <a href={phoneHref} className="hover:text-pay-action">{c('contact_phone')}</a> : c('contact_phone') },
                  { icon: Mail, body: <a href={`mailto:${c('contact_email')}`} className="hover:text-pay-action break-all">{c('contact_email')}</a> },
                  { icon: Clock, body: t('Morning & evening batches. Call us for timings.') },
                ].map(({ icon: Icon, body }, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-pay-sky text-pay-action shrink-0"><Icon size={18} /></span>
                    <span className="text-body">{body}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-6 flex items-center justify-between rounded-2xl bg-pay-bg px-4 py-3 text-sm font-semibold text-heading hover:bg-pay-sky">
                {t('Already enrolled? Open the student portal')}
                <LogIn size={16} className="text-pay-action" />
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter c={c} />
    </div>
  )
}
