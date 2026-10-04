import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export const REGISTRATION_NO = '255/SR/Th/2025'

// Fallbacks used until an admin sets real content via the Website Content module
export const SITE_DEFAULTS = {
  announcement: 'Admissions open for the new training session — all age groups welcome. Visit the academy office or submit the admission enquiry form below.',
  hero_kicker: 'Khangabok, Thoubal · Manipur',
  hero_headline: 'Discipline earns the black belt.',
  hero_body: 'Thoubal Taekwondo Academy trains students of all ages in technique, sparring, and self-discipline — from white belt to black belt, from the dojang to the national stage.',
  about_heading: 'Built on respect, discipline, and hard work',
  about_paragraph_1: 'Founded to bring quality Taekwondo training to Khangabok and the wider Thoubal district, the academy trains students in Poomsae, Kyorugi (sparring), and self-defense under certified instruction.',
  about_paragraph_2: 'Every student progresses through a structured belt-grading system, with regular gradings, competitive exposure, and a focus on discipline both on and off the mat.',
  stat_students: '200+',
  stat_medals: '15+',
  stat_belts: '8',
  coach_1_name: 'Ranbir Moirangthem',
  coach_1_role: 'Head Coach · NIS Certified (SAI Bangalore)',
  coach_2_name: 'Jemsh Saikhom',
  coach_2_role: 'Assistant Coach · State Taekwondo Referee',
  contact_address: 'Khangabok, Thoubal, Manipur',
  contact_phone: '+91 XXXXX XXXXX',
  contact_email: 'info@thoubaltkd.in',
}

// Loads the editable public-site content once and returns a lookup with defaults.
export function useSiteContent() {
  const [content, setContent] = useState({})

  useEffect(() => {
    let active = true
    supabase.from('site_content').select('*').then(({ data }) => {
      if (!active || !data) return
      const map = {}
      data.forEach((row) => { map[row.key] = row.value })
      setContent(map)
    })
    return () => { active = false }
  }, [])

  const c = (key) => content[key] || SITE_DEFAULTS[key] || ''
  return { content, c }
}

// Only real phone numbers get a tel: link (the default placeholder has X's in it).
export function telHref(phone) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.replace('+', '').length >= 7 ? `tel:${digits}` : undefined
}
