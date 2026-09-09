import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/site.css'
import logo from '../../assets/logo.png'

export default function Home() {
  const [recentAchievements, setRecentAchievements] = useState([])
  const [enquiryForm, setEnquiryForm] = useState({
    child_name: '', age: '', guardian_phone: '', program_interested: 'Little Dragons (5–8)', message: '',
  })
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquiryStatus, setEnquiryStatus] = useState('') // '', 'success', 'error'

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

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logo} alt="Thoubal Taekwondo Academy" className="brand-logo" />
            <div className="brand-text">
              <div className="logo">THOUBAL <span>TKD</span></div>
              <div className="brand-sub">Thoubal District Taekwondo Association</div>
            </div>
          </div>
          <nav className="links">
            <a href="#about">About</a>
            <a href="#programs">Programs</a>
            <a href="#achievements">Achievements</a>
            <a href="#coaches">Coaches</a>
            <a href="#gallery">Gallery</a>
            <a href="#enquiry">Contact</a>
          </nav>
          <Link to="/login" className="btn btn-primary">Enquire</Link>
        </div>
      </header>

      <div className="belt-strip">
        <span className="b-white"></span><span className="b-yellow"></span><span className="b-green"></span>
        <span className="b-blue"></span><span className="b-red"></span><span className="b-black"></span>
      </div>

      <section className="hero">
        <div className="hero-stripes">
          <div className="st" style={{ background: '#EDEBE4' }}></div>
          <div className="st" style={{ background: '#D4A537' }}></div>
          <div className="st" style={{ background: '#4C6B4F' }}></div>
          <div className="st" style={{ background: '#2F5A78' }}></div>
          <div className="st" style={{ background: '#B3282D' }}></div>
        </div>
        <div className="wrap">
          <div className="kicker">Khangabok, Thoubal · Manipur</div>
          <h1>Discipline earns the black belt.</h1>
          <p className="lede">Thoubal Taekwondo Academy trains students of all ages in technique, sparring, and self-discipline — from white belt to black belt, from the dojang to the national stage.</p>
          <div className="hero-ctas">
            <a href="#enquiry" className="btn btn-primary">Enroll Now</a>
            <a href="#programs" className="btn btn-outline">View Programs</a>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="wrap about-grid">
          <div className="ph">Academy photo</div>
          <div>
            <div className="section-head" style={{ marginBottom: 24 }}>
              <div className="kicker-line">About the academy</div>
              <h2>Built on respect, discipline, and hard work</h2>
            </div>
            <p>Founded to bring quality Taekwondo training to Khangabok and the wider Thoubal district, the academy trains students in Poomsae, Kyorugi (sparring), and self-defense under certified instruction.</p>
            <p>Every student progresses through a structured belt-grading system, with regular gradings, competitive exposure, and a focus on discipline both on and off the mat.</p>
            <div className="about-stats">
              <div><strong>200+</strong><span>Students trained</span></div>
              <div><strong>15+</strong><span>State &amp; national medals</span></div>
              <div><strong>8</strong><span>Belt ranks taught</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="programs-band" id="programs">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker-line">Training programs</div>
            <h2>A path for every age and level</h2>
          </div>
          <div className="prog-scroll">
            <div className="prog-card">
              <div className="age">Ages 5–8</div>
              <h3>Little Dragons</h3>
              <p>Coordination, discipline basics, and fun introduction to stances and kicks.</p>
            </div>
            <div className="prog-card">
              <div className="age">Ages 9–14</div>
              <h3>Junior Program</h3>
              <p>Poomsae fundamentals, controlled sparring, and belt-grading preparation.</p>
            </div>
            <div className="prog-card">
              <div className="age">Ages 15+</div>
              <h3>Senior Program</h3>
              <p>Advanced Kyorugi, competition training, and black belt curriculum.</p>
            </div>
            <div className="prog-card">
              <div className="age">All levels</div>
              <h3>Competition Squad</h3>
              <p>Selective training for state and national tournament representation.</p>
            </div>
            <div className="prog-card">
              <div className="age">Adults</div>
              <h3>Self-Defense &amp; Fitness</h3>
              <p>Practical self-defense and conditioning for adult beginners.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="achievements">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker-line">Achievements</div>
            <h2>Results on the mat</h2>
          </div>
          <div className="achieve-grid">
            <div className="achieve-cell"><strong>12</strong><span>Gold medals, state-level</span></div>
            <div className="achieve-cell"><strong>3</strong><span>National qualifiers</span></div>
            <div className="achieve-cell"><strong>40+</strong><span>Black belts awarded</span></div>
            <div className="achieve-cell"><strong>9</strong><span>Years of training</span></div>
          </div>

          {recentAchievements.length > 0 && (
            <div className="module-grid" style={{ marginTop: 32 }}>
              {recentAchievements.map((a) => (
                <div className="module-card" key={a.id} style={{ borderTopColor: a.medal === 'gold' ? '#D4A537' : a.medal === 'silver' ? '#A8A8A8' : a.medal === 'bronze' ? '#B08D57' : 'var(--red)' }}>
                  <h3 style={{ textTransform: 'none', fontFamily: 'Inter', fontWeight: 600, fontSize: '1rem' }}>{a.title}</h3>
                  <p style={{ textTransform: 'capitalize', fontSize: '0.85rem', marginTop: 4 }}>{a.level}{a.medal ? ` · ${a.medal} medal` : ''}</p>
                  {a.students?.full_name && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{a.students.full_name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="coaches">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker-line">Our instructors</div>
            <h2>Coaches</h2>
          </div>
          <div className="coach-row">
            <div className="coach-card">
              <div className="ph">Photo</div>
              <h3>Ranbir Moirangthem</h3>
              <span className="role">Head Coach · NIS Certified (SAI Bangalore)</span>
            </div>
            <div className="coach-card">
              <div className="ph">Photo</div>
              <h3>Jemsh Saikhom</h3>
              <span className="role">Assistant Coach · State Taekwondo Referee</span>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker-line">Gallery</div>
            <h2>From the dojang and the podium</h2>
          </div>
          <div className="gallery-grid">
            <div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div>
          </div>
        </div>
      </section>

      <section className="enquiry" id="enquiry">
        <div className="wrap enquiry-grid">
          <div>
            <div className="section-head" style={{ marginBottom: 24 }}>
              <div className="kicker-line">Join the academy</div>
              <h2>Enroll your child, or yourself</h2>
            </div>
            <form className="enq" onSubmit={handleEnquirySubmit}>
              <label>Full name</label>
              <input
                type="text" placeholder="Student's full name" required
                value={enquiryForm.child_name}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, child_name: e.target.value })}
              />
              <label>Age</label>
              <input
                type="number" placeholder="Age" required
                value={enquiryForm.age}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
              />
              <label>Parent/Guardian contact</label>
              <input
                type="tel" placeholder="Phone number" required
                value={enquiryForm.guardian_phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, guardian_phone: e.target.value })}
              />
              <label>Program interested in</label>
              <select
                value={enquiryForm.program_interested}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, program_interested: e.target.value })}
              >
                <option>Little Dragons (5–8)</option>
                <option>Junior Program (9–14)</option>
                <option>Senior Program (15+)</option>
                <option>Self-Defense &amp; Fitness (Adults)</option>
              </select>
              <label>Message</label>
              <textarea
                rows="3" placeholder="Any questions?"
                value={enquiryForm.message}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
              ></textarea>
              {enquiryStatus === 'success' && (
                <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>Thank you! We'll get back to you soon.</p>
              )}
              {enquiryStatus === 'error' && (
                <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>Something went wrong. Please try again or call us directly.</p>
              )}
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={enquirySubmitting}>
                {enquirySubmitting ? 'Sending…' : 'Send Enquiry'}
              </button>
            </form>
          </div>
          <div className="map-box">Map — Khangabok, Thoubal</div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <h4>Thoubal Taekwondo Academy</h4>
              <p style={{ fontSize: '0.9rem', maxWidth: '36ch', color: '#B8B6B0' }}>Under Thoubal District Taekwondo Association. Regd. No. 255/SR/Th/2025. Affiliated to AMTA, TFI &amp; Asian Taekwondo Union.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <a href="#about">About</a>
              <a href="#programs">Programs</a>
              <a href="#achievements">Achievements</a>
              <a href="#gallery">Gallery</a>
              <Link to="/rules">Rules &amp; Regulations</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <a href="#">Khangabok, Thoubal, Manipur</a>
              <a href="#">+91 XXXXX XXXXX</a>
              <a href="#">info@thoubaltkd.in</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Thoubal Taekwondo Academy. All rights reserved.</span>
            <Link to="/login">Student &amp; Parent Login →</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
