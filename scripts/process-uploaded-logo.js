import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processLogo() {
  const inputPath = path.resolve('image.png');
  if (!fs.existsSync(inputPath)) {
    console.error('image.png not found');
    process.exit(1);
  }

  // 1. Save original as public/logo.png
  fs.copyFileSync(inputPath, 'public/logo.png');
  console.log('Copied to public/logo.png');

  // Let's get metadata of image.png
  const meta = await sharp(inputPath).metadata();
  console.log('Original size:', meta.width, meta.height);

  // 2. 512x512 standard PWA icon: Fit contain with clean background or padding
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated public/pwa-512x512.png');

  // 3. 192x192 standard PWA icon
  await sharp(inputPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated public/pwa-192x192.png');

  // 4. Apple touch icon 180x180
  await sharp(inputPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated public/apple-touch-icon.png');

  // 5. Favicon 64x64
  await sharp(inputPath)
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile('public/favicon.png');
  console.log('Generated public/favicon.png');

  // 6. Maskable 512x512: 80% safe zone inner fit
  const maskableInner = await sharp(inputPath)
    .resize(410, 410, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: maskableInner,
      gravity: 'center'
    }
  ])
  .png()
  .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated public/pwa-maskable-512x512.png');

  console.log('All icons processed successfully from uploaded image.png!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
