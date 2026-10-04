import { initials } from '../lib/people'

// Avatar initials + name + a secondary line, used as the first column of record tables
export default function PersonCell({ name, sub }) {
  return (
    <span className="inline-flex items-center gap-3 min-w-0">
      <span className="grid place-items-center w-9 h-9 rounded-full bg-pay-sky text-pay-action text-xs font-bold shrink-0" aria-hidden="true">
        {initials(name)}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-heading truncate">{name}</span>
        {sub && <span className="block text-xs text-subtle font-normal truncate">{sub}</span>}
      </span>
    </span>
  )
}
