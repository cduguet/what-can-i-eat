// Simple asset generator for Expo icons and splash using Sharp
// Generates:
// - assets/icon.png (1024x1024)
// - assets/adaptive-icon.png (1024x1024)
// - assets/splash-icon.png (1024x1024)
// - assets/favicon.png (48x48)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(process.cwd(), 'assets');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Base colors from design system
const COLORS = {
  teal: '#14B8A6',
  tealDark: '#0F766E',
  amber: '#F59E0B',
  cyan: '#22D3EE',
  white: '#FFFFFF',
};

// SVG for background gradient and subtle pattern
function buildBackgroundSVG(size = 1024) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${COLORS.teal}"/>
        <stop offset="100%" stop-color="${COLORS.tealDark}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
      <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#FFFFFF" opacity="0.06" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#dots)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
  </svg>`;
}

// SVG utensils glyph (fork + spoon), white with slight shadow
function buildGlyphSVG(size = 1024) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024; // allows proportional scaling
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(512,512)">
      <!-- soft shadow -->
      <g opacity="0.18" filter="none">
        <g transform="translate(-512,-512) rotate(-10 ${cx} ${cy})">
          <!-- circle plate shadow -->
          <circle cx="512" cy="512" r="300" fill="#000"/>
        </g>
      </g>
      <!-- main glyph -->
      <g transform="translate(-512,-512) rotate(-10 ${cx} ${cy})" fill="#FFFFFF">
        <!-- plate -->
        <circle cx="512" cy="512" r="300" fill="#FFFFFF" opacity="0.22"/>
        <!-- fork -->
        <rect x="440" y="340" width="40" height="280" rx="20" />
        <rect x="420" y="300" width="20" height="60" rx="8" />
        <rect x="450" y="300" width="20" height="60" rx="8" />
        <rect x="480" y="300" width="20" height="60" rx="8" />
        <!-- spoon -->
        <ellipse cx="590" cy="360" rx="40" ry="55" />
        <rect x="580" y="410" width="20" height="210" rx="10" />
      </g>
    </g>
  </svg>`;
}

async function generate() {
  ensureDir(ASSETS_DIR);

  // 1) ICON 1024
  const bg = Buffer.from(buildBackgroundSVG(1024));
  const glyph = Buffer.from(buildGlyphSVG(1024));

  const iconPng = await sharp(bg)
    .composite([{ input: glyph }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(iconPng).toFile(path.join(ASSETS_DIR, 'icon.png'));
  await sharp(iconPng).toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));

  // 2) SPLASH ICON (same size, slightly larger glyph)
  const splashGlyph = Buffer.from(buildGlyphSVG(1024));
  const splashBg = Buffer.from(buildBackgroundSVG(1024));
  const splashPng = await sharp(splashBg)
    .composite([{ input: splashGlyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(splashPng).toFile(path.join(ASSETS_DIR, 'splash-icon.png'));

  // 3) Favicon 48x48 (downscale icon)
  await sharp(iconPng).resize(48, 48).png({ compressionLevel: 9 }).toFile(path.join(ASSETS_DIR, 'favicon.png'));

  console.log('✅ Assets generated in ./assets: icon.png, adaptive-icon.png, splash-icon.png, favicon.png');
}

generate().catch((err) => {
  console.error('❌ Failed to generate assets:', err);
  process.exit(1);
});
