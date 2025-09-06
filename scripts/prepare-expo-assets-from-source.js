// Prepare Expo assets from a source PNG using Sharp
// Usage: node scripts/prepare-expo-assets-from-source.js [sourcePath]

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const DEFAULT_SOURCE = path.join(ASSETS_DIR, 'what-can-i-eat-icon.png');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generateFromSource(srcPath) {
  ensureDir(ASSETS_DIR);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source image not found: ${srcPath}`);
  }

  const ICON_SIZE = 1024;
  const FAVICON_SIZE = 48;
  const SAFE_MARGIN = 0.12; // 12% padding
  const contentSize = Math.round(ICON_SIZE * (1 - SAFE_MARGIN * 2));

  // Background gradient SVG (teal -> dark teal)
  const bgSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#14B8A6"/>
          <stop offset="100%" stop-color="#0F766E"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`);

  // Load and scale source into a square with padding
  const src = sharp(srcPath).resize(contentSize, contentSize, { fit: 'inside', withoutEnlargement: true }).png();
  const srcBuf = await src.toBuffer();

  // 1) icon.png (bg + centered image)
  const icon = await sharp(bgSvg)
    .composite([{ input: srcBuf, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'icon.png'));

  // 2) adaptive-icon.png (foreground: transparent canvas with centered image, fits 70%)
  const fgScale = Math.round(ICON_SIZE * 0.7);
  const fgBuf = await sharp(srcPath).resize(fgScale, fgScale, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const transparentCanvas = await sharp({ create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .composite([{ input: fgBuf, gravity: 'center' }])
    .toBuffer();
  await sharp(transparentCanvas).toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));

  // 3) splash-icon.png (white bg + larger icon ~70%)
  const splashScale = Math.round(ICON_SIZE * 0.7);
  const splashBuf = await sharp(srcPath).resize(splashScale, splashScale, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const whiteCanvas = await sharp({ create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .composite([{ input: splashBuf, gravity: 'center' }])
    .toBuffer();
  await sharp(whiteCanvas).toFile(path.join(ASSETS_DIR, 'splash-icon.png'));

  // 4) favicon.png (downscale icon)
  await sharp(path.join(ASSETS_DIR, 'icon.png')).resize(FAVICON_SIZE, FAVICON_SIZE).png({ compressionLevel: 9 }).toFile(path.join(ASSETS_DIR, 'favicon.png'));

  console.log('✅ Prepared Expo assets from source image:');
  console.log(' - assets/icon.png');
  console.log(' - assets/adaptive-icon.png');
  console.log(' - assets/splash-icon.png');
  console.log(' - assets/favicon.png');
}

const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE;
generateFromSource(input).catch((err) => {
  console.error('❌ Failed to prepare assets:', err.message);
  process.exit(1);
});

