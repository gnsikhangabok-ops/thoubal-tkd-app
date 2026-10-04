import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { REGISTRATION_NO, telHref } from '../../lib/siteContent'
import logo from '../../assets/logo.png'
import { useT } from '../../lib/i18n'
import InstallAppButton from '../InstallAppButton'

export default function PublicFooter({ c }) {
  const { t } = useT()
  const phoneHref = telHref(c('contact_phone'))
  const linkCls = 'block text-sm mb-2.5 text-[#C7D6EA] hover:text-white'

  return (
    <footer className="bg-pay-navy text-[#C7D6EA] rounded-t-3xl mt-4">
      <div className="max-w-[1180px] mx-auto px-4 md:px-7 pt-12 pb-8 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-11 h-11 rounded-full bg-[#fff] shrink-0">
              <img src={logo} alt="" className="w-8 h-8 object-contain" />
            </span>
            <span className="font-bold text-white">Thoubal Taekwondo Academy</span>
          </div>
          <InstallAppButton className="mb-4 bg-white text-[#002E6E] hover:bg-[#E6F7FD]" />
          <p className="text-sm max-w-[38ch]">
            {t('Under Thoubal District Taekwondo Association. Regd. No. {reg}. Affiliated to AMTA, Taekwondo Federation of India & Asian Taekwondo Union.', { reg: REGISTRATION_NO })}
          </p>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">{t('Explore')}</h2>
          <a href="/#about" className={linkCls}>{t('About the Academy')}</a>
          <a href="/#programs" className={linkCls}>{t('Training Programs')}</a>
          <a href="/#achievements" className={linkCls}>{t('Achievements')}</a>
          <a href="/#gallery" className={linkCls}>{t('Gallery')}</a>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">{t('Services')}</h2>
          <a href="/#enquiry" className={linkCls}>{t('Admission Enquiry')}</a>
          <Link to="/rules" className={linkCls}>{t('Rules & Regulations')}</Link>
          <Link to="/login" className={linkCls}>{t('Student / Parent Login')}</Link>
          <Link to="/signup" className={linkCls}>{t('Create an Account')}</Link>
        </div>
        <div>
          <h2 className="!text-white text-sm font-bold mb-4">{t('Contact Us')}</h2>
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
          <span>{t('© {year} Thoubal Taekwondo Academy. All rights reserved.', { year: new Date().getFullYear() })}</span>
          <span>{t('Made for our students, parents & coaches.')}</span>
        </div>
      </div>
    </footer>
  )
}
