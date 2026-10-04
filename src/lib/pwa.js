import { useEffect, useState, useSyncExternalStore } from 'react'

// Register the service worker in production builds only (dev server has no sw.js caching).
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker not registered:', err))
  })
}

// Chrome/Edge/Android fire beforeinstallprompt when the app can be installed.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach((cb) => cb())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

/** { canInstall, install } — canInstall is false on iOS and once installed */
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => Boolean(deferredPrompt),
  )
  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
  }
  return { canInstall, install }
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
