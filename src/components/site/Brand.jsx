import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useT } from '../../lib/i18n'

// Logo + name lockup used in every public header.
export default function Brand({ subtitle, size = 'md' }) {
  const { t } = useT()
  const img = size === 'lg' ? 'w-11 h-11 md:w-12 md:h-12' : 'w-9 h-9'
  return (
    <Link to="/" className="flex items-center gap-2.5 min-w-0">
      <img src={logo} alt="" className={`${img} object-contain shrink-0`} />
      <span className="flex flex-col leading-tight min-w-0">
        <span className="font-bold text-heading text-[0.98rem] md:text-lg truncate">
          Thoubal{' '}
          <span className="text-pay-blue">
            {/* Short form only where the header is tightest: full menu shown but screen < 1536px */}
            {size === 'lg' ? (
              <>
                <span className="xl:hidden 2xl:inline">Taekwondo</span>
                <span className="hidden xl:inline 2xl:hidden">TKD</span>
              </>
            ) : 'Taekwondo'}
          </span>{' '}
          Academy
        </span>
        <span className="text-[0.65rem] md:text-xs text-subtle truncate">{subtitle ?? t('Thoubal District Taekwondo Association')}</span>
      </span>
    </Link>
  )
}
