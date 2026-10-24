/**
 * Dependency-free PNG generator for PWA icons, favicon and manifest screenshots.
 *
 * There is no image toolchain in CI (no ImageMagick / sharp / PIL), so this
 * script rasterises the brand mark directly and writes spec-compliant PNGs with
 * Node's zlib. Run with `npm run icons`.
 */
import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── PNG encoder ────────────────────────────────────────────────────────────
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
};

const encodePng = (width, height, rgba) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// ── tiny raster canvas ─────────────────────────────────────────────────────
const createCanvas = (width, height) => {
  const data = Buffer.alloc(width * height * 4, 0);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = (y * width + x) * 4;
    const alpha = a / 255;
    const dstA = data[index + 3] / 255;
    const outA = alpha + dstA * (1 - alpha);
    if (outA === 0) return;
    data[index] = Math.round((r * alpha + data[index] * dstA * (1 - alpha)) / outA);
    data[index + 1] = Math.round((g * alpha + data[index + 1] * dstA * (1 - alpha)) / outA);
    data[index + 2] = Math.round((b * alpha + data[index + 2] * dstA * (1 - alpha)) / outA);
    data[index + 3] = Math.round(outA * 255);
  };
  const blend = (x, y, r, g, b, alpha) => set(x, y, r, g, b, Math.round(alpha * 255));

  const roundedRect = (x0, y0, w, h, radius, color, alpha = 1) => {
    for (let y = Math.floor(y0); y < Math.ceil(y0 + h); y += 1) {
      for (let x = Math.floor(x0); x < Math.ceil(x0 + w); x += 1) {
        const dx = Math.max(x0 + radius - x, 0, x - (x0 + w - radius));
        const dy = Math.max(y0 + radius - y, 0, y - (y0 + h - radius));
        const distance = Math.hypot(dx, dy);
        const coverage = Math.min(1, Math.max(0, radius - distance + 0.5));
        if (coverage > 0) blend(x, y, color[0], color[1], color[2], alpha * coverage);
      }
    }
  };

  const gradientRect = (x0, y0, w, h, radius, from, to, alpha = 1) => {
    for (let y = Math.floor(y0); y < Math.ceil(y0 + h); y += 1) {
      for (let x = Math.floor(x0); x < Math.ceil(x0 + w); x += 1) {
        const dx = Math.max(x0 + radius - x, 0, x - (x0 + w - radius));
        const dy = Math.max(y0 + radius - y, 0, y - (y0 + h - radius));
        const distance = Math.hypot(dx, dy);
        const coverage = Math.min(1, Math.max(0, radius - distance + 0.5));
        if (coverage <= 0) continue;
        const t = Math.min(1, Math.max(0, (x - x0) / w * 0.6 + (y - y0) / h * 0.4));
        blend(
          x,
          y,
          Math.round(from[0] + (to[0] - from[0]) * t),
          Math.round(from[1] + (to[1] - from[1]) * t),
          Math.round(from[2] + (to[2] - from[2]) * t),
          alpha * coverage,
        );
      }
    }
  };

  const strokePolyline = (points, widthPx, color, alpha = 1) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const minX = Math.floor(Math.min(x1, x2) - widthPx);
      const maxX = Math.ceil(Math.max(x1, x2) + widthPx);
      const minY = Math.floor(Math.min(y1, y2) - widthPx);
      const maxY = Math.ceil(Math.max(y1, y2) + widthPx);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSq = dx * dx + dy * dy || 1;
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const t = Math.min(1, Math.max(0, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
          const px = x1 + dx * t;
          const py = y1 + dy * t;
          const distance = Math.hypot(x - px, y - py);
          const coverage = Math.min(1, Math.max(0, widthPx / 2 - distance + 0.5));
          if (coverage > 0) blend(x, y, color[0], color[1], color[2], alpha * coverage);
        }
      }
    }
  };

  const circle = (cx, cy, radius, color, alpha = 1) => {
    for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y += 1) {
      for (let x = Math.floor(cx - radius - 1); x <= Math.ceil(cx + radius + 1); x += 1) {
        const distance = Math.hypot(x - cx, y - cy);
        const coverage = Math.min(1, Math.max(0, radius - distance + 0.5));
        if (coverage > 0) blend(x, y, color[0], color[1], color[2], alpha * coverage);
      }
    }
  };

  return { width, height, data, set, blend, roundedRect, gradientRect, strokePolyline, circle };
};

const BRAND_FROM = [74, 92, 255];
const BRAND_TO = [124, 92, 255];
const WHITE = [255, 255, 255];

const drawSigma = (canvas, size, padding = 0.22) => {
  const inset = size * padding;
  const w = size - inset * 2;
  const points = [
    [inset + w * 0.78, inset + w * 0.2],
    [inset + w * 0.26, inset + w * 0.2],
    [inset + w * 0.58, inset + w * 0.5],
    [inset + w * 0.26, inset + w * 0.8],
    [inset + w * 0.8, inset + w * 0.8],
  ];
  canvas.strokePolyline(points, size * 0.075, WHITE, 0.98);
};

const makeIcon = async (size, { maskable = false, apple = false } = {}) => {
  const canvas = createCanvas(size, size);
  if (apple) {
    // iOS applies its own mask; keep the artwork full-bleed.
    canvas.gradientRect(0, 0, size, size, 0, BRAND_FROM, BRAND_TO);
    drawSigma(canvas, size, 0.2);
  } else if (maskable) {
    canvas.gradientRect(0, 0, size, size, size * 0.5, BRAND_FROM, BRAND_TO);
    // 40% safe zone: keep the glyph well inside the maskable circle.
    drawSigma(canvas, size, 0.3);
  } else {
    canvas.gradientRect(size * 0.02, size * 0.02, size * 0.96, size * 0.96, size * 0.22, BRAND_FROM, BRAND_TO);
    drawSigma(canvas, size, 0.24);
  }
  return encodePng(size, size, canvas.data);
};

// ── app-shaped screenshots (for the manifest) ──────────────────────────────
const drawMobileScreenshot = () => {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  canvas.roundedRect(0, 0, width, height, 0, [0, 0, 0]);

  // status + top app bar
  canvas.roundedRect(40, 60, 220, 26, 13, [40, 40, 48]);
  canvas.circle(980, 96, 26, [186, 195, 255], 0.5);
  canvas.roundedRect(70, 130, 220, 40, 12, [186, 195, 255]);
  canvas.strokePolyline([[80, 200], [300, 200]], 8, [70, 70, 79]);
  canvas.strokePolyline([[80, 240], [1000, 240]], 12, [27, 27, 31]);

  // hero card
  canvas.gradientRect(40, 280, 1000, 520, 40, [30, 37, 96], [18, 18, 26]);
  canvas.strokePolyline([[90, 360], [520, 360]], 18, [228, 225, 230]);
  canvas.strokePolyline([[90, 410], [720, 410]], 18, [228, 225, 230]);
  canvas.strokePolyline([[90, 470], [640, 470]], 12, [140, 140, 152]);
  canvas.roundedRect(90, 540, 900, 96, 48, [27, 27, 31]);
  canvas.strokePolyline([[140, 588], [400, 588]], 10, [110, 110, 124]);
  canvas.roundedRect(90, 660, 300, 70, 35, [45, 63, 207]);
  canvas.strokePolyline([[140, 695], [330, 695]], 10, [221, 225, 255]);
  canvas.strokePolyline([[90, 840], [300, 840]], 8, [70, 70, 79]); // stat

  // category grid 2x2
  const card = (x, y, from, to) => {
    canvas.gradientRect(x, y, 480, 250, 32, from, to);
    canvas.circle(x + 70, y + 70, 34, [255, 255, 255], 0.2);
    canvas.strokePolyline([[x + 40, y + 170], [x + 300, y + 170]], 14, [228, 225, 230]);
    canvas.strokePolyline([[x + 40, y + 205], [x + 190, y + 205]], 10, [160, 160, 172]);
  };
  card(40, 900, [35, 44, 120], [27, 27, 31]);
  card(560, 900, [20, 80, 70], [27, 27, 31]);
  card(40, 1180, [90, 62, 24], [27, 27, 31]);
  card(560, 1180, [30, 70, 90], [27, 27, 31]);

  // list rows
  for (let i = 0; i < 3; i += 1) {
    const y = 1490 + i * 110;
    canvas.roundedRect(40, y, 1000, 96, 20, [18, 18, 22]);
    canvas.circle(110, y + 48, 28, [45, 63, 207]);
    canvas.strokePolyline([[170, y + 36], [600, y + 36]], 10, [228, 225, 230]);
    canvas.strokePolyline([[170, y + 64], [420, y + 64]], 8, [120, 120, 132]);
  }

  // bottom navigation
  canvas.roundedRect(0, 1740, width, 180, 0, [18, 18, 22]);
  for (let i = 0; i < 5; i += 1) {
    const x = 108 + i * 216;
    canvas.circle(x, 1810, 26, i === 2 ? [186, 195, 255] : [90, 90, 102]);
    canvas.strokePolyline([[x - 26, 1866], [x + 26, 1866]], 8, i === 0 ? [228, 225, 230] : [90, 90, 102]);
  }
  return canvas;
};

const drawFormulaScreenshot = () => {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  canvas.roundedRect(0, 0, width, height, 0, [0, 0, 0]);
  canvas.circle(90, 110, 30, [40, 40, 48]);
  canvas.strokePolyline([[170, 100], [520, 100]], 16, [228, 225, 230]);
  canvas.strokePolyline([[70, 200], [1010, 200]], 14, [27, 27, 31]);

  // tab rail
  ['محاسبه', 'مراحل', 'رسم', 'مثال', 'تاریخچه'].forEach((_, index) => {
    canvas.roundedRect(50 + index * 200, 240, 180, 70, 35, index === 0 ? [45, 63, 207] : [27, 27, 31]);
  });

  // hero formula
  canvas.roundedRect(40, 340, 1000, 260, 32, [18, 18, 22]);
  canvas.strokePolyline([[120, 430], [400, 430]], 14, [186, 195, 255]);
  canvas.strokePolyline([[120, 490], [700, 490]], 10, [120, 120, 132]);
  canvas.circle(540, 545, 8, [228, 225, 230]);

  // inputs
  canvas.roundedRect(40, 650, 480, 120, 20, [11, 11, 15]);
  canvas.roundedRect(560, 650, 480, 120, 20, [11, 11, 15]);
  canvas.strokePolyline([[80, 712], [240, 712]], 12, [186, 195, 255]);
  canvas.strokePolyline([[600, 712], [760, 712]], 12, [186, 195, 255]);

  // result card
  canvas.gradientRect(40, 820, 1000, 330, 32, [30, 37, 96], [18, 18, 26]);
  canvas.strokePolyline([[90, 890], [330, 890]], 10, [160, 160, 172]);
  canvas.strokePolyline([[90, 950], [420, 950]], 18, [228, 225, 230]);
  canvas.strokePolyline([[90, 1040], [700, 1040]], 8, [120, 120, 132]);

  // math keyboard
  canvas.roundedRect(0, 1220, width, 700, 36, [27, 27, 31]);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      canvas.roundedRect(30 + col * 206, 1280 + row * 110, 186, 88, 16, [36, 36, 41]);
      canvas.strokePolyline([[80 + col * 206, 1324 + row * 110], [150 + col * 206, 1324 + row * 110]], 8, [199, 197, 208]);
    }
  }
  canvas.roundedRect(30, 1740, 540, 88, 16, [45, 63, 207]);
  canvas.roundedRect(790, 1740, 260, 88, 16, [186, 195, 255]);
  return canvas;
};

const drawDesktopScreenshot = () => {
  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  canvas.roundedRect(0, 0, width, height, 0, [0, 0, 0]);
  canvas.roundedRect(0, 0, 260, height, 0, [11, 11, 15]);
  canvas.roundedRect(40, 40, 180, 56, 16, [45, 63, 207]);
  for (let i = 0; i < 7; i += 1) {
    canvas.roundedRect(40, 140 + i * 70, 180, 40, 12, i === 0 ? [36, 36, 41] : [18, 18, 22]);
  }
  canvas.gradientRect(340, 90, 1540, 340, 40, [30, 37, 96], [18, 18, 26]);
  canvas.strokePolyline([[400, 190], [1040, 190]], 26, [228, 225, 230]);
  canvas.strokePolyline([[400, 260], [1300, 260]], 16, [140, 140, 152]);
  canvas.roundedRect(400, 320, 420, 72, 36, [45, 63, 207]);
  for (let i = 0; i < 3; i += 1) {
    const x = 340 + i * 530;
    canvas.gradientRect(x, 480, 480, 240, 32, [27, 27, 31], [18, 18, 22]);
    canvas.circle(x + 60, 540, 26, [186, 195, 255], 0.6);
    canvas.strokePolyline([[x + 40, 620], [x + 340, 620]], 14, [228, 225, 230]);
    canvas.strokePolyline([[x + 40, 664], [x + 240, 664]], 10, [120, 120, 132]);
  }
  for (let i = 0; i < 3; i += 1) {
    canvas.roundedRect(340, 780 + i * 100, 1540, 80, 20, [18, 18, 22]);
    canvas.circle(400, 820 + i * 100, 24, [45, 63, 207]);
  }
  return canvas;
};

// ── main ───────────────────────────────────────────────────────────────────
const iconDir = path.join(root, 'public', 'icons');
const shotDir = path.join(root, 'public', 'screenshots');
await mkdir(iconDir, { recursive: true });
await mkdir(shotDir, { recursive: true });

const jobs = [
  [path.join(iconDir, 'icon-192.png'), await makeIcon(192)],
  [path.join(iconDir, 'icon-512.png'), await makeIcon(512)],
  [path.join(iconDir, 'maskable-512.png'), await makeIcon(512, { maskable: true })],
  [path.join(iconDir, 'apple-touch-icon.png'), await makeIcon(180, { apple: true })],
  [path.join(iconDir, 'favicon-32.png'), await makeIcon(32)],
  [path.join(iconDir, 'icon-1024.png'), await makeIcon(1024)],
];
for (const [file, buffer] of jobs) await writeFile(file, buffer);

await writeFile(
  path.join(iconDir, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="SolveEverything">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4A5CFF"/>
      <stop offset="1" stop-color="#7C5CFF"/>
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="492" height="492" rx="112" fill="url(#g)"/>
  <path d="M370 148H178l142 108-142 108h204" fill="none" stroke="#fff" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
);

const shots = [
  ['home-mobile.png', drawMobileScreenshot()],
  ['formula-mobile.png', drawFormulaScreenshot()],
  ['home-desktop.png', drawDesktopScreenshot()],
];
for (const [name, canvas] of shots) {
  await writeFile(path.join(shotDir, name), encodePng(canvas.width, canvas.height, canvas.data));
}

console.log(`Generated ${jobs.length} icons and ${shots.length} screenshots.`);
