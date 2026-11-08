// Generates the PWA PNG icons (same glyph as public/icon.svg) without any image dependency.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const NAVY = [11, 31, 58];
const WHITE = [255, 255, 255];
const BLUE = [43, 108, 246];
const SHELF = [133, 143, 156]; // white at 50% over navy

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** Point-in-rounded-rectangle, all coordinates in [0,1] of the canvas. */
const inRR = (u, v, x0, y0, x1, y1, r) => {
  if (u < x0 || u > x1 || v < y0 || v > y1) return false;
  const cx = Math.min(Math.max(u, x0 + r), x1 - r);
  const cy = Math.min(Math.max(v, y0 + r), y1 - r);
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
};

// Glyph geometry mirrors icon.svg (512 canvas): door 156..356 × 116..396, stroke 22, handle, two shelves.
function sample(u, v) {
  const s = 22 / 512;
  if (inRR(u, v, 312 / 512, 200 / 512, 334 / 512, 288 / 512, 11 / 512)) return BLUE;
  if (inRR(u, v, 181 / 512, 171 / 512, 287 / 512, 189 / 512, 9 / 512)) return SHELF;
  if (inRR(u, v, 181 / 512, 221 / 512, 259 / 512, 239 / 512, 9 / 512)) return SHELF;
  const outer = inRR(u, v, 145 / 512, 105 / 512, 367 / 512, 407 / 512, 39 / 512);
  const inner = inRR(u, v, 145 / 512 + s, 105 / 512 + s, 367 / 512 - s, 407 / 512 - s, 39 / 512 - s);
  if (outer && !inner) return WHITE;
  return NAVY;
}

function png(size) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  const SS = 3; // supersampling grid per pixel for smooth edges
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < SS; i++)
        for (let j = 0; j < SS; j++) {
          const [cr, cg, cb] = sample((x + (i + 0.5) / SS) / size, (y + (j + 0.5) / SS) / size);
          r += cr;
          g += cg;
          b += cb;
        }
      const o = y * stride + 1 + x * 3;
      raw[o] = Math.round(r / (SS * SS));
      raw[o + 1] = Math.round(g / (SS * SS));
      raw[o + 2] = Math.round(b / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [file, size] of [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/apple-touch-icon.png", 180],
]) {
  writeFileSync(file, png(size));
  console.log("wrote", file);
}
