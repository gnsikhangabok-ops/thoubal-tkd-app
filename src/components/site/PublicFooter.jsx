import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { REGISTRATION_NO, telHref } from '../../lib/siteContent'

export default function PublicFooter({ c }) {
  const phoneHref = telHref(c('contact_phone'))
  const linkCls = 'block text-sm mb-2 hover:text-gold'

  return (
    <footer className="bg-ink-deep text-[#C9D3E6]">
      <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
        <div>
          <h2 className="text-chalk text-base mb-4">Thoubal Taekwondo Academy</h2>
          <p className="text-sm max-w-[38ch]">
            Under Thoubal District Taekwondo Association. Regd. No. {REGISTRATION_NO}.
            Affiliated to AMTA, Taekwondo Federation of India &amp; Asian Taekwondo Union.
          </p>
        </div>
        <div>
          <h2 className="text-chalk text-base mb-4">Quick Links</h2>
          <a href="/#about" className={linkCls}>About the Academy</a>
          <a href="/#programs" className={linkCls}>Training Programs</a>
          <a href="/#achievements" className={linkCls}>Achievements</a>
          <a href="/#gallery" className={linkCls}>Gallery</a>
        </div>
        <div>
          <h2 className="text-chalk text-base mb-4">Services</h2>
          <a href="/#enquiry" className={linkCls}>Admission Enquiry</a>
          <Link to="/rules" className={linkCls}>Rules &amp; Regulations</Link>
          <Link to="/login" className={linkCls}>Student / Parent Login</Link>
          <Link to="/signup" className={linkCls}>New Account Registration</Link>
        </div>
        <div>
          <h2 className="text-chalk text-base mb-4">Academy Office</h2>
          <p className="flex gap-2 text-sm mb-2.5"><MapPin size={16} className="shrink-0 mt-0.5 text-gold" />{c('contact_address')}</p>
          <p className="flex gap-2 text-sm mb-2.5">
            <Phone size={16} className="shrink-0 mt-0.5 text-gold" />
            {phoneHref ? <a href={phoneHref} className="hover:text-gold">{c('contact_phone')}</a> : c('contact_phone')}
          </p>
          <p className="flex gap-2 text-sm">
            <Mail size={16} className="shrink-0 mt-0.5 text-gold" />
            <a href={`mailto:${c('contact_email')}`} className="hover:text-gold break-all">{c('contact_email')}</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-4 text-xs text-[#8E9BB3] flex justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Thoubal Taekwondo Academy. All rights reserved.</span>
          <span>Content managed by the Academy administration.</span>
        </div>
      </div>
      <div className="tricolor" />
    </footer>
  )
}
