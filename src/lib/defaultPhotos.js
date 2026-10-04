import placeholders from '../assets/photos/placeholders.json'
import teamBanner from '../assets/photos/team-banner.webp'
import teamBannerSm from '../assets/photos/team-banner-sm.webp'
import gtcmAward from '../assets/photos/gtcm-2025-award.webp'
import gtcmAwardSm from '../assets/photos/gtcm-2025-award-sm.webp'
import coachRanbir from '../assets/photos/coach-ranbir-moirangthem.webp'
import coachRanbirSm from '../assets/photos/coach-ranbir-moirangthem-sm.webp'
import coachJemsh from '../assets/photos/coach-jemsh-saikhom.webp'
import coachJemshSm from '../assets/photos/coach-jemsh-saikhom-sm.webp'
import saiRanbir from '../assets/photos/sai-bangalore-ranbir-moirangthem.webp'
import saiRanbirSm from '../assets/photos/sai-bangalore-ranbir-moirangthem-sm.webp'
import gtcCoachAthlete from '../assets/photos/gtc-2025-coach-young-athlete.webp'
import gtcCoachAthleteSm from '../assets/photos/gtc-2025-coach-young-athlete-sm.webp'
import gtcPodiumCadets from '../assets/photos/gtc-2025-podium-cadets.webp'
import gtcPodiumCadetsSm from '../assets/photos/gtc-2025-podium-cadets-sm.webp'
import gtcPodiumJuniors from '../assets/photos/gtc-2025-podium-juniors.webp'
import gtcPodiumJuniorsSm from '../assets/photos/gtc-2025-podium-juniors-sm.webp'
import gtcYoungAthlete from '../assets/photos/gtc-2025-young-athlete.webp'
import gtcYoungAthleteSm from '../assets/photos/gtc-2025-young-athlete-sm.webp'

// Academy photos bundled with the site, shown until an admin uploads a replacement for the
// same slot in Website Content. Each has a full and a small size (for phones) and a tiny
// blurred preview shown while it loads. They were sharpened, colour-corrected and had the
// phone-camera stamps cropped off (see README → Photos).
// w/h = full size in pixels, smW = width of the small file
const photo = (key, src, sm, w, h, smW, extra = {}) => ({ src, sm, w, h, smW, placeholder: placeholders[key], ...extra })

export const DEFAULT_PHOTOS = {
  hero_image: photo('team-banner', teamBanner, teamBannerSm, 1600, 720, 800, {
    alt: 'Thoubal Taekwondo Academy students lined up in the training hall',
  }),
  about_image: photo('gtcm-2025-award', gtcmAward, gtcmAwardSm, 1280, 960, 720, {
    alt: 'Thoubal Taekwondo Academy team receiving the 2nd Runner Up prize at the 18th GTCM 2025',
  }),
  // Head-and-shoulders crops of event portraits by Naoboy Photography
  coach_1_photo: photo('coach-ranbir-moirangthem', coachRanbir, coachRanbirSm, 880, 1100, 440, { credit: 'Naoboy Photography' }),
  coach_2_photo: photo('coach-jemsh-saikhom', coachJemsh, coachJemshSm, 880, 1100, 440, { credit: 'Naoboy Photography' }),
}

// Used for the gallery when no gallery photos have been uploaded yet.
// wide = landscape (two columns); others are portrait (one column). The team photo is
// left out because it is already the homepage banner.
const GTC = "18th Governor's Taekwondo Cup, Manipur 2025"
export const DEFAULT_GALLERY = [
  { ...DEFAULT_PHOTOS.about_image, wide: true, caption: '2nd Runner Up · 18th GTCM 2025' },
  photo('sai-bangalore-ranbir-moirangthem', saiRanbir, saiRanbirSm, 720, 1280, 480, {
    caption: 'Ranbir Moirangthem · SAI Bangalore coaching course',
    alt: 'Head coach Ranbir Moirangthem at the Sports Authority of India, Bangalore Diploma Course in Sports Coaching (Taekwondo) practical examination',
  }),
  photo('gtc-2025-coach-young-athlete', gtcCoachAthlete, gtcCoachAthleteSm, 720, 1195, 480, {
    caption: GTC, alt: `A coach with a young athlete in sparring gear at the ${GTC}`,
  }),
  photo('gtc-2025-podium-juniors', gtcPodiumJuniors, gtcPodiumJuniorsSm, 1280, 650, 720, {
    wide: true, caption: `Medal ceremony · ${GTC}`, alt: `Young medallists on the podium at the ${GTC}`,
  }),
  photo('gtc-2025-podium-cadets', gtcPodiumCadets, gtcPodiumCadetsSm, 720, 1193, 480, {
    caption: `Medal ceremony · ${GTC}`, alt: `Medal ceremony at the ${GTC}`,
  }),
  photo('gtc-2025-young-athlete', gtcYoungAthlete, gtcYoungAthleteSm, 720, 1195, 480, {
    caption: 'Ready for the bout', alt: `A young athlete in sparring gear waiting to compete at the ${GTC}`,
  }),
]
