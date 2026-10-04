import { useSyncExternalStore } from 'react'

// Light/dark theme lives on <html data-theme>. The inline script in index.html sets it
// before first paint (saved choice, else the OS setting); this keeps toggles in sync.
const listeners = new Set()

function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B1220' : '#002E6E')
  try { localStorage.setItem('tkd-theme', theme) } catch { /* private mode: applies to this visit only */ }
  listeners.forEach((cb) => cb())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
