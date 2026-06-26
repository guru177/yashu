import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");

const logoPath = path.join(assetsDir, "logo.jpg");
const thumbPath = path.join(assetsDir, "thump.png");
const ogThumbPath = path.join(assetsDir, "og-thumb.jpg");

async function generateFavicons() {
  if (!fs.existsSync(logoPath)) {
    console.warn("Skip favicons: assets/logo.jpg not found");
    return;
  }

  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(logoPath)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(assetsDir, name));
    console.log(`Created assets/${name}`);
  }

  await sharp(logoPath)
    .resize(32, 32, { fit: "cover" })
    .toFile(path.join(assetsDir, "favicon.ico"));
  console.log("Created assets/favicon.ico");
}

async function generateOgThumb() {
  const source = [
    path.join(assetsDir, "og-thumb2.png"),
    thumbPath,
    path.join(assetsDir, "hero5.jpg"),
    logoPath,
  ].find((file) => fs.existsSync(file));

  if (!source) {
    console.warn("Skip og-thumb: no source image found");
    return;
  }

  const pipeline = sharp(source).resize(1200, 630, { fit: "cover", position: "centre" });

  await pipeline.clone().jpeg({ quality: 90, mozjpeg: true }).toFile(ogThumbPath);
  await pipeline.clone().webp({ quality: 85, effort: 6 }).toFile(path.join(assetsDir, "og-thumb.webp"));

  console.log(`Created assets/og-thumb.jpg and assets/og-thumb.webp from ${path.basename(source)}`);
}

async function main() {
  await generateFavicons();
  await generateOgThumb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
