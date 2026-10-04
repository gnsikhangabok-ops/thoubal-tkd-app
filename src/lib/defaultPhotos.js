import teamBanner from '../assets/photos/team-banner.webp'
import gtcmAward from '../assets/photos/gtcm-2025-award.webp'
import coachRanbir from '../assets/photos/coach-ranbir-moirangthem.webp'
import coachJemsh from '../assets/photos/coach-jemsh-saikhom.webp'
import saiCourse from '../assets/photos/sai-bangalore-coaching-course.webp'
import gtcCoachAthlete from '../assets/photos/gtc-2025-coach-young-athlete.webp'
import gtcPodiumCadets from '../assets/photos/gtc-2025-podium-cadets.jpg'
import gtcPodiumJuniors from '../assets/photos/gtc-2025-podium-juniors.jpg'
import gtcYoungAthlete from '../assets/photos/gtc-2025-young-athlete.jpg'

// Academy photos bundled with the site. Shown until an admin uploads a replacement
// for the same slot in Website Content.
export const DEFAULT_PHOTOS = {
  hero_image: teamBanner,
  about_image: gtcmAward,
  coach_1_photo: coachRanbir, // Ranbir Moirangthem, head coach
  coach_2_photo: coachJemsh, // Jemsh Saikhom, assistant coach
}

// Used for the gallery when no gallery photos have been uploaded yet.
// wide = landscape photo (two columns); others are portrait (one column).
// The team photo is left out because it is already the homepage banner.
const GTC = "18th Governor's Taekwondo Cup, Manipur 2025"
export const DEFAULT_GALLERY = [
  { src: gtcmAward, wide: true, caption: '2nd Runner Up · 18th GTCM 2025', alt: 'Thoubal Taekwondo Academy team receiving the 2nd Runner Up prize at the 18th GTCM 2025' },
  { src: saiCourse, caption: 'SAI Bangalore coaching course', alt: 'Academy coach at the Sports Authority of India, Bangalore Diploma Course in Sports Coaching (Taekwondo) practical examination' },
  { src: gtcCoachAthlete, caption: GTC, alt: `A coach with a young athlete in sparring gear at the ${GTC}` },
  { src: gtcPodiumJuniors, wide: true, caption: `Medal ceremony · ${GTC}`, alt: `Young medallists on the podium at the ${GTC}` },
  { src: gtcPodiumCadets, caption: `Medal ceremony · ${GTC}`, alt: `Medal ceremony at the ${GTC}` },
  { src: gtcYoungAthlete, caption: 'Ready for the bout', alt: `A young athlete in sparring gear waiting to compete at the ${GTC}` },
]
