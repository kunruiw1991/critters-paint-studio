// R1.1 Character 1: SunnyFox / LanternFox (Golden-Orange Fox Smiling Critter with Glowing Storm Lantern Pendant)

import {
  createPlushMaterial,
  createStitchSeamStrip,
  createPilotGearGroup,
  countGroupStats,
} from './materials.js';

const THREE = window.THREE;

export const SUNNY_FOX_PALETTE = {
  plushMain: '#e89125',
  earTipCoral: '#f26d6d',
  innerEarCream: '#f8e8c8',
  muzzleCream: '#f9efd8',
  bellyCream: '#faefd4',
  pawCoral: '#e36562',
  tailTipWhite: '#faf5ea',
  eyeBlack: '#08080c',
  mouthBlack: '#050508',
  teethWhite: '#fcfaf5',
  tonguePink: '#d9535f',
  zipperBrass: '#d49b35',
  lanternBronze: '#b87b20',
  lanternCore: '#ffd966',
};

export function buildSunnyFox() {
  const root = new THREE.Group();
  root.name = 'SunnyFox';
  root.userData = {
    characterId: 'SunnyFox',
    displayName: 'SunnyFox (LanternFox)',
    role: 'pilot',
    animState: 'idle',
    palette: { ...SUNNY_FOX_PALETTE },
  };

  const matOrange = createPlushMaterial(SUNNY_FOX_PALETTE.plushMain);
  const matCoralTip = createPlushMaterial(SUNNY_FOX_PALETTE.earTipCoral);
  const matInnerEar = createPlushMaterial(SUNNY_FOX_PALETTE.innerEarCream);
  const matMuzzle = createPlushMaterial(SUNNY_FOX_PALETTE.muzzleCream);
  const matBelly = createPlushMaterial(SUNNY_FOX_PALETTE.bellyCream);
  const matPawCoral = createPlushMaterial(SUNNY_FOX_PALETTE.pawCoral);
  const matTailWhite = createPlushMaterial(SUNNY_FOX_PALETTE.tailTipWhite);
  const matBrow = createPlushMaterial('#6b3814');
  const matEyeBlack = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SUNNY_FOX_PALETTE.eyeBlack),
    roughness: 0.06,
    metalness: 0.12,
  });
  const matWhiteBasic = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matMouthBlack = new THREE.MeshBasicMaterial({ color: new THREE.Color(SUNNY_FOX_PALETTE.mouthBlack) });
  const matTeeth = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SUNNY_FOX_PALETTE.teethWhite),
    roughness: 0.25,
    metalness: 0.05,
  });
  const matTongue = createPlushMaterial(SUNNY_FOX_PALETTE.tonguePink, { roughness: 0.65 });
  const matZipperBrass = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SUNNY_FOX_PALETTE.zipperBrass),
    roughness: 0.28,
    metalness: 0.85,
  });
  const matLanternBronze = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SUNNY_FOX_PALETTE.lanternBronze),
    roughness: 0.32,
    metalness: 0.82,
  });
  const matLanternCore = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SUNNY_FOX_PALETTE.lanternCore),
    emissive: new THREE.Color(SUNNY_FOX_PALETTE.lanternCore),
    emissiveIntensity: 2.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  // ==================== 1. HEAD GROUP ====================
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.42, 0);

  const skullMesh = new THREE.Mesh(new THREE.SphereGeometry(0.46, 36, 28), matOrange);
  skullMesh.name = 'skullMesh';
  skullMesh.scale.set(1.18, 0.98, 0.95);
  head.add(skullMesh);

  // Forehead center stitch seam
  const foreheadStitch = createStitchSeamStrip(
    [
      new THREE.Vector3(0, 0.43, 0.16),
      new THREE.Vector3(0, 0.34, 0.36),
      new THREE.Vector3(0, 0.16, 0.44),
    ],
    '#5c3116',
    8,
    'foreheadStitch'
  );
  head.add(foreheadStitch);

  // Fluffy side cheek tufts
  const cheekTufts = new THREE.Group();
  cheekTufts.name = 'cheekTufts';
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.24, 14), matOrange);
      tuft.position.set(side * (0.48 + i * 0.03), -0.02 - i * 0.055, 0.06);
      tuft.rotation.z = side * (-1.25 - i * 0.18);
      cheekTufts.add(tuft);
    }
  });
  head.add(cheekTufts);

  // Eyebrows
  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 18, 1.7), matBrow);
    brow.position.set(side * 0.175, 0.27, 0.39);
    brow.rotation.z = side * -0.25 + 0.7;
    head.add(brow);
  });

  // Pointed Fox Ears (leftEar = +X viewer's right, rightEar = -X viewer's left)
  const buildFoxEar = (name, side) => {
    const earGroup = new THREE.Group();
    earGroup.name = name;
    earGroup.position.set(side * 0.28, 0.38, -0.02);
    earGroup.rotation.z = side * -0.34;

    const earBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.19, 0.28, 22), matOrange);
    earBaseMesh.name = 'earBaseMesh';
    earBaseMesh.position.set(0, 0.09, 0);
    earGroup.add(earBaseMesh);

    const earTipMesh = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.18, 22), matCoralTip);
    earTipMesh.name = 'earTipMesh';
    earTipMesh.position.set(0, 0.31, 0);
    earGroup.add(earTipMesh);

    const innerEarMesh = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 18), matInnerEar);
    innerEarMesh.name = 'innerEarMesh';
    innerEarMesh.position.set(0, 0.14, 0.055);
    innerEarMesh.scale.set(1.0, 1.0, 0.45);
    earGroup.add(innerEarMesh);

    for (let t = 0; t < 3; t++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 10), matInnerEar);
      tuft.position.set((t - 1) * 0.04, 0.06 + t * 0.04, 0.08);
      tuft.rotation.x = 0.35;
      earGroup.add(tuft);
    }
    return earGroup;
  };

  const leftEar = buildFoxEar('leftEar', 1);
  const rightEar = buildFoxEar('rightEar', -1);
  head.add(leftEar);
  head.add(rightEar);

  // Signature Asymmetric Coral-Pink Eye Patch Ring around Left Eye (+X, viewer's right)
  const eyePatchLeft = new THREE.Group();
  eyePatchLeft.name = 'eyePatchLeft';
  eyePatchLeft.position.set(0.175, 0.11, 0.395);

  const leftEyePatchRing = new THREE.Mesh(new THREE.SphereGeometry(0.148, 26, 20), matCoralTip);
  leftEyePatchRing.name = 'leftEyePatchRing';
  leftEyePatchRing.scale.set(1.06, 1.18, 0.32);
  eyePatchLeft.add(leftEyePatchRing);
  head.add(eyePatchLeft);

  // Glossy Black Eyes with Dual White Catchlights & 3 Eyelashes per Eye
  const eyes = new THREE.Group();
  eyes.name = 'eyes';
  eyes.position.set(0, 0.11, 0.415);

  const buildEye = (eyeName, side) => {
    const eyeGrp = new THREE.Group();
    eyeGrp.name = eyeName;
    eyeGrp.position.set(side * 0.175, 0, 0);

    const corneaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.104, 24, 20), matEyeBlack);
    corneaMesh.name = 'corneaMesh';
    corneaMesh.scale.set(1.0, 1.08, 0.65);
    eyeGrp.add(corneaMesh);

    const catchlightMain = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), matWhiteBasic);
    catchlightMain.name = 'catchlightMain';
    catchlightMain.position.set(-0.028, 0.032, 0.072);
    eyeGrp.add(catchlightMain);

    const catchlightSub = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), matWhiteBasic);
    catchlightSub.name = 'catchlightSub';
    catchlightSub.position.set(0.028, -0.026, 0.072);
    eyeGrp.add(catchlightSub);

    const lashesGrp = new THREE.Group();
    lashesGrp.name = 'eyelashes';
    [0.55, 0.85, 1.15].forEach((ang) => {
      const lash = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0085, 0.055, 8), matEyeBlack);
      const theta = side * ang;
      lash.position.set(Math.sin(theta) * 0.105, Math.cos(theta) * 0.112, 0.02);
      lash.rotation.z = -theta;
      lashesGrp.add(lash);
    });
    eyeGrp.add(lashesGrp);
    return eyeGrp;
  };

  eyes.add(buildEye('rightEye', -1));
  eyes.add(buildEye('leftEye', 1));
  head.add(eyes);

  // Cream Muzzle, Nose, Smiling Critters Grin & Scalloped Teeth
  const muzzle = new THREE.Group();
  muzzle.name = 'muzzle';
  muzzle.position.set(0, -0.11, 0.26);

  const muzzleShellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 22), matMuzzle);
  muzzleShellMesh.name = 'muzzleShellMesh';
  muzzleShellMesh.scale.set(1.26, 0.76, 0.74);
  muzzle.add(muzzleShellMesh);

  const noseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.054, 16, 14), matEyeBlack);
  noseMesh.name = 'noseMesh';
  noseMesh.scale.set(1.35, 0.85, 0.9);
  noseMesh.position.set(0, 0.12, 0.25);
  muzzle.add(noseMesh);

  const philtrumStitch = createStitchSeamStrip(
    [new THREE.Vector3(0, 0.09, 0.26), new THREE.Vector3(0, 0.03, 0.27)],
    '#5c3116',
    3,
    'philtrumStitch'
  );
  muzzle.add(philtrumStitch);

  const mouthCavityMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), matMouthBlack);
  mouthCavityMesh.name = 'mouthCavityMesh';
  mouthCavityMesh.scale.set(1.38, 0.68, 0.36);
  mouthCavityMesh.position.set(0, -0.03, 0.21);
  muzzle.add(mouthCavityMesh);

  // 8 upper and 8 lower rounded white teeth
  for (let i = 0; i < 8; i++) {
    const u = (i - 3.5) / 3.8;
    const tx = u * 0.24;
    const tz = 0.27 - u * u * 0.05;
    const uTooth = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.018, 6, 8), matTeeth);
    uTooth.position.set(tx, 0.045 - u * u * 0.03, tz);
    muzzle.add(uTooth);

    const lTooth = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.016, 6, 8), matTeeth);
    lTooth.position.set(tx, -0.10 + u * u * 0.03, tz);
    muzzle.add(lTooth);
  }

  const tongueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), matTongue);
  tongueMesh.name = 'tongueMesh';
  tongueMesh.scale.set(1.35, 0.55, 0.6);
  tongueMesh.position.set(0, -0.085, 0.24);
  muzzle.add(tongueMesh);
  head.add(muzzle);

  // Pilot Gear (Aviator Goggles, Pilot Scarf, Captain's Cap)
  const pilotGear = createPilotGearGroup(true, true, false);
  head.add(pilotGear);
  root.add(head);

  // ==================== 2. TORSO, ZIPPER & GLOWING STORM LANTERN ====================
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.set(0, -0.20, 0);

  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 30, 24), matOrange);
  bodyMesh.name = 'bodyMesh';
  bodyMesh.scale.set(1.02, 1.18, 0.92);
  torso.add(bodyMesh);

  const bellyPatchMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 20), matBelly);
  bellyPatchMesh.name = 'bellyPatchMesh';
  bellyPatchMesh.scale.set(0.95, 1.12, 0.35);
  bellyPatchMesh.position.set(0, -0.02, 0.24);
  torso.add(bellyPatchMesh);

  const zipper = new THREE.Group();
  zipper.name = 'zipper';
  zipper.position.set(0, 0.02, 0.325);

  const zipperTapeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.46, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x8c5319, roughness: 0.7 })
  );
  zipper.add(zipperTapeMesh);

  for (let i = 0; i < 16; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.018), matZipperBrass);
    tooth.position.set((i % 2 === 0 ? -1 : 1) * 0.008, -0.20 + i * 0.026, 0.006);
    zipper.add(tooth);
  }

  const zipperPullRing = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 10, 20), matZipperBrass);
  zipperPullRing.name = 'zipperPullRing';
  zipperPullRing.position.set(0, 0.20, 0.018);
  zipper.add(zipperPullRing);
  torso.add(zipper);

  // 3D Glowing Golden Storm Lantern Pendant
  const lanternPendant = new THREE.Group();
  lanternPendant.name = 'lanternPendant';
  lanternPendant.position.set(0, 0.17, 0.355);

  const bailRing = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), matLanternBronze);
  bailRing.position.set(0, -0.01, 0);
  lanternPendant.add(bailRing);

  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.036, 18), matLanternBronze);
  lanternCap.position.set(0, -0.04, 0);
  lanternPendant.add(lanternCap);

  const glassGlobeCore = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.095, 22), matLanternCore);
  glassGlobeCore.name = 'glassGlobeCore';
  glassGlobeCore.position.set(0, -0.09, 0);
  lanternPendant.add(glassGlobeCore);

  const innerFlameFilament = new THREE.Mesh(new THREE.OctahedronGeometry(0.026, 1), matWhiteBasic);
  innerFlameFilament.name = 'innerFlameFilament';
  innerFlameFilament.position.set(0, -0.09, 0);
  lanternPendant.add(innerFlameFilament);

  for (let c = 0; c < 4; c++) {
    const ang = (c * Math.PI) / 2 + Math.PI / 4;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.105, 8), matLanternBronze);
    strut.position.set(Math.cos(ang) * 0.052, -0.09, Math.sin(ang) * 0.052);
    lanternPendant.add(strut);
  }

  const baseTank = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.062, 0.032, 20), matLanternBronze);
  baseTank.position.set(0, -0.148, 0);
  lanternPendant.add(baseTank);

  const lanternLight = new THREE.PointLight(0xffd966, 2.2, 22.0, 1.4);
  lanternLight.name = 'lanternLight';
  lanternLight.position.set(0, -0.09, 0.06);
  lanternPendant.add(lanternLight);

  torso.add(lanternPendant);
  root.add(torso);

  // ==================== 3. ARMS & PAW PADS ====================
  const buildArm = (armName, side) => {
    const armGrp = new THREE.Group();
    armGrp.name = armName;
    armGrp.position.set(side * 0.30, 0.05, 0);
    armGrp.rotation.z = side * -0.48;

    const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.34, 20), matOrange);
    upperArmMesh.position.set(0, -0.16, 0);
    armGrp.add(upperArmMesh);

    const handPawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), matPawCoral);
    handPawMesh.name = 'handPawMesh';
    handPawMesh.position.set(0, -0.35, 0);
    armGrp.add(handPawMesh);

    [-0.04, 0, 0.04].forEach((fx, idx) => {
      const finger = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), matPawCoral);
      finger.position.set(fx, -0.43, idx === 1 ? 0.02 : 0);
      armGrp.add(finger);

      const pad = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), matBelly);
      pad.scale.set(1.0, 1.1, 0.4);
      pad.position.set(fx, -0.35, 0.105);
      armGrp.add(pad);
    });
    return armGrp;
  };

  const leftArm = buildArm('leftArm', 1);
  const rightArm = buildArm('rightArm', -1);
  root.add(leftArm);
  root.add(rightArm);

  // ==================== 4. LEGS & 3-TOED FEET ====================
  const buildLeg = (legName, side) => {
    const legGrp = new THREE.Group();
    legGrp.name = legName;
    legGrp.position.set(side * 0.15, -0.52, 0);

    const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.122, 0.28, 20), matOrange);
    thighMesh.position.set(0, -0.14, 0);
    legGrp.add(thighMesh);

    const footPawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 16), matPawCoral);
    footPawMesh.name = 'footPawMesh';
    footPawMesh.scale.set(1.05, 0.72, 1.35);
    footPawMesh.position.set(0, -0.32, 0.055);
    legGrp.add(footPawMesh);

    [-0.055, 0, 0.055].forEach((tx) => {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), matPawCoral);
      toe.position.set(tx, -0.33, 0.19);
      legGrp.add(toe);
    });
    return legGrp;
  };

  const leftLeg = buildLeg('leftLeg', 1);
  const rightLeg = buildLeg('rightLeg', -1);
  root.add(leftLeg);
  root.add(rightLeg);

  // ==================== 5. BUSHY S-CURVED TAIL ====================
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0.08, -0.36, -0.24);
  tail.rotation.y = 0.42;

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, 0.14, -0.22),
    new THREE.Vector3(0.24, 0.36, -0.28),
    new THREE.Vector3(0.30, 0.62, -0.18),
  ]);
  const tailBaseOrange = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 24, 0.17, 18, false), matOrange);
  tailBaseOrange.name = 'tailBaseOrange';
  tail.add(tailBaseOrange);

  for (let c = 0; c < 8; c++) {
    const ang = (c * Math.PI * 2) / 8;
    const collarTuft = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 10), matTailWhite);
    collarTuft.position.set(0.27 + Math.cos(ang) * 0.14, 0.52, -0.20 + Math.sin(ang) * 0.14);
    tail.add(collarTuft);
  }

  const tailTipWhite = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.38, 22), matTailWhite);
  tailTipWhite.name = 'tailTipWhite';
  tailTipWhite.position.set(0.32, 0.76, -0.15);
  tailTipWhite.rotation.z = -0.22;
  tail.add(tailTipWhite);
  root.add(tail);

  // Attach Unified Verification & Reference Metadata directly onto root group
  const stats = countGroupStats(root);
  root.characterId = 'SunnyFox';
  root.displayName = 'SunnyFox (LanternFox)';
  root.group = root;
  root.vertexCount = stats.vertexCount;
  root.meshCount = stats.meshCount;
  root.currentAnimation = 'idle';
  root.animationTime = 0;
  root.pendantLight = lanternLight;
  root.pendantEmissiveMesh = glassGlobeCore;
  root.parts = {
    head,
    leftEar,
    rightEar,
    eyes,
    eyePatchLeft,
    leftEyePatchRing,
    muzzle,
    muzzleSmile: muzzle,
    torso,
    zipper,
    chestZipper: zipper,
    lanternPendant,
    bushyTail: tail,
    tail,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    pilotGear,
  };

  return root;
}
