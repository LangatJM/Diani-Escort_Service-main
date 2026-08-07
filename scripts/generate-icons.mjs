// Generates simple PNG app icons (192x192 and 512x512) for the PWA manifest.
// Creates a rounded dark square with a teal circle and sand "flower" shape,
// matching public/icons/icon.svg. Uses only Node built-ins (zlib).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// ---- PNG encoder helpers ----
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build scanlines (each row prefixed with filter byte 0).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Drawing ----
const OCEAN_950 = [6, 21, 25];      // background
const OCEAN_500 = [42, 157, 152];   // teal circle
const SAND_200 = [242, 224, 184];   // sand "flower"
const OCEAN_950_RGB = [11, 31, 42]; // inner circle accent

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const radius = size * 0.22; // rounded-corner radius
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let r = OCEAN_950[0], g = OCEAN_950[1], b = OCEAN_950[2], a = 255;

      // Rounded-square mask: skip corners outside the rounded rectangle.
      const dx = Math.max(Math.abs(x - cx) - (cx - radius), 0);
      const dy = Math.max(Math.abs(y - cy) - (cy - radius), 0);
      if (dx * dx + dy * dy > radius * radius) {
        a = 0;
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
        continue;
      }

      // Distance from center for the teal circle.
      const dist = Math.hypot(x - cx, y - cy);
      const circleR = size * 0.30;
      if (dist <= circleR) {
        r = OCEAN_500[0]; g = OCEAN_500[1]; b = OCEAN_500[2];
      }

      // Sand "flower" shape: two overlaid petals + inner dark circle.
      // Petal 1 (top)
      const petal = (pxx, pyy) => {
        const ex = cx + (pxx - cx) * 1.0;
        const ey = cy - (size * 0.38) + (pyy - cy) * 0.55;
        return Math.hypot(pxx - ex, pyy - ey) < size * 0.16;
      };
      // Petal 2 (bottom)
      const petal2 = (pxx, pyy) => {
        const ex = cx + (pxx - cx) * 1.0;
        const ey = cy + (size * 0.38) + (pyy - cy) * 0.55;
        return Math.hypot(pxx - ex, pyy - ey) < size * 0.16;
      };
      if ((petal(x, y) && y < cy) || (petal2(x, y) && y >= cy)) {
        r = SAND_200[0]; g = SAND_200[1]; b = SAND_200[2];
      }

      // Inner dark circle
      if (dist <= size * 0.07) {
        r = OCEAN_950_RGB[0]; g = OCEAN_950_RGB[1]; b = OCEAN_950_RGB[2];
      }

      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }
  return px;
}

for (const size of [192, 512]) {
  const rgba = drawIcon(size);
  const png = encodePng(size, rgba);
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`Wrote ${file} (${png.length} bytes)`);
}

