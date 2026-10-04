import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      className={`grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
