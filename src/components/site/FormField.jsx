import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from '../../lib/ui'

export function TextField({ label, hint, required, ...props }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}{required && <span className="text-brand-red"> *</span>}
      </label>
      <input id={id} required={required} className={inputClass} {...props} />
      {hint && <span className="text-xs text-charcoal">{hint}</span>}
    </div>
  )
}

export function PasswordField({ label, required, visible, onToggle, showToggle = true, ...props }) {
  const id = useId()
  const [localVisible, setLocalVisible] = useState(false)
  const isVisible = visible ?? localVisible
  const toggle = onToggle ?? (() => setLocalVisible((v) => !v))

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}{required && <span className="text-brand-red"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          required={required}
          className={`${inputClass} ${showToggle ? 'pr-11' : ''}`}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={toggle}
            className="absolute inset-y-0 right-0 px-3 text-subtle hover:text-heading"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
          >
            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function Alert({ tone = 'error', children }) {
  const styles = {
    error: 'bg-red-50 text-red-700',
    success: 'bg-emerald-50 text-emerald-800',
    info: 'bg-pay-sky text-heading',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${styles[tone]}`}>
      {children}
    </div>
  )
}
