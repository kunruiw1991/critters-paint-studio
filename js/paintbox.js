// Critter Paint Studio — the Paint Box catalog (~150 tools) and their 2D renderers.
import { MOTIFS, drawMotif, shade, lum } from './motifs.js';

const TAU = Math.PI * 2;
export const BLANK = '#f3efe8';

/* ------------------------------------------------------------------ colors (40 + signature) */
const FAMILIES = {
  red: ['#ffc9c9', '#ff8787', '#fa5252', '#e03131', '#a61e1e'],
  orange: ['#ffd8a8', '#ffa94d', '#fd7e14', '#e8590c', '#a8410a'],
  yellow: ['#fff3bf', '#ffe066', '#fcc419', '#f59f00', '#b47400'],
  green: ['#d3f9d8', '#8ce99a', '#40c057', '#2b8a3e', '#1b5e2a'],
  blue: ['#d0ebff', '#74c0fc', '#339af0', '#1c7ed6', '#1a4f99'],
  purple: ['#e5dbff', '#b197fc', '#845ef7', '#6741d9', '#3f2a8c'],
  pink: ['#ffdeeb', '#faa2c1', '#f06595', '#d6336c', '#9c1f52'],
  neutral: ['#ffffff', '#f1e4d0', '#adb5bd', '#6b5e55', '#2b2530'],
};
export const COLORS = Object.values(FAMILIES).flat();
export const SIGNATURE = [
  { id: 'sunnyfox', c: '#e89125' }, { id: 'lunabat', c: '#3a2278' }, { id: 'lavender', c: '#b898e8' },
  { id: 'poppydash', c: '#50505e' }, { id: 'catnap', c: '#8a5cc8' }, { id: 'dogday', c: '#f2a629' },
  { id: 'coral', c: '#f26d6d' }, { id: 'cream', c: '#f9efd8' },
];
export const BG_CHOICES = ['#ffffff', '#fff3bf', '#ffdeeb', '#e5dbff', '#d0ebff', '#d3f9d8', '#2b2530', 'auto'];

/* --------------------------------------------------------------- RYB-style color mixing */
function hexToHsv(hex) {
  const n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx];
}
function hsvToHex(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
// map RGB hue <-> RYB hue (piecewise) so blue + yellow = green like real paint
const RGB2RYB = [[0, 0], [30, 60], [60, 120], [120, 180], [240, 240], [300, 300], [360, 360]];
function mapHue(h, tbl, inv) {
  for (let i = 0; i < tbl.length - 1; i++) {
    const [a0, b0] = inv ? [tbl[i][1], tbl[i][0]] : tbl[i], [a1, b1] = inv ? [tbl[i + 1][1], tbl[i + 1][0]] : tbl[i + 1];
    if (h >= a0 && h <= a1) return b0 + ((h - a0) / (a1 - a0 || 1)) * (b1 - b0);
  }
  return h;
}
export function mixColors(c1, c2) {
  const [h1, s1, v1] = hexToHsv(c1), [h2, s2, v2] = hexToHsv(c2);
  const r1 = mapHue(h1, RGB2RYB), r2 = mapHue(h2, RGB2RYB);
  const w1 = s1 + 0.001, w2 = s2 + 0.001; // greys/whites don't pull the hue
  let d = r2 - r1; if (d > 180) d -= 360; if (d < -180) d += 360;
  const rh = (r1 + d * (w2 / (w1 + w2)) + 360) % 360;
  const s = (s1 + s2) / 2 * (Math.abs(d) > 150 ? 0.55 : 1), v = (v1 + v2) / 2;
  return hsvToHex(mapHue(rh, RGB2RYB, true), Math.min(1, s), Math.min(1, v));
}

/* ------------------------------------------------------------------ special paints (22) */
// mat: overrides for MeshPhysicalMaterial; draw: how the albedo canvas is painted.
export const SPECIALS = [
  { id: 'gold', tint: '#e6b422', fixed: true, mat: { metalness: 0.95, roughness: 0.22, bumpScale: 0.004 } },
  { id: 'silver', tint: '#d9dde3', fixed: true, mat: { metalness: 0.95, roughness: 0.2, bumpScale: 0.004 } },
  { id: 'rosegold', tint: '#e8a598', fixed: true, mat: { metalness: 0.9, roughness: 0.25, bumpScale: 0.004 } },
  { id: 'chrome', tint: '#eef1f5', fixed: true, mat: { metalness: 1, roughness: 0.04, bumpScale: 0 } },
  { id: 'pearl', tint: '#fbf3f5', fixed: true, draw: 'pearl', mat: { metalness: 0.15, roughness: 0.28, iridescence: 0.8, iridescenceIOR: 1.6, clearcoat: 0.6 } },
  { id: 'glitter', draw: 'glitter', glitter: 1, mat: { metalness: 0.55, roughness: 0.35 } },
  { id: 'chunky', draw: 'chunky', glitter: 1, mat: { metalness: 0.6, roughness: 0.3 } },
  { id: 'holo', fixed: true, draw: 'holo', mat: { metalness: 0.55, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.9, bumpScale: 0.004 } },
  { id: 'opal', fixed: true, draw: 'opal', mat: { metalness: 0.1, roughness: 0.25, iridescence: 0.9, clearcoat: 1 } },
  { id: 'velvet', mat: { roughness: 1, sheen: 1, sheenRoughness: 0.3, bumpScale: 0.01 } },
  { id: 'fur', mat: { roughness: 1, bumpScale: 0.07, sheen: 0.6 } },
  { id: 'satin', mat: { roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3, bumpScale: 0.004, sheen: 0.4 } },
  { id: 'felt', mat: { roughness: 1, bumpScale: 0.03 } },
  { id: 'glow', draw: 'glow', glow: 1, mat: { roughness: 0.6 } },
  { id: 'colorshift', mat: { metalness: 0.4, roughness: 0.2, iridescence: 1, iridescenceIOR: 2.2, iridescenceThicknessRange: [200, 900], bumpScale: 0.004 } },
  { id: 'jelly', mat: { roughness: 0.12, transmission: 0.55, thickness: 0.6, clearcoat: 1, bumpScale: 0 } },
  { id: 'ice', tint: '#d0ebff', fixed: true, draw: 'ice', mat: { roughness: 0.45, transmission: 0.45, thickness: 0.5, clearcoat: 0.6, bumpScale: 0.004 } },
  { id: 'rainbow', fixed: true, draw: 'grad', stops: ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'] },
  { id: 'sunset', fixed: true, draw: 'grad', stops: ['#5f3dc4', '#e64980', '#ff922b', '#ffd43b'] },
  { id: 'ocean', fixed: true, draw: 'grad', stops: ['#e3fafc', '#66d9e8', '#1c7ed6', '#1a3a7a'] },
  { id: 'galaxy', fixed: true, draw: 'galaxy', mat: { roughness: 0.5 } },
  { id: 'cotton', fixed: true, draw: 'grad', stops: ['#ffdeeb', '#e5dbff', '#d0ebff'] },
];

/* ------------------------------------------------------------------ patterns (34) */
export const PATTERNS = [
  'dots', 'stripes', 'zigzag', 'checkers', 'plaid', 'gingham', 'argyle', 'waves', 'scales',
  'leopard', 'tiger', 'zebra', 'giraffe', 'dalmatian',
  'heart', 'star', 'moon', 'rainbow', 'cloud', 'flower', 'strawberry', 'cherry', 'lollipop', 'balloon',
  'note', 'pixel', 'popcorn', 'lantern', 'moonstar', 'paw', 'butterfly', 'snowflake', 'sparkle', 'donut',
].map((id) => ({ id }));

/* ------------------------------------------------------------------ brushes (17) */
export const BRUSHES = [
  { id: 'soft' }, { id: 'marker' }, { id: 'crayon' }, { id: 'chalk' }, { id: 'watercolor' }, { id: 'spray' },
  { id: 'rainbowtrail' }, { id: 'glitterglue' }, { id: 'neon' }, { id: 'stitch' }, { id: 'confetti' },
  { id: 'st_heart', motif: 'heart' }, { id: 'st_star', motif: 'star' }, { id: 'st_paw', motif: 'paw' },
  { id: 'st_bubble', motif: 'bubble' }, { id: 'st_flower', motif: 'flower' }, { id: 'eraser' },
];

/* ------------------------------------------------------------------ magic effects 特效 (18) */
// scope: 'part' effects attach to the tapped part; 'body' effects float around the whole critter.
export const EFFECTS = [
  { id: 'twinkle', motif: 'sparkle', color: '#fff3bf', scope: 'part' },
  { id: 'bubbles', motif: 'bubble', color: '#74c0fc', scope: 'part' },
  { id: 'rainbowflow', motif: 'rainbow', scope: 'part', material: true },
  { id: 'warmglow', motif: 'firefly', color: '#ffb347', scope: 'part', material: true },
  { id: 'moondust', motif: 'glowdot', color: '#d0bfff', scope: 'body' },
  { id: 'snow', motif: 'snowflake', color: '#ffffff', scope: 'body' },
  { id: 'petals', motif: 'petal', color: '#ffc2d6', scope: 'body' },
  { id: 'butterflies', motif: 'butterfly', color: '#b197fc', scope: 'body' },
  { id: 'hearts', motif: 'heart', color: '#ff8fab', scope: 'part' },
  { id: 'popcorn', motif: 'popcorn', scope: 'part' },
  { id: 'aurora', motif: 'glowdot', color: '#63e6be', scope: 'part', material: true },
  { id: 'ripple', motif: 'drop', color: '#74c0fc', scope: 'part', material: true },
  { id: 'galaxyswirl', motif: 'sparkle', color: '#9775fa', scope: 'part', material: true },
  { id: 'confetti', motif: 'confetto', color: '#ffd43b', scope: 'part' },
  { id: 'halo', motif: 'crown', color: '#ffe066', scope: 'body' },
  { id: 'fireflies', motif: 'firefly', color: '#ffe066', scope: 'body' },
  { id: 'notes', motif: 'note', color: '#845ef7', scope: 'body' },
  { id: 'aura', motif: 'glowdot', color: '#ffc9e3', scope: 'body' },
];

/* ------------------------------------------------------------------ stickers (36) + wearables (12) */
export const STICKERS = [
  ['blush', '#ff8fab'], ['freckles', '#b0703a'], ['heart', '#ff6b9a'], ['star', '#ffd43b'], ['sparkle', '#ffe066'], ['rainbow'],
  ['moon', '#ffe066'], ['moonstar', '#ffe066'], ['flower', '#ff8fab'], ['cloud', '#ffffff'], ['sun', '#ffc933'], ['bolt', '#ffd43b'],
  ['smiley', '#ffd43b'], ['paw', '#845ef7'], ['letterC', '#7048e8'], ['city', '#7048e8'], ['bridge', '#e8590c'], ['lantern'],
  ['popcorn'], ['cherry'], ['strawberry'], ['butterfly', '#b197fc'], ['crown', '#ffd43b'], ['note', '#845ef7'],
  ['clover'], ['icecream'], ['donut'], ['cupcake'], ['balloon', '#ff6b6b'], ['bee'],
  ['ladybug'], ['lollipop', '#f06595'], ['diamond', '#74c0fc'], ['leaf'], ['drop'], ['snowflake', '#74c0fc'],
].map(([motif, color]) => ({ id: motif, motif, color }));
export const WEARABLES = ['bow', 'flowercrown', 'sunglasses', 'headphones', 'scarf', 'cape', 'fairywings', 'tiara', 'backpack', 'goggles', 'partyhat', 'necklace'].map((id) => ({ id }));

/* ================================================================== renderers */
function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

/** Paint a fill spec into a surface canvas. surf: {ctx, w, h, lenU, lenV} */
export function renderFill(surf, spec) {
  const { ctx, w, h } = surf;
  ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (spec.type === 'color') { ctx.fillStyle = spec.color; ctx.fillRect(0, 0, w, h); }
  else if (spec.type === 'special') renderSpecial(surf, SPECIALS.find((s) => s.id === spec.id), spec.color);
  else if (spec.type === 'pattern') renderPattern(surf, spec.id, spec.c1, spec.c2, spec.size ?? 1);
  ctx.restore();
}

function renderSpecial(surf, sp, color) {
  const { ctx, w, h } = surf, base = sp.fixed ? (sp.tint || color) : color;
  const r = rng(w * 7 + h);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  switch (sp.draw) {
    case 'glitter': case 'chunky': {
      const big = sp.draw === 'chunky', n = (w * h) / (big ? 90 : 24);
      for (let i = 0; i < n; i++) {
        const k = r(); ctx.fillStyle = k < 0.45 ? shade(base, 0.65) : k < 0.8 ? shade(base, -0.3) : '#ffffff';
        const s = big ? 2 + r() * 3 : 1 + r() * 1.2;
        if (big) { ctx.save(); ctx.translate(r() * w, r() * h); ctx.rotate(r() * TAU); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
        else ctx.fillRect(r() * w, r() * h, s, s);
      }
      break;
    }
    case 'pearl': { const g = ctx.createLinearGradient(0, 0, w, h); ['#fff5f8', '#f3f0ff', '#e7f5ff', '#fff9db', '#fff5f8'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case 'holo': {
      const cols = ['#ffc9de', '#d0bfff', '#a5d8ff', '#b2f2bb', '#fff3bf', '#ffc9de'];
      for (let i = -h; i < w + h; i += 6) { ctx.strokeStyle = cols[Math.abs(Math.floor(i / 6)) % cols.length]; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }
      break;
    }
    case 'opal': {
      ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 28; i++) { const g = ctx.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, w * (0.08 + r() * 0.18)); const c = ['#ffdeeb', '#c5f6fa', '#e5dbff', '#d3f9d8', '#fff3bf'][i % 5]; g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
      break;
    }
    case 'glow': ctx.fillStyle = shade(base, 0.35); ctx.fillRect(0, 0, w, h); break;
    case 'ice': { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) { ctx.save(); ctx.translate(r() * w, r() * h); ctx.rotate(r() * TAU); ctx.fillRect(0, 0, 1 + r() * 2, 6 + r() * 14); ctx.restore(); } break; }
    case 'grad': { const g = ctx.createLinearGradient(0, 0, 0, h); sp.stops.forEach((c, i) => g.addColorStop(i / (sp.stops.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case 'galaxy': {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1446'); g.addColorStop(0.5, '#3b1f73'); g.addColorStop(1, '#101a4a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) { const n = ctx.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, w * 0.18); n.addColorStop(0, ['rgba(230,73,128,.35)', 'rgba(77,171,247,.3)', 'rgba(151,117,250,.35)'][i % 3]); n.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = n; ctx.fillRect(0, 0, w, h); }
      for (let i = 0; i < (w * h) / 200; i++) { ctx.fillStyle = r() < 0.8 ? '#ffffff' : '#ffe066'; const s = r() < 0.9 ? 1 : 2; ctx.fillRect(r() * w, r() * h, s, s); }
      break;
    }
  }
}

/** emissive "sparkle map" for glitter paints so they twinkle softly */
export function renderGlitterEmissive(surf, seed = 1) {
  const { w, h } = surf, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'), r = rng(seed + w);
  c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 160; i++) { c.fillStyle = '#ffffff'; c.fillRect(r() * w, r() * h, 1.5, 1.5); }
  return cv;
}

function cellCounts(surf, size) {
  const tile = [0.075, 0.13, 0.22][size] || 0.13;
  return [Math.max(1, Math.round(surf.lenU / tile)), Math.max(1, Math.round(surf.lenV / tile))];
}

function renderPattern(surf, id, c1, c2, size) {
  const { ctx, w, h } = surf;
  if (c2 === 'auto') c2 = lum(c1) > 0.6 ? shade(c1, -0.45) : shade(c1, 0.75);
  const [nU, nV] = cellCounts(surf, size), cw = w / nU, ch = h / nV;
  const r = rng(nU * 31 + nV * 17 + id.length);
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  const each = (fn) => { for (let j = 0; j < nV; j++) for (let i = 0; i < nU; i++) fn(i, j, i * cw, j * ch); };
  const ellipse = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
  // Wrap-safe draw across the u seam: draw at x and x ± w.
  const wrap = (x, fn) => { fn(x); if (x < cw) fn(x + w); if (x > w - cw) fn(x - w); };
  switch (id) {
    case 'dots': each((i, j, x, y) => { const off = (j % 2) * cw / 2; wrap(x + cw / 2 + off, (xx) => { ellipse(xx, y + ch / 2, cw * 0.26, ch * 0.26); ctx.fillStyle = c1; ctx.fill(); }); }); break;
    case 'stripes': for (let j = 0; j < nV * 2; j += 2) { ctx.fillStyle = c1; ctx.fillRect(0, (j * ch) / 2, w, ch / 2); } break;
    case 'zigzag': ctx.strokeStyle = c1; ctx.lineWidth = ch * 0.22; ctx.lineJoin = 'round'; for (let j = 0; j < nV; j++) { ctx.beginPath(); for (let i = 0; i <= nU * 2; i++) ctx.lineTo((i * cw) / 2, j * ch + (i % 2 ? ch * 0.25 : ch * 0.75)); ctx.stroke(); } break;
    case 'checkers': ctx.fillStyle = c1; each((i, j, x, y) => { if ((i + j) % 2 === 0) ctx.fillRect(x, y, cw + 0.5, ch + 0.5); }); break;
    case 'plaid': case 'gingham': {
      ctx.globalAlpha = id === 'plaid' ? 0.55 : 0.45; ctx.fillStyle = c1;
      for (let i = 0; i < nU; i++) ctx.fillRect(i * cw, 0, cw * (id === 'plaid' ? 0.4 : 0.5), h);
      for (let j = 0; j < nV; j++) ctx.fillRect(0, j * ch, w, ch * (id === 'plaid' ? 0.4 : 0.5));
      ctx.globalAlpha = 1;
      if (id === 'plaid') { ctx.strokeStyle = shade(c1, -0.35); ctx.lineWidth = Math.max(1, cw * 0.05); for (let i = 0; i < nU; i++) { ctx.beginPath(); ctx.moveTo(i * cw + cw * 0.7, 0); ctx.lineTo(i * cw + cw * 0.7, h); ctx.stroke(); } for (let j = 0; j < nV; j++) { ctx.beginPath(); ctx.moveTo(0, j * ch + ch * 0.7); ctx.lineTo(w, j * ch + ch * 0.7); ctx.stroke(); } }
      break;
    }
    case 'argyle': each((i, j, x, y) => {
      ctx.beginPath(); ctx.moveTo(x + cw / 2, y); ctx.lineTo(x + cw, y + ch / 2); ctx.lineTo(x + cw / 2, y + ch); ctx.lineTo(x, y + ch / 2); ctx.closePath();
      ctx.fillStyle = (i + j) % 2 ? c1 : shade(c1, 0.35); ctx.fill();
      ctx.setLineDash([Math.max(2, cw * 0.08), Math.max(2, cw * 0.08)]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cw * 0.03); ctx.stroke(); ctx.setLineDash([]);
    }); break;
    case 'waves': ctx.strokeStyle = c1; ctx.lineWidth = ch * 0.2; ctx.lineCap = 'round'; for (let j = 0; j < nV; j++) { ctx.beginPath(); for (let x = 0; x <= w; x += 2) ctx.lineTo(x, j * ch + ch / 2 + Math.sin((x / cw) * TAU) * ch * 0.22); ctx.stroke(); } break;
    case 'scales': for (let j = nV; j >= -1; j--) for (let i = -1; i <= nU; i++) { const x = i * cw + (j % 2) * cw / 2; ctx.beginPath(); ctx.arc(x + cw / 2, j * ch, cw * 0.55, 0, Math.PI); ctx.fillStyle = (i + j) % 2 ? c1 : shade(c1, 0.2); ctx.fill(); ctx.strokeStyle = shade(c1, -0.3); ctx.lineWidth = Math.max(1, cw * 0.04); ctx.stroke(); } break;
    case 'leopard': each((i, j, x, y) => { const px = x + cw * (0.2 + r() * 0.6), py = y + ch * (0.2 + r() * 0.6); wrap(px, (xx) => { ellipse(xx, py, cw * 0.28, ch * 0.24, r() * 3); ctx.fillStyle = shade(c2, -0.18); ctx.fill(); ctx.lineWidth = Math.max(1.5, cw * 0.09); ctx.strokeStyle = c1; ctx.setLineDash([cw * 0.25, cw * 0.1]); ctx.stroke(); ctx.setLineDash([]); }); }); break;
    case 'tiger': case 'zebra': {
      ctx.fillStyle = c1; const n = id === 'tiger' ? nU : nU * 1.5;
      for (let i = 0; i < n; i++) {
        const x0 = (i / n) * w, amp = (w / n) * 0.35, thick = (w / n) * (id === 'tiger' ? 0.28 : 0.42);
        ctx.beginPath(); ctx.moveTo(x0, 0);
        for (let y = 0; y <= h; y += 4) ctx.lineTo(x0 + Math.sin((y / h) * TAU * 1.5 + i) * amp, y);
        for (let y = h; y >= 0; y -= 4) ctx.lineTo(x0 + Math.sin((y / h) * TAU * 1.5 + i) * amp + thick * (0.5 + 0.5 * Math.sin((y / h) * Math.PI)), y);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'giraffe': ctx.fillStyle = c1; each((i, j, x, y) => { const g = Math.min(cw, ch) * 0.1; ctx.beginPath(); const pts = 7; for (let k = 0; k < pts; k++) { const a = (k / pts) * TAU, rr = 0.5 - 0.08 * r(); ctx.lineTo(x + cw / 2 + Math.cos(a) * (cw * rr - g), y + ch / 2 + Math.sin(a) * (ch * rr - g)); } ctx.closePath(); ctx.fill(); }); break;
    case 'dalmatian': ctx.fillStyle = c1; each((i, j, x, y) => { if (r() < 0.7) { const px = x + r() * cw; wrap(px, (xx) => { ellipse(xx, y + r() * ch, cw * (0.1 + r() * 0.22), ch * (0.1 + r() * 0.18), r() * 3); ctx.fill(); }); } }); break;
    default: { // motif prints (half-drop layout, colored by c1)
      const m = id === 'star' ? 'star' : id;
      each((i, j, x, y) => {
        const off = (j % 2) * cw / 2, rot = (r() - 0.5) * 0.5;
        wrap(x + cw / 2 + off, (xx) => drawMotif(ctx, m, xx, y + ch / 2, cw * 0.36, ch * 0.36, c1, c2 === '#ffffff' ? '#ffd84d' : '#ffffff', rot));
      });
    }
  }
}

/* ------------------------------------------------------------------ brush stamping */
/** Draw one brush dab. (x,y) px centre; rx/ry px radius; st: per-stroke state. */
export function brushDab(ctx, brush, x, y, rx, ry, color, st, emisCtx) {
  const r = st.rand;
  ctx.save();
  switch (brush.id) {
    case 'soft': { const g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, color); g.addColorStop(0.6, color); g.addColorStop(1, hexA(color, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); break; }
    case 'marker': ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.fill(); break;
    case 'crayon': ctx.fillStyle = color; for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()); ctx.globalAlpha = 0.5 + r() * 0.5; ctx.fillRect(x + Math.cos(a) * d * rx * 0.8, y + Math.sin(a) * d * ry * 0.8, 1.6, 1.6); } break;
    case 'chalk': ctx.fillStyle = shade(color, 0.35); for (let i = 0; i < 18; i++) { const a = r() * TAU, d = r(); ctx.globalAlpha = 0.35 + r() * 0.4; ctx.fillRect(x + Math.cos(a) * d * rx, y + Math.sin(a) * d * ry, 2, 1.2); } break;
    case 'watercolor': { ctx.globalAlpha = 0.09; const g = ctx.createRadialGradient(x, y, 0, x, y, rx * 1.4); g.addColorStop(0, color); g.addColorStop(0.8, color); g.addColorStop(1, hexA(color, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.4, ry * 1.4, 0, 0, TAU); ctx.fill(); break; }
    case 'spray': ctx.fillStyle = color; for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r(); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * rx * 1.3, y + Math.sin(a) * d * ry * 1.3, 0.9, 0, TAU); ctx.fill(); } break;
    case 'rainbowtrail': { const c = `hsl(${(st.dist * 0.6) % 360},85%,65%)`; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.fill(); break; }
    case 'glitterglue': ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.7, ry * 0.7, 0, 0, TAU); ctx.fill(); for (let i = 0; i < 5; i++) { ctx.fillStyle = r() < 0.5 ? '#ffffff' : shade(color, 0.6); ctx.fillRect(x + (r() - 0.5) * rx, y + (r() - 0.5) * ry, 1.6, 1.6); } break;
    case 'neon': {
      ctx.fillStyle = hexA(color, 0.25); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(color, 0.55); ctx.beginPath(); ctx.ellipse(x, y, rx * 0.38, ry * 0.38, 0, 0, TAU); ctx.fill();
      if (emisCtx) { emisCtx.fillStyle = color; emisCtx.beginPath(); emisCtx.ellipse(x, y, rx * 0.6, ry * 0.6, 0, 0, TAU); emisCtx.fill(); }
      break;
    }
    case 'stitch': if (Math.floor(st.dist / (rx * 1.2)) % 2 === 0) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.35, ry * 0.35, 0, 0, TAU); ctx.fill(); } break;
    case 'confetti': for (let i = 0; i < 2; i++) { ctx.fillStyle = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#faa2c1'][Math.floor(r() * 6)]; ctx.save(); ctx.translate(x + (r() - 0.5) * rx * 1.5, y + (r() - 0.5) * ry * 1.5); ctx.rotate(r() * TAU); ctx.fillRect(-rx * 0.25, -ry * 0.1, rx * 0.5, ry * 0.2); ctx.restore(); } break;
    case 'eraser': ctx.fillStyle = st.blank || BLANK; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); break;
    default: if (brush.motif) drawMotif(ctx, brush.motif, x, y, rx, ry, color, '#ffd84d', (r() - 0.5) * 0.6);
  }
  ctx.restore();
}
/** spacing between dabs, as a fraction of brush radius */
export function brushSpacing(brush) {
  if (brush.motif) return 2.4;
  return { spray: 0.6, crayon: 0.35, chalk: 0.45, watercolor: 0.35, confetti: 1.2, stitch: 0.3 }[brush.id] ?? 0.25;
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

/* ------------------------------------------------------------------ sticker decal */
export function stickerDecal(ctx, st, x, y, rx, ry, rot) {
  const plain = st.motif === 'blush' || st.motif === 'freckles';
  if (!plain) { // white die-cut border like a real sticker
    ctx.save(); ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = Math.max(2, rx * 0.18);
    for (let k = 0; k < 3; k++) drawMotif(ctx, st.motif, x, y, rx, ry, st.color, undefined, rot);
    ctx.restore();
  }
  drawMotif(ctx, st.motif, x, y, rx, ry, st.color, undefined, rot);
}

export { MOTIFS };
