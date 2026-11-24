import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const source = "src/assets/icons/a3";
const destination = "public/a3/icons";
const size = 512;
const chars = "0123456789ABCDEFXZ<>/*+-=$#%&@_[]{}|^~?";
const activeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-";
const color = { background: "#000000", mid: "#a0a0a0", bright: "#ebebeb", peak: "#ffffff" };

function hash(value) {
  let n = Math.imul(value | 0, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function glyph(index, alphabet = chars) {
  return alphabet[index % alphabet.length].replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function artwork() {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    "<title>A3 game icon</title>",
    `<rect width="${size}" height="${size}" fill="${color.background}"/>`,
    `<g font-family="JetBrains Mono, monospace" font-size="22" text-anchor="middle" fill="${color.mid}">`,
  ];

  // One ambient stream per column, spaced and faded like the game canvas.
  for (let col = 0; col < 20; col++) {
    const x = 12 + col * 26;
    const head = ((hash(col * 17 + 9) * (size + 235) + 240) % (size + 235)) - 118;
    for (let row = 0; row < 7; row++) {
      const y = head - row * 26;
      if (y < 0 || y > size + 16) continue;
      const index = Math.floor(hash(col * 937 + row * 101 + 8) * chars.length);
      const opacity = ((1 - row / 7) * 0.24).toFixed(3);
      parts.push(`<text x="${x}" y="${y.toFixed(1)}" opacity="${opacity}">${glyph(index)}</text>`);
    }
  }
  parts.push("</g>");

  // Three game rays descend from the top: each bright, bold head leads its fading tail.
  parts.push('<g font-family="JetBrains Mono, monospace" font-size="28" text-anchor="middle">');
  for (const [x, head, seed] of [[102, 246, 13], [256, 180, 29], [410, 232, 47]]) {
    for (let row = 5; row >= 0; row--) {
      const y = head - row * 32;
      const alphabet = row === 0 ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : activeChars;
      const index = Math.floor(hash(seed + row * 113) * alphabet.length);
      const opacity = (1 - row / 7).toFixed(3);
      parts.push(`<text x="${x}" y="${y}" font-weight="${row === 0 ? 800 : 400}" fill="${row === 0 ? color.peak : color.bright}" opacity="${opacity}">${glyph(index, alphabet)}</text>`);
    }
  }
  parts.push("</g>");

  // Same solid equilateral geometry as the game plane, enlarged and set slightly low.
  const height = 172;
  const halfWidth = height / Math.sqrt(3);
  const centerX = 256;
  const centerY = 336;
  const points = `${centerX},${(centerY - height * 0.55).toFixed(3)} ${(centerX - halfWidth).toFixed(3)},${(centerY + height * 0.45).toFixed(3)} ${(centerX + halfWidth).toFixed(3)},${(centerY + height * 0.45).toFixed(3)}`;
  parts.push(`<polygon points="${points}" fill="${color.peak}"/>`);

  const scanlines = Array.from({ length: 170 }, (_, index) => `M0 ${index * 3 + 2}.5h512`).join(" ");
  parts.push(`<path d="${scanlines}" fill="none" stroke="${color.peak}" stroke-opacity=".07" stroke-width="1"/>`);
  parts.push("</svg>");
  return parts.join("");
}

await mkdir(source, { recursive: true });
await mkdir(destination, { recursive: true });
const fontResponse = await fetch("https://amiri.cc/delta/assets/css/fonts.css");
if (!fontResponse.ok) throw new Error(`Unable to load Delta fonts: ${fontResponse.status}`);
const fontCss = await fontResponse.text();
const browser = await chromium.launch({ headless: true });
try {
  const svg = artwork();
  await writeFile(join(source, "dark.svg"), svg);
  for (const iconSize of [32, 180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: iconSize, height: iconSize }, deviceScaleFactor: 1 });
    await page.setContent(`<html><head><style>${fontCss}body{margin:0}svg{display:block;width:${iconSize}px;height:${iconSize}px}</style></head><body>${svg}</body></html>`);
    const fontLoaded = await page.evaluate(async () => {
      const [regular, bold] = await Promise.all([
        document.fonts.load('400 22px "JetBrains Mono"', "AZ09"),
        document.fonts.load('800 28px "JetBrains Mono"', "AZ09"),
      ]);
      return [regular, bold].every((faces) =>
        faces.some((face) => face.family === "JetBrains Mono" && face.status === "loaded"));
    });
    if (!fontLoaded) throw new Error("JetBrains Mono did not load for A3 icon rendering");
    await page.locator("svg").screenshot({ path: join(destination, `dark-${iconSize}.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}
