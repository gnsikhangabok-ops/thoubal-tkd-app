import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useT } from '../../lib/i18n'

// Logo + name lockup used in every public header.
export default function Brand({ subtitle, size = 'md' }) {
  const { t } = useT()
  const img = size === 'lg' ? 'w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12' : 'w-9 h-9'
  return (
    <Link to="/" className="flex items-center gap-2.5 min-w-0">
      <img src={logo} alt="" className={`${img} object-contain shrink-0`} />
      <span className="flex flex-col leading-tight min-w-0">
        <span className="font-bold text-heading text-[0.9rem] sm:text-[0.98rem] md:text-lg truncate">
          Thoubal{' '}
          <span className="text-pay-blue">
            {/* Short form on phones and wherever the full desktop menu is shown (the header is capped at 1180px) */}
            {size === 'lg' ? (
              <>
                <span className="hidden sm:inline xl:hidden">Taekwondo</span>
                <span className="sm:hidden xl:inline">TKD</span>
              </>
            ) : 'Taekwondo'}
          </span>
          {/* very narrow phones: "Thoubal TKD" (the line below still names the association) */}
          <span className={size === 'lg' ? 'max-[379px]:hidden' : ''}> Academy</span>
        </span>
        <span className="text-[0.65rem] md:text-xs text-subtle truncate">{subtitle ?? t('Thoubal District Taekwondo Association')}</span>
      </span>
    </Link>
  )
}
