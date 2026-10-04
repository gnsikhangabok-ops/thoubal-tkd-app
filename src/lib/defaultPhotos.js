import teamBanner from '../assets/photos/team-banner.webp'
import gtcmAward from '../assets/photos/gtcm-2025-award.webp'
import coachRanbir from '../assets/photos/coach-ranbir-moirangthem.webp'
import coachJemsh from '../assets/photos/coach-jemsh-saikhom.webp'

// Academy photos bundled with the site. Shown until an admin uploads a replacement
// for the same slot in Website Content.
export const DEFAULT_PHOTOS = {
  hero_image: teamBanner,
  about_image: gtcmAward,
  coach_1_photo: coachRanbir, // Ranbir Moirangthem, head coach
  coach_2_photo: coachJemsh, // Jemsh Saikhom, assistant coach
}

// Used for the gallery when no gallery photos have been uploaded yet
export const DEFAULT_GALLERY = [
  { src: gtcmAward, alt: 'Thoubal Taekwondo Academy team receiving the 2nd Runner Up prize at the 18th GTCM 2025' },
  { src: teamBanner, alt: 'Thoubal Taekwondo Academy students lined up in the training hall' },
]
