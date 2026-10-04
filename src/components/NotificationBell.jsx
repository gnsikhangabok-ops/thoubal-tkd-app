import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'

/**
 * Bell with an unread badge and a dropdown list.
 * items: [{ id, icon, title, body, time, to }]   align: which edge the panel lines up with
 */
export default function NotificationBell({ items, unread = 0, onOpen, viewAll, emptyText = 'You’re all caught up', align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  function toggle() {
    if (!open) onOpen?.()
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        className="relative grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-[var(--status-bad)] text-white text-[0.6rem] font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 top-full mt-2 ${align === 'left' ? 'left-0' : 'right-0'} w-[min(21rem,calc(100vw-2rem))] max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto bg-surface rounded-2xl shadow-card border border-pay-line overflow-hidden`}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="px-4 py-3 border-b border-pay-line font-bold text-heading text-sm">Notifications</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted text-center">{emptyText}</p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto divide-y divide-pay-line">
              {items.map((n) => {
                const Icon = n.icon
                const inner = (
                  <>
                    {Icon && (
                      <span className="grid place-items-center w-8 h-8 rounded-full bg-pay-sky text-pay-action shrink-0">
                        <Icon size={15} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {n.unread && <span className="w-2 h-2 rounded-full bg-pay-action shrink-0" aria-label="new" />}
                        <span className="block text-sm font-semibold text-heading truncate">{n.title}</span>
                      </span>
                      {n.body && <span className="block text-xs text-muted line-clamp-2">{n.body}</span>}
                      {n.time && <span className="block text-[0.7rem] text-subtle mt-0.5">{n.time}</span>}
                    </span>
                  </>
                )
                return (
                  <li key={n.id}>
                    {n.to ? (
                      <Link to={n.to} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-pay-bg">{inner}</Link>
                    ) : n.onClick ? (
                      <button type="button" onClick={() => { n.onClick(); setOpen(false) }} className="w-full text-left flex gap-3 px-4 py-3 hover:bg-pay-bg">{inner}</button>
                    ) : (
                      <div className="flex gap-3 px-4 py-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {viewAll && (
            viewAll.to ? (
              <Link to={viewAll.to} onClick={() => setOpen(false)} className="block text-center text-sm font-semibold text-pay-action py-2.5 border-t border-pay-line hover:bg-pay-bg">
                {viewAll.label}
              </Link>
            ) : (
              <button type="button" onClick={() => { viewAll.onClick(); setOpen(false) }} className="w-full text-center text-sm font-semibold text-pay-action py-2.5 border-t border-pay-line hover:bg-pay-bg">
                {viewAll.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
