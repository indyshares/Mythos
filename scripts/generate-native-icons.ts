import sharp from 'sharp';
import path from 'node:path';

/** Regenerate Android launcher/splash PNGs and public PWA icons from the desktop feather artwork. */
const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'public', 'pwa-maskable.png');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');

const densities = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
] as const;

const splashes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
] as const;

async function opaque(size: number, out: string) {
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: '#FFFFFF' })
    .flatten({ background: '#FFFFFF' })
    .png()
    .toFile(out);
}

async function foreground(size: number, out: string) {
  const inner = Math.round(size * 0.66);
  const feather = await sharp(source).resize(inner, inner, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: feather, gravity: 'center' }])
    .png()
    .toFile(out);
}

async function splash(width: number, height: number, out: string) {
  const mark = Math.round(Math.min(width, height) * 0.25);
  const feather = await sharp(source)
    .resize(mark, mark, { fit: 'contain', background: '#FFFFFF' })
    .flatten({ background: '#FFFFFF' })
    .toBuffer();
  await sharp({ create: { width, height, channels: 3, background: '#FFFFFF' } })
    .composite([{ input: feather, gravity: 'center' }])
    .flatten({ background: '#FFFFFF' })
    .png()
    .toFile(out);
}

async function main() {
  for (const d of densities) {
    const dir = path.join(res, d.folder);
    await opaque(d.launcher, path.join(dir, 'ic_launcher.png'));
    await opaque(d.launcher, path.join(dir, 'ic_launcher_round.png'));
    await foreground(d.foreground, path.join(dir, 'ic_launcher_foreground.png'));
  }
  for (const [folder, width, height] of splashes) {
    await splash(width, height, path.join(res, folder, 'splash.png'));
  }
  await opaque(1254, path.join(root, 'public', 'pwa.png'));
  await opaque(180, path.join(root, 'public', 'apple-touch-icon.png'));
  console.log('Native icons regenerated from public/pwa-maskable.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
