import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/logo.png'

const MEDAL_COLOR = { gold: '#D4A537', silver: '#A8A8A8', bronze: '#B08D57' }

export default function Home() {
  const [recentAchievements, setRecentAchievements] = useState([])
  const [enquiryForm, setEnquiryForm] = useState({
    child_name: '', age: '', guardian_phone: '', program_interested: 'Little Dragons (5–8)', message: '',
  })
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquiryStatus, setEnquiryStatus] = useState('')

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
      setEnquiryForm({ child_name: '', age: '', guardian_phone: '', program_interested: 'Little Dragons (5–8)', message: '' })
    }
  }

  useEffect(() => {
    async function loadAchievements() {
      const { data } = await supabase
        .from('achievements')
        .select('*, students(full_name)')
        .order('achievement_date', { ascending: false })
        .limit(6)
      if (data) setRecentAchievements(data)
    }
    loadAchievements()
  }, [])

  const inputClass = "px-4 py-3 border border-black/10 bg-chalk font-body text-[0.95rem] text-ink focus:outline-2 focus:outline-brand-red focus:outline-offset-1"

  return (
    <div className="font-body text-charcoal bg-chalk">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-chalk border-b border-black/10">
        <div className="max-w-[1180px] mx-auto px-7 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="w-11 h-11 object-contain" />
            <div className="flex flex-col leading-tight">
              <div className="font-display font-bold text-lg text-ink">THOUBAL <span className="text-brand-red">TKD</span></div>
              <div className="text-[0.62rem] tracking-wide text-charcoal uppercase mt-0.5">Thoubal District Taekwondo Association</div>
            </div>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#about" className="text-sm font-medium hover:text-brand-red">About</a>
            <a href="#programs" className="text-sm font-medium hover:text-brand-red">Programs</a>
            <a href="#achievements" className="text-sm font-medium hover:text-brand-red">Achievements</a>
            <a href="#coaches" className="text-sm font-medium hover:text-brand-red">Coaches</a>
            <a href="#gallery" className="text-sm font-medium hover:text-brand-red">Gallery</a>
            <a href="#enquiry" className="text-sm font-medium hover:text-brand-red">Contact</a>
          </nav>
          <Link to="/login" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark">Enquire</Link>
        </div>
      </header>

      {/* BELT STRIP */}
      <div className="flex h-2 w-full">
        <span className="flex-1 bg-[#EDEBE4]"></span>
        <span className="flex-1 bg-gold"></span>
        <span className="flex-1 bg-[#4C6B4F]"></span>
        <span className="flex-1 bg-[#2F5A78]"></span>
        <span className="flex-1 bg-brand-red"></span>
        <span className="flex-1 bg-ink"></span>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-ink py-28 md:py-32">
        <div className="absolute top-0 right-[-10%] h-full w-3/5 flex gap-3.5 -skew-x-[14deg] opacity-90">
          <div className="w-14 h-full bg-[#EDEBE4]"></div>
          <div className="w-14 h-full bg-gold"></div>
          <div className="w-14 h-full bg-[#4C6B4F]"></div>
          <div className="w-14 h-full bg-[#2F5A78]"></div>
          <div className="w-14 h-full bg-brand-red"></div>
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-7">
          <div className="text-gold font-display font-medium text-sm tracking-wide mb-4">Khangabok, Thoubal · Manipur</div>
          <h1 className="font-display font-bold text-chalk uppercase tracking-wide leading-[1.02] max-w-[11ch] text-5xl md:text-7xl">
            Discipline earns the black belt.
          </h1>
          <p className="text-[#C9C7C0] text-lg max-w-[44ch] my-6">
            Thoubal Taekwondo Academy trains students of all ages in technique, sparring, and self-discipline — from white belt to black belt, from the dojang to the national stage.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a href="#enquiry" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark">Enroll Now</a>
            <a href="#programs" className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-chalk text-chalk hover:bg-chalk hover:text-ink">View Programs</a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20">
        <div className="max-w-[1180px] mx-auto px-7 grid md:grid-cols-2 gap-16 items-center">
          <div className="aspect-[4/5] bg-gradient-to-br from-[#1c1c1a] to-charcoal flex items-center justify-center text-[#8a8a86] font-display text-sm uppercase">
            Academy photo
          </div>
          <div>
            <div className="mb-6">
              <div className="text-brand-red font-display font-semibold text-sm mb-2">About the academy</div>
              <h2 className="font-display text-ink uppercase text-3xl md:text-4xl">Built on respect, discipline, and hard work</h2>
            </div>
            <p className="mb-4 text-[1.05rem]">Founded to bring quality Taekwondo training to Khangabok and the wider Thoubal district, the academy trains students in Poomsae, Kyorugi (sparring), and self-defense under certified instruction.</p>
            <p className="mb-4 text-[1.05rem]">Every student progresses through a structured belt-grading system, with regular gradings, competitive exposure, and a focus on discipline both on and off the mat.</p>
            <div className="flex gap-10 mt-8 flex-wrap">
              <div><strong className="block font-display text-3xl text-brand-red">200+</strong><span className="text-sm">Students trained</span></div>
              <div><strong className="block font-display text-3xl text-brand-red">15+</strong><span className="text-sm">State &amp; national medals</span></div>
              <div><strong className="block font-display text-3xl text-brand-red">8</strong><span className="text-sm">Belt ranks taught</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="bg-ink py-20">
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="mb-12">
            <div className="text-gold font-display font-semibold text-sm mb-2">Training programs</div>
            <h2 className="font-display text-chalk uppercase text-3xl md:text-4xl">A path for every age and level</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none]">
            {[
              { age: 'Ages 5–8', title: 'Little Dragons', desc: 'Coordination, discipline basics, and fun introduction to stances and kicks.' },
              { age: 'Ages 9–14', title: 'Junior Program', desc: 'Poomsae fundamentals, controlled sparring, and belt-grading preparation.' },
              { age: 'Ages 15+', title: 'Senior Program', desc: 'Advanced Kyorugi, competition training, and black belt curriculum.' },
              { age: 'All levels', title: 'Competition Squad', desc: 'Selective training for state and national tournament representation.' },
              { age: 'Adults', title: 'Self-Defense & Fitness', desc: 'Practical self-defense and conditioning for adult beginners.' },
            ].map((p) => (
              <div key={p.title} className="flex-none w-[260px] bg-[#1a1a18] p-7 border-t-[3px] border-t-gold">
                <div className="text-gold font-display text-sm mb-2.5">{p.age}</div>
                <h3 className="text-chalk text-xl font-display uppercase mb-2.5">{p.title}</h3>
                <p className="text-[#B8B6B0] text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section id="achievements" className="py-20">
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="mb-12">
            <div className="text-brand-red font-display font-semibold text-sm mb-2">Achievements</div>
            <h2 className="font-display text-ink uppercase text-3xl md:text-4xl">Results on the mat</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-black/10">
            {[
              { n: '12', l: 'Gold medals, state-level' },
              { n: '3', l: 'National qualifiers' },
              { n: '40+', l: 'Black belts awarded' },
              { n: '9', l: 'Years of training' },
            ].map((s, i) => (
              <div key={s.l} className={`p-9 ${i < 3 ? 'md:border-r border-black/10' : ''}`}>
                <strong className="block font-display text-4xl text-ink">{s.n}</strong>
                <span className="text-sm">{s.l}</span>
              </div>
            ))}
          </div>

          {recentAchievements.length > 0 && (
            <div className="grid gap-4 mt-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {recentAchievements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-black/10 p-6"
                  style={{ borderTopWidth: 3, borderTopColor: a.medal ? MEDAL_COLOR[a.medal] : '#B3282D' }}
                >
                  <h3 className="font-semibold text-base text-ink normal-case">{a.title}</h3>
                  <p className="capitalize text-sm mt-1">{a.level}{a.medal ? ` · ${a.medal} medal` : ''}</p>
                  {a.students?.full_name && <p className="text-sm mt-1">{a.students.full_name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COACHES */}
      <section id="coaches" className="py-20">
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="mb-12">
            <div className="text-brand-red font-display font-semibold text-sm mb-2">Our instructors</div>
            <h2 className="font-display text-ink uppercase text-3xl md:text-4xl">Coaches</h2>
          </div>
          <div className="grid gap-8 max-w-[640px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div>
              <div className="aspect-square bg-gradient-to-br from-[#e7e4db] to-[#cfccc2] mb-4 flex items-center justify-center text-[#8a8a86] font-display text-sm">Photo</div>
              <h3 className="text-lg font-semibold mb-1">Ranbir Moirangthem</h3>
              <span className="text-brand-red text-sm font-display">Head Coach · NIS Certified (SAI Bangalore)</span>
            </div>
            <div>
              <div className="aspect-square bg-gradient-to-br from-[#e7e4db] to-[#cfccc2] mb-4 flex items-center justify-center text-[#8a8a86] font-display text-sm">Photo</div>
              <h3 className="text-lg font-semibold mb-1">Jemsh Saikhom</h3>
              <span className="text-brand-red text-sm font-display">Assistant Coach · State Taekwondo Referee</span>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20">
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="mb-12">
            <div className="text-brand-red font-display font-semibold text-sm mb-2">Gallery</div>
            <h2 className="font-display text-ink uppercase text-3xl md:text-4xl">From the dojang and the podium</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" style={{ gridAutoRows: 140 }}>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46] col-span-2 row-span-2"></div>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46]"></div>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46]"></div>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46]"></div>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46]"></div>
            <div className="bg-gradient-to-br from-[#1c1c1a] to-[#4a4a46] col-span-2"></div>
          </div>
        </div>
      </section>

      {/* ENQUIRY */}
      <section id="enquiry" className="bg-[#EFEBE1] py-20">
        <div className="max-w-[1180px] mx-auto px-7 grid md:grid-cols-2 gap-16">
          <div>
            <div className="mb-6">
              <div className="text-brand-red font-display font-semibold text-sm mb-2">Join the academy</div>
              <h2 className="font-display text-ink uppercase text-3xl md:text-4xl">Enroll your child, or yourself</h2>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleEnquirySubmit}>
              <label className="text-sm font-semibold -mb-2">Full name</label>
              <input
                type="text" placeholder="Student's full name" required
                value={enquiryForm.child_name}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, child_name: e.target.value })}
                className={inputClass}
              />
              <label className="text-sm font-semibold -mb-2">Age</label>
              <input
                type="number" placeholder="Age" required
                value={enquiryForm.age}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
                className={inputClass}
              />
              <label className="text-sm font-semibold -mb-2">Parent/Guardian contact</label>
              <input
                type="tel" placeholder="Phone number" required
                value={enquiryForm.guardian_phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, guardian_phone: e.target.value })}
                className={inputClass}
              />
              <label className="text-sm font-semibold -mb-2">Program interested in</label>
              <select
                value={enquiryForm.program_interested}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, program_interested: e.target.value })}
                className={inputClass}
              >
                <option>Little Dragons (5–8)</option>
                <option>Junior Program (9–14)</option>
                <option>Senior Program (15+)</option>
                <option>Self-Defense &amp; Fitness (Adults)</option>
              </select>
              <label className="text-sm font-semibold -mb-2">Message</label>
              <textarea
                rows="3" placeholder="Any questions?"
                value={enquiryForm.message}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                className={inputClass}
              ></textarea>
              {enquiryStatus === 'success' && (
                <p className="text-brand-red text-sm">Thank you! We'll get back to you soon.</p>
              )}
              {enquiryStatus === 'error' && (
                <p className="text-brand-red text-sm">Something went wrong. Please try again or call us directly.</p>
              )}
              <button
                type="submit"
                className="inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark mt-2 disabled:opacity-60"
                disabled={enquirySubmitting}
              >
                {enquirySubmitting ? 'Sending…' : 'Send Enquiry'}
              </button>
            </form>
          </div>
          <div className="bg-[#d8d5cb] min-h-[280px] flex items-center justify-center text-[#7a776d] font-display">
            Map — Khangabok, Thoubal
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink text-[#C9C7C0] py-14">
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-10 mb-10">
            <div>
              <h4 className="text-chalk font-display text-base mb-4">Thoubal Taekwondo Academy</h4>
              <p className="text-sm max-w-[36ch] text-[#B8B6B0]">Under Thoubal District Taekwondo Association. Regd. No. 255/SR/Th/2025. Affiliated to AMTA, TFI &amp; Asian Taekwondo Union.</p>
            </div>
            <div>
              <h4 className="text-chalk font-display text-base mb-4">Explore</h4>
              <a href="#about" className="block text-sm mb-2 hover:text-gold">About</a>
              <a href="#programs" className="block text-sm mb-2 hover:text-gold">Programs</a>
              <a href="#achievements" className="block text-sm mb-2 hover:text-gold">Achievements</a>
              <a href="#gallery" className="block text-sm mb-2 hover:text-gold">Gallery</a>
              <Link to="/rules" className="block text-sm mb-2 hover:text-gold">Rules &amp; Regulations</Link>
            </div>
            <div>
              <h4 className="text-chalk font-display text-base mb-4">Contact</h4>
              <a href="#" className="block text-sm mb-2 hover:text-gold">Khangabok, Thoubal, Manipur</a>
              <a href="#" className="block text-sm mb-2 hover:text-gold">+91 XXXXX XXXXX</a>
              <a href="#" className="block text-sm mb-2 hover:text-gold">info@thoubaltkd.in</a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-sm text-[#8a8a86] flex justify-between flex-wrap gap-3">
            <span>© 2026 Thoubal Taekwondo Academy. All rights reserved.</span>
            <Link to="/login" className="hover:text-gold">Student &amp; Parent Login →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
