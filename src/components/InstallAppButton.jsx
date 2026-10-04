import { Download } from 'lucide-react'
import { useInstallPrompt } from '../lib/pwa'
import { useT } from '../lib/i18n'

// Shows only when the browser says the app can be installed
export default function InstallAppButton({ className = '' }) {
  const { canInstall, install } = useInstallPrompt()
  const { t } = useT()
  if (!canInstall) return null
  return (
    <button
      type="button"
      onClick={install}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${className}`}
    >
      <Download size={16} /> {t('Install app')}
    </button>
  )
}
