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
import fdAddress from '../assets/photos/foundation-day-2024-address.webp'
import fdAddressSm from '../assets/photos/foundation-day-2024-address-sm.webp'
import fdHonour1 from '../assets/photos/foundation-day-2024-honour-1.webp'
import fdHonour1Sm from '../assets/photos/foundation-day-2024-honour-1-sm.webp'
import fdHonour2 from '../assets/photos/foundation-day-2024-honour-2.webp'
import fdHonour2Sm from '../assets/photos/foundation-day-2024-honour-2-sm.webp'
import fdGuests from '../assets/photos/foundation-day-2024-guests.webp'
import fdGuestsSm from '../assets/photos/foundation-day-2024-guests-sm.webp'
import fdJemsh from '../assets/photos/foundation-day-2024-jemsh-saikhom.webp'
import fdJemshSm from '../assets/photos/foundation-day-2024-jemsh-saikhom-sm.webp'

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
  // Ranbir at the SAI Bangalore coaching course; Jemsh addressing the 4th Foundation Day
  coach_1_photo: photo('coach-ranbir-moirangthem', coachRanbir, coachRanbirSm, 880, 1100, 440),
  coach_2_photo: photo('coach-jemsh-saikhom', coachJemsh, coachJemshSm, 880, 1100, 440),
}

// Used for the gallery when no gallery photos have been uploaded yet.
// wide = landscape (two columns); others are portrait (one column). Each row is one wide
// and two portrait photos so the grid has no gaps.
const GTC = "18th Governor's Taekwondo Cup, Manipur 2025"
const FD = '4th Foundation Day · 30 Dec 2024'
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
  photo('foundation-day-2024-address', fdAddress, fdAddressSm, 1280, 960, 720, {
    wide: true, caption: FD,
    alt: 'Address at the 4th Foundation Day of Thoubal Taekwondo Academy, Khangabok, 30 December 2024',
  }),
  photo('foundation-day-2024-honour-1', fdHonour1, fdHonour1Sm, 960, 1280, 480, {
    caption: 'Certificate of Honour · blood donation camp',
    alt: 'Certificate of Honour from the State Blood Cell, NHM Manipur, at the voluntary blood donation camp held for the 4th Foundation Day',
  }),
  photo('foundation-day-2024-honour-2', fdHonour2, fdHonour2Sm, 960, 1280, 480, {
    caption: 'Certificate of Honour · blood donation camp',
    alt: 'Certificate of Honour at the voluntary blood donation camp held for the 4th Foundation Day of Thoubal Taekwondo Academy',
  }),
  { ...DEFAULT_PHOTOS.hero_image, wide: true, caption: 'Our athletes · training hall, Khangabok' },
  photo('foundation-day-2024-guests', fdGuests, fdGuestsSm, 960, 1280, 480, {
    caption: `Guests · ${FD}`, alt: 'Guests honoured at the 4th Foundation Day of Thoubal Taekwondo Academy',
  }),
  photo('foundation-day-2024-jemsh-saikhom', fdJemsh, fdJemshSm, 1169, 1280, 480, {
    caption: `Jemsh Saikhom · ${FD}`, alt: 'Assistant coach Jemsh Saikhom speaking at the 4th Foundation Day, 30 December 2024',
  }),
]
