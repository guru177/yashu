import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");

const WEBP_QUALITY = 82;
const JPG_QUALITY = 85;
const JPG_BG = { r: 250, g: 247, b: 242 };

function collectPngFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "css" && entry.name !== "js") {
      files.push(...collectPngFiles(full));
    } else if (entry.isFile() && /\.png$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function convertImage(inputPath) {
  const base = inputPath.replace(/\.png$/i, "");
  const webpPath = `${base}.webp`;
  const jpgPath = `${base}.jpg`;
  const image = sharp(inputPath);
  const meta = await image.metadata();

  await sharp(inputPath)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(webpPath);

  const jpgPipeline = meta.hasAlpha
    ? sharp(inputPath).flatten({ background: JPG_BG })
    : sharp(inputPath);

  await jpgPipeline
    .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
    .toFile(jpgPath);

  const pngSize = fs.statSync(inputPath).size;
  const webpSize = fs.statSync(webpPath).size;
  const jpgSize = fs.statSync(jpgPath).size;

  return {
    name: path.basename(inputPath),
    pngSize,
    webpSize,
    jpgSize,
  };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegInstaller.path, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function convertVideo(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) return null;

  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "32",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-an",
    outputPath,
  ]);

  return {
    name: path.basename(outputPath),
    mp4Size: fs.statSync(inputPath).size,
    webmSize: fs.statSync(outputPath).size,
  };
}

async function main() {
  const pngFiles = collectPngFiles(assetsDir).filter((file) => fs.existsSync(file));

  console.log(`Converting ${pngFiles.length} PNG images...\n`);

  const imageResults = [];
  for (const file of pngFiles) {
    const result = await convertImage(file);
    imageResults.push(result);
    console.log(
      `${result.name}: PNG ${(result.pngSize / 1024).toFixed(0)}KB → WebP ${(result.webpSize / 1024).toFixed(0)}KB, JPG ${(result.jpgSize / 1024).toFixed(0)}KB`
    );
  }

  console.log("\nConverting videos...\n");

  const videoResults = [];
  const videoJobs = [[path.join(root, "intro.mp4"), path.join(root, "intro.webm")]];

  for (const [input, output] of videoJobs) {
    const result = await convertVideo(input, output);
    if (result) {
      videoResults.push(result);
      console.log(
        `${result.name}: MP4 ${(result.mp4Size / 1024 / 1024).toFixed(2)}MB → WebM ${(result.webmSize / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }

  const totalPng = imageResults.reduce((sum, r) => sum + r.pngSize, 0);
  const totalWebp = imageResults.reduce((sum, r) => sum + r.webpSize, 0);
  const totalJpg = imageResults.reduce((sum, r) => sum + r.jpgSize, 0);

  console.log("\n--- Summary ---");
  console.log(`Images: PNG ${(totalPng / 1024 / 1024).toFixed(2)}MB → WebP ${(totalWebp / 1024 / 1024).toFixed(2)}MB, JPG ${(totalJpg / 1024 / 1024).toFixed(2)}MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
