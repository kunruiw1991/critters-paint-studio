// PoppyDash (Dad): charcoal-and-white striped skunk Smiling Critter with a golden popcorn-bucket pendant.
// Same rig conventions as SunnyFox.js / LunaBat.js (head/eyes/ears/torso/arms/legs/tail groups).

import { createPlushMaterial, createStitchSeamStrip, countGroupStats } from './materials.js';

const THREE = window.THREE;

export const POPPY_DASH_PALETTE = {
  plushMain: '#34353d',
  stripeWhite: '#f6f3ec',
  innerEarPink: '#f0a2aa',
  muzzleWhite: '#f8f5ef',
  bellyWhite: '#f4f1ea',
  pawDark: '#26272d',
  eyeBlack: '#08080c',
  mouthDark: '#3a1418',
  tonguePink: '#e06c78',
  zipperSilver: '#c9ccd4',
  popcornRed: '#e2394a',
  popcornKernel: '#ffe7a3',
};

export function buildPoppyDash() {
  const P = POPPY_DASH_PALETTE;
  const root = new THREE.Group();
  root.name = 'PoppyDash';
  root.userData = { characterId: 'PoppyDash', displayName: 'PoppyDash', animState: 'idle', palette: { ...P } };

  const matMain = createPlushMaterial(P.plushMain);
  const matWhite = createPlushMaterial(P.stripeWhite);
  const matInnerEar = createPlushMaterial(P.innerEarPink);
  const matMuzzle = createPlushMaterial(P.muzzleWhite);
  const matBelly = createPlushMaterial(P.bellyWhite);
  const matPaw = createPlushMaterial(P.pawDark);
  const matEyeBlack = new THREE.MeshStandardMaterial({ color: P.eyeBlack, roughness: 0.06, metalness: 0.12 });
  const matSclera = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const matWhiteBasic = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matMouth = new THREE.MeshBasicMaterial({ color: P.mouthDark });
  const matTongue = createPlushMaterial(P.tonguePink, { roughness: 0.65 });
  const matTeeth = new THREE.MeshStandardMaterial({ color: 0xfcfaf5, roughness: 0.25 });
  const matZip = new THREE.MeshStandardMaterial({ color: P.zipperSilver, roughness: 0.22, metalness: 0.88 });
  const matBucketRed = new THREE.MeshStandardMaterial({ color: P.popcornRed, roughness: 0.4, metalness: 0.2 });
  const matBucketWhite = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.4, metalness: 0.2 });
  const matKernel = new THREE.MeshStandardMaterial({
    color: P.popcornKernel, emissive: new THREE.Color('#ffcc55'), emissiveIntensity: 1.6, roughness: 0.5,
  });

  // ---------- HEAD ----------
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.42, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.46, 48, 36), matMain);
  skull.name = 'skullMesh';
  skull.scale.set(1.16, 0.98, 0.95);
  head.add(skull);

  // White stripe from the forehead over the crown, ending in a fluffy tuft.
  const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.47, 40, 30, Math.PI / 2 - 0.3, 0.6, 0, Math.PI * 0.62), matWhite);
  stripe.name = 'headStripe';
  stripe.scale.set(1.17, 0.99, 0.96);
  stripe.rotation.x = -0.25;
  head.add(stripe);
  const tuft = new THREE.Group();
  tuft.name = 'hairTuft';
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 14), matWhite);
    c.position.set((i - 2) * 0.045, 0.47 + Math.abs(i - 2) * -0.02, 0.05 - Math.abs(i - 2) * 0.02);
    c.rotation.z = (i - 2) * -0.35;
    c.rotation.x = -0.35;
    tuft.add(c);
  }
  head.add(tuft);
  head.add(createStitchSeamStrip(
    [new THREE.Vector3(0, 0.43, 0.16), new THREE.Vector3(0, 0.33, 0.37), new THREE.Vector3(0, 0.18, 0.44)],
    '#b9b4aa', 8, 'foreheadStitch'));

  // Cheek fluff
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 14), matMain);
      t.position.set(side * (0.49 + i * 0.02), -0.03 - i * 0.06, 0.05);
      t.rotation.z = side * (-1.3 - i * 0.18);
      head.add(t);
    }
  });

  // Round bear-like ears with pink inner fur
  const buildEar = (name, side) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(side * 0.36, 0.33, -0.02);
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 20), matMain);
    outer.scale.set(1, 1, 0.55);
    g.add(outer);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 18), matInnerEar);
    inner.scale.set(1, 1, 0.4);
    inner.position.set(0, -0.01, 0.06);
    g.add(inner);
    return g;
  };
  const leftEar = buildEar('leftEar', 1);
  const rightEar = buildEar('rightEar', -1);
  head.add(leftEar, rightEar);

  // Brows
  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 18, 1.6), matPaw);
    brow.position.set(side * 0.19, 0.27, 0.39);
    brow.rotation.z = side * -0.25 + 0.72;
    head.add(brow);
  });

  // Eyes (white rim + glossy black + catchlights)
  const eyes = new THREE.Group();
  eyes.name = 'eyes';
  eyes.position.set(0, 0.11, 0.415);
  const buildEye = (name, side) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(side * 0.18, 0, 0);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(0.118, 28, 20), matSclera);
    rim.scale.set(1, 1.08, 0.5);
    g.add(rim);
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.095, 28, 20), matEyeBlack);
    cornea.name = 'corneaMesh';
    cornea.scale.set(1, 1.08, 0.66);
    cornea.position.set(side * 0.012, -0.004, 0.012);
    g.add(cornea);
    const c1 = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), matWhiteBasic);
    c1.position.set(-0.026, 0.03, 0.078);
    g.add(c1);
    const c2 = new THREE.Mesh(new THREE.CircleGeometry(0.013, 12), matWhiteBasic);
    c2.position.set(0.026, -0.026, 0.078);
    g.add(c2);
    return g;
  };
  eyes.add(buildEye('rightEye', -1), buildEye('leftEye', 1));
  head.add(eyes);

  // Muzzle, nose, big grin
  const muzzle = new THREE.Group();
  muzzle.name = 'muzzle';
  muzzle.position.set(0, -0.11, 0.26);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), matMuzzle);
  shell.scale.set(1.22, 0.78, 0.74);
  muzzle.add(shell);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 14), matEyeBlack);
  nose.scale.set(1.4, 0.85, 0.9);
  nose.position.set(0, 0.12, 0.25);
  muzzle.add(nose);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.22, 26, 18), matMouth);
  mouth.scale.set(1.35, 0.66, 0.36);
  mouth.position.set(0, -0.04, 0.2);
  muzzle.add(mouth);
  [-1, 1].forEach((s) => {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 10), matTeeth);
    fang.rotation.x = Math.PI;
    fang.position.set(s * 0.1, 0.03, 0.27);
    muzzle.add(fang);
  });
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), matTongue);
  tongue.scale.set(1.35, 0.55, 0.6);
  tongue.position.set(0, -0.09, 0.23);
  muzzle.add(tongue);
  head.add(muzzle);
  root.add(head);

  // ---------- TORSO + ZIPPER + POPCORN BUCKET ----------
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.set(0, -0.2, 0);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 30), matMain);
  body.name = 'bodyMesh';
  body.scale.set(1.04, 1.18, 0.92);
  torso.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), matBelly);
  belly.name = 'bellyPatchMesh';
  belly.scale.set(0.95, 1.14, 0.36);
  belly.position.set(0, -0.02, 0.24);
  torso.add(belly);
  const zipper = new THREE.Group();
  zipper.name = 'zipper';
  zipper.position.set(0, 0.02, 0.325);
  zipper.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.46, 0.012), new THREE.MeshStandardMaterial({ color: 0x70737c, roughness: 0.7 })));
  for (let i = 0; i < 16; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.018), matZip);
    tooth.position.set((i % 2 ? 1 : -1) * 0.008, -0.2 + i * 0.026, 0.006);
    zipper.add(tooth);
  }
  torso.add(zipper);

  const popcornPendant = new THREE.Group();
  popcornPendant.name = 'popcornPendant';
  popcornPendant.position.set(0, 0.17, 0.36);
  const bucket = new THREE.Group();
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.042, 0.1, 6, 1, true, (i / stripes) * Math.PI * 2, (Math.PI * 2) / stripes),
      i % 2 ? matBucketWhite : matBucketRed);
    seg.material.side = THREE.DoubleSide;
    bucket.add(seg);
  }
  bucket.position.set(0, -0.1, 0);
  popcornPendant.add(bucket);
  const kernels = new THREE.Group();
  kernels.name = 'popcornKernels';
  for (let i = 0; i < 11; i++) {
    const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 1), matKernel);
    const a = i * 2.39;
    const r = i === 0 ? 0 : 0.03 + (i % 3) * 0.008;
    k.position.set(Math.cos(a) * r, -0.04 + (i % 4) * 0.008, Math.sin(a) * r);
    kernels.add(k);
  }
  popcornPendant.add(kernels);
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 16), matZip);
  bail.position.set(0, 0.0, 0);
  popcornPendant.add(bail);
  const popLight = new THREE.PointLight(0xffcc66, 2.0, 22, 1.4);
  popLight.name = 'popcornLight';
  popLight.position.set(0, -0.05, 0.08);
  popcornPendant.add(popLight);
  torso.add(popcornPendant);
  root.add(torso);

  // ---------- ARMS ----------
  const buildArm = (name, side) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(side * 0.3, 0.05, 0);
    g.rotation.z = side * -0.5;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.108, 0.34, 24), matMain);
    upper.position.set(0, -0.16, 0);
    g.add(upper);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.118, 24, 18), matPaw);
    paw.name = 'handPawMesh';
    paw.position.set(0, -0.35, 0);
    g.add(paw);
    return g;
  };
  const leftArm = buildArm('leftArm', 1);
  const rightArm = buildArm('rightArm', -1);
  root.add(leftArm, rightArm);

  // ---------- LEGS ----------
  const buildLeg = (name, side) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(side * 0.15, -0.52, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.122, 0.28, 24), matMain);
    thigh.position.set(0, -0.14, 0);
    g.add(thigh);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18), matPaw);
    foot.name = 'footPawMesh';
    foot.scale.set(1.05, 0.72, 1.35);
    foot.position.set(0, -0.32, 0.055);
    g.add(foot);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 12), matInnerEar);
    pad.scale.set(1, 1, 0.3);
    pad.position.set(0, -0.3, 0.22);
    pad.rotation.x = -0.4;
    g.add(pad);
    return g;
  };
  const leftLeg = buildLeg('leftLeg', 1);
  const rightLeg = buildLeg('rightLeg', -1);
  root.add(leftLeg, rightLeg);

  // ---------- BIG STRIPED TAIL ----------
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(-0.1, -0.38, -0.26);
  tail.rotation.y = -0.45;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.14, 0.18, -0.2),
    new THREE.Vector3(-0.26, 0.45, -0.24), new THREE.Vector3(-0.28, 0.78, -0.1),
  ]);
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.18, 24, false), matMain));
  const stripeCurve = new THREE.CatmullRomCurve3(curve.points.map((p) => p.clone().add(new THREE.Vector3(0, 0, 0.02))));
  const tailStripe = new THREE.Mesh(new THREE.TubeGeometry(stripeCurve, 40, 0.1, 18, false), matWhite);
  tailStripe.scale.set(1.0, 1.0, 1.0);
  tailStripe.position.set(0.02, 0.02, -0.1);
  tail.add(tailStripe);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), matWhite);
  tip.position.set(-0.28, 0.82, -0.1);
  tip.scale.set(1, 1.15, 1);
  tail.add(tip);
  root.add(tail);

  const stats = countGroupStats(root);
  root.characterId = 'PoppyDash';
  root.displayName = 'PoppyDash';
  root.vertexCount = stats.vertexCount;
  root.meshCount = stats.meshCount;
  root.pendantLight = popLight;
  root.pendantEmissiveMesh = kernels.children[0];
  root.parts = { head, leftEar, rightEar, eyes, muzzle, torso, zipper, popcornPendant, tail, leftArm, rightArm, leftLeg, rightLeg };
  return root;
}
