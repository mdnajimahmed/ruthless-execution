/**
 * Generates mobile/assets/notification-icon.png
 * White lightning bolt on transparent background, 192x192px.
 * Also generates notification-icon-preview.png (teal circle bg) for visual check.
 * Run: node generate-notification-icon.js
 */
const zlib = require('zlib');
const fs   = require('fs');

const W = 192, H = 192;

// ─── Lightning bolt polygon (8 vertices, clockwise) ────────────────────────
//
// Z-kink bolt: two parallel diagonal bands connected by a sharp step at y=96.
// ALL notch vertices share the same y so the step is crisp, not blended.
//
// Upper band (top→mid): B(74,8)→C(22,96)  [left]  A(154,8)→H(96,96)  [right]
// Notch step   (mid):   C(22,96)→D(82,96)          H(96,96)→G(154,96)
// Lower band (mid→bot): D(82,96)→E(20,184) [left]  G(154,96)→F(96,184)[right]
//
// Width: ~80px at top, ~74px through both arms, 58px notch shift → bold Z-kink.
const BOLT = [
  [154,   8],   // A  top-right
  [ 74,   8],   // B  top-left
  [ 22,  96],   // C  mid-left   (upper arm bottom)
  [ 82,  96],   // D  notch-left (lower arm top)
  [ 20, 184],   // E  bot-left
  [ 96, 184],   // F  bot-right
  [154,  96],   // G  notch-right (lower arm top)
  [ 96,  96],   // H  mid-right  (upper arm bottom)
];

// ─── Supersampled point-in-polygon (4×4 → smooth edges) ───────────────────
function inPolygon(px, py) {
  let inside = false;
  const n = BOLT.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = BOLT[i][0], yi = BOLT[i][1];
    const xj = BOLT[j][0], yj = BOLT[j][1];
    if ((yi > py) !== (yj > py) &&
        px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const SUB = 4;

function buildRGBA(boltFn) {
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 4);
    row[0] = 0;
    for (let x = 0; x < W; x++) {
      let hits = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          if (boltFn(x + (sx + 0.5) / SUB, y + (sy + 0.5) / SUB)) hits++;
        }
      }
      const alpha = Math.round((hits / (SUB * SUB)) * 255);
      const o = 1 + x * 4;
      // will be overwritten by caller for colored versions
      row[o] = row[o+1] = row[o+2] = row[o+3] = alpha;
      rows._alphas = rows._alphas || [];
      rows._alphas.push(alpha);  // unused, just for reference
    }
    rows.push(row);
  }
  return rows;
}

// ─── PNG encoding (pure Node built-ins) ────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) {
    c ^= byte;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, cr]);
}

function makePng(rows) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw  = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── 1. Notification icon: white bolt on transparent ──────────────────────
const iconRows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0;
  for (let x = 0; x < W; x++) {
    let hits = 0;
    for (let sy = 0; sy < SUB; sy++)
      for (let sx = 0; sx < SUB; sx++)
        if (inPolygon(x + (sx+0.5)/SUB, y + (sy+0.5)/SUB)) hits++;
    const a = Math.round(hits / (SUB*SUB) * 255);
    const o = 1 + x * 4;
    row[o] = row[o+1] = row[o+2] = 255;  // white
    row[o+3] = a;                          // alpha from coverage
  }
  iconRows.push(row);
}
fs.writeFileSync('./mobile/assets/notification-icon.png', makePng(iconRows));
console.log('✓ notification-icon.png  (white on transparent — production icon)');

// ─── 2. Preview: white bolt on teal circle (simulates how Android shows it) ─
const cx = W / 2, cy = H / 2, r = 88;
const [TR, TG, TB] = [0x0f, 0x76, 0x6e]; // #0f766e teal

const previewRows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0;
  for (let x = 0; x < W; x++) {
    const o = 1 + x * 4;
    const dx = x - cx, dy = y - cy;
    const inCircle = dx*dx + dy*dy <= r*r;

    // bolt coverage (supersampled)
    let hits = 0;
    for (let sy = 0; sy < SUB; sy++)
      for (let sx = 0; sx < SUB; sx++)
        if (inPolygon(x + (sx+0.5)/SUB, y + (sy+0.5)/SUB)) hits++;
    const boltAlpha = hits / (SUB*SUB);

    if (inCircle) {
      // blend teal + white bolt
      row[o]   = Math.round(TR + (255-TR) * boltAlpha);
      row[o+1] = Math.round(TG + (255-TG) * boltAlpha);
      row[o+2] = Math.round(TB + (255-TB) * boltAlpha);
      row[o+3] = 255;
    } else {
      row[o] = row[o+1] = row[o+2] = row[o+3] = 0; // transparent outside circle
    }
  }
  previewRows.push(row);
}
fs.writeFileSync('./mobile/assets/notification-icon-preview.png', makePng(previewRows));
console.log('✓ notification-icon-preview.png (teal circle — visual check)');
