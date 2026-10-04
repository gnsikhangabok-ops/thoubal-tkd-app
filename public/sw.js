/* Thoubal TKD service worker: makes the app installable and keeps it usable on a poor connection.
   - Page loads: network first, falling back to the cached app, then the offline page.
   - Built JS/CSS/fonts (content-hashed under /assets/): cache first.
   - Supabase / other sites: never cached (always live data). */
const VERSION = 'tkd-v2'
// Cached copies were fetched without an Origin header; module scripts send one, so ignore Vary
const MATCH = { ignoreVary: true }
const SHELL = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

// Cache the app shell plus every built file listed by the build (asset-manifest.json),
// so sections open even when the connection drops later.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION)
    await cache.addAll(SHELL)
    try {
      const { files } = await (await fetch('/asset-manifest.json', { cache: 'no-store' })).json()
      await cache.addAll(['/index.html', ...files])
    } catch {
      // dev server or missing manifest: assets are cached as they are used instead
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // Supabase and other APIs: always network

  // Pages: network first; offline, open the cached app (it shows an offline banner), else the offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('/index.html', MATCH)) || caches.match('/offline.html', MATCH)),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request, MATCH).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
        }
        return res
      })),
    )
  }
})
