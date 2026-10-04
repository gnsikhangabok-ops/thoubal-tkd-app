import { useSyncExternalStore } from 'react'
import hi from '../i18n/hi'
import mni from '../i18n/mni'

// Interface text in English, Hindi and Manipuri (Meitei Mayek). Keys are the English
// strings themselves, so untranslated text simply falls back to English.
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'mni', label: 'ꯃꯩꯇꯩꯂꯣꯟ', short: 'ꯃꯩ' },
]
const DICTS = { hi, mni }
const listeners = new Set()

function read() {
  try {
    const saved = localStorage.getItem('tkd-lang')
    return LANGUAGES.some((l) => l.code === saved) ? saved : 'en'
  } catch {
    return 'en'
  }
}

let current = read()
document.documentElement.lang = current === 'mni' ? 'mni-Mtei' : current

export function setLanguage(code) {
  current = code
  document.documentElement.lang = code === 'mni' ? 'mni-Mtei' : code
  try { localStorage.setItem('tkd-lang', code) } catch { /* private mode: applies to this visit */ }
  listeners.forEach((cb) => cb())
}

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb) }

/** const { t, lang } = useT();  t('Enroll Now')  ·  t('Hello {name}', { name }) */
export function useT() {
  const lang = useSyncExternalStore(subscribe, () => current)
  const dict = DICTS[lang]
  const t = (text, vars) => {
    let out = (dict && dict[text]) || text
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v)
    return out
  }
  return { t, lang }
}
