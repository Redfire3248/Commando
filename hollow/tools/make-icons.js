// Generates the app icons (assets/icons/*.png) with no dependencies.
//   node tools/make-icons.js
// Replace the output with real art any time — keep the same file names and sizes.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel((x + 0.5) / size, (y + 0.5) / size);
      const i = row + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
const inEllipse = (u, v, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2;

// The hooded gunner's face: dark hood, void face, two glowing eyes. `s` shrinks the art for maskable icons.
function icon(s) {
  return (u, v) => {
    const x = (u - 0.5) / s + 0.5, y = (v - 0.5) / s + 0.5;
    let col = mix([20, 29, 51], [7, 8, 13], Math.hypot(x - 0.5, y - 0.45) * 1.6);         // background
    const hoodW = 0.10 + 0.27 * Math.pow(Math.max(0, (y - 0.14) / 0.72), 0.55);            // hood widens downward
    if (y > 0.14 && y < 0.9 && Math.abs(x - 0.5) < hoodW) col = mix([58, 69, 102], [22, 28, 46], (y - 0.14) / 0.6);
    if (y > 0.74 && y < 0.84 && Math.abs(x - 0.5) < hoodW) col = [196, 50, 59];            // scarf
    if (inEllipse(x, y, 0.5, 0.5, 0.2, 0.2) < 1) col = [4, 5, 10];                          // face
    for (const ex of [0.425, 0.575]) {                                                      // eyes
      const d = inEllipse(x, y, ex, 0.5, 0.042, 0.068);
      if (d < 1) col = [191, 251, 255];
      else if (d < 5) col = mix(col, [111, 243, 255], (1 - (d - 1) / 4) * 0.55);
    }
    return col;
  };
}

const out = path.resolve(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), png(192, icon(1)));
fs.writeFileSync(path.join(out, 'icon-512.png'), png(512, icon(1)));
fs.writeFileSync(path.join(out, 'icon-512-maskable.png'), png(512, icon(0.72)));
console.log('Icons written to', out);
