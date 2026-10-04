import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (work offline). Each script's file is only downloaded when that script is shown.
import '@fontsource/noto-sans/400.css'
import '@fontsource/noto-sans/600.css'
import '@fontsource/noto-sans/700.css'
import '@fontsource/noto-sans-devanagari/400.css'
import '@fontsource/noto-sans-devanagari/600.css'
import '@fontsource/noto-sans-devanagari/700.css'
import '@fontsource/noto-sans-meetei-mayek/400.css'
import '@fontsource/noto-sans-meetei-mayek/600.css'
import '@fontsource/noto-sans-meetei-mayek/700.css'
import './styles/tailwind.css'
import App from './App.jsx'
import { registerServiceWorker } from './lib/pwa'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
