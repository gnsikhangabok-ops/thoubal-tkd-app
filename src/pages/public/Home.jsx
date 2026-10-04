import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useSiteContent, telHref } from '../../lib/siteContent'
import { inputClass } from '../../lib/ui'
import PublicHeader from '../../components/site/PublicHeader'
import PublicFooter from '../../components/site/PublicFooter'
import { Alert } from '../../components/site/FormField'
import {
  ShieldCheck, Users2, Medal, Sparkles, Target, HeartPulse,
  GraduationCap, Globe2, Trophy, Flag, ChevronRight, FileText,
  ClipboardList, LogIn, Award, Megaphone, MapPin, Phone, Mail, Clock,
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
  return (
    <div className="mb-10">
      <div className={`font-display font-semibold text-sm uppercase tracking-wide mb-1.5 ${light ? 'text-gold' : 'text-brand-red'}`}>{kicker}</div>
      <h2 className={`text-2xl md:text-3xl ${light ? 'text-chalk' : 'text-ink'}`}>{title}</h2>
      <div className="flex h-1 w-24 mt-3">
        <span className="flex-1 bg-saffron" />
        <span className={`flex-1 ${light ? 'bg-white' : 'bg-[#D9DEE7]'}`} />
        <span className="flex-1 bg-india-green" />
      </div>
    </div>
  )
}

function PhotoPlaceholder({ label, className = '' }) {
  return (
    <div className={`bg-[#E3E8F0] border border-line flex items-center justify-center text-[#7C879A] font-display text-sm uppercase ${className}`}>
      {label}
    </div>
  )
}

export default function Home() {
  const { content, c } = useSiteContent()
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
  const sectionCls = 'py-16 md:py-20 scroll-mt-14'
  const container = 'max-w-[1180px] mx-auto px-4 md:px-7'

  return (
    <div id="top" className="font-body text-charcoal bg-chalk">
      <PublicHeader />

      {/* LATEST UPDATES */}
      <div className="bg-white border-b border-line">
        <div className={`${container} flex items-stretch`}>
          <span className="shrink-0 flex items-center gap-1.5 bg-brand-red text-chalk font-display font-semibold text-xs uppercase tracking-wide px-3 py-2">
            <Megaphone size={14} /> Latest Updates
          </span>
          <div className="flex-1 overflow-hidden flex items-center px-3 py-2 text-sm text-ink">
            <p className="ticker whitespace-nowrap">{c('announcement')}</p>
          </div>
        </div>
      </div>

      <main id="main">
        {/* HERO */}
        <section className="bg-ink relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)' }}
            aria-hidden="true"
          />
          <div className={`${container} relative grid lg:grid-cols-[1.5fr_1fr] gap-10 py-14 md:py-20`}>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 mb-5">
                <span className="flex flex-col w-4 h-3 overflow-hidden" aria-hidden="true">
                  <span className="flex-1 bg-saffron" />
                  <span className="flex-1 bg-white" />
                  <span className="flex-1 bg-india-green" />
                </span>
                <span className="text-[0.7rem] font-display uppercase tracking-wide text-[#D5DEEE]">Recognized National Sport · Olympic Discipline</span>
              </div>
              <div className="text-gold font-display font-medium text-sm uppercase tracking-wide mb-3">{c('hero_kicker')}</div>
              <h1 className="font-display font-bold text-chalk uppercase tracking-wide leading-[1.05] max-w-[16ch] text-4xl md:text-6xl">
                {c('hero_headline')}
              </h1>
              <p className="text-[#D5DEEE] text-base md:text-lg max-w-[52ch] my-6">{c('hero_body')}</p>
              <div className="flex gap-3 flex-wrap">
                <a href="#enquiry" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark">Apply for Admission</a>
                <a href="#programs" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-chalk text-chalk hover:bg-chalk hover:text-ink">View Programs</a>
              </div>
            </div>

            {/* Quick links panel */}
            <aside aria-label="Quick links" className="bg-white self-start border-t-4 border-t-gold">
              <h2 className="bg-[#EAF0F8] text-ink text-base px-5 py-3 border-b border-line">Quick Links</h2>
              <ul>
                {QUICK_LINKS.map(({ icon: Icon, label, href, to }) => {
                  const cls = 'flex items-center gap-3 px-5 py-3.5 border-b border-line text-sm font-medium text-ink hover:bg-[#F3F6FB] hover:text-brand-red'
                  const inner = (
                    <>
                      <Icon size={18} className="text-brand-red shrink-0" strokeWidth={1.75} />
                      <span className="flex-1">{label}</span>
                      <ChevronRight size={16} className="text-[#9AA5B8]" />
                    </>
                  )
                  return (
                    <li key={label}>
                      {to ? <Link to={to} className={cls}>{inner}</Link> : <a href={href} className={cls}>{inner}</a>}
                    </li>
                  )
                })}
              </ul>
            </aside>
          </div>
        </section>

        {/* KEY FIGURES */}
        <section aria-label="Key figures" className="bg-white border-b border-line">
          <div className={container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border-x border-line">
              {[
                { n: c('stat_students'), l: 'Students trained' },
                { n: c('stat_medals'), l: 'State & national medals' },
                { n: c('stat_belts'), l: 'Belt ranks taught' },
                { n: PROGRAMS.length, l: 'Training programs' },
              ].map((s) => (
                <div key={s.l} className="bg-white px-4 md:px-6 py-7">
                  <strong className="block font-display text-3xl md:text-4xl text-ink">{s.n}</strong>
                  <span className="text-sm">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className={sectionCls}>
          <div className={`${container} grid md:grid-cols-[1fr_1.2fr] gap-10 md:gap-14 items-start`}>
            {content.about_image ? (
              <img src={content.about_image} alt="Training at Thoubal Taekwondo Academy" className="aspect-[4/3] md:aspect-[4/5] w-full object-cover border border-line" />
            ) : (
              <PhotoPlaceholder label="Academy photo" className="aspect-[4/3] md:aspect-[4/5]" />
            )}
            <div>
              <SectionHeading kicker="About the academy" title={c('about_heading')} />
              <p className="mb-4 text-[1.02rem]">{c('about_paragraph_1')}</p>
              <p className="mb-6 text-[1.02rem]">{c('about_paragraph_2')}</p>
              <dl className="grid sm:grid-cols-2 gap-px bg-line border border-line text-sm">
                {[
                  ['Governing body', 'Thoubal District Taekwondo Association'],
                  ['Affiliations', 'AMTA · TFI · Asian Taekwondo Union'],
                  ['Disciplines', 'Poomsae, Kyorugi, Self-defense'],
                  ['Location', c('contact_address')],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-[#6B778C]">{k}</dt>
                    <dd className="font-medium text-ink mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className={`${sectionCls} bg-[#EAF0F8]`}>
          <div className={container}>
            <SectionHeading kicker="Training programs" title="A path for every age and level" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {PROGRAMS.map((p) => (
                <div key={p.title} className="bg-white border border-line flex flex-col">
                  <div className="bg-ink text-gold font-display text-xs uppercase tracking-wide px-5 py-2">{p.age}</div>
                  <div className="p-5">
                    <h3 className="text-ink text-lg mb-2">{p.title}</h3>
                    <p className="text-sm">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section id="achievements" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Achievements" title="Results on the mat" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: '12', l: 'Gold medals, state-level' },
                { n: '3', l: 'National qualifiers' },
                { n: '40+', l: 'Black belts awarded' },
                { n: '9', l: 'Years of training' },
              ].map((s) => (
                <div key={s.l} className="bg-white border border-line border-l-4 border-l-ink p-5 md:p-7">
                  <strong className="block font-display text-3xl md:text-4xl text-ink">{s.n}</strong>
                  <span className="text-sm">{s.l}</span>
                </div>
              ))}
            </div>

            {recentAchievements.length > 0 && (
              <>
                <h3 className="text-ink text-lg mt-12 mb-4">Recent results</h3>
                <div className="bg-white border border-line overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-ink text-chalk font-display uppercase tracking-wide text-xs">
                      <tr>
                        <th className="text-left px-4 py-3">Event / Title</th>
                        <th className="text-left px-4 py-3">Athlete</th>
                        <th className="text-left px-4 py-3">Level</th>
                        <th className="text-left px-4 py-3">Medal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAchievements.map((a, i) => (
                        <tr key={a.id} className={i % 2 ? 'bg-[#F5F7FA]' : ''}>
                          <td className="px-4 py-3 font-medium text-ink">{a.title}</td>
                          <td className="px-4 py-3">{a.students?.full_name || '—'}</td>
                          <td className="px-4 py-3 capitalize">{a.level || '—'}</td>
                          <td className="px-4 py-3 capitalize">
                            {a.medal ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: MEDAL_COLOR[a.medal] }} />
                                {a.medal}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* WHY TRAIN WITH US */}
        <section id="why-us" className={`${sectionCls} bg-ink`}>
          <div className={container}>
            <SectionHeading light kicker="Why train with us" title="Serious training, backed by official recognition" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/15 border border-white/15">
              {WHY_FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="relative bg-ink p-6 pt-7 flex flex-col gap-3">
                    {f.national && <span className="tricolor absolute top-0 left-0" aria-hidden="true" />}
                    <Icon size={22} className="text-gold" strokeWidth={1.75} />
                    <h3 className="font-semibold text-[0.95rem] text-chalk leading-snug normal-case font-body tracking-normal">{f.title}</h3>
                    <p className="text-[0.82rem] text-[#C9D3E6] leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* COACHES */}
        <section id="coaches" className={sectionCls}>
          <div className={container}>
            <SectionHeading kicker="Our instructors" title="Coaching staff" />
            <div className="grid gap-6 sm:grid-cols-2 max-w-[720px]">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-line">
                  {content[`coach_${n}_photo`] ? (
                    <img src={content[`coach_${n}_photo`]} alt={c(`coach_${n}_name`)} className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <PhotoPlaceholder label="Photo" className="aspect-[4/3] border-0 border-b" />
                  )}
                  <div className="p-5 border-t-4 border-t-ink">
                    <h3 className="text-lg text-ink mb-1">{c(`coach_${n}_name`)}</h3>
                    <span className="text-brand-red text-sm font-medium">{c(`coach_${n}_role`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className={`${sectionCls} bg-[#EAF0F8]`}>
          <div className={container}>
            <SectionHeading kicker="Photo gallery" title="From the dojang and the podium" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" style={{ gridAutoRows: 140 }}>
              {galleryKeys.map((key, i) => {
                const span = `${i === 0 ? 'col-span-2 row-span-2' : ''} ${i === 5 ? 'col-span-2' : ''}`
                return content[key] ? (
                  <img key={key} src={content[key]} alt={`Academy gallery photo ${i + 1}`} className={`object-cover w-full h-full border border-line ${span}`} />
                ) : !hasGalleryImages ? (
                  <div key={key} className={`bg-[#D3DBE7] border border-line ${span}`} />
                ) : null
              })}
            </div>
          </div>
        </section>

        {/* ENQUIRY */}
        <section id="enquiry" className={sectionCls}>
          <div className={`${container} grid lg:grid-cols-[1.4fr_1fr] gap-8`}>
            <div className="bg-white border border-line">
              <div className="bg-ink px-5 md:px-7 py-4 border-b-4 border-b-gold">
                <h2 className="text-chalk text-xl">Admission Enquiry Form</h2>
                <p className="text-[#C9D3E6] text-sm mt-1">Enroll your child, or yourself. The academy office will contact you.</p>
              </div>
              <form className="grid sm:grid-cols-2 gap-4 p-5 md:p-7" onSubmit={handleEnquirySubmit}>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-ink">Student's full name <span className="text-brand-red">*</span></span>
                  <input type="text" required value={enquiryForm.child_name} onChange={setField('child_name')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">Age <span className="text-brand-red">*</span></span>
                  <input type="number" min="3" max="99" required value={enquiryForm.age} onChange={setField('age')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">Parent / guardian phone <span className="text-brand-red">*</span></span>
                  <input type="tel" required value={enquiryForm.guardian_phone} onChange={setField('guardian_phone')} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-ink">Program interested in</span>
                  <select value={enquiryForm.program_interested} onChange={setField('program_interested')} className={inputClass}>
                    <option>Little Dragons (5–8)</option>
                    <option>Junior Program (9–14)</option>
                    <option>Senior Program (15+)</option>
                    <option>Self-Defense &amp; Fitness (Adults)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-ink">Message</span>
                  <textarea rows="3" value={enquiryForm.message} onChange={setField('message')} className={inputClass} />
                </label>
                <div className="sm:col-span-2 flex flex-col gap-3">
                  {enquiryStatus === 'success' && <Alert tone="success">Thank you! Your enquiry has been received. We'll get back to you soon.</Alert>}
                  {enquiryStatus === 'error' && <Alert>Something went wrong. Please try again or call the academy office.</Alert>}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-charcoal">Fields marked <span className="text-brand-red">*</span> are mandatory.</span>
                    <button
                      type="submit"
                      className="px-8 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
                      disabled={enquirySubmitting}
                    >
                      {enquirySubmitting ? 'Submitting…' : 'Submit Enquiry'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <aside className="bg-white border border-line self-start">
              <h2 className="bg-[#EAF0F8] text-ink text-base px-5 py-3 border-b border-line border-l-4 border-l-brand-red">Academy Office</h2>
              <ul className="p-5 flex flex-col gap-4 text-sm">
                <li className="flex gap-3"><MapPin size={18} className="shrink-0 text-brand-red" /><span>{c('contact_address')}</span></li>
                <li className="flex gap-3">
                  <Phone size={18} className="shrink-0 text-brand-red" />
                  {phoneHref ? <a href={phoneHref} className="hover:text-brand-red">{c('contact_phone')}</a> : <span>{c('contact_phone')}</span>}
                </li>
                <li className="flex gap-3">
                  <Mail size={18} className="shrink-0 text-brand-red" />
                  <a href={`mailto:${c('contact_email')}`} className="hover:text-brand-red break-all">{c('contact_email')}</a>
                </li>
                <li className="flex gap-3"><Clock size={18} className="shrink-0 text-brand-red" /><span>Training sessions: morning &amp; evening batches. Contact the office for timings.</span></li>
              </ul>
              <div className="border-t border-line p-5 bg-chalk text-sm">
                Already enrolled?{' '}
                <Link to="/login" className="font-semibold text-ink underline hover:text-brand-red">Sign in to the student portal</Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter c={c} />
    </div>
  )
}
