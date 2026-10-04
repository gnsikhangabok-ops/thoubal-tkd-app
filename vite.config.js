import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { defineConfig } from 'vite'

// Writes asset-manifest.json (every built JS/CSS/font file and icon) and sw.js, stamped with a
// build id, so the service worker caches the whole app on install and every deploy refreshes it.
function serviceWorker() {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        // photos (jpg/webp) are left out: they're cached when viewed, so a first visit on
        // mobile data doesn't download the whole gallery
        .filter((f) => /\.(js|css|woff2|png|svg)$/.test(f))
        // only the scripts the app actually uses; skip font files for scripts we never show (e.g. Cyrillic)
        .filter((f) => !f.endsWith('.woff2') || /(latin|devanagari|meetei)/.test(f))
        .map((f) => `/${f}`)
      this.emitFile({ type: 'asset', fileName: 'asset-manifest.json', source: JSON.stringify({ files }) })
      const buildId = createHash('sha256').update(files.join()).digest('hex').slice(0, 10)
      const sw = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8').replace('__BUILD_ID__', buildId)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
})
