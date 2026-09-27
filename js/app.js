// Critter Paint Studio — main app.
// Huggy sneezed a gray cloud over Playcare; Chuyu paints each plush back to life, then it dances.
import { buildSunnyFox } from './characters/SunnyFox.js';
import { buildLunaBat } from './characters/LunaBat.js';
import { buildPoppyDash } from './characters/PoppyDash.js';
import * as PB from './paintbox.js';
import { drawMotif, motifCanvas, shade, lum } from './motifs.js';

const THREE = window.THREE;
const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

const CRITTERS = [
  { id: 'lunabat', name: 'LunaBat', build: buildLunaBat },
  { id: 'sunnyfox', name: 'SunnyFox', build: buildSunnyFox },
  { id: 'poppydash', name: 'PoppyDash', build: buildPoppyDash },
];

/* ============================================================ renderer / scene */
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);

// Soft studio environment for metals / pearls / holo (built procedurally, no downloads).
(function buildEnv() {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  const pos = sky.geometry.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10; const c = new THREE.Color().lerpColors(new THREE.Color('#e9dcff'), new THREE.Color('#fff8ec'), (y + 1) / 2); cols.push(c.r, c.g, c.b); }
  sky.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  env.add(sky);
  [[0, 6, 4, '#ffffff', 5], [-6, 2, 3, '#ffe3c2', 3], [6, 3, -2, '#d6e8ff', 3]].forEach(([x, y, z, c, s]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  });
  scene.environment = pm.fromScene(env, 0.04).texture;
})();

const hemi = new THREE.HemisphereLight('#fff6ea', '#cdb8e6', 0.9); scene.add(hemi);
const key = new THREE.DirectionalLight('#fff1dc', 2.1); key.position.set(2.2, 4.2, 3.2); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 3; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0015; key.shadow.normalBias = 0.02;
scene.add(key);
const fill = new THREE.DirectionalLight('#e6ddff', 0.7); fill.position.set(-3, 2, 2); scene.add(fill);
const rim = new THREE.DirectionalLight('#ffffff', 0.9); rim.position.set(0, 3, -4); scene.add(rim);
const LIGHTS = [[hemi, 0.9], [key, 2.1], [fill, 0.7], [rim, 0.9]];

// Wooden turntable
function woodTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#c99a66'; g.fillRect(0, 0, 512, 512);
  for (let r = 4; r < 256; r += 5 + Math.random() * 6) { g.strokeStyle = `rgba(120,70,30,${0.08 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.arc(256, 256, r, 0, TAU); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const turntable = new THREE.Group(); scene.add(turntable);
const ttTop = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.14, 72), [
  new THREE.MeshStandardMaterial({ color: '#b98555', roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.55 }), new THREE.MeshStandardMaterial({ color: '#8a5c35' })]);
ttTop.position.y = -0.07; ttTop.receiveShadow = true; turntable.add(ttTop);
const ttBase = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.42, 0.08, 72), new THREE.MeshStandardMaterial({ color: '#8a5c35', roughness: 0.7 }));
ttBase.position.y = -0.17; ttBase.receiveShadow = true; scene.add(ttBase);
const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.ShadowMaterial({ opacity: 0.12 }));
shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = -0.215; shadowDisc.receiveShadow = true; scene.add(shadowDisc);
const holder = new THREE.Group(); turntable.add(holder);
const fxWorld = new THREE.Group(); scene.add(fxWorld);

/* ============================================================ state */
const LS_KEY = 'critterPaint_v1';
const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
const S = {
  screen: 'title', paused: false, critterId: saved.last || 'lunabat', C: null,
  mode: 'fill', fill: { kind: 'color', id: null }, brush: 'soft', effect: null, sticker: null,
  color: '#ff8fab', bg: '#ffffff', size: 1, mirror: true, lights: true, tab: 'colors',
  myColors: saved.myColors || [], recent: saved.recent || [], mixing: null,
  undo: [], spin: 0, spinVel: 0, zoom: 1, time: 0, finale: null, music: saved.music ?? true, sound: saved.sound ?? true,
  done: saved.done || {},
};
function persistPrefs() { localStorage.setItem(LS_KEY, JSON.stringify({ last: S.critterId, myColors: S.myColors, recent: S.recent, music: S.music, sound: S.sound, done: S.done })); }

/* ============================================================ critter loading / surfaces */
const EXCL = /^(eyes|leftEye|rightEye|eyelashes|corneaMesh|catchlight\w*|mouthCavityMesh|tongueMesh|noseMesh|nose|leftNostril|rightNostril|zipper|zipperPullRing|lanternPendant|moonStarPendant|popcornPendant|popcornKernels|pilotGear|glassGlobeCore|innerFlameFilament|crescentMoonMesh|starburstMesh|foreheadStitch|stitchSeam)$/;
const REGIONS = new Set(['leftEar', 'rightEar', 'head', 'muzzle', 'torso', 'leftArm', 'rightArm', 'leftWingArm', 'rightWingArm', 'leftLeg', 'rightLeg', 'tail', 'eyePatchLeft', 'cheekTufts']);
const bump = PB.MOTIFS && (() => { // fabric bump shared by every plush surface
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1800; i++) { const s = 90 + Math.random() * 140 | 0; g.strokeStyle = `rgb(${s},${s},${s})`; g.lineWidth = 1.3; const x = Math.random() * 128, y = Math.random() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 4, y + 3 + Math.random() * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
})();

function excluded(obj, root) {
  for (let o = obj; o && o !== root; o = o.parent) if (EXCL.test(o.name || '')) return true;
  return false;
}
function regionOf(obj, root) {
  for (let o = obj.parent; o && o !== root; o = o.parent) if (REGIONS.has(o.name)) return o.name;
  return 'body';
}
const pow2 = (v, lo, hi) => { let p = lo; while (p < hi && p < v) p *= 2; return p; };

function measure(mesh) {
  const g = mesh.geometry, p = g.parameters || {}, s = new THREE.Vector3(); mesh.getWorldScale(s);
  const su = (s.x + s.z) / 2, sv = s.y, sa = (s.x + s.y + s.z) / 3;
  switch (g.type) {
    case 'SphereGeometry': return [TAU * p.radius * su * ((p.phiLength ?? TAU) / TAU), Math.PI * p.radius * sv * ((p.thetaLength ?? Math.PI) / Math.PI)];
    case 'CylinderGeometry': case 'ConeGeometry': return [Math.PI * ((p.radiusTop ?? 0) + (p.radiusBottom ?? p.radius ?? 0.1)) * su, p.height * sv];
    case 'TubeGeometry': return [p.path.getLength() * sa, TAU * p.radius * sa];
    case 'TorusGeometry': return [p.radius * (p.arc ?? TAU) * sa, TAU * p.tube * sa];
    case 'CapsuleGeometry': return [TAU * p.radius * su, (p.length + Math.PI * p.radius) * sv];
    default: { g.computeBoundingBox(); const b = g.boundingBox, d = new THREE.Vector3(); b.getSize(d); return [Math.max(0.05, d.x * s.x), Math.max(0.05, d.y * s.y)]; }
  }
}
function normalizeUV(geom) {
  const uv = geom.attributes.uv; if (!uv) return;
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (let i = 0; i < uv.count; i++) { a = Math.min(a, uv.getX(i)); b = Math.min(b, uv.getY(i)); c = Math.max(c, uv.getX(i)); d = Math.max(d, uv.getY(i)); }
  if (a >= 0 && b >= 0 && c <= 1 && d <= 1) return;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - a) / (c - a || 1), (uv.getY(i) - b) / (d - b || 1));
  uv.needsUpdate = true;
}

function baseMat(surf) {
  return new THREE.MeshPhysicalMaterial({ map: surf.tex, bumpMap: surf.bumpMap, bumpScale: surf.bumpScale, roughness: 0.86, metalness: 0.02, sheen: 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.7 });
}

function loadCritter(id) {
  if (S.C) disposeCritter();
  const def = CRITTERS.find((c) => c.id === id) || CRITTERS[0];
  S.critterId = def.id; persistPrefs();
  const root = def.build();
  if (root.parts && root.parts.pilotGear && root.parts.pilotGear.parent) root.parts.pilotGear.parent.remove(root.parts.pilotGear);
  root.updateMatrixWorld(true);
  const surfaces = [], parts = new Map(), all = [];
  root.traverse((m) => {
    if (!m.isMesh) return;
    all.push(m); m.castShadow = true;
    const om = m.material;
    if (Array.isArray(om) || !om || !om.isMeshStandardMaterial) return;
    if (excluded(m, root)) return;
    if (!(om.bumpMap || om.map)) return;
    if (om.metalness > 0.5 || (om.emissive && om.emissiveIntensity > 0.4 && om.emissive.getHex())) return;
    m.geometry = m.geometry.clone(); normalizeUV(m.geometry);
    m.geometry.computeBoundingSphere();
    const [lenU, lenV] = measure(m);
    const rad = m.geometry.boundingSphere.radius; const ws = new THREE.Vector3(); m.getWorldScale(ws);
    if (lum('#' + om.color.getHexString()) < 0.12 && rad * ws.x < 0.12) return; // brows / tiny dark bits stay as-is
    const w = pow2(lenU * 520, 64, 1024), h = pow2(lenV * 520, 32, 512);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.wrapS = THREE.RepeatWrapping;
    const region = regionOf(m, root);
    const partKey = `${region}:${om.uuid.slice(0, 6)}`;
    const surf = {
      i: surfaces.length, mesh: m, cv, ctx: cv.getContext('2d'), tex, w, h, lenU, lenV, partKey,
      orig: '#' + om.color.getHexString(), bumpMap: om.map && !om.bumpMap ? om.map : bump, bumpScale: om.map && !om.bumpMap ? 0.03 : 0.018,
      fillSpec: null, special: null, emis: null, emisTex: null, dirty: false, glitterSeed: Math.random() * 1000 | 0,
    };
    surf.ctx.fillStyle = PB.BLANK; surf.ctx.fillRect(0, 0, w, h);
    m.material = baseMat(surf); m.userData.surf = surf;
    surfaces.push(surf);
    if (!parts.has(partKey)) parts.set(partKey, { key: partKey, region, surfaces: [], area: 0, orig: surf.orig });
    const P = parts.get(partKey); P.surfaces.push(surf); P.area += lenU * lenV;
    surf.part = P;
  });
  // mirror pairs (left <-> right)
  for (const P of parts.values()) {
    const mk = P.key.replace(/^left/, '§').replace(/^right/, 'left').replace(/^§/, 'right');
    P.mirror = mk !== P.key ? parts.get(mk) || null : null;
  }
  // stand on the turntable
  const box = new THREE.Box3().setFromObject(root);
  root.position.y = -box.min.y + 0.0;
  root.position.x = -(box.min.x + box.max.x) / 2 * 0.0;
  holder.add(root); root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const rig = findRig(root);
  S.C = { def, root, surfaces, parts, all, height: box2.max.y - box2.min.y, top: box2.max.y, rig, effects: [], wearables: [], anchors: computeAnchors(root, rig) };
  S.undo = []; updateUndo();
  frameCamera();
  $('critterName').textContent = def.name;
  document.querySelectorAll('.pick').forEach((b) => b.classList.toggle('sel', b.dataset.id === def.id));
  return loadSaved(def.id);
}
function disposeCritter() {
  const C = S.C; if (!C) return;
  C.effects.slice().forEach((e) => removeEffect(e, true));
  holder.remove(C.root);
  C.surfaces.forEach((s) => { s.tex.dispose(); s.emisTex && s.emisTex.dispose(); s.mesh.material.dispose(); s.mesh.geometry.dispose(); });
  S.C = null;
}

function findRig(root) {
  const f = (re) => { let r = null; root.traverse((o) => { if (!r && !o.isMesh && re.test(o.name || '')) r = o; }); return r; };
  const rig = { head: f(/^head$/), torso: f(/^torso$/), armL: f(/^left(Wing)?Arm$/), armR: f(/^right(Wing)?Arm$/), legL: f(/^leftLeg$/), legR: f(/^rightLeg$/), tail: f(/^tail$/), earL: f(/^leftEar$/), earR: f(/^rightEar$/) };
  rig.base = {};
  for (const [k, o] of Object.entries(rig)) if (o && o.isObject3D) rig.base[k] = { r: o.rotation.clone(), p: o.position.clone(), s: o.scale.clone() };
  rig.rootBase = { p: root.position.clone(), r: root.rotation.clone() };
  return rig;
}

function computeAnchors(root, rig) {
  root.updateMatrixWorld(true);
  const head = rig.head, torso = rig.torso || root;
  let skull = null; head && head.traverse((o) => { if (!skull && o.isMesh && /skull/i.test(o.name)) skull = o; });
  const hb = new THREE.Box3().setFromObject(skull || head || root);
  const tb = new THREE.Box3(); torso.traverse((o) => { if (o.isMesh && /body/i.test(o.name)) tb.expandByObject(o); }); if (tb.isEmpty()) tb.setFromObject(torso);
  const hc = hb.getCenter(new THREE.Vector3()), hs = hb.getSize(new THREE.Vector3());
  const tc = tb.getCenter(new THREE.Vector3()), ts = tb.getSize(new THREE.Vector3());
  let eyeY = hc.y + hs.y * 0.05; head && head.traverse((o) => { if (o.name === 'eyes') { const e = new THREE.Box3().setFromObject(o); if (!e.isEmpty()) eyeY = e.getCenter(new THREE.Vector3()).y; } });
  // everything stored in the local space of head / torso so accessories follow the dance
  const toHead = (v) => (head ? head.worldToLocal(v.clone()) : v.clone());
  const toTorso = (v) => torso.worldToLocal(v.clone());
  return {
    headTop: toHead(new THREE.Vector3(hc.x, hb.max.y - hs.y * 0.08, hc.z)), headR: hs.x / 2, headD: hs.z / 2, headH: hs.y / 2,
    headCenter: toHead(hc), face: toHead(new THREE.Vector3(hc.x, eyeY, hb.max.z)),
    neck: toTorso(new THREE.Vector3(tc.x, tb.max.y - ts.y * 0.08, tc.z)), back: toTorso(new THREE.Vector3(tc.x, tc.y + ts.y * 0.08, tb.min.z)),
    chest: toTorso(new THREE.Vector3(tc.x, tb.max.y - ts.y * 0.25, tb.max.z)), torsoR: ts.x / 2, torsoD: ts.z / 2, torsoH: ts.y / 2,
  };
}

/* ============================================================ materials per surface */
function applyMaterial(surf) {
  const m = surf.mesh.material, sp = surf.special ? PB.SPECIALS.find((x) => x.id === surf.special) : null;
  const d = { roughness: 0.86, metalness: 0.02, sheen: 0.35, sheenRoughness: 0.8, clearcoat: 0, clearcoatRoughness: 0.1, iridescence: 0, iridescenceIOR: 1.3, transmission: 0, thickness: 0, bumpScale: surf.bumpScale };
  Object.assign(m, d, sp && sp.mat ? sp.mat : {});
  if (sp && sp.mat && sp.mat.iridescenceThicknessRange) m.iridescenceThicknessRange = sp.mat.iridescenceThicknessRange;
  m.color.set('#ffffff');
  surf.glow = !!(sp && sp.glow); surf.glitter = !!(sp && sp.glitter);
  if (surf.glow) m.emissive.set(surf.fillColor || '#ffffff');
  const needEmis = surf.emis && (surf.glitter || surf.neon);
  if (needEmis) { m.emissiveMap = surf.emisTex; if (!surf.glow) m.emissive.set('#ffffff'); }
  else { m.emissiveMap = null; if (!surf.glow) m.emissive.set('#000000'); }
  m.emissiveIntensity = surf.glow ? (S.lights ? 0.12 : 1.1) : needEmis ? 0.6 : 0;
  m.needsUpdate = true;
}
function ensureEmis(surf) {
  if (surf.emis) return surf.emis;
  const c = document.createElement('canvas'); c.width = surf.w; c.height = surf.h; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, surf.w, surf.h);
  surf.emis = { cv: c, ctx: g }; surf.emisTex = new THREE.CanvasTexture(c); surf.emisTex.colorSpace = THREE.SRGBColorSpace; surf.emisTex.wrapS = THREE.RepeatWrapping;
  return surf.emis;
}
const dirtyTex = new Set();
function touch(surf) { surf.dirty = true; dirtyTex.add(surf); scheduleSave(); }

/* ============================================================ undo */
function snapshot(surfs) {
  return surfs.map((s) => {
    const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(s.cv, 0, 0);
    let e = null; if (s.emis) { e = document.createElement('canvas'); e.width = s.w; e.height = s.h; e.getContext('2d').drawImage(s.emis.cv, 0, 0); }
    return { s, c, e, special: s.special, fillColor: s.fillColor, neon: s.neon, hadEmis: !!s.emis };
  });
}
function restoreSnap(snap) {
  snap.forEach(({ s, c, e, special, fillColor, neon, hadEmis }) => {
    s.ctx.globalCompositeOperation = 'copy'; s.ctx.drawImage(c, 0, 0); s.ctx.globalCompositeOperation = 'source-over';
    if (e) { ensureEmis(s); s.emis.ctx.globalCompositeOperation = 'copy'; s.emis.ctx.drawImage(e, 0, 0); s.emis.ctx.globalCompositeOperation = 'source-over'; s.emisTex.needsUpdate = true; }
    else if (s.emis && !hadEmis) { s.emis.ctx.fillStyle = '#000'; s.emis.ctx.fillRect(0, 0, s.w, s.h); s.emisTex.needsUpdate = true; }
    s.special = special; s.fillColor = fillColor; s.neon = neon; applyMaterial(s); touch(s);
  });
}
function pushUndo(fn) { S.undo.push(fn); if (S.undo.length > 25) S.undo.shift(); updateUndo(); }
function doUndo() { const fn = S.undo.pop(); if (fn) { fn(); sfx('undo'); } updateUndo(); }
function updateUndo() { $('undoBtn').classList.toggle('dim', !S.undo.length); }

/* ============================================================ painting actions */
function partTargets(P) { const list = [P]; if (S.mirror && P.mirror) list.push(P.mirror); return list; }

function fillPart(P, spec = currentFillSpec()) {
  const targets = partTargets(P), surfs = targets.flatMap((p) => p.surfaces);
  const snap = snapshot(surfs); pushUndo(() => restoreSnap(snap));
  surfs.forEach((s) => paintSurface(s, spec));
  sfx('fill'); addRecent();
}
function paintSurface(s, spec) {
  PB.renderFill(s, spec);
  s.special = spec.type === 'special' ? spec.id : null; s.fillColor = spec.color || spec.c1; s.neon = false;
  if (s.emis) { s.emis.ctx.fillStyle = '#000'; s.emis.ctx.fillRect(0, 0, s.w, s.h); }
  if (s.special && PB.SPECIALS.find((x) => x.id === s.special).glitter) { ensureEmis(s); s.emis.ctx.drawImage(PB.renderGlitterEmissive(s, s.glitterSeed), 0, 0); }
  if (s.emisTex) s.emisTex.needsUpdate = true;
  applyMaterial(s); touch(s);
}
function currentFillSpec() {
  const f = S.fill;
  if (f.kind === 'special') return { type: 'special', id: f.id, color: S.color };
  if (f.kind === 'pattern') return { type: 'pattern', id: f.id, c1: S.color, c2: S.bg, size: S.size };
  return { type: 'color', color: S.color };
}

// ---- brush strokes (with mirror) ----
const BRUSH_R = [0.03, 0.055, 0.095];
let stroke = null;
function beginStroke() { stroke = { tracks: [{ last: null }, { last: null }], snapped: new Set(), snaps: [], rand: mulberry(Math.random() * 1e6 | 0), dist: 0 }; }
function endStroke() {
  if (stroke && stroke.snaps.length) { const snaps = stroke.snaps.flat(); pushUndo(() => restoreSnap(snaps)); addRecent(); }
  stroke = null;
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function strokeTo(hit, trackIdx = 0) {
  const s = hit.object.userData.surf; if (!s || !stroke) return;
  if (!stroke.snapped.has(s)) { stroke.snapped.add(s); stroke.snaps.push(snapshot([s])); }
  const brush = PB.BRUSHES.find((b) => b.id === S.brush);
  const x = hit.uv.x * s.w, y = (1 - hit.uv.y) * s.h;
  const rW = BRUSH_R[S.size], rx = Math.max(1.5, (rW / s.lenU) * s.w), ry = Math.max(1.5, (rW / s.lenV) * s.h);
  const tr = stroke.tracks[trackIdx];
  const st = { rand: stroke.rand, dist: stroke.dist, blank: PB.BLANK };
  let emisCtx = null; if (brush.id === 'neon') { emisCtx = ensureEmis(s).ctx; s.neon = true; }
  const dab = (px, py) => { [0, -s.w, s.w].forEach((o) => { if (px + o > -rx * 2 && px + o < s.w + rx * 2) PB.brushDab(s.ctx, brush, px + o, py, rx, ry, S.color, st, emisCtx && { fillStyle: '', beginPath() { }, ellipse() { }, fill() { } } && emisCtx); }); };
  if (tr.last && tr.last.s === s && Math.abs(x - tr.last.x) < s.w / 2) {
    const dx = x - tr.last.x, dy = y - tr.last.y, d = Math.hypot(dx / rx, dy / ry), step = PB.brushSpacing(brush);
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) { st.dist = stroke.dist + (k / n) * d * rx; dab(tr.last.x + (dx * k) / n, tr.last.y + (dy * k) / n); }
    if (trackIdx === 0) stroke.dist += d * rx;
  } else dab(x, y);
  tr.last = { s, x, y };
  if (brush.id === 'neon') { applyMaterial(s); s.emisTex.needsUpdate = true; }
  touch(s);
}
// mirrored counterpart of a hit: reflect across the critter's x=0 plane and re-cast onto the plush
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), ray2 = new THREE.Raycaster();
function mirrorHit(hit) {
  const root = S.C.root;
  const p = root.worldToLocal(hit.point.clone());
  const nW = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const n = nW.clone().transformDirection(new THREE.Matrix4().copy(root.matrixWorld).invert());
  if (Math.abs(p.x) < 0.02) return null;
  p.x = -p.x; n.x = -n.x;
  const origin = root.localToWorld(p.clone().addScaledVector(n, 0.3));
  const dir = n.clone().transformDirection(root.matrixWorld).negate();
  ray2.set(origin, dir); ray2.far = 0.6;
  const h = ray2.intersectObjects(S.C.all, false)[0];
  return h && h.object.userData.surf && h.uv ? h : null;
}

function placeSticker(hit) {
  const s = hit.object.userData.surf, st = PB.STICKERS.find((x) => x.id === S.sticker);
  const snap = snapshot([s]); pushUndo(() => restoreSnap(snap));
  const rW = [0.06, 0.1, 0.16][S.size], x = hit.uv.x * s.w, y = (1 - hit.uv.y) * s.h, rx = (rW / s.lenU) * s.w, ry = (rW / s.lenV) * s.h, rot = rand(-0.25, 0.25);
  [0, -s.w, s.w].forEach((o) => PB.stickerDecal(s.ctx, st, x + o, y, rx, ry, rot));
  touch(s); sfx('pop'); addRecent();
}

/* ============================================================ magic effects 特效 */
const spriteTexCache = {};
function spriteTex(motif, color) {
  const k = motif + color; if (spriteTexCache[k]) return spriteTexCache[k];
  const t = new THREE.CanvasTexture(motifCanvas(motif, 128, color)); t.colorSpace = THREE.SRGBColorSpace; return (spriteTexCache[k] = t);
}
function sprite(motif, color, size, additive = false) {
  const m = new THREE.SpriteMaterial({ map: spriteTex(motif, color), transparent: true, depthWrite: false, opacity: 0, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const sp = new THREE.Sprite(m); sp.scale.set(size, size, 1); sp.userData.base = size; return sp;
}
function randomSurfacePoint(P, local = false) {
  const s = P.surfaces[Math.floor(Math.random() * P.surfaces.length)], pos = s.mesh.geometry.attributes.position, nor = s.mesh.geometry.attributes.normal;
  const i = Math.floor(Math.random() * pos.count);
  const v = new THREE.Vector3().fromBufferAttribute(pos, i), n = nor ? new THREE.Vector3().fromBufferAttribute(nor, i) : new THREE.Vector3(0, 1, 0);
  if (local) { v.applyMatrix4(s.mesh.matrix); n.transformDirection(s.mesh.matrix); return { parent: s.mesh.parent, v, n }; }
  s.mesh.localToWorld(v); n.transformDirection(s.mesh.matrixWorld); return { v, n };
}
function animTex(kind) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  if (kind === 'rainbowflow') { const gr = g.createLinearGradient(0, 0, 256, 0); ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc', '#ff6b6b'].forEach((col, i) => gr.addColorStop(i / 6, col)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  if (kind === 'aurora') { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 5; i++) { const gr = g.createLinearGradient(0, i * 52, 0, i * 52 + 52); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, i % 2 ? '#b197fc' : '#63e6be'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, i * 52, 256, 52); } }
  if (kind === 'ripple') { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#a5d8ff'; g.lineWidth = 6; for (let r = 16; r < 256; r += 40) { g.beginPath(); g.arc(128, 128, r, 0, TAU); g.stroke(); } }
  if (kind === 'galaxyswirl') { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 260; i++) { const a = i * 0.35, r = i * 0.45; g.fillStyle = i % 5 ? '#d0bfff' : '#ffe066'; g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2.5, 2.5); } }
  if (kind === 'warmglow') { g.fillStyle = '#ffb347'; g.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.center.set(0.5, 0.5); return t;
}

function addEffect(def, P) {
  const C = S.C, same = C.effects.find((e) => e.def.id === def.id && (def.scope === 'body' || e.part === P));
  if (same) { removeEffect(same); sfx('undo'); return; }
  if (C.effects.length >= 3) removeEffect(C.effects[0], true);
  const fx = { def, part: def.scope === 'part' ? P : null, objs: [], t: 0, spawnT: 0 };
  const add = (o, parent = fxWorld) => { parent.add(o); fx.objs.push(o); return o; };
  const id = def.id;
  if (def.material) { // animated overlay skin on the part
    const tex = animTex(id), op = { rainbowflow: 0.32, warmglow: 0.25, aurora: 0.55, ripple: 0.35, galaxyswirl: 0.7 }[id];
    fx.tex = tex;
    partTargets(P).flatMap((p) => p.surfaces).forEach((s) => {
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const o = new THREE.Mesh(s.mesh.geometry, m); o.userData.baseOp = op; add(o, s.mesh);
    });
  } else if (id === 'twinkle') {
    for (let i = 0; i < 16; i++) { const pt = randomSurfacePoint(P, true); const sp = sprite('sparkle', '#fff3bf', 0.07, true); sp.position.copy(pt.v).addScaledVector(pt.n, 0.02); sp.userData.ph = Math.random() * TAU; add(sp, pt.parent); }
  } else if (id === 'halo') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(C.anchors.headR * 0.62, 0.028, 12, 48), new THREE.MeshStandardMaterial({ color: '#ffe066', emissive: '#ffd43b', emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.3 }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(C.anchors.headTop).add(new THREE.Vector3(0, C.anchors.headH * 0.55, 0)); ring.userData.y0 = ring.position.y; add(ring, C.rig.head || C.root);
  } else if (id === 'aura') {
    const sp = sprite('glowdot', '#ffc9e3', C.height * 1.5, true); sp.position.set(0, C.height * 0.5, -0.4); sp.material.opacity = 0.5; add(sp, holder);
  } else if (id === 'butterflies') {
    for (let i = 0; i < 3; i++) { const sp = sprite('butterfly', ['#b197fc', '#faa2c1', '#74c0fc'][i], 0.18); sp.material.opacity = 1; sp.userData.ph = (i * TAU) / 3; add(sp); }
  } else if (id === 'fireflies') {
    for (let i = 0; i < 10; i++) { const sp = sprite('firefly', '#ffe066', 0.09, true); sp.userData.ph = Math.random() * TAU; sp.userData.r = rand(0.6, 1.05); sp.userData.y = rand(0.2, C.height); add(sp); }
  }
  C.effects.push(fx);
  sfx('sparkle'); addRecent(); scheduleSave();
  pushUndo(() => removeEffect(fx, true));
  return fx;
}
function removeEffect(fx, silent) {
  fx.objs.forEach((o) => { o.parent && o.parent.remove(o); if (o.material) { o.material.dispose(); } if (o.geometry && fx.def.id === 'halo') o.geometry.dispose(); });
  fx.tex && fx.tex.dispose();
  const C = S.C; if (C) C.effects = C.effects.filter((e) => e !== fx);
  if (!silent) scheduleSave();
}
function updateEffects(dt) {
  const C = S.C; if (!C) return;
  const center = new THREE.Vector3(); holder.getWorldPosition(center);
  C.effects.forEach((fx) => {
    fx.t += dt; fx.spawnT -= dt; const id = fx.def.id, t = fx.t;
    if (fx.def.material) {
      if (id === 'rainbowflow') fx.tex.offset.x = (t * 0.05) % 1;
      if (id === 'aurora') fx.tex.offset.y = (t * 0.04) % 1;
      if (id === 'ripple') { const k = 1 + ((t * 0.12) % 1) * 0.5; fx.tex.repeat.set(1 / k, 1 / k); }
      if (id === 'galaxyswirl') fx.tex.rotation = t * 0.15;
      if (id === 'warmglow') fx.objs.forEach((o) => { o.material.opacity = o.userData.baseOp * (0.55 + 0.45 * Math.sin(t * 1.6)); });
      return;
    }
    if (id === 'twinkle') { fx.objs.forEach((o) => { const k = 0.5 + 0.5 * Math.sin(t * 1.4 + o.userData.ph); o.material.opacity = k; o.scale.setScalar(o.userData.base * (0.6 + 0.4 * k)); }); return; }
    if (id === 'halo') { const o = fx.objs[0]; o.position.y = o.userData.y0 + Math.sin(t * 1.2) * 0.02; o.rotation.z = t * 0.3; return; }
    if (id === 'aura') { fx.objs[0].material.opacity = 0.35 + 0.15 * Math.sin(t * 0.9); return; }
    if (id === 'butterflies') { fx.objs.forEach((o, i) => { const a = t * 0.35 + o.userData.ph, r = 0.95 + 0.1 * Math.sin(t * 0.7 + i); o.position.set(center.x + Math.cos(a) * r, center.y + C.height * (0.55 + 0.2 * Math.sin(t * 0.5 + i)), center.z + Math.sin(a) * r); o.scale.set(o.userData.base * (0.55 + 0.45 * Math.abs(Math.sin(t * 3 + i))), o.userData.base, 1); }); return; }
    if (id === 'fireflies') { fx.objs.forEach((o) => { const a = t * 0.18 + o.userData.ph; o.position.set(center.x + Math.cos(a) * o.userData.r, center.y + o.userData.y + Math.sin(t * 0.6 + o.userData.ph) * 0.1, center.z + Math.sin(a * 1.3) * o.userData.r); o.material.opacity = 0.35 + 0.35 * Math.sin(t * 1.1 + o.userData.ph * 2); }); return; }
    // particle emitters (all slow + soft)
    const cfg = {
      bubbles: { every: 0.45, life: 4.5, size: [0.06, 0.12], vy: 0.14 }, hearts: { every: 0.6, life: 4, size: [0.06, 0.1], vy: 0.12 },
      popcorn: { every: 1.6, life: 2.4, size: [0.08, 0.1], vy: 0.35, g: 0.35 }, confetti: { every: 4.5, burst: 14, life: 3, size: [0.035, 0.05], vy: 0.2, g: 0.12, spread: 0.3 },
      moondust: { every: 0.18, life: 5, size: [0.03, 0.06], vy: -0.08, body: true, additive: true }, snow: { every: 0.25, life: 7, size: [0.05, 0.09], vy: -0.12, body: true },
      petals: { every: 0.5, life: 7, size: [0.06, 0.09], vy: -0.1, body: true }, notes: { every: 0.9, life: 4.5, size: [0.08, 0.12], vy: 0.13, body: true },
    }[id];
    if (!cfg) return;
    if (fx.spawnT <= 0) {
      fx.spawnT = cfg.every;
      const n = cfg.burst || 1;
      for (let k = 0; k < n; k++) {
        const col = id === 'confetti' ? ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#faa2c1'][k % 6] : id === 'notes' ? ['#845ef7', '#f06595', '#339af0'][Math.random() * 3 | 0] : fx.def.color;
        const sp = sprite(fx.def.motif, col, rand(...cfg.size), cfg.additive);
        let p;
        if (cfg.body) p = new THREE.Vector3(center.x + rand(-1, 1), center.y + (cfg.vy < 0 ? C.height * rand(1.0, 1.25) : C.height * rand(0.3, 0.8)), center.z + rand(-0.8, 0.8));
        else p = randomSurfacePoint(fx.part).v;
        sp.position.copy(p);
        sp.userData = { ...sp.userData, life: 0, max: cfg.life, vx: rand(-1, 1) * (cfg.spread || 0.03), vy: cfg.vy * rand(0.8, 1.2), vz: rand(-1, 1) * (cfg.spread || 0.03), g: cfg.g || 0, ph: Math.random() * TAU, rot: rand(-1, 1) };
        fxWorld.add(sp); fx.objs.push(sp);
      }
    }
    fx.objs = fx.objs.filter((o) => {
      const u = o.userData; u.life += dt;
      if (u.life >= u.max) { fxWorld.remove(o); o.material.dispose(); return false; }
      u.vy -= u.g * dt;
      o.position.x += (u.vx + Math.sin(u.life * 1.5 + u.ph) * (id === 'petals' || id === 'snow' ? 0.08 : 0.03)) * dt;
      o.position.y += u.vy * dt; o.position.z += u.vz * dt;
      o.material.rotation += u.rot * dt * 0.6;
      const k = u.life / u.max; o.material.opacity = Math.min(1, u.life * 2.5) * (1 - Math.max(0, (k - 0.7) / 0.3));
      return true;
    });
  });
}

/* ============================================================ wearables */
function wearableMesh(id, color) {
  const A = S.C.anchors, g = new THREE.Group(), R = A.headR;
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const gold = mat('#ffd43b', { metalness: 0.8, roughness: 0.25 });
  let parent = S.C.rig.head || S.C.root;
  switch (id) {
    case 'bow': {
      [-1, 1].forEach((s) => { const lobe = new THREE.Mesh(new THREE.ConeGeometry(R * 0.2, R * 0.38, 16), mat(color)); lobe.rotation.z = s * Math.PI / 2; lobe.position.x = s * R * 0.2; g.add(lobe); });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.09, 12, 10), mat(shade(color, -0.2))));
      g.position.copy(A.headTop).add(new THREE.Vector3(R * 0.45, -A.headH * 0.05, A.headD * 0.2)); g.rotation.z = -0.4; break;
    }
    case 'flowercrown': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.62, R * 0.035, 8, 40), mat('#51cf66')); ring.rotation.x = Math.PI / 2; g.add(ring);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, f = new THREE.Group(); for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(R * 0.06, 8, 6), mat(i % 2 ? color : '#ffffff')); p.position.set(Math.cos((k / 5) * TAU) * R * 0.06, 0, Math.sin((k / 5) * TAU) * R * 0.06); f.add(p); } f.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 8, 6), mat('#ffd43b'))); f.position.set(Math.cos(a) * R * 0.62, R * 0.03, Math.sin(a) * R * 0.62); g.add(f); }
      g.position.copy(A.headTop).add(new THREE.Vector3(0, -A.headH * 0.12, 0)); break;
    }
    case 'sunglasses': case 'goggles': {
      const isG = id === 'goggles';
      [-1, 1].forEach((s) => {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.2, R * 0.2, R * 0.06, 24), mat(isG ? '#74c0fc' : '#2b2530', { metalness: 0.6, roughness: 0.1 })); lens.rotation.x = Math.PI / 2; lens.position.x = s * R * 0.3; g.add(lens);
        const rimM = new THREE.Mesh(new THREE.TorusGeometry(R * 0.2, R * 0.03, 8, 24), isG ? gold : mat(color)); rimM.position.set(s * R * 0.3, 0, R * 0.03); g.add(rimM);
      });
      const br = new THREE.Mesh(new THREE.BoxGeometry(R * 0.2, R * 0.04, R * 0.04), isG ? gold : mat(color)); g.add(br);
      if (isG) { const strap = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, R * 0.05, 8, 40), mat('#6b4a2e')); strap.rotation.x = Math.PI / 2; strap.position.z = -A.headD * 0.9; g.add(strap); }
      g.position.copy(A.face).add(new THREE.Vector3(0, isG ? A.headH * 0.35 : 0, R * 0.06)); break;
    }
    case 'headphones': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, R * 0.06, 10, 40, Math.PI), mat(color)); g.add(band);
      [-1, 1].forEach((s) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.24, R * 0.24, R * 0.16, 24), mat(shade(color, -0.25))); cup.rotation.z = Math.PI / 2; cup.position.x = s * R * 1.0; g.add(cup); });
      g.position.copy(A.headCenter).add(new THREE.Vector3(0, A.headH * 0.1, 0)); break;
    }
    case 'tiara': {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(R * 0.5, R * 0.03, 8, 30, Math.PI * 0.9), gold); arc.rotation.x = -Math.PI / 2 + 0.3; arc.rotation.z = Math.PI * 0.05; g.add(arc);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(R * 0.11), mat(color, { metalness: 0.3, roughness: 0.05, emissive: color, emissiveIntensity: 0.2 })); gem.position.set(0, R * 0.14, R * 0.47); g.add(gem);
      g.position.copy(A.headTop).add(new THREE.Vector3(0, -A.headH * 0.1, 0)); break;
    }
    case 'partyhat': {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffffff'; for (let i = 0; i < 128; i += 32) x.fillRect(0, i, 128, 14);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(R * 0.32, R * 0.8, 24), mat('#ffffff', { map: t })); cone.position.y = R * 0.4; g.add(cone);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(R * 0.1, 12, 10), mat('#ffd43b')); pom.position.y = R * 0.82; g.add(pom);
      g.position.copy(A.headTop).add(new THREE.Vector3(-R * 0.2, -A.headH * 0.08, 0)); g.rotation.z = 0.25; break;
    }
    case 'scarf': case 'necklace': case 'cape': case 'backpack': case 'fairywings': {
      parent = S.C.rig.torso || S.C.root; const T = A.torsoR;
      if (id === 'scarf') { const ring = new THREE.Mesh(new THREE.TorusGeometry(T * 0.8, T * 0.18, 12, 36), mat(color)); ring.rotation.x = Math.PI / 2; g.add(ring); const tail = new THREE.Mesh(new THREE.BoxGeometry(T * 0.3, T * 0.8, T * 0.1), mat(shade(color, -0.12))); tail.position.set(T * 0.35, -T * 0.4, T * 0.75); tail.rotation.z = 0.2; g.add(tail); g.position.copy(A.neck); }
      if (id === 'necklace') { for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; const p = new THREE.Mesh(new THREE.SphereGeometry(T * 0.06, 10, 8), mat(i % 3 ? '#fffaf0' : color, { roughness: 0.2, metalness: 0.2 })); p.position.set(Math.cos(a) * T * 0.78, -Math.max(0, Math.sin(a)) * T * 0.18, Math.sin(a) * T * 0.78); g.add(p); } g.position.copy(A.neck).add(new THREE.Vector3(0, -T * 0.08, 0)); }
      if (id === 'cape') { const cape = new THREE.Mesh(new THREE.CylinderGeometry(T * 0.9, T * 1.5, A.torsoH * 2.1, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76), mat(color, { side: THREE.DoubleSide })); cape.position.y = -A.torsoH * 0.95; g.add(cape); g.position.copy(A.neck); }
      if (id === 'backpack') { const b = new THREE.Mesh(new THREE.BoxGeometry(T * 1.0, A.torsoH * 1.1, T * 0.5), mat(color)); g.add(b); const pocket = new THREE.Mesh(new THREE.BoxGeometry(T * 0.7, A.torsoH * 0.45, T * 0.15), mat(shade(color, -0.2))); pocket.position.set(0, -A.torsoH * 0.2, -T * 0.3); g.add(pocket); g.position.copy(A.back).add(new THREE.Vector3(0, 0, -T * 0.25)); }
      if (id === 'fairywings') {
        [-1, 1].forEach((s) => { const w = new THREE.Mesh(new THREE.CircleGeometry(T * 0.9, 32), new THREE.MeshPhysicalMaterial({ color: shade(color, 0.4), transparent: true, opacity: 0.6, side: THREE.DoubleSide, iridescence: 1, roughness: 0.2 })); w.scale.set(1, 1.4, 1); w.position.set(s * T * 0.8, T * 0.4, 0); w.rotation.z = s * -0.5; w.userData.flap = s; g.add(w); });
        g.position.copy(A.back).add(new THREE.Vector3(0, 0, -T * 0.1)); g.userData.wings = true;
      }
      break;
    }
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.wearId = id; g.userData.color = color;
  parent.add(g);
  return g;
}
function toggleWearable(id, color = S.color, silent) {
  const C = S.C, have = C.wearables.find((w) => w.userData.wearId === id);
  if (have) { have.parent.remove(have); C.wearables = C.wearables.filter((w) => w !== have); if (!silent) { pushUndo(() => toggleWearable(id, have.userData.color, true)); sfx('undo'); } }
  else { const g = wearableMesh(id, color); C.wearables.push(g); if (!silent) { pushUndo(() => toggleWearable(id, color, true)); sfx('pop'); addRecent({ kind: 'wearable', id }); } }
  scheduleSave(); renderPanel();
}

/* ============================================================ interaction */
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  if (!S.C) return null;
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const h = raycaster.intersectObjects(S.C.all, false)[0];
  return h || null;
}
let ptr = null;
canvas.addEventListener('pointerdown', (e) => {
  if (S.screen !== 'studio' || S.finale || S.paused) return;
  audioInit();
  canvas.setPointerCapture(e.pointerId);
  const h = pick(e);
  ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, moved: false, painting: false, hit: h };
  if (S.mode === 'brush' && h && h.object.userData.surf) {
    ptr.painting = true; beginStroke(); strokeTo(h, 0);
    if (S.mirror) { const m = mirrorHit(h); if (m) strokeTo(m, 1); }
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!ptr || e.pointerId !== ptr.id) return;
  if (Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > 8) ptr.moved = true;
  if (ptr.painting) {
    const h = pick(e);
    if (h && h.object.userData.surf) { strokeTo(h, 0); if (S.mirror) { const m = mirrorHit(h); if (m) strokeTo(m, 1); else stroke.tracks[1].last = null; } }
    else if (stroke) stroke.tracks.forEach((t) => (t.last = null));
  } else if (ptr.moved) {
    const dx = e.clientX - ptr.lx; S.spinVel = dx * 0.006; S.spin += dx * 0.006;
  }
  ptr.lx = e.clientX;
});
const endPtr = (e) => {
  if (!ptr || e.pointerId !== ptr.id) return;
  if (ptr.painting) endStroke();
  else if (!ptr.moved && ptr.hit) onTap(ptr.hit);
  ptr = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(S.zoom * (e.deltaY > 0 ? 0.92 : 1.08)); }, { passive: false });

function onTap(hit) {
  const surf = hit.object.userData.surf;
  if (S.mode === 'effect' && S.effect) { const def = PB.EFFECTS.find((x) => x.id === S.effect); if (def.scope === 'body' || surf) addEffect(def, surf ? surf.part : null); return; }
  if (!surf) { sfx('tick'); return; }
  if (S.mode === 'sticker' && S.sticker) { placeSticker(hit); return; }
  if (S.mode === 'fill') { fillPart(surf.part); wiggle(); }
}
let wiggleT = 0; function wiggle() { wiggleT = 0.6; }

/* ============================================================ camera / layout */
function frameCamera() {
  const H = S.C ? S.C.height : 2;
  const dist = (H * 1.85 * (S.fit || 1)) / (2 * Math.tan((camera.fov * Math.PI) / 360)) / S.zoom;
  camera.position.set(0, H * 0.6 + 0.35, dist);
  camera.lookAt(0, H * 0.4, 0);
}
function setZoom(z) { S.zoom = Math.max(0.8, Math.min(2.4, z)); frameCamera(); }
function layout() {
  const W = innerWidth, H = innerHeight;
  renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  camera.aspect = W / H;
  // centre the plush in the free area (left of the drawer in landscape, above it in portrait)
  const portrait = H > W; document.body.classList.toggle('portrait', portrait);
  const dr = $('drawer').getBoundingClientRect();
  S.fit = portrait ? Math.max(1, Math.min(1.5, (H / Math.max(200, dr.top)) * 0.78)) : 1;
  if (portrait) camera.setViewOffset(W, H, 0, (H - dr.top) / 2 - 10, W, H);
  else camera.setViewOffset(W, H, (W - dr.left) / 2 - 30, 0, W, H);
  camera.updateProjectionMatrix(); frameCamera();
}
addEventListener('resize', () => { layout(); });

/* ============================================================ animation (idle, dance) */
function animateRig(dt) {
  const C = S.C; if (!C) return;
  const R = C.rig, B = R.base, t = S.time, root = C.root;
  const reset = (k) => { const o = R[k]; if (o && B[k]) { o.rotation.copy(B[k].r); o.position.copy(B[k].p); o.scale.copy(B[k].s); } };
  ['head', 'torso', 'armL', 'armR', 'legL', 'legR', 'tail', 'earL', 'earR'].forEach(reset);
  root.position.copy(R.rootBase.p); root.rotation.copy(R.rootBase.r);
  // idle: breathe + gentle head tilt + tail sway
  if (R.torso) R.torso.scale.y = B.torso.s.y * (1 + 0.012 * Math.sin(t * 1.6));
  if (R.head) { R.head.rotation.z += 0.04 * Math.sin(t * 0.7); R.head.rotation.x += 0.02 * Math.sin(t * 0.9); }
  if (R.tail) R.tail.rotation.y += 0.15 * Math.sin(t * 1.2);
  if (R.earL && Math.sin(t * 0.5) > 0.97) R.earL.rotation.z += 0.12 * Math.sin(t * 20);
  if (wiggleT > 0) { wiggleT -= dt; root.rotation.z += Math.sin(wiggleT * 22) * 0.05 * wiggleT; }
  C.wearables.forEach((w) => { if (w.userData.wings) w.children.forEach((c) => { c.rotation.y = c.userData.flap * (0.25 + 0.2 * Math.sin(t * 2.2)); }); });
  const F = S.finale; if (!F) return;
  const ft = F.t;
  if (ft < 1.6) { if (R.head) R.head.rotation.x += Math.min(1, ft * 2) * 0.28; return; }
  const style = Math.floor((ft - 1.6) / 3.2) % 4, u = ft - 1.6, beat = u * TAU * (110 / 60) / 2;
  const up = (o, k, v) => { if (o) o.rotation[k] += v; };
  if (style === 0) { root.rotation.z += 0.12 * Math.sin(beat); up(R.armL, 'z', 0.6 + 0.4 * Math.sin(beat)); up(R.armR, 'z', -0.6 - 0.4 * Math.sin(beat)); }
  if (style === 1) { root.position.y += Math.abs(Math.sin(beat)) * 0.14; up(R.armL, 'z', 1.2); up(R.armR, 'z', -1.2); up(R.legL, 'x', 0.3 * Math.sin(beat)); up(R.legR, 'x', -0.3 * Math.sin(beat)); }
  if (style === 2) { root.rotation.y += (u % 3.2) / 3.2 * TAU; up(R.armL, 'z', 0.9); up(R.armR, 'z', -0.9); }
  if (style === 3) { up(R.armR, 'z', -1.6 - 0.35 * Math.sin(beat * 2)); if (R.head) R.head.rotation.z += 0.15 * Math.sin(beat); root.position.y += Math.abs(Math.sin(beat)) * 0.05; }
  up(R.tail, 'y', 0.4 * Math.sin(beat * 2));
}

/* ============================================================ finale: comes alive */
function startFinale() {
  if (!S.C || S.finale) return;
  S.finale = { t: 0 };
  document.body.classList.add('finale');
  S.spin = 0; S.spinVel = 0;
  music('dance'); sfx('chime');
  const lines = { lunabat: 'Wow! I love my new colors!', sunnyfox: 'Yay! I feel so sparkly!', poppydash: 'Whoa! Let\u2019s dance!' };
  say(lines[S.C.def.id] || 'Wow! I love it!', 3.2);
  S.done[S.C.def.id] = true; persistPrefs(); saveNow();
  confettiBurst();
}
function confettiBurst() {
  const C = S.C; if (!C) return;
  const center = new THREE.Vector3(); holder.getWorldPosition(center);
  for (let i = 0; i < 26; i++) {
    const col = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#faa2c1'][i % 6];
    const sp = sprite(i % 3 ? 'confetto' : 'star', col, rand(0.04, 0.07));
    sp.position.set(center.x + rand(-0.8, 0.8), center.y + C.height * rand(1.0, 1.3), center.z + rand(-0.5, 0.6));
    sp.userData = { ...sp.userData, life: 0, max: rand(3.5, 5), vy: -rand(0.12, 0.22), ph: Math.random() * TAU, rot: rand(-1, 1) };
    fxWorld.add(sp); loose.push(sp);
  }
}
const loose = [];
function updateLoose(dt) {
  for (let i = loose.length - 1; i >= 0; i--) {
    const o = loose[i], u = o.userData; u.life += dt;
    if (u.life > u.max) { fxWorld.remove(o); o.material.dispose(); loose.splice(i, 1); continue; }
    o.position.y += u.vy * dt; o.position.x += Math.sin(u.life * 1.6 + u.ph) * 0.06 * dt; o.material.rotation += u.rot * dt;
    o.material.opacity = Math.min(1, u.life * 2) * (1 - Math.max(0, (u.life / u.max - 0.75) / 0.25));
  }
}
function updateFinale(dt) {
  const F = S.finale; if (!F) return;
  F.t += dt;
  if (!F.c2 && F.t > 7) { F.c2 = true; confettiBurst(); }
  if (F.t > 14.5) {
    S.finale = null; document.body.classList.remove('finale'); music('studio');
    say('Let\u2019s paint another friend!', 3);
    $('picker').classList.add('glow'); setTimeout(() => $('picker').classList.remove('glow'), 4000);
  }
}
let sayTimer = 0;
function say(text, secs) { const b = $('bubble'); b.textContent = text; b.classList.remove('hidden'); clearTimeout(sayTimer); sayTimer = setTimeout(() => b.classList.add('hidden'), secs * 1000); }
function positionBubble() {
  const b = $('bubble'); if (b.classList.contains('hidden') || !S.C) return;
  const v = new THREE.Vector3(0, S.C.top + 0.15, 0); holder.localToWorld(v); v.project(camera);
  b.style.left = ((v.x + 1) / 2) * innerWidth + 'px'; b.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
}

/* ============================================================ surprise me 🎲 */
function surprise() {
  const C = S.C; if (!C) return;
  const surfs = C.surfaces, snap = snapshot(surfs);
  const oldFx = C.effects.slice();
  const H = Math.random() * 360, hsl = (h, s, l) => { const c = new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l); return '#' + c.getHexString(); };
  const main = hsl(H, 0.72, 0.56), accent = hsl(H + rand(130, 170), 0.75, 0.62), light = hsl(H, 0.7, 0.84), deep = hsl(H + 20, 0.6, 0.38);
  const parts = [...C.parts.values()].sort((a, b) => b.area - a.area), seen = new Set();
  const inner = /muzzle|eyePatch|cheek/;
  const pats = ['dots', 'hearts', 'star', 'stripes', 'flower', 'moonstar', 'checkers', 'rainbow', 'strawberry', 'leopard'].map((p) => (p === 'hearts' ? 'heart' : p));
  const sps = ['glitter', 'holo', 'satin', 'velvet', 'pearl', 'galaxy', 'rainbow', 'colorshift'];
  let patDone = false, spDone = false;
  parts.forEach((P, idx) => {
    if (seen.has(P)) return; seen.add(P); if (P.mirror) seen.add(P.mirror);
    const orig = lum(P.orig), isLight = orig > 0.72 || inner.test(P.region);
    let spec = { type: 'color', color: idx === 0 ? main : isLight ? light : Math.random() < 0.5 ? accent : main };
    if (!patDone && idx > 0 && P.area > 0.15 && Math.random() < 0.7) { patDone = true; spec = { type: 'pattern', id: pats[Math.random() * pats.length | 0], c1: accent, c2: light, size: 1 }; }
    else if (!spDone && idx > 1 && Math.random() < 0.6) { spDone = true; spec = { type: 'special', id: sps[Math.random() * sps.length | 0], color: accent }; }
    else if (idx > 0 && !isLight && Math.random() < 0.25) spec = { type: 'color', color: deep };
    [P, P.mirror].filter(Boolean).forEach((p) => p.surfaces.forEach((s) => paintSurface(s, spec)));
  });
  oldFx.forEach((f) => removeEffect(f, true));
  const fxPool = PB.EFFECTS.filter((e) => ['twinkle', 'moondust', 'hearts', 'fireflies', 'petals', 'bubbles', 'butterflies', 'notes'].includes(e.id));
  const def = fxPool[Math.random() * fxPool.length | 0];
  const newFx = addEffect(def, parts[Math.min(1, parts.length - 1)]); S.undo.pop();
  pushUndo(() => { restoreSnap(snap); newFx && removeEffect(newFx, true); oldFx.forEach((f) => addEffect(f.def, f.part) && S.undo.pop()); });
  S.color = accent; renderColorChip(); sfx('sparkle'); wiggle();
}

/* ============================================================ hint: real colors */
let hintT = 0;
function showHint() {
  if (!S.C || hintT > 0) return;
  hintT = 2.4; S.C.surfaces.forEach((s) => { const m = s.mesh.material; m.map = null; m.color.set(s.orig); m.needsUpdate = true; });
  say('These are my real colors!', 2.2); sfx('sparkle');
}
function endHint() { S.C && S.C.surfaces.forEach((s) => { const m = s.mesh.material; m.map = s.tex; m.color.set('#ffffff'); m.needsUpdate = true; }); }

/* ============================================================ lights */
function setLights(on) {
  S.lights = on; document.body.classList.toggle('night', !on);
  LIGHTS.forEach(([l, v]) => (l.intensity = on ? v : v * 0.22));
  renderer.toneMappingExposure = on ? 1.05 : 0.9;
  S.C && S.C.surfaces.forEach((s) => s.glow && applyMaterial(s));
  $('lightsBtn').textContent = on ? '🌙' : '☀️';
}

/* ============================================================ save / load (IndexedDB) */
let dbP = null;
function db() {
  if (dbP) return dbP;
  dbP = new Promise((res) => { try { const r = indexedDB.open('critterPaint', 1); r.onupgradeneeded = () => r.result.createObjectStore('critters'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (_) { res(null); } });
  return dbP;
}
async function idb(op, keyName, val) {
  const d = await db(); if (!d) return null;
  return new Promise((res) => { const tx = d.transaction('critters', op === 'get' ? 'readonly' : 'readwrite'); const st = tx.objectStore('critters'); const rq = op === 'get' ? st.get(keyName) : op === 'del' ? st.delete(keyName) : st.put(val, keyName); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); });
}
let saveTimer = 0;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1200); }
async function saveNow() {
  const C = S.C; if (!C) return;
  const rec = {
    v: 1, surfaces: C.surfaces.filter((s) => s.dirty).map((s) => ({ i: s.i, img: s.cv.toDataURL('image/jpeg', 0.88), emis: s.emis ? s.emis.cv.toDataURL('image/jpeg', 0.85) : null, special: s.special, fillColor: s.fillColor, neon: !!s.neon })),
    effects: C.effects.map((e) => ({ id: e.def.id, part: e.part ? e.part.key : null })), wearables: C.wearables.map((w) => ({ id: w.userData.wearId, color: w.userData.color })),
  };
  await idb('put', C.def.id, rec);
  S.lastSave = Date.now();
}
async function loadSaved(id) {
  const rec = await idb('get', id); const C = S.C;
  if (!rec || !C || C.def.id !== id) return;
  await Promise.all(rec.surfaces.map((r) => new Promise((res) => {
    const s = C.surfaces[r.i]; if (!s) return res();
    const im = new Image(); im.onload = () => {
      s.ctx.drawImage(im, 0, 0, s.w, s.h); s.special = r.special; s.fillColor = r.fillColor; s.neon = r.neon; s.dirty = true;
      if (r.emis) { const e = new Image(); e.onload = () => { ensureEmis(s).ctx.drawImage(e, 0, 0, s.w, s.h); s.emisTex.needsUpdate = true; applyMaterial(s); res(); }; e.onerror = res; e.src = r.emis; }
      else { applyMaterial(s); res(); }
      dirtyTex.add(s);
    }; im.onerror = res; im.src = r.img;
  })));
  (rec.effects || []).forEach((e) => { const def = PB.EFFECTS.find((x) => x.id === e.id); if (def) { addEffect(def, e.part ? C.parts.get(e.part) : null); S.undo.pop(); } });
  (rec.wearables || []).forEach((w) => toggleWearable(w.id, w.color, true));
  S.undo = []; updateUndo();
}
async function resetCritter() {
  const id = S.C.def.id; await idb('del', id); delete S.done[id]; persistPrefs(); await loadCritter(id); sfx('undo');
}

/* ============================================================ audio */
let AC = null, sfxBus = null;
const tracks = { studio: new Audio('music/studio_theme.mp3'), dance: new Audio('music/dance_party.mp3') };
Object.values(tracks).forEach((a) => { a.loop = true; a.volume = 0.45; a.preload = 'auto'; });
let curTrack = null;
function music(name) {
  curTrack = name;
  Object.entries(tracks).forEach(([k, a]) => { if (k !== name) a.pause(); });
  const a = tracks[name]; if (!a) return;
  if (S.music && !S.paused && S.screen !== 'title') { if (name === 'dance') a.currentTime = 0; a.play().catch(() => { }); } else a.pause();
}
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
  AC = new A(); sfxBus = AC.createGain(); sfxBus.gain.value = 0.35; sfxBus.connect(AC.destination);
}
function tone(f, t, dur, type = 'sine', vol = 0.3, slide) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function whoosh(t, dur, f0, f1, vol = 0.25) {
  const n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = b; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t);
}
function sfx(name) {
  if (!S.sound || !AC) return; const t = AC.currentTime;
  switch (name) {
    case 'fill': whoosh(t, 0.35, 300, 1400, 0.3); tone(330, t, 0.25, 'sine', 0.15, 520); break;
    case 'pop': tone(600, t, 0.12, 'sine', 0.3, 1200); break;
    case 'tick': tone(1200, t, 0.05, 'triangle', 0.12); break;
    case 'undo': tone(520, t, 0.12, 'sine', 0.2, 300); break;
    case 'sparkle': [1319, 1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.07, 0.35, 'sine', 0.12)); break;
    case 'mix': whoosh(t, 0.8, 200, 900, 0.2); tone(440, t + 0.6, 0.4, 'triangle', 0.15, 660); break;
    case 'chime': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.12, 0.8, 'triangle', 0.18)); break;
  }
}

/* ============================================================ UI: drawers & tiles */
const TABS = [['colors', '🖍️'], ['specials', '💎'], ['patterns', '🧵'], ['brushes', '🖌️'], ['effects', '✨'], ['stickers', '⭐']];
function tileCanvas(size = 96) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
function specialPreview(sp) {
  const c = tileCanvas(), g = c.getContext('2d'), surf = { ctx: g, w: 96, h: 96, lenU: 0.5, lenV: 0.5 };
  g.save(); g.beginPath(); g.arc(48, 48, 44, 0, TAU); g.clip();
  PB.renderFill(surf, { type: 'special', id: sp.id, color: S.color });
  const hl = g.createRadialGradient(34, 30, 4, 48, 48, 50); hl.addColorStop(0, 'rgba(255,255,255,.75)'); hl.addColorStop(0.35, 'rgba(255,255,255,.1)'); hl.addColorStop(1, sp.mat && sp.mat.metalness > 0.8 ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.18)'); g.fillStyle = hl; g.fillRect(0, 0, 96, 96);
  if (sp.id === 'glow') { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, 96, 96); }
  g.restore(); return c;
}
function patternPreview(id) { const c = tileCanvas(), g = c.getContext('2d'); PB.renderFill({ ctx: g, w: 96, h: 96, lenU: 0.4, lenV: 0.4 }, { type: 'pattern', id, c1: S.color, c2: S.bg, size: 1 }); return c; }
function brushPreview(b) {
  const c = tileCanvas(), g = c.getContext('2d'); g.fillStyle = '#fffdf7'; g.fillRect(0, 0, 96, 96);
  const st = { rand: mulberry(7), dist: 0, blank: '#fffdf7' }, br = b.motif ? 8 : 7, sp = PB.brushSpacing(b);
  let lx = 14, ly = 64;
  const emis = b.id === 'neon' ? null : null;
  for (let x = 14; x <= 82; x += 1) { const y = 48 + Math.sin((x - 14) / 11) * 16; const d = Math.hypot(x - lx, y - ly); if (d >= br * sp || x === 14) { st.dist += d; PB.brushDab(g, b, x, y, br, br, b.id === 'eraser' ? '#fffdf7' : S.color, st, emis); lx = x; ly = y; } }
  if (b.id === 'eraser') { g.font = '40px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🧽', 48, 50); }
  return c;
}
function effectPreview(e) {
  const c = tileCanvas(), g = c.getContext('2d');
  const bgs = { twinkle: ['#3b2f6b', '#6741d9'], bubbles: ['#d0ebff', '#a5d8ff'], rainbowflow: ['#fff0f6', '#e5dbff'], warmglow: ['#5c3a12', '#e8590c'], moondust: ['#2b2350', '#5f3dc4'], snow: ['#a5d8ff', '#d0ebff'], petals: ['#fff0f6', '#ffdeeb'], butterflies: ['#e6fcf5', '#c3fae8'], hearts: ['#fff0f6', '#ffc9de'], popcorn: ['#fff9db', '#ffec99'], aurora: ['#0b1a33', '#1b3a5c'], ripple: ['#d0ebff', '#74c0fc'], galaxyswirl: ['#1b1446', '#3b1f73'], confetti: ['#fffdf7', '#fff3bf'], halo: ['#fff9db', '#ffe8cc'], fireflies: ['#1f2a1a', '#2b4a2a'], notes: ['#f3f0ff', '#e5dbff'], aura: ['#fff0f6', '#fcc2d7'] }[e.id];
  const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, bgs[0]); gr.addColorStop(1, bgs[1]); g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
  const put = (m, col, x, y, r, rot = 0) => drawMotif(g, m, x, y, r, r, col, undefined, rot);
  switch (e.id) {
    case 'rainbowflow': put('rainbow', null, 48, 52, 38); break;
    case 'warmglow': put('firefly', '#ffb347', 48, 48, 40); put('lantern', '#ffd43b', 48, 50, 20); break;
    case 'aurora': { for (let i = 0; i < 3; i++) { g.strokeStyle = ['#63e6be', '#b197fc', '#74c0fc'][i]; g.globalAlpha = 0.7; g.lineWidth = 9; g.beginPath(); for (let x = 0; x <= 96; x += 4) g.lineTo(x, 30 + i * 14 + Math.sin(x / 14 + i) * 8); g.stroke(); } g.globalAlpha = 1; break; }
    case 'ripple': g.strokeStyle = '#ffffff'; g.lineWidth = 3; [12, 24, 36].forEach((r) => { g.beginPath(); g.ellipse(48, 56, r, r * 0.45, 0, 0, TAU); g.stroke(); }); put('drop', '#339af0', 48, 30, 14); break;
    case 'galaxyswirl': for (let i = 0; i < 120; i++) { const a = i * 0.35, r = i * 0.33; g.fillStyle = i % 5 ? '#d0bfff' : '#ffe066'; g.fillRect(48 + Math.cos(a) * r, 48 + Math.sin(a) * r, 2.5, 2.5); } break;
    case 'aura': put('glowdot', '#ff8fc7', 48, 48, 42); break;
    case 'halo': g.strokeStyle = '#fcc419'; g.lineWidth = 7; g.beginPath(); g.ellipse(48, 40, 28, 10, 0, 0, TAU); g.stroke(); put('sparkle', '#ffe066', 78, 22, 9); break;
    case 'confetti': for (let i = 0; i < 16; i++) { g.save(); g.translate(10 + (i * 37) % 78, 12 + (i * 23) % 74); g.rotate(i); g.fillStyle = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'][i % 5]; g.fillRect(-6, -3, 12, 6); g.restore(); } break;
    default: { const pts = [[30, 32, 16], [64, 26, 12], [52, 60, 20], [22, 70, 11], [76, 66, 13]]; pts.forEach(([x, y, r], i) => put(e.motif, e.id === 'notes' ? ['#845ef7', '#f06595', '#339af0'][i % 3] : e.id === 'butterflies' ? ['#b197fc', '#faa2c1', '#74c0fc'][i % 3] : e.color, x, y, r, (i - 2) * 0.2)); }
  }
  return c;
}
function stickerPreview(st) { const c = tileCanvas(), g = c.getContext('2d'); g.fillStyle = '#fffdf7'; g.fillRect(0, 0, 96, 96); PB.stickerDecal(g, st, 48, 48, 34, 34, 0); return c; }
function wearablePreview(id) {
  const c = tileCanvas(), g = c.getContext('2d'); g.fillStyle = '#fffdf7'; g.fillRect(0, 0, 96, 96); const col = S.color;
  g.lineJoin = 'round'; g.lineCap = 'round';
  const M = { flowercrown: () => { g.strokeStyle = '#51cf66'; g.lineWidth = 5; g.beginPath(); g.ellipse(48, 56, 34, 14, 0, 0, TAU); g.stroke(); [18, 34, 48, 62, 78].forEach((x, i) => drawMotif(g, 'flower', x, 50 + (i % 2) * 8, 10, 10, i % 2 ? col : '#ffffff')); },
    tiara: () => drawMotif(g, 'crown', 48, 50, 32, 26, '#ffd43b'), fairywings: () => drawMotif(g, 'butterfly', 48, 48, 38, 38, shade(col, 0.3)),
    bow: () => { g.fillStyle = col; [-1, 1].forEach((s) => { g.beginPath(); g.moveTo(48, 48); g.lineTo(48 + s * 36, 26); g.lineTo(48 + s * 36, 70); g.closePath(); g.fill(); }); g.beginPath(); g.arc(48, 48, 9, 0, TAU); g.fillStyle = shade(col, -0.25); g.fill(); },
    sunglasses: () => { g.fillStyle = '#2b2530'; [30, 66].forEach((x) => { g.beginPath(); g.arc(x, 50, 15, 0, TAU); g.fill(); }); g.strokeStyle = col; g.lineWidth = 4; [30, 66].forEach((x) => { g.beginPath(); g.arc(x, 50, 15, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(45, 48); g.lineTo(51, 48); g.stroke(); },
    goggles: () => { g.strokeStyle = '#6b4a2e'; g.lineWidth = 7; g.beginPath(); g.moveTo(6, 50); g.lineTo(90, 50); g.stroke(); g.fillStyle = '#74c0fc'; [30, 66].forEach((x) => { g.beginPath(); g.arc(x, 50, 14, 0, TAU); g.fill(); }); g.strokeStyle = '#fcc419'; g.lineWidth = 4; [30, 66].forEach((x) => { g.beginPath(); g.arc(x, 50, 14, 0, TAU); g.stroke(); }); },
    headphones: () => { g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.arc(48, 56, 30, Math.PI, 0); g.stroke(); g.fillStyle = shade(col, -0.25); g.fillRect(12, 50, 14, 24); g.fillRect(70, 50, 14, 24); },
    scarf: () => { g.fillStyle = col; g.fillRect(16, 34, 64, 18); g.fillRect(54, 40, 16, 40); g.fillStyle = shade(col, -0.2); for (let x = 20; x < 80; x += 12) g.fillRect(x, 34, 5, 18); },
    cape: () => { g.fillStyle = col; g.beginPath(); g.moveTo(34, 18); g.lineTo(62, 18); g.lineTo(84, 84); g.quadraticCurveTo(48, 92, 12, 84); g.closePath(); g.fill(); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(48, 20, 5, 0, TAU); g.fill(); },
    backpack: () => { g.fillStyle = col; g.beginPath(); g.roundRect(24, 22, 48, 60, 12); g.fill(); g.fillStyle = shade(col, -0.2); g.beginPath(); g.roundRect(32, 52, 32, 22, 6); g.fill(); g.strokeStyle = shade(col, -0.35); g.lineWidth = 4; g.beginPath(); g.arc(48, 22, 10, Math.PI, 0); g.stroke(); },
    partyhat: () => { g.fillStyle = col; g.beginPath(); g.moveTo(48, 12); g.lineTo(72, 82); g.lineTo(24, 82); g.closePath(); g.fill(); g.fillStyle = '#fff'; [40, 58].forEach((y) => { g.beginPath(); g.moveTo(48 - (y - 12) * 0.34, y); g.lineTo(48 + (y - 12) * 0.34, y); g.lineTo(48 + (y + 7 - 12) * 0.34, y + 7); g.lineTo(48 - (y + 7 - 12) * 0.34, y + 7); g.fill(); }); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(48, 12, 7, 0, TAU); g.fill(); },
    necklace: () => { for (let i = 0; i < 13; i++) { const a = Math.PI * 0.1 + (i / 12) * Math.PI * 0.8; g.beginPath(); g.arc(48 + Math.cos(a) * 32, 30 + Math.sin(a) * 36, 6, 0, TAU); g.fillStyle = i % 3 ? '#fffaf0' : col; g.fill(); g.strokeStyle = '#d8cfc0'; g.lineWidth = 1; g.stroke(); } },
  };
  (M[id] || (() => { }))(); return c;
}

function tileEl(content, sel, onClick, extraClass = '') {
  const b = document.createElement('button'); b.className = 'tile ' + extraClass + (sel ? ' sel' : '');
  if (typeof content === 'string') b.style.background = content; else b.appendChild(content);
  b.addEventListener('click', () => { audioInit(); sfx('tick'); onClick(); });
  return b;
}
function section(title) { const h = document.createElement('div'); h.className = 'sec'; h.textContent = title; return h; }
function grid() { const g = document.createElement('div'); g.className = 'grid'; return g; }

function renderPanel() {
  const P = $('panel'); P.innerHTML = '';
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('sel', b.dataset.tab === S.tab));
  const tab = S.tab;
  if (tab === 'colors') {
    const mixRow = document.createElement('div'); mixRow.className = 'mixrow';
    const bowl = document.createElement('button'); bowl.className = 'bowl' + (S.mixing ? ' on' : ''); bowl.title = 'Mix';
    const a = S.mixing && S.mixing[0], b2 = S.mixing && S.mixing[1];
    bowl.innerHTML = `<span style="background:${a || '#f1e4d0'}"></span><i>+</i><span style="background:${b2 || '#f1e4d0'}"></span>`;
    bowl.onclick = () => { audioInit(); S.mixing = S.mixing ? null : []; sfx('tick'); renderPanel(); };
    mixRow.appendChild(bowl);
    const mine = document.createElement('div'); mine.className = 'mine';
    S.myColors.forEach((c) => mine.appendChild(tileEl(c, S.color === c, () => pickColor(c), 'sw small')));
    mixRow.appendChild(mine); P.appendChild(mixRow);
    const g = grid(); g.classList.add('g5');
    PB.COLORS.forEach((c) => g.appendChild(tileEl(c, S.color === c, () => pickColor(c), 'sw')));
    P.appendChild(g);
    const g2 = grid(); g2.classList.add('g4');
    PB.SIGNATURE.forEach((s) => { const cv = tileCanvas(); const x = cv.getContext('2d'); x.fillStyle = s.c; x.beginPath(); x.arc(48, 48, 44, 0, TAU); x.fill(); drawMotif(x, 'heart', 70, 70, 14, 14, '#ffffff'); g2.appendChild(tileEl(cv, S.color === s.c, () => pickColor(s.c), 'sw')); });
    P.appendChild(section('✦')); P.appendChild(g2);
  }
  if (tab === 'specials') {
    const g = grid();
    g.appendChild(tileEl(plainTile(), S.fill.kind === 'color', () => setFill({ kind: 'color' })));
    PB.SPECIALS.forEach((sp) => g.appendChild(tileEl(specialPreview(sp), S.fill.kind === 'special' && S.fill.id === sp.id, () => setFill({ kind: 'special', id: sp.id }), 'shimmer')));
    P.appendChild(g);
  }
  if (tab === 'patterns') {
    const bgRow = document.createElement('div'); bgRow.className = 'bgrow';
    PB.BG_CHOICES.forEach((c) => { const b = document.createElement('button'); b.className = 'bgc' + (S.bg === c ? ' sel' : ''); b.style.background = c === 'auto' ? `linear-gradient(135deg, ${S.color} 50%, ${shade(S.color, 0.7)} 50%)` : c; b.onclick = () => { S.bg = c; sfx('tick'); renderPanel(); }; bgRow.appendChild(b); });
    const sizes = document.createElement('div'); sizes.className = 'sizes';
    ['•', '●', '⬤'].forEach((t, i) => { const b = document.createElement('button'); b.textContent = t; b.className = S.size === i ? 'sel' : ''; b.onclick = () => { S.size = i; renderSize(); renderPanel(); }; sizes.appendChild(b); });
    bgRow.appendChild(sizes); P.appendChild(bgRow);
    const g = grid();
    g.appendChild(tileEl(plainTile(), S.fill.kind === 'color', () => setFill({ kind: 'color' })));
    PB.PATTERNS.forEach((p) => g.appendChild(tileEl(patternPreview(p.id), S.fill.kind === 'pattern' && S.fill.id === p.id, () => setFill({ kind: 'pattern', id: p.id }))));
    P.appendChild(g);
  }
  if (tab === 'brushes') {
    const g = grid();
    PB.BRUSHES.forEach((b) => g.appendChild(tileEl(brushPreview(b), S.mode === 'brush' && S.brush === b.id, () => { S.brush = b.id; setMode('brush'); addRecent(); })));
    P.appendChild(g);
  }
  if (tab === 'effects') {
    const g = grid();
    PB.EFFECTS.forEach((e) => { const on = S.C && S.C.effects.some((x) => x.def.id === e.id); g.appendChild(tileEl(effectPreview(e), S.mode === 'effect' && S.effect === e.id, () => { S.effect = e.id; setMode('effect'); hintTap(); }, 'shimmer' + (on ? ' active' : ''))); });
    P.appendChild(g);
  }
  if (tab === 'stickers') {
    const g = grid();
    PB.STICKERS.forEach((st) => g.appendChild(tileEl(stickerPreview(st), S.mode === 'sticker' && S.sticker === st.id, () => { S.sticker = st.id; setMode('sticker'); hintTap(); })));
    P.appendChild(g);
    P.appendChild(section('👒'));
    const g2 = grid();
    PB.WEARABLES.forEach((w) => { const on = S.C && S.C.wearables.some((x) => x.userData.wearId === w.id); g2.appendChild(tileEl(wearablePreview(w.id), on, () => toggleWearable(w.id), on ? 'active' : '')); });
    P.appendChild(g2);
  }
}
function plainTile() { const c = tileCanvas(), g = c.getContext('2d'); g.fillStyle = S.color; g.beginPath(); g.arc(48, 48, 40, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(36, 34, 10, 0, TAU); g.fill(); return c; }
function hintTap() { const h = $('tapHint'); h.classList.remove('hidden'); clearTimeout(hintTap.t); hintTap.t = setTimeout(() => h.classList.add('hidden'), 1800); }

function pickColor(c) {
  if (S.mixing) {
    S.mixing.push(c);
    if (S.mixing.length === 2) {
      const m = PB.mixColors(S.mixing[0], S.mixing[1]);
      if (!S.myColors.includes(m)) { S.myColors.unshift(m); S.myColors = S.myColors.slice(0, 12); toast('New color!', m); }
      S.color = m; S.mixing = null; sfx('mix'); persistPrefs();
    }
    renderPanel(); renderColorChip(); return;
  }
  S.color = c;
  if (S.mode === 'effect' || S.mode === 'sticker') setMode('fill', true);
  if (S.fill.kind === 'special' && PB.SPECIALS.find((s) => s.id === S.fill.id).fixed) S.fill = { kind: 'color' };
  renderColorChip(); renderPanel();
}
function setFill(f) { S.fill = f; setMode('fill', true); addRecent(); renderPanel(); }
function setMode(m, quiet) {
  S.mode = m;
  $('fillBtn').classList.toggle('sel', m === 'fill'); $('brushBtn').classList.toggle('sel', m === 'brush');
  renderColorChip(); if (!quiet) renderPanel();
}
function renderSize() { $('sizeBtn').textContent = ['•', '●', '⬤'][S.size]; }
function currentToolCanvas() {
  if (S.mode === 'brush') return brushPreview(PB.BRUSHES.find((b) => b.id === S.brush));
  if (S.mode === 'effect') return effectPreview(PB.EFFECTS.find((e) => e.id === S.effect));
  if (S.mode === 'sticker') return stickerPreview(PB.STICKERS.find((s) => s.id === S.sticker));
  if (S.fill.kind === 'special') return specialPreview(PB.SPECIALS.find((s) => s.id === S.fill.id));
  if (S.fill.kind === 'pattern') return patternPreview(S.fill.id);
  return plainTile();
}
function renderColorChip() { const el = $('current'); el.innerHTML = ''; el.appendChild(currentToolCanvas()); const dot = document.createElement('i'); dot.style.background = S.color; el.appendChild(dot); }

function addRecent(item) {
  item = item || (S.mode === 'brush' ? { kind: 'brush', id: S.brush } : S.mode === 'effect' ? { kind: 'effect', id: S.effect } : S.mode === 'sticker' ? { kind: 'sticker', id: S.sticker } : { kind: S.fill.kind, id: S.fill.id });
  item = { ...item, color: S.color };
  const k = JSON.stringify(item);
  S.recent = [item, ...S.recent.filter((r) => JSON.stringify(r) !== k)].slice(0, 8);
  persistPrefs(); renderRecent(); renderColorChip();
}
function renderRecent() {
  const el = $('recent'); el.innerHTML = '';
  S.recent.forEach((r) => {
    let cv; const keep = S.color; S.color = r.color;
    if (r.kind === 'brush') cv = brushPreview(PB.BRUSHES.find((b) => b.id === r.id));
    else if (r.kind === 'effect') cv = effectPreview(PB.EFFECTS.find((e) => e.id === r.id));
    else if (r.kind === 'sticker') cv = stickerPreview(PB.STICKERS.find((s) => s.id === r.id));
    else if (r.kind === 'special') cv = specialPreview(PB.SPECIALS.find((s) => s.id === r.id));
    else if (r.kind === 'pattern') cv = patternPreview(r.id);
    else if (r.kind === 'wearable') cv = wearablePreview(r.id);
    else cv = plainTile();
    S.color = keep;
    el.appendChild(tileEl(cv, false, () => {
      S.color = r.color;
      if (r.kind === 'brush') { S.brush = r.id; setMode('brush'); } else if (r.kind === 'effect') { S.effect = r.id; setMode('effect'); } else if (r.kind === 'sticker') { S.sticker = r.id; setMode('sticker'); } else if (r.kind === 'wearable') toggleWearable(r.id); else { S.fill = { kind: r.kind, id: r.id }; setMode('fill'); }
      renderColorChip();
    }, 'mini'));
  });
}
let toastT = 0;
function toast(text, color) { const t = $('toast'); t.innerHTML = `<span style="background:${color}"></span>${text}`; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2200); }

/* ============================================================ top bar & screens */
function buildStatic() {
  const tabs = $('tabs');
  TABS.forEach(([id, icon]) => { const b = document.createElement('button'); b.dataset.tab = id; b.textContent = icon; b.onclick = () => { audioInit(); S.tab = id; sfx('tick'); renderPanel(); $('panel').scrollTop = 0; }; tabs.appendChild(b); });
  const picker = $('picker'), cards = $('cards');
  CRITTERS.forEach((c) => {
    const b = document.createElement('button'); b.className = 'pick'; b.dataset.id = c.id; b.innerHTML = `<img src="icons/${c.id}.jpg" alt="">`;
    b.onclick = async () => { if (S.finale || S.C && S.C.def.id === c.id) return; audioInit(); sfx('tick'); await saveNow(); await loadCritter(c.id); renderPanel(); };
    picker.appendChild(b);
    const card = document.createElement('button'); card.className = 'card' + (S.critterId === c.id ? ' sel' : ''); card.dataset.id = c.id;
    card.innerHTML = `<img src="icons/${c.id}.jpg" alt=""><b>${c.name}</b>${S.done[c.id] ? '<em>✓</em>' : ''}`;
    card.onclick = () => { audioInit(); sfx('tick'); S.critterId = c.id; document.querySelectorAll('.card').forEach((x) => x.classList.toggle('sel', x === card)); };
    cards.appendChild(card);
  });
  $('fillBtn').onclick = () => { setMode('fill'); sfx('tick'); };
  $('brushBtn').onclick = () => { setMode('brush'); sfx('tick'); };
  $('sizeBtn').onclick = () => { S.size = (S.size + 1) % 3; renderSize(); sfx('tick'); if (S.tab === 'patterns') renderPanel(); };
  $('mirrorBtn').onclick = () => { S.mirror = !S.mirror; $('mirrorBtn').classList.toggle('sel', S.mirror); sfx('tick'); };
  $('undoBtn').onclick = () => doUndo();
  $('hintBtn').onclick = () => showHint();
  $('lightsBtn').onclick = () => { setLights(!S.lights); sfx('tick'); };
  $('diceBtn').onclick = () => { audioInit(); surprise(); };
  $('zoomIn').onclick = () => setZoom(S.zoom * 1.15);
  $('zoomOut').onclick = () => setZoom(S.zoom / 1.15);
  $('doneBtn').onclick = () => { audioInit(); startFinale(); };
  $('resetBtn').onclick = () => { if (confirm('Start this critter over?')) resetCritter(); };
  $('startBtn').onclick = () => { audioInit(); if (S.screen === 'title') enterStudio(); else if (S.paused) setPaused(false); };
  $('bigStart').onclick = () => { audioInit(); enterStudio(); };
  $('pauseBtn').onclick = () => { if (S.screen === 'studio') setPaused(!S.paused); };
  $('resumeBtn').onclick = () => setPaused(false);
  $('stopBtn').onclick = () => goTitle();
  $('musicBtn').onclick = () => { S.music = !S.music; $('musicBtn').classList.toggle('off', !S.music); persistPrefs(); music(curTrack || 'studio'); };
  $('soundBtn').onclick = () => { S.sound = !S.sound; $('soundBtn').classList.toggle('off', !S.sound); persistPrefs(); };
  $('musicBtn').classList.toggle('off', !S.music); $('soundBtn').classList.toggle('off', !S.sound);
  $('mirrorBtn').classList.toggle('sel', S.mirror);
  addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); doUndo(); } if (e.key === 'Escape' && S.screen === 'studio') setPaused(!S.paused); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.screen === 'studio' && !S.paused) setPaused(true); });
}
async function enterStudio() {
  S.screen = 'studio'; $('title').classList.add('hidden'); document.body.classList.add('studio');
  S.spin = ((S.spin % TAU) + TAU) % TAU; if (S.spin > Math.PI) S.spin -= TAU; S.spinVel = 0; S.spinHome = true;
  if (!S.C || S.C.def.id !== S.critterId) await loadCritter(S.critterId);
  layout(); renderPanel(); renderColorChip(); renderRecent(); renderSize();
  music('studio');
  say('Paint me, please!', 2.5);
}
async function goTitle() {
  if (S.finale) { S.finale = null; document.body.classList.remove('finale'); }
  await saveNow();
  S.screen = 'title'; S.paused = false; $('pauseVeil').classList.add('hidden'); document.body.classList.remove('studio');
  $('title').classList.remove('hidden'); music('studio');
  document.querySelectorAll('.card').forEach((c) => { c.querySelector('em') && c.querySelector('em').remove(); if (S.done[c.dataset.id]) c.insertAdjacentHTML('beforeend', '<em>✓</em>'); });
}
function setPaused(p) {
  S.paused = p; $('pauseVeil').classList.toggle('hidden', !p); $('pauseBtn').textContent = p ? '▶' : '⏸';
  music(curTrack || 'studio');
}

/* ============================================================ main loop */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!S.paused) {
    S.time += dt;
    if (!ptr || ptr.painting) { S.spinVel *= Math.pow(0.04, dt); S.spin += S.spinVel * (ptr ? 0 : 1) * dt * 20; }
    if (S.screen === 'title') S.spin += dt * 0.25; // slow showcase spin on the title screen
    if (S.finale) S.spin *= Math.pow(0.1, dt);
    if (S.spinHome) { S.spin *= Math.pow(0.08, dt); if (Math.abs(S.spin) < 0.005 || ptr) S.spinHome = false; }
    turntable.rotation.y = S.spin;
    animateRig(dt); updateEffects(dt); updateLoose(dt); updateFinale(dt);
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) endHint(); }
    if (S.C) S.C.surfaces.forEach((s) => { if (s.glitter && s.emis) s.mesh.material.emissiveIntensity = 0.25 + 0.2 * Math.sin(S.time * 1.3 + s.i); });
  }
  dirtyTex.forEach((s) => { s.tex.needsUpdate = true; }); dirtyTex.clear();
  positionBubble();
  renderer.render(scene, camera);
}

/* ============================================================ test hooks */
window.__PAINT__ = {
  S, PB, THREE, renderer,
  critters: () => CRITTERS.map((c) => c.id),
  select: (id) => loadCritter(id), enter: () => enterStudio(), title: () => goTitle(),
  parts: () => (S.C ? [...S.C.parts.keys()] : []),
  surfaces: () => (S.C ? S.C.surfaces.length : 0),
  setColor: (c) => pickColor(c), setMode, setFill, tab: (t) => { S.tab = t; renderPanel(); },
  fill: (key, spec) => { const P = S.C.parts.get(key); fillPart(P, spec || currentFillSpec()); },
  brush: (key, id, n = 20) => { // synthetic stroke across a part (tests brush pipeline + mirror)
    S.brush = id; setMode('brush', true); const P = S.C.parts.get(key); const s = P.surfaces[0];
    beginStroke();
    for (let i = 0; i <= n; i++) strokeTo({ object: s.mesh, uv: new THREE.Vector2(0.2 + (0.6 * i) / n, 0.5 + 0.15 * Math.sin(i / 3)) }, 0);
    endStroke(); return s.i;
  },
  sticker: (key, id) => { S.sticker = id; setMode('sticker', true); const s = S.C.parts.get(key).surfaces[0]; placeSticker({ object: s.mesh, uv: new THREE.Vector2(0.5, 0.5) }); },
  effect: (id, key) => { const def = PB.EFFECTS.find((e) => e.id === id); return !!addEffect(def, key ? S.C.parts.get(key) : [...S.C.parts.values()][0]); },
  effects: () => (S.C ? S.C.effects.map((e) => e.def.id) : []),
  wear: (id) => toggleWearable(id), wearables: () => (S.C ? S.C.wearables.map((w) => w.userData.wearId) : []),
  undo: () => doUndo(), undoDepth: () => S.undo.length, surprise: () => surprise(), done: () => startFinale(),
  sample: (key, u = 0.5, v = 0.5) => { const s = S.C.parts.get(key).surfaces[0]; const d = s.ctx.getImageData(Math.floor(u * (s.w - 1)), Math.floor(v * (s.h - 1)), 1, 1).data; return '#' + [d[0], d[1], d[2]].map((x) => x.toString(16).padStart(2, '0')).join(''); },
  special: (key) => S.C.parts.get(key).surfaces[0].special,
  save: () => saveNow(), reset: () => resetCritter(), mix: (a, b) => PB.mixColors(a, b),
  tick: (n = 60) => { for (let i = 0; i < n; i++) { S.time += 1 / 60; animateRig(1 / 60); updateEffects(1 / 60); updateLoose(1 / 60); updateFinale(1 / 60); } },
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures }),
};

/* ============================================================ boot */
buildStatic();
loadCritter(S.critterId).then(() => { layout(); S.ready = true; });
layout();
requestAnimationFrame(loop);
