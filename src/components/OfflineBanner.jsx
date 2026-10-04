import { WifiOff } from 'lucide-react'
import { useOnline } from '../lib/pwa'
import { useT } from '../lib/i18n'

export default function OfflineBanner() {
  const online = useOnline()
  const { t } = useT()
  if (online) return null
  return (
    <div role="status" className="no-print fixed bottom-4 inset-x-4 z-[80] mx-auto max-w-md flex items-center gap-3 rounded-2xl bg-[#1F2937] text-white px-4 py-3 shadow-card text-sm">
      <WifiOff size={18} className="shrink-0" />
      {t("You're offline. Changes can't be saved until the connection is back.")}
    </div>
  )
}
