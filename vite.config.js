import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Writes asset-manifest.json (every built JS/CSS/font/image file) so the service worker can
// cache the whole app on install and open any section offline.
function assetManifest() {
  return {
    name: 'asset-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css|woff2|png|jpe?g|svg|webp)$/.test(f))
        // only the scripts the app actually uses; skip font files for scripts we never show (e.g. Cyrillic)
        .filter((f) => !f.endsWith('.woff2') || /(latin|devanagari|meetei)/.test(f))
        .map((f) => `/${f}`)
      this.emitFile({ type: 'asset', fileName: 'asset-manifest.json', source: JSON.stringify({ files }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), assetManifest()],
})
