import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp modern SVG badge for Mythos
const createSvg = (size: number, isMaskable: boolean = false) => {
  // Maskable icons need safe zone: keep key content in inner 80% circle
  const scale = isMaskable ? 0.72 : 0.88;
  const offset = (size * (1 - scale)) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bg)" />
    
    <!-- Subtle tech accent rings -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${(size / 2) * scale * 0.95}" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,8" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${(size / 2) * scale * 0.75}" fill="none" stroke="#0284c7" stroke-opacity="0.15" stroke-width="1.5" />

    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      <!-- Glow effect backdrop -->
      <path d="M ${size * 0.22} ${size * 0.78} 
               L ${size * 0.22} ${size * 0.26} 
               L ${size * 0.5} ${size * 0.56} 
               L ${size * 0.78} ${size * 0.26} 
               L ${size * 0.78} ${size * 0.78}"
            fill="none" 
            stroke="#0284c7" 
            stroke-width="${size * 0.08}" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            opacity="0.4"
            filter="url(#glow)" />

      <!-- Main "M" / Mythos Knowledge Monogram -->
      <path d="M ${size * 0.22} ${size * 0.78} 
               L ${size * 0.22} ${size * 0.26} 
               L ${size * 0.5} ${size * 0.56} 
               L ${size * 0.78} ${size * 0.26} 
               L ${size * 0.78} ${size * 0.78}"
            fill="none" 
            stroke="url(#primary)" 
            stroke-width="${size * 0.065}" 
            stroke-linecap="round" 
            stroke-linejoin="round" />

      <!-- Center Lore Crystal / Quill tip -->
      <polygon points="${size * 0.5},${size * 0.28} ${size * 0.56},${size * 0.38} ${size * 0.5},${size * 0.48} ${size * 0.44},${size * 0.38}" 
               fill="url(#accent)" />
      
      <!-- Tech connection dots -->
      <circle cx="${size * 0.22}" cy="${size * 0.78}" r="${size * 0.035}" fill="#38bdf8" />
      <circle cx="${size * 0.78}" cy="${size * 0.78}" r="${size * 0.035}" fill="#818cf8" />
      <circle cx="${size * 0.5}" cy="${size * 0.56}" r="${size * 0.028}" fill="#e0f2fe" />
    </g>
  </svg>`;
};

async function generate() {
  console.log('Generating PWA icons...');

  // 1. Favicon SVG
  const svg512 = createSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg512);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg512);

  // 2. pwa-192x192.png
  await sharp(Buffer.from(createSvg(192, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 3. pwa-512x512.png
  await sharp(Buffer.from(createSvg(512, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 4. pwa-maskable-512x512.png
  await sharp(Buffer.from(createSvg(512, true)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(createSvg(180, false)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 6. favicon.ico (using 32x32 sharp png to favicon)
  await sharp(Buffer.from(createSvg(64, false)))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
