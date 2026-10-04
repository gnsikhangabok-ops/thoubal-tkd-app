// Prepares the bundled website photos in src/assets/photos/ from the original files:
// crops off phone-camera stamps, applies a gentle colour/contrast/sharpness enhancement,
// writes a full and a small (-sm) WebP for responsive loading, and a tiny blurred preview
// for each photo (placeholders.json).
//
// Usage (sharp is not a project dependency, install it just for this):
//   npm i --no-save sharp
//   node scripts/process-photos.cjs <folder with the original photos>
//
// Originals are numbered as they were sent in chat; rename them or edit PHOTOS below.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IN = process.argv[2];
if (!IN) { console.error('Usage: node scripts/process-photos.cjs <originals folder>'); process.exit(1) }
const OUT = path.join(__dirname, '..', 'src', 'assets', 'photos');

const PHOTOS = [
  // name, source, crop (x, y, w, h) or null, full width, small width
  ['team-banner', '4.webp', null, 1600, 800],                                         // hero (upscaled smoothly)
  ['gtcm-2025-award', '2.webp', null, 1280, 720],
  ['coach-ranbir-moirangthem', '5.webp', { left: 175, top: 230, width: 440, height: 550 }, 880, 440],
  ['coach-jemsh-saikhom', '3.webp', { left: 236, top: 200, width: 448, height: 560 }, 880, 440],
  ['sai-bangalore-ranbir-moirangthem', '6.webp', null, 720, 480],
  ['gtc-2025-coach-young-athlete', '7.webp', { left: 0, top: 0, width: 720, height: 1195 }, 720, 480],
  ['gtc-2025-podium-cadets', '8.jpg', { left: 0, top: 0, width: 721, height: 1195 }, 720, 480],
  ['gtc-2025-podium-juniors', '9.jpg', { left: 0, top: 0, width: 1280, height: 650 }, 1280, 720],
  ['gtc-2025-young-athlete', '10.jpg', { left: 0, top: 0, width: 720, height: 1195 }, 720, 480],
];

const enhance = (img) => img
  .modulate({ saturation: 1.08, brightness: 1.02 })   // a little more life, not cartoonish
  .linear(1.06, -7)                                    // slight contrast lift
  .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 });          // crisp edges without halos

(async () => {
  const placeholders = {};
  for (const [name, src, crop, full, small] of PHOTOS) {
    const base = () => { let s = sharp(path.join(IN, src)).rotate(); if (crop) s = s.extract(crop); return s };
    for (const [w, suffix] of [[full, ''], [small, '-sm']]) {
      await enhance(base().resize({ width: w, kernel: 'lanczos3', withoutEnlargement: !(name === 'team-banner' || name.startsWith('coach-')) }))
        .webp({ quality: 86, effort: 6, smartSubsample: true })
        .toFile(path.join(OUT, name + suffix + '.webp'));
    }
    const tiny = await base().resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();
    placeholders[name] = 'data:image/webp;base64,' + tiny.toString('base64');
    const m = await sharp(path.join(OUT, name + '.webp')).metadata();
    console.log(name.padEnd(36), m.width + 'x' + m.height);
  }
  fs.writeFileSync(path.join(OUT, 'placeholders.json'), JSON.stringify(placeholders, null, 2) + '\n');
})();
