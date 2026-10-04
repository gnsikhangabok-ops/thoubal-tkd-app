import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

// Logo + name lockup used in every public header.
export default function Brand({ subtitle = 'Thoubal District Taekwondo Association', size = 'md' }) {
  const img = size === 'lg' ? 'w-11 h-11 md:w-12 md:h-12' : 'w-9 h-9'
  return (
    <Link to="/" className={`flex items-center gap-2.5 min-w-0 ${size === 'lg' ? 'lg:shrink-0' : ''}`}>
      <img src={logo} alt="" className={`${img} object-contain shrink-0`} />
      <span className="flex flex-col leading-tight min-w-0">
        <span className="font-bold text-pay-navy text-[0.98rem] md:text-lg truncate">
          Thoubal <span className="text-pay-blue">Taekwondo</span> Academy
        </span>
        <span className="text-[0.65rem] md:text-xs text-[#7A889E] truncate">{subtitle}</span>
      </span>
    </Link>
  )
}
