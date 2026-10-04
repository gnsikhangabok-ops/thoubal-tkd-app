import logo from '../../assets/logo.png'

export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col bg-chalk font-body" role="status" aria-live="polite">
      <div className="tricolor" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <img src={logo} alt="" className="w-14 h-14 object-contain animate-pulse" />
        <span className="font-display uppercase tracking-wide text-sm text-charcoal">{label}</span>
      </div>
    </div>
  )
}
