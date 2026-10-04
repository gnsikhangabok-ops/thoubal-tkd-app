import logo from '../../assets/logo.png'
import { useT } from '../../lib/i18n'

export default function PageLoader({ label = 'Loading…' }) {
  const { t } = useT()
  return (
    <div className="paytm min-h-screen flex flex-col items-center justify-center gap-4 font-body" role="status" aria-live="polite">
      <span className="grid place-items-center w-20 h-20 rounded-full bg-surface shadow-card">
        <img src={logo} alt="" className="w-12 h-12 object-contain animate-pulse" />
      </span>
      <span className="text-sm font-medium text-muted">{t(label)}</span>
    </div>
  )
}
