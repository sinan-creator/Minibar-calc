// Builds the PWA icons and favicon from the emblem in public/logo.png (no image dependency).
// Run: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

// ---- PNG decode (8-bit, non-interlaced; grey, grey+alpha, RGB, RGBA) ---------
function decodePng(buf) {
  let o = 8;
  const idat = [];
  let w = 0, h = 0, colourType = 0;
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    const type = buf.toString("ascii", o + 4, o + 8);
    const data = buf.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colourType = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error("Only 8-bit non-interlaced PNGs are supported");
    } else if (type === "IDAT") idat.push(data);
    o += 12 + len;
  }
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[colourType];
  if (!bpp) throw new Error(`Unsupported colour type ${colourType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const row = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = row[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp, d = (y * w + x) * 4;
      if (bpp >= 3) {
        out[d] = row[s]; out[d + 1] = row[s + 1]; out[d + 2] = row[s + 2];
        out[d + 3] = bpp === 4 ? row[s + 3] : 255;
      } else {
        out[d] = out[d + 1] = out[d + 2] = row[s];
        out[d + 3] = bpp === 2 ? row[s + 1] : 255;
      }
    }
    prev = row;
  }
  return { w, h, data: out };
}

// ---- PNG encode (RGB, filter 0) -----------------------------------------------
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
/** `rgba` true writes colour type 6 (Next's ICO decoder insists on RGBA inside favicon.ico). */
function encodePng(size, rgb, rgba = false) {
  const channels = rgba ? 4 : 3;
  const stride = size * channels + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 3, d = y * stride + 1 + x * channels;
      raw[d] = rgb[s]; raw[d + 1] = rgb[s + 1]; raw[d + 2] = rgb[s + 2];
      if (rgba) raw[d + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, rgba ? 6 : 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Single-image ICO wrapping a PNG (supported by every current browser). */
function encodeIco(pngBuf, size) {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = size === 256 ? 0 : size; header[7] = size === 256 ? 0 : size;
  header[8] = 0; header[9] = 0;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuf.length, 14); header.writeUInt32LE(22, 18);
  return Buffer.concat([header, pngBuf]);
}

// ---- Emblem extraction -----------------------------------------------------------
const logo = decodePng(readFileSync("public/logo.png"));
const { w, h, data } = logo;
const isInk = (i) => data[i + 3] > 128 && data[i] + data[i + 1] + data[i + 2] < 450;

// The emblem is the left-most dark cluster in the upper part of the logo.
let x0 = w, y0 = h, x1 = 0, y1 = 0;
let minAlpha = 255;
const sum = [0, 0, 0];
let inkCount = 0;
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    minAlpha = Math.min(minAlpha, data[i + 3]);
    if (x < w * 0.16 && y < h * 0.6 && isInk(i)) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; inkCount++;
    }
  }
const navy = sum.map((v) => Math.round(v / inkCount));
const hex = "#" + navy.map((v) => v.toString(16).padStart(2, "0")).join("");
console.log(`emblem bbox x ${x0}-${x1}, y ${y0}-${y1}; background ${minAlpha < 128 ? "transparent" : "opaque"}; navy ${hex}`);

// Square source window around the emblem (keep aspect, centre it).
const side = Math.max(x1 - x0, y1 - y0) + 1;
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;

/** Bilinear sample of the logo, alpha-composited over white. */
function sampleOverWhite(sx, sy) {
  const xi = Math.floor(sx), yi = Math.floor(sy);
  const fx = sx - xi, fy = sy - yi;
  const acc = [0, 0, 0];
  for (const [dx, dy, wgt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
    const px = Math.min(w - 1, Math.max(0, xi + dx)), py = Math.min(h - 1, Math.max(0, yi + dy));
    const i = (py * w + px) * 4;
    const a = data[i + 3] / 255;
    for (let c = 0; c < 3; c++) acc[c] += wgt * (data[i + c] * a + 255 * (1 - a));
  }
  return acc;
}

/** Emblem centred on a white square, occupying `fill` of the side. Supersampled 3×3. */
function icon(size, fill, rgba = false) {
  const rgb = Buffer.alloc(size * size * 3, 255);
  const emblemPx = size * fill;
  const scale = side / emblemPx; // source px per output px
  const offset = (size - emblemPx) / 2;
  const SS = 3;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0];
      for (let i = 0; i < SS; i++)
        for (let j = 0; j < SS; j++) {
          const sx = cx - side / 2 + (x + (i + 0.5) / SS - offset) * scale;
          const sy = cy - side / 2 + (y + (j + 0.5) / SS - offset) * scale;
          const inside = sx >= cx - side / 2 - 1 && sx <= cx + side / 2 + 1 && sy >= cy - side / 2 - 1 && sy <= cy + side / 2 + 1;
          const px = inside ? sampleOverWhite(sx, sy) : [255, 255, 255];
          for (let c = 0; c < 3; c++) acc[c] += px[c];
        }
      const o = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) rgb[o + c] = Math.round(acc[c] / (SS * SS));
    }
  return encodePng(size, rgb, rgba);
}

writeFileSync("public/icon-512.png", icon(512, 0.62)); // maskable-safe
writeFileSync("public/icon-192.png", icon(192, 0.78));
writeFileSync("public/apple-touch-icon.png", icon(180, 0.76));
writeFileSync("src/app/favicon.ico", encodeIco(icon(64, 0.9, true), 64));
console.log("wrote icon-512.png, icon-192.png, apple-touch-icon.png, favicon.ico");
