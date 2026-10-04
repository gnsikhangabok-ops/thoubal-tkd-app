import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { REGISTRATION_NO, telHref } from '../../lib/siteContent'
import logo from '../../assets/logo.png'

export default function PublicFooter({ c }) {
  const phoneHref = telHref(c('contact_phone'))
  const linkCls = 'block text-sm mb-2.5 text-[#C7D6EA] hover:text-white'

  return (
    <footer className="bg-pay-navy text-[#C7D6EA] rounded-t-3xl mt-4">
      <div className="max-w-[1180px] mx-auto px-4 md:px-7 pt-12 pb-8 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-11 h-11 rounded-full bg-white shrink-0">
              <img src={logo} alt="" className="w-8 h-8 object-contain" />
            </span>
            <span className="font-bold text-white">Thoubal Taekwondo Academy</span>
          </div>
          <p className="text-sm max-w-[38ch]">
            Under Thoubal District Taekwondo Association. Regd. No. {REGISTRATION_NO}.
            Affiliated to AMTA, Taekwondo Federation of India &amp; Asian Taekwondo Union.
          </p>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">Explore</h2>
          <a href="/#about" className={linkCls}>About the Academy</a>
          <a href="/#programs" className={linkCls}>Training Programs</a>
          <a href="/#achievements" className={linkCls}>Achievements</a>
          <a href="/#gallery" className={linkCls}>Gallery</a>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">Services</h2>
          <a href="/#enquiry" className={linkCls}>Admission Enquiry</a>
          <Link to="/rules" className={linkCls}>Rules &amp; Regulations</Link>
          <Link to="/login" className={linkCls}>Student / Parent Login</Link>
          <Link to="/signup" className={linkCls}>Create an Account</Link>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">Contact Us</h2>
          <p className="flex gap-2.5 text-sm mb-3"><MapPin size={16} className="shrink-0 mt-0.5 text-pay-blue" />{c('contact_address')}</p>
          <p className="flex gap-2.5 text-sm mb-3">
            <Phone size={16} className="shrink-0 mt-0.5 text-pay-blue" />
            {phoneHref ? <a href={phoneHref} className="hover:text-white">{c('contact_phone')}</a> : c('contact_phone')}
          </p>
          <p className="flex gap-2.5 text-sm">
            <Mail size={16} className="shrink-0 mt-0.5 text-pay-blue" />
            <a href={`mailto:${c('contact_email')}`} className="hover:text-white break-all">{c('contact_email')}</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-4 text-xs text-[#8FA6C6] flex justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Thoubal Taekwondo Academy. All rights reserved.</span>
          <span>Made for our students, parents &amp; coaches.</span>
        </div>
      </div>
    </footer>
  )
}
