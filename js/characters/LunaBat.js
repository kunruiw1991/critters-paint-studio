// R1.2 Character 2: LunaBat / StarBat (Indigo-Violet Bat Smiling Critter with Diamond-Quilted Wings & Moon-Star Pendant)

import {
  createPlushMaterial,
  createDiamondQuiltTexture,
  createStitchSeamStrip,
  createPilotGearGroup,
  countGroupStats,
} from './materials.js';

const THREE = window.THREE;

export const LUNA_BAT_PALETTE = {
  plushHead: '#3a2278',
  innerEarLilac: '#c5a3f0',
  muzzleLavender: '#b898e8',
  nostrilDark: '#231252',
  plushTorso: '#351e70',
  bellyLavender: '#b592e6',
  wingMembrane: '#9f78d9',
  footLavender: '#ba96ea',
  eyeBlack: '#08080c',
  mouthBlack: '#050508',
  teethWhite: '#fcfaf5',
  zipperSilver: '#d8dde6',
  moonStarGold: '#ffe57f',
};

export function buildLunaBat() {
  const root = new THREE.Group();
  root.name = 'LunaBat';
  root.userData = {
    characterId: 'LunaBat',
    displayName: 'LunaBat (StarBat)',
    role: 'copilot',
    animState: 'idle',
    palette: { ...LUNA_BAT_PALETTE },
  };

  const matIndigoHead = createPlushMaterial(LUNA_BAT_PALETTE.plushHead);
  const matInnerEar = createPlushMaterial(LUNA_BAT_PALETTE.innerEarLilac);
  const matMuzzleLav = createPlushMaterial(LUNA_BAT_PALETTE.muzzleLavender);
  const matNostril = createPlushMaterial(LUNA_BAT_PALETTE.nostrilDark, { roughness: 0.6 });
  const matTorso = createPlushMaterial(LUNA_BAT_PALETTE.plushTorso);
  const matBelly = createPlushMaterial(LUNA_BAT_PALETTE.bellyLavender);
  const matFoot = createPlushMaterial(LUNA_BAT_PALETTE.footLavender);
  const quiltTex = createDiamondQuiltTexture(LUNA_BAT_PALETTE.wingMembrane, '#563694');
  const matWingQuilted = new THREE.MeshStandardMaterial({
    color: new THREE.Color(LUNA_BAT_PALETTE.wingMembrane),
    map: quiltTex,
    bumpMap: quiltTex,
    bumpScale: 0.032,
    roughness: 0.74,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const matEyeBlack = new THREE.MeshStandardMaterial({
    color: new THREE.Color(LUNA_BAT_PALETTE.eyeBlack),
    roughness: 0.06,
    metalness: 0.12,
  });
  const matWhiteBasic = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matMouthBlack = new THREE.MeshBasicMaterial({ color: new THREE.Color(LUNA_BAT_PALETTE.mouthBlack) });
  const matTeeth = new THREE.MeshStandardMaterial({
    color: new THREE.Color(LUNA_BAT_PALETTE.teethWhite),
    roughness: 0.25,
    metalness: 0.05,
  });
  const matZipperSilver = new THREE.MeshStandardMaterial({
    color: new THREE.Color(LUNA_BAT_PALETTE.zipperSilver),
    roughness: 0.22,
    metalness: 0.88,
  });
  const matMoonStarGold = new THREE.MeshStandardMaterial({
    color: new THREE.Color(LUNA_BAT_PALETTE.moonStarGold),
    emissive: new THREE.Color(LUNA_BAT_PALETTE.moonStarGold),
    emissiveIntensity: 2.4,
    roughness: 0.2,
    metalness: 0.45,
  });

  // ==================== 1. HEAD GROUP ====================
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.42, 0);

  const skullMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 36, 28), matIndigoHead);
  skullMesh.name = 'skullMesh';
  skullMesh.scale.set(1.16, 0.96, 0.94);
  head.add(skullMesh);

  // Forehead center stitch seam
  const foreheadStitch = createStitchSeamStrip(
    [
      new THREE.Vector3(0, 0.42, 0.15),
      new THREE.Vector3(0, 0.32, 0.35),
      new THREE.Vector3(0, 0.15, 0.43),
    ],
    '#6342b5',
    8,
    'foreheadStitch'
  );
  head.add(foreheadStitch);

  // Eyebrows
  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.017, 8, 18, 1.7), matNostril);
    brow.position.set(side * 0.17, 0.27, 0.39);
    brow.rotation.z = side * -0.24 + 0.7;
    head.add(brow);
  });

  // Oversized Fluffy Bat Ears
  const buildBatEar = (name, side) => {
    const earGrp = new THREE.Group();
    earGrp.name = name;
    earGrp.position.set(side * 0.29, 0.38, -0.02);
    earGrp.rotation.z = side * -0.32;

    const outerEarShell = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.54, 24), matIndigoHead);
    outerEarShell.name = 'outerEarShell';
    outerEarShell.position.set(0, 0.22, 0);
    outerEarShell.scale.set(1.05, 1.0, 0.52);
    earGrp.add(outerEarShell);

    const innerEarFur = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.44, 20), matInnerEar);
    innerEarFur.name = 'innerEarFur';
    innerEarFur.position.set(0, 0.20, 0.055);
    innerEarFur.scale.set(1.0, 1.0, 0.45);
    earGrp.add(innerEarFur);

    for (let f = 0; f < 6; f++) {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), matInnerEar);
      const ang = (f / 5) * Math.PI - Math.PI / 2;
      tuft.position.set(Math.sin(ang) * 0.12, 0.12 + Math.cos(ang) * 0.14, 0.07);
      earGrp.add(tuft);
    }
    return earGrp;
  };

  const leftEar = buildBatEar('leftEar', 1);
  const rightEar = buildBatEar('rightEar', -1);
  head.add(leftEar);
  head.add(rightEar);

  // Eyes with Dual Catchlights
  const eyes = new THREE.Group();
  eyes.name = 'eyes';
  eyes.position.set(0, 0.11, 0.415);

  [-1, 1].forEach((side) => {
    const eyeGrp = new THREE.Group();
    eyeGrp.name = side < 0 ? 'rightEye' : 'leftEye';
    eyeGrp.position.set(side * 0.17, 0, 0);

    const corneaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.106, 24, 20), matEyeBlack);
    corneaMesh.scale.set(1.0, 1.06, 0.65);
    eyeGrp.add(corneaMesh);

    const catchlightMain = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), matWhiteBasic);
    catchlightMain.position.set(-0.028, 0.032, 0.072);
    eyeGrp.add(catchlightMain);

    const catchlightSub = new THREE.Mesh(new THREE.CircleGeometry(0.015, 12), matWhiteBasic);
    catchlightSub.position.set(0.028, -0.026, 0.072);
    eyeGrp.add(catchlightSub);
    eyes.add(eyeGrp);
  });
  head.add(eyes);

  // Upturned Bat Nose with 2 Dark Nostrils
  const nose = new THREE.Group();
  nose.name = 'nose';
  nose.position.set(0, 0.01, 0.485);

  const noseBridgeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.078, 18, 16), matMuzzleLav);
  noseBridgeMesh.name = 'noseBridgeMesh';
  noseBridgeMesh.scale.set(1.25, 0.95, 0.78);
  nose.add(noseBridgeMesh);

  [-1, 1].forEach((side) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), matNostril);
    nostril.name = side < 0 ? 'rightNostril' : 'leftNostril';
    nostril.scale.set(0.75, 1.25, 0.5);
    nostril.position.set(side * 0.026, 0.008, 0.054);
    nose.add(nostril);
  });
  head.add(nose);

  // Lavender Lip Rim Muzzle & Smiling Critters Mouth
  const muzzle = new THREE.Group();
  muzzle.name = 'muzzle';
  muzzle.position.set(0, -0.12, 0.26);

  const lavenderLipRim = new THREE.Mesh(new THREE.SphereGeometry(0.35, 28, 20), matMuzzleLav);
  lavenderLipRim.name = 'lavenderLipRim';
  lavenderLipRim.scale.set(1.26, 0.72, 0.72);
  muzzle.add(lavenderLipRim);

  const mouthCavityMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), matMouthBlack);
  mouthCavityMesh.name = 'mouthCavityMesh';
  mouthCavityMesh.scale.set(1.36, 0.66, 0.36);
  mouthCavityMesh.position.set(0, -0.02, 0.21);
  muzzle.add(mouthCavityMesh);

  for (let i = 0; i < 6; i++) {
    const u = (i - 2.5) / 2.8;
    const tx = u * 0.22;
    const tz = 0.265 - u * u * 0.045;
    const uTooth = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.018, 6, 8), matTeeth);
    uTooth.position.set(tx, 0.045 - u * u * 0.03, tz);
    muzzle.add(uTooth);

    const lTooth = new THREE.Mesh(new THREE.CapsuleGeometry(0.020, 0.016, 6, 8), matTeeth);
    lTooth.position.set(tx, -0.095 + u * u * 0.03, tz);
    muzzle.add(lTooth);
  }
  head.add(muzzle);

  // Pilot Gear
  const pilotGear = createPilotGearGroup(true, false, true);
  head.add(pilotGear);
  root.add(head);

  // ==================== 2. TORSO, SILVER ZIPPER & CRESCENT MOON + STARBURST PENDANT ====================
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.set(0, -0.20, 0);

  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 30, 24), matTorso);
  bodyMesh.name = 'bodyMesh';
  bodyMesh.scale.set(1.0, 1.18, 0.90);
  torso.add(bodyMesh);

  const bellyPatchMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 20), matBelly);
  bellyPatchMesh.name = 'bellyPatchMesh';
  bellyPatchMesh.scale.set(0.94, 1.12, 0.35);
  bellyPatchMesh.position.set(0, -0.02, 0.24);
  torso.add(bellyPatchMesh);

  const zipper = new THREE.Group();
  zipper.name = 'zipper';
  zipper.position.set(0, 0.02, 0.325);

  const zipperTapeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.46, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x1e1042, roughness: 0.7 })
  );
  zipper.add(zipperTapeMesh);

  for (let i = 0; i < 16; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.018), matZipperSilver);
    tooth.position.set((i % 2 === 0 ? -1 : 1) * 0.008, -0.20 + i * 0.026, 0.006);
    zipper.add(tooth);
  }

  const zipperPullRing = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 10, 20), matZipperSilver);
  zipperPullRing.position.set(0, 0.20, 0.018);
  zipper.add(zipperPullRing);
  torso.add(zipper);

  // 3D Glowing Golden Crescent Moon + 8-Pointed Starburst Pendant
  const moonStarPendant = new THREE.Group();
  moonStarPendant.name = 'moonStarPendant';
  moonStarPendant.position.set(0, 0.16, 0.355);

  const crescentMoonMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.072, 0.022, 14, 28, Math.PI * 1.35),
    matMoonStarGold
  );
  crescentMoonMesh.name = 'crescentMoonMesh';
  crescentMoonMesh.position.set(-0.012, -0.085, 0);
  crescentMoonMesh.rotation.z = Math.PI * 0.32;
  moonStarPendant.add(crescentMoonMesh);

  const starburstGroup = new THREE.Group();
  starburstGroup.name = 'starburstMesh';
  starburstGroup.position.set(0.028, -0.082, 0.012);
  for (let r = 0; r < 8; r++) {
    const ang = (r * Math.PI) / 4;
    const isCardinal = r % 2 === 0;
    const ray = new THREE.Mesh(
      new THREE.ConeGeometry(isCardinal ? 0.014 : 0.010, isCardinal ? 0.055 : 0.038, 8),
      matMoonStarGold
    );
    ray.position.set(Math.cos(ang) * 0.022, Math.sin(ang) * 0.022, 0);
    ray.rotation.z = ang - Math.PI / 2;
    starburstGroup.add(ray);
  }
  moonStarPendant.add(starburstGroup);

  const moonStarLight = new THREE.PointLight(0xffe57f, 2.2, 22.0, 1.4);
  moonStarLight.name = 'moonStarLight';
  moonStarLight.position.set(0, -0.085, 0.06);
  moonStarPendant.add(moonStarLight);

  torso.add(moonStarPendant);
  root.add(torso);

  // ==================== 3. ARTICULATED 2-JOINT SPREAD BAT WINGS ====================
  const buildBatWingArm = (wingName, side) => {
    const wingArm = new THREE.Group();
    wingArm.name = wingName;
    wingArm.position.set(side * 0.28, 0.08, -0.02);

    const innerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.16, 0.10, 0.02),
      new THREE.Vector3(side * 0.32, 0.18, 0),
    ]);
    const upperWingLeadingEdge = new THREE.Mesh(
      new THREE.TubeGeometry(innerCurve, 14, 0.042, 12, false),
      matIndigoHead
    );
    upperWingLeadingEdge.name = 'upperWingLeadingEdge';
    wingArm.add(upperWingLeadingEdge);

    const thumbHook = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.085, 12), matIndigoHead);
    thumbHook.name = 'thumbHook';
    thumbHook.position.set(side * 0.32, 0.24, 0.01);
    thumbHook.rotation.z = side * -0.25;
    wingArm.add(thumbHook);

    // Inner quilted membrane panel
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 0);
    innerShape.lineTo(side * 0.32, 0.18);
    innerShape.lineTo(side * 0.28, -0.22);
    innerShape.quadraticCurveTo(side * 0.14, -0.15, 0, -0.26);
    innerShape.closePath();
    const innerMembrane = new THREE.Mesh(new THREE.ShapeGeometry(innerShape, 8), matWingQuilted);
    wingArm.add(innerMembrane);

    // Secondary wrist joint (outerWingSpan)
    const outerWingSpan = new THREE.Group();
    outerWingSpan.name = 'outerWingSpan';
    outerWingSpan.position.set(side * 0.32, 0.18, 0);

    const outerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.22, -0.06, 0),
      new THREE.Vector3(side * 0.46, -0.26, 0),
    ]);
    const outerLeadingEdge = new THREE.Mesh(
      new THREE.TubeGeometry(outerCurve, 14, 0.032, 12, false),
      matIndigoHead
    );
    outerLeadingEdge.name = 'outerLeadingEdge';
    outerWingSpan.add(outerLeadingEdge);

    // 3 Radial Finger Struts
    [
      new THREE.Vector3(side * 0.42, -0.28, 0),
      new THREE.Vector3(side * 0.24, -0.38, 0),
      new THREE.Vector3(side * 0.04, -0.40, 0),
    ].forEach((tipVec) => {
      const ribCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), tipVec]);
      const rib = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 10, 0.016, 8, false), matIndigoHead);
      outerWingSpan.add(rib);
    });

    // Outer scalloped diamond-quilted membrane
    const outerShape = new THREE.Shape();
    outerShape.moveTo(0, 0);
    outerShape.lineTo(side * 0.46, -0.26);
    outerShape.quadraticCurveTo(side * 0.34, -0.26, side * 0.24, -0.38);
    outerShape.quadraticCurveTo(side * 0.14, -0.30, side * 0.04, -0.40);
    outerShape.lineTo(side * -0.04, -0.40);
    outerShape.closePath();

    const quiltedMembraneMesh = new THREE.Mesh(new THREE.ShapeGeometry(outerShape, 12), matWingQuilted);
    quiltedMembraneMesh.name = 'quiltedMembraneMesh';
    outerWingSpan.add(quiltedMembraneMesh);

    wingArm.add(outerWingSpan);
    return wingArm;
  };

  const leftWingArm = buildBatWingArm('leftWingArm', 1);
  const rightWingArm = buildBatWingArm('rightWingArm', -1);
  root.add(leftWingArm);
  root.add(rightWingArm);

  // ==================== 4. LEGS & 3-TOED LAVENDER FEET ====================
  const buildBatLeg = (legName, side) => {
    const legGrp = new THREE.Group();
    legGrp.name = legName;
    legGrp.position.set(side * 0.15, -0.52, 0);

    const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.12, 0.28, 20), matTorso);
    thighMesh.position.set(0, -0.14, 0);
    legGrp.add(thighMesh);

    const footPawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.132, 20, 16), matFoot);
    footPawMesh.name = 'footPawMesh';
    footPawMesh.scale.set(1.05, 0.72, 1.35);
    footPawMesh.position.set(0, -0.32, 0.055);
    legGrp.add(footPawMesh);

    [-0.052, 0, 0.052].forEach((tx) => {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), matFoot);
      toe.position.set(tx, -0.33, 0.185);
      legGrp.add(toe);
    });
    return legGrp;
  };

  const leftLeg = buildBatLeg('leftLeg', 1);
  const rightLeg = buildBatLeg('rightLeg', -1);
  root.add(leftLeg);
  root.add(rightLeg);

  // Attach Unified Verification & Reference Metadata directly onto root group
  const stats = countGroupStats(root);
  root.characterId = 'LunaBat';
  root.displayName = 'LunaBat (StarBat)';
  root.group = root;
  root.vertexCount = stats.vertexCount;
  root.meshCount = stats.meshCount;
  root.currentAnimation = 'idle';
  root.animationTime = 0;
  root.pendantLight = moonStarLight;
  root.pendantEmissiveMesh = crescentMoonMesh;
  root.parts = {
    head,
    leftEar,
    rightEar,
    eyes,
    muzzle,
    muzzleSmile: muzzle,
    nose,
    torso,
    zipper,
    chestZipper: zipper,
    moonStarPendant,
    leftWingArm,
    rightWingArm,
    leftLeg,
    rightLeg,
    leftFoot: leftLeg,
    rightFoot: rightLeg,
    pilotGear,
  };

  return root;
}
