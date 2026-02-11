/**
 * Generates PNG PWA icons from public/icons/icon.svg.
 * Chrome and many PWA runtimes do not accept SVG as manifest icons.
 * Run before build: npm run generate-icons (or as part of build).
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icons', 'icon.svg');
const outDir = join(root, 'public', 'icons');

const sizes = [192, 512] as const;

async function main() {
  const svg = readFileSync(svgPath);
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-${size}.png`));
    console.log(`Generated public/icons/icon-${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
