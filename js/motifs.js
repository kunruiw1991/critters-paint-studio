// Critter Paint Studio — shared vector motif library.
// Every motif draws inside the unit box [-1, 1] x [-1, 1] centred on the origin, so the same
// drawing powers patterns, stamp brushes, stickers, effect sprites and drawer tiles.
// Style rule: flat, rounded, soft outline — one uniform look across the whole Paint Box.

const TAU = Math.PI * 2;

export function shade(hex, k) {
  // k < 0 darkens, k > 0 lightens (−1..1)
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
export function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function heartPath(ctx, s = 1) {
  ctx.beginPath();
  ctx.moveTo(0, 0.85 * s);
  ctx.bezierCurveTo(-1.05 * s, 0.1 * s, -0.95 * s, -0.85 * s, -0.48 * s, -0.85 * s);
  ctx.bezierCurveTo(-0.2 * s, -0.85 * s, 0, -0.62 * s, 0, -0.42 * s);
  ctx.bezierCurveTo(0, -0.62 * s, 0.2 * s, -0.85 * s, 0.48 * s, -0.85 * s);
  ctx.bezierCurveTo(0.95 * s, -0.85 * s, 1.05 * s, 0.1 * s, 0, 0.85 * s);
  ctx.closePath();
}
function starPath(ctx, pts = 5, ro = 1, ri = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 ? ri : ro, a = rot + (i * Math.PI) / pts;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function fillStroke(ctx, fill, stroke, lw = 0.08) {
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}

export const MOTIFS = {
  heart: (c, a) => { heartPath(c, 0.95); fillStroke(c, a, shade(a, -0.35)); c.fillStyle = 'rgba(255,255,255,.55)'; circle(c, -0.45, -0.4, 0.14); c.fill(); },
  star: (c, a) => { starPath(c, 5, 1, 0.46); fillStroke(c, a, shade(a, -0.35)); },
  sparkle: (c, a) => { starPath(c, 4, 1, 0.22, 0); fillStroke(c, a); },
  moon: (c, a) => {
    c.beginPath(); c.arc(0, 0, 0.9, 0.5, TAU - 0.5); c.arc(0.42, -0.1, 0.72, TAU - 0.9, 0.9, true); c.closePath();
    fillStroke(c, a, shade(a, -0.3));
  },
  flower: (c, a, b = '#ffd84d') => {
    for (let i = 0; i < 5; i++) { const ang = (i * TAU) / 5 - Math.PI / 2; circle(c, Math.cos(ang) * 0.5, Math.sin(ang) * 0.5, 0.42); fillStroke(c, a, shade(a, -0.3), 0.06); }
    circle(c, 0, 0, 0.32); fillStroke(c, b, shade(b, -0.3), 0.06);
  },
  cloud: (c, a) => {
    c.beginPath(); c.arc(-0.45, 0.15, 0.4, Math.PI * 0.5, Math.PI * 1.5); c.arc(-0.05, -0.25, 0.5, Math.PI, 0); c.arc(0.5, 0.05, 0.4, Math.PI * 1.4, Math.PI * 0.5); c.closePath();
    fillStroke(c, a, shade(a, -0.2));
  },
  rainbow: (c) => {
    ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'].forEach((col, i) => {
      c.beginPath(); c.arc(0, 0.55, 0.95 - i * 0.12, Math.PI, 0); c.lineWidth = 0.13; c.strokeStyle = col; c.stroke();
    });
    withT(c, -0.72, 0.6, 0.32); MOTIFS.cloud(c, '#ffffff'); c.restore();
    withT(c, 0.72, 0.6, 0.32); MOTIFS.cloud(c, '#ffffff'); c.restore();
  },
  strawberry: (c, a = '#ff4d6d') => {
    c.beginPath(); c.moveTo(0, 0.95); c.bezierCurveTo(-0.95, 0.2, -0.85, -0.6, 0, -0.55); c.bezierCurveTo(0.85, -0.6, 0.95, 0.2, 0, 0.95); c.closePath();
    fillStroke(c, a, shade(a, -0.35));
    c.fillStyle = '#fff3b0'; [[-0.3, -0.15], [0.3, -0.15], [0, 0.1], [-0.25, 0.35], [0.25, 0.35], [0, 0.6]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 0.05, 0.08, 0, 0, TAU); c.fill(); });
    starPath(c, 5, 0.42, 0.18, -Math.PI / 2); c.save(); c.translate(0, -0.6); c.scale(1, 0.55); fillStroke(c, '#51cf66'); c.restore();
  },
  cherry: (c, a = '#e03131') => {
    c.strokeStyle = '#5c940d'; c.lineWidth = 0.09; c.beginPath(); c.moveTo(-0.4, 0.2); c.quadraticCurveTo(-0.1, -0.5, 0.2, -0.85); c.moveTo(0.42, 0.28); c.quadraticCurveTo(0.35, -0.4, 0.2, -0.85); c.stroke();
    circle(c, -0.42, 0.45, 0.38); fillStroke(c, a, shade(a, -0.35)); circle(c, 0.45, 0.52, 0.38); fillStroke(c, a, shade(a, -0.35));
    c.fillStyle = 'rgba(255,255,255,.6)'; circle(c, -0.55, 0.33, 0.09); c.fill(); circle(c, 0.32, 0.4, 0.09); c.fill();
  },
  lollipop: (c, a) => {
    c.fillStyle = '#f1e4d0'; c.fillRect(-0.06, 0.2, 0.12, 0.8);
    circle(c, 0, -0.2, 0.62); fillStroke(c, '#ffffff', shade(a, -0.3));
    c.strokeStyle = a; c.lineWidth = 0.16; c.beginPath();
    for (let t = 0; t < 14; t += 0.1) { const r = t * 0.04; c.lineTo(Math.cos(t) * r, -0.2 + Math.sin(t) * r); } c.stroke();
  },
  balloon: (c, a) => {
    c.strokeStyle = '#8a8a8a'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(0, 0.55); c.quadraticCurveTo(0.2, 0.8, 0, 1); c.stroke();
    c.beginPath(); c.ellipse(0, -0.15, 0.6, 0.72, 0, 0, TAU); fillStroke(c, a, shade(a, -0.3));
    c.beginPath(); c.moveTo(-0.1, 0.62); c.lineTo(0.1, 0.62); c.lineTo(0, 0.52); c.closePath(); c.fillStyle = shade(a, -0.2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-0.25, -0.45, 0.1, 0.18, -0.5, 0, TAU); c.fill();
  },
  note: (c, a) => {
    c.fillStyle = a; c.beginPath(); c.ellipse(-0.3, 0.55, 0.32, 0.24, -0.4, 0, TAU); c.fill();
    c.fillRect(-0.04, -0.85, 0.13, 1.4);
    c.beginPath(); c.moveTo(0.09, -0.85); c.quadraticCurveTo(0.7, -0.6, 0.55, -0.1); c.quadraticCurveTo(0.5, -0.45, 0.09, -0.5); c.fill();
  },
  paw: (c, a) => {
    c.beginPath(); c.ellipse(0, 0.3, 0.48, 0.4, 0, 0, TAU); c.fillStyle = a; c.fill();
    [[-0.62, -0.18], [-0.24, -0.58], [0.24, -0.58], [0.62, -0.18]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 0.2, 0.26, 0, 0, TAU); c.fill(); });
  },
  bubble: (c, a) => {
    circle(c, 0, 0, 0.9); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.lineWidth = 0.09; c.strokeStyle = a; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-0.38, -0.38, 0.16, 0.26, -0.8, 0, TAU); c.fill();
  },
  snowflake: (c, a) => {
    c.strokeStyle = a; c.lineWidth = 0.12; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate((i * TAU) / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -0.9);
      c.moveTo(0, -0.5); c.lineTo(-0.22, -0.72); c.moveTo(0, -0.5); c.lineTo(0.22, -0.72); c.stroke(); c.restore();
    }
  },
  petal: (c, a) => {
    c.beginPath(); c.moveTo(0, -0.9); c.bezierCurveTo(0.75, -0.5, 0.6, 0.6, 0, 0.9); c.bezierCurveTo(-0.6, 0.6, -0.75, -0.5, 0, -0.9); c.closePath();
    fillStroke(c, a, shade(a, -0.15), 0.05);
    c.strokeStyle = shade(a, -0.12); c.lineWidth = 0.05; c.beginPath(); c.moveTo(0, -0.6); c.lineTo(0, 0.6); c.stroke();
  },
  butterfly: (c, a, b = '#ffffff') => {
    [-1, 1].forEach((s) => {
      c.beginPath(); c.ellipse(s * 0.45, -0.3, 0.45, 0.5, s * 0.5, 0, TAU); fillStroke(c, a, shade(a, -0.35), 0.06);
      c.beginPath(); c.ellipse(s * 0.35, 0.42, 0.3, 0.36, -s * 0.4, 0, TAU); fillStroke(c, shade(a, 0.25), shade(a, -0.35), 0.06);
      circle(c, s * 0.45, -0.3, 0.14); c.fillStyle = b; c.fill();
    });
    c.fillStyle = '#4a3b5c'; c.beginPath(); c.ellipse(0, 0, 0.1, 0.55, 0, 0, TAU); c.fill();
  },
  popcorn: (c) => {
    c.fillStyle = '#fff6e0'; [[-0.35, -0.55], [0.05, -0.75], [0.4, -0.5], [-0.1, -0.35], [0.25, -0.25]].forEach(([x, y]) => { circle(c, x, y, 0.3); c.fill(); });
    c.beginPath(); c.moveTo(-0.62, -0.25); c.lineTo(0.62, -0.25); c.lineTo(0.45, 0.95); c.lineTo(-0.45, 0.95); c.closePath(); fillStroke(c, '#ffffff', '#c92a2a', 0.06);
    c.fillStyle = '#e03131'; [-0.33, 0, 0.33].forEach((x) => { c.beginPath(); c.moveTo(x - 0.1, -0.25); c.lineTo(x + 0.1, -0.25); c.lineTo(x * 0.75 + 0.07, 0.95); c.lineTo(x * 0.75 - 0.07, 0.95); c.closePath(); c.fill(); });
  },
  lantern: (c, a = '#ffd43b') => {
    c.fillStyle = '#b07a25'; c.fillRect(-0.3, -0.85, 0.6, 0.14); c.fillRect(-0.35, 0.72, 0.7, 0.14);
    c.beginPath(); c.ellipse(0, -0.02, 0.45, 0.72, 0, 0, TAU); fillStroke(c, a, '#b07a25', 0.08);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(0, 0.05, 0.14, 0.3, 0, 0, TAU); c.fill();
    c.strokeStyle = '#b07a25'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, -0.92, 0.18, Math.PI, 0); c.stroke();
  },
  crown: (c, a = '#ffd43b') => {
    c.beginPath(); c.moveTo(-0.85, 0.6); c.lineTo(-0.85, -0.35); c.lineTo(-0.42, 0.05); c.lineTo(0, -0.6); c.lineTo(0.42, 0.05); c.lineTo(0.85, -0.35); c.lineTo(0.85, 0.6); c.closePath();
    fillStroke(c, a, shade(a, -0.35));
    [[-0.85, -0.42], [0, -0.68], [0.85, -0.42]].forEach(([x, y]) => { circle(c, x, y, 0.12); c.fillStyle = '#ff6b9a'; c.fill(); });
  },
  smiley: (c, a = '#ffd43b') => {
    circle(c, 0, 0, 0.9); fillStroke(c, a, shade(a, -0.35));
    c.fillStyle = '#3b2f3f'; circle(c, -0.3, -0.2, 0.1); c.fill(); circle(c, 0.3, -0.2, 0.1); c.fill();
    c.strokeStyle = '#3b2f3f'; c.lineWidth = 0.1; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0.05, 0.45, 0.4, Math.PI - 0.4); c.stroke();
  },
  bolt: (c, a = '#ffd43b') => { c.beginPath(); c.moveTo(0.2, -0.95); c.lineTo(-0.5, 0.1); c.lineTo(-0.02, 0.1); c.lineTo(-0.25, 0.95); c.lineTo(0.55, -0.15); c.lineTo(0.05, -0.15); c.closePath(); fillStroke(c, a, shade(a, -0.35)); },
  sun: (c, a = '#ffc933') => {
    c.strokeStyle = a; c.lineWidth = 0.12; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const ang = (i * TAU) / 8; c.beginPath(); c.moveTo(Math.cos(ang) * 0.62, Math.sin(ang) * 0.62); c.lineTo(Math.cos(ang) * 0.92, Math.sin(ang) * 0.92); c.stroke(); }
    circle(c, 0, 0, 0.48); fillStroke(c, a, shade(a, -0.3));
  },
  clover: (c, a = '#51cf66') => {
    [0, 1, 2, 3].forEach((i) => { c.save(); c.rotate((i * Math.PI) / 2 + Math.PI / 4); c.translate(0, -0.42); heartPath(c, 0.42); c.restore(); fillStroke(c, a, shade(a, -0.35), 0.05); });
  },
  icecream: (c, a = '#ffa8c5') => {
    c.beginPath(); c.moveTo(-0.45, -0.05); c.lineTo(0.45, -0.05); c.lineTo(0, 0.95); c.closePath(); fillStroke(c, '#e8b36a', '#b07a25', 0.06);
    circle(c, 0, -0.35, 0.5); fillStroke(c, a, shade(a, -0.3)); circle(c, 0.1, -0.85, 0.12); c.fillStyle = '#e03131'; c.fill();
  },
  donut: (c, a = '#ff8fb3') => {
    circle(c, 0, 0, 0.9); fillStroke(c, '#e8b36a', '#b07a25', 0.06);
    c.beginPath(); c.arc(0, 0, 0.78, 0, TAU); c.fillStyle = a; c.fill();
    circle(c, 0, 0, 0.3); c.fillStyle = '#ffffff'; c.globalCompositeOperation = 'destination-out'; c.fill(); c.globalCompositeOperation = 'source-over';
    ['#fff', '#74c0fc', '#ffe066', '#69db7c'].forEach((col, i) => { c.fillStyle = col; for (let k = 0; k < 3; k++) { const ang = i * 1.6 + k * 2.1; c.save(); c.translate(Math.cos(ang) * 0.55, Math.sin(ang) * 0.55); c.rotate(ang); c.fillRect(-0.1, -0.03, 0.2, 0.06); c.restore(); } });
  },
  bee: (c) => {
    [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 0.3, -0.55, 0.3, 0.38, s * 0.5, 0, TAU); fillStroke(c, 'rgba(220,240,255,.95)', '#8ab', 0.05); });
    c.beginPath(); c.ellipse(0, 0.1, 0.8, 0.55, 0, 0, TAU); fillStroke(c, '#ffd43b', '#3b2f3f', 0.07);
    c.save(); c.beginPath(); c.ellipse(0, 0.1, 0.8, 0.55, 0, 0, TAU); c.clip(); c.fillStyle = '#3b2f3f'; [-0.2, 0.25].forEach((x) => c.fillRect(x, -0.5, 0.18, 1.2)); c.restore();
    c.fillStyle = '#3b2f3f'; circle(c, -0.55, 0, 0.07); c.fill();
  },
  ladybug: (c) => {
    circle(c, 0, -0.62, 0.3); c.fillStyle = '#3b2f3f'; c.fill();
    circle(c, 0, 0.1, 0.78); fillStroke(c, '#f03e3e', '#3b2f3f', 0.07);
    c.strokeStyle = '#3b2f3f'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(0, -0.66); c.lineTo(0, 0.88); c.stroke();
    c.fillStyle = '#3b2f3f'; [[-0.38, -0.1], [0.38, -0.1], [-0.35, 0.4], [0.35, 0.4]].forEach(([x, y]) => { circle(c, x, y, 0.13); c.fill(); });
  },
  leaf: (c, a = '#51cf66') => {
    c.beginPath(); c.moveTo(-0.8, 0.8); c.bezierCurveTo(-0.8, -0.4, 0.2, -0.9, 0.85, -0.85); c.bezierCurveTo(0.9, -0.1, 0.4, 0.8, -0.8, 0.8); c.closePath();
    fillStroke(c, a, shade(a, -0.35), 0.06); c.strokeStyle = shade(a, -0.3); c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.8, 0.8); c.lineTo(0.6, -0.6); c.stroke();
  },
  drop: (c, a = '#4dabf7') => { c.beginPath(); c.moveTo(0, -0.95); c.bezierCurveTo(0.5, -0.3, 0.7, 0.1, 0.65, 0.35); c.arc(0, 0.35, 0.65, 0, Math.PI); c.bezierCurveTo(-0.7, 0.1, -0.5, -0.3, 0, -0.95); fillStroke(c, a, shade(a, -0.3)); },
  cupcake: (c, a = '#ffa8c5') => {
    c.beginPath(); c.moveTo(-0.6, 0.05); c.lineTo(0.6, 0.05); c.lineTo(0.45, 0.9); c.lineTo(-0.45, 0.9); c.closePath(); fillStroke(c, '#74c0fc', '#1c7ed6', 0.06);
    c.beginPath(); c.arc(-0.35, 0.02, 0.3, Math.PI, 0); c.arc(0.35, 0.02, 0.3, Math.PI, 0); c.arc(0, -0.28, 0.38, 0, Math.PI, true); c.closePath(); fillStroke(c, a, shade(a, -0.3), 0.06);
    circle(c, 0, -0.75, 0.13); c.fillStyle = '#e03131'; c.fill();
  },
  bridge: (c, a = '#e8590c') => { // Golden Gate heart patch
    heartPath(c, 0.95); fillStroke(c, '#d0ebff', a, 0.08);
    c.save(); heartPath(c, 0.95); c.clip();
    c.fillStyle = '#4dabf7'; c.fillRect(-1, 0.35, 2, 0.7);
    c.fillStyle = a; c.fillRect(-0.45, -0.55, 0.12, 1.0); c.fillRect(0.33, -0.55, 0.12, 1.0); c.fillRect(-1, 0.28, 2, 0.08);
    c.strokeStyle = a; c.lineWidth = 0.05; c.beginPath(); c.moveTo(-1, -0.1); c.quadraticCurveTo(-0.39, 0.3, -0.39, -0.5); c.quadraticCurveTo(0, 0.25, 0.39, -0.5); c.quadraticCurveTo(0.39, 0.3, 1, -0.1); c.stroke();
    c.restore();
  },
  city: (c, a = '#7048e8') => { // Boston heart patch
    heartPath(c, 0.95); fillStroke(c, '#fff0f6', a, 0.08);
    c.save(); heartPath(c, 0.95); c.clip(); c.fillStyle = a;
    [[-0.8, 0.1, 0.3], [-0.45, -0.3, 0.25], [-0.15, 0.0, 0.25], [0.12, -0.45, 0.2], [0.35, -0.1, 0.25], [0.62, 0.15, 0.3]].forEach(([x, y, w]) => c.fillRect(x, y, w, 1.2));
    c.fillStyle = '#fff3bf'; for (let i = 0; i < 12; i++) c.fillRect(-0.7 + (i % 6) * 0.26, 0.35 + Math.floor(i / 6) * 0.2, 0.06, 0.07);
    c.restore();
  },
  letterC: (c, a = '#7048e8') => {
    circle(c, 0, 0, 0.92); fillStroke(c, '#ffffff', a, 0.1);
    c.strokeStyle = a; c.lineWidth = 0.24; c.lineCap = 'round'; c.beginPath(); c.arc(0.05, 0, 0.48, 0.75, TAU - 0.75); c.stroke();
  },
  blush: (c, a = '#ff8fab') => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, a); g.addColorStop(1, 'rgba(255,143,171,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 1, 0.65, 0, 0, TAU); c.fill(); },
  freckles: (c, a = '#b0703a') => { c.fillStyle = a; [[-0.45, -0.1], [0, 0.15], [0.45, -0.1], [-0.2, -0.4], [0.25, -0.38]].forEach(([x, y]) => { circle(c, x, y, 0.1); c.fill(); }); },
  dot: (c, a) => { circle(c, 0, 0, 0.9); c.fillStyle = a; c.fill(); },
  diamond: (c, a) => { c.beginPath(); c.moveTo(0, -0.95); c.lineTo(0.7, -0.2); c.lineTo(0, 0.95); c.lineTo(-0.7, -0.2); c.closePath(); fillStroke(c, a, shade(a, -0.3)); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(0, -0.95); c.lineTo(0.25, -0.2); c.lineTo(-0.25, -0.2); c.closePath(); c.fill(); },
  pixel: (c, a) => { // Mikey & JJ blocky pixel face
    const g = ['..#####..', '.#######.', '##.###.##', '#########', '###...###', '.#######.'];
    const s = 1.8 / 9; g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') { c.fillStyle = (i + j) % 3 ? a : shade(a, -0.2); c.fillRect(-0.9 + i * s, -0.6 + j * s, s + 0.005, s + 0.005); } }));
  },
  moonstar: (c, a = '#ffe066') => { withT(c, -0.2, 0, 0.8); MOTIFS.moon(c, a); c.restore(); withT(c, 0.55, -0.45, 0.35); MOTIFS.star(c, a); c.restore(); },
  confetto: (c, a) => { c.fillStyle = a; c.fillRect(-0.5, -0.25, 1, 0.5); },
  firefly: (c, a = '#ffe066') => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, '#fffbe6'); g.addColorStop(0.35, a); g.addColorStop(1, 'rgba(255,224,102,0)'); c.fillStyle = g; circle(c, 0, 0, 1); c.fill(); },
  glowdot: (c, a = '#d0bfff') => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, a); g.addColorStop(1, 'rgba(208,191,255,0)'); c.fillStyle = g; circle(c, 0, 0, 1); c.fill(); },
};

function withT(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); return c; }

/** Draw a motif centred at (x, y) with half-size (rx, ry) and optional rotation. */
export function drawMotif(ctx, name, x, y, rx, ry = rx, a = '#ff6b9a', b, rot = 0) {
  const fn = MOTIFS[name]; if (!fn) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(rx, ry);
  fn(ctx, a, b);
  ctx.restore();
}

/** Render a motif to its own canvas (used for sprites, tiles). */
export function motifCanvas(name, size = 128, a, b, pad = 0.12) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  drawMotif(ctx, name, size / 2, size / 2, size * (0.5 - pad), size * (0.5 - pad), a, b);
  return cv;
}
