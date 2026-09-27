// Shared Procedural Plush Textures, Diamond-Quilted Wing Membranes, Stitch Seams & Pilot Gear

const THREE = window.THREE;

let _cachedPlushBump = null;
let _cachedDiamondQuilt = null;

export function createPlushBumpTexture(size = 128) {
  if (_cachedPlushBump) return _cachedPlushBump;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const shade = Math.floor(90 + rand() * 140);
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 4, y + 3 + rand() * 3);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  _cachedPlushBump = tex;
  return tex;
}

export function createDiamondQuiltTexture(baseHex = '#9f78d9', seamHex = '#563694', size = 256) {
  if (_cachedDiamondQuilt) return _cachedDiamondQuilt;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const step = 32;
  // Subtle pillow highlights inside diamonds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let y = 0; y <= size; y += step) {
    for (let x = 0; x <= size; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Intersecting 45-degree quilted stitch lines
  ctx.strokeStyle = seamHex;
  ctx.lineWidth = 2.8;
  ctx.setLineDash([5, 3]);
  for (let offset = -size; offset <= size * 2; offset += step) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, size);
    ctx.lineTo(offset + size, 0);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  _cachedDiamondQuilt = tex;
  return tex;
}

export function createPlushMaterial(hexColor, extra = {}) {
  const bumpMap = createPlushBumpTexture();
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hexColor),
    roughness: extra.roughness ?? 0.82,
    metalness: extra.metalness ?? 0.04,
    bumpMap,
    bumpScale: extra.bumpScale ?? 0.018,
    ...extra,
  });
}

export function createStitchSeamStrip(points, colorHex = '#4a2511', dashCount = 8, name = 'stitchSeam') {
  const group = new THREE.Group();
  group.name = name;
  const curve = new THREE.CatmullRomCurve3(points);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.7,
    metalness: 0.05,
  });
  const geom = new THREE.CapsuleGeometry(0.0055, 0.014, 4, 6);

  for (let i = 0; i < dashCount; i++) {
    const u = (i + 0.5) / dashCount;
    const pt = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    const stitch = new THREE.Mesh(geom, mat);
    stitch.position.copy(pt);
    const up = new THREE.Vector3(0, 1, 0);
    stitch.quaternion.setFromUnitVectors(up, tangent.normalize());
    group.add(stitch);
  }
  return group;
}

export function createPilotGearGroup(defaultGoggles = true, defaultScarf = true, defaultCap = false) {
  const pilotGear = new THREE.Group();
  pilotGear.name = 'pilotGear';

  // 1. Aviator Goggles
  const aviatorGoggles = new THREE.Group();
  aviatorGoggles.name = 'aviatorGoggles';
  aviatorGoggles.visible = Boolean(defaultGoggles);

  const strapMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.6, metalness: 0.2 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd49b35, roughness: 0.25, metalness: 0.85 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    emissive: 0x114466,
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.75,
  });

  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.022, 8, 28), strapMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.set(0, 0.27, 0.02);
  aviatorGoggles.add(strap);

  [-0.14, 0.14].forEach((xOff) => {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.045, 14), frameMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(xOff, 0.27, 0.42);
    aviatorGoggles.add(rim);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.05, 14), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(xOff, 0.27, 0.425);
    aviatorGoggles.add(lens);
  });
  pilotGear.add(aviatorGoggles);

  // 2. Pilot Scarf
  const pilotScarf = new THREE.Group();
  pilotScarf.name = 'pilotScarf';
  pilotScarf.visible = Boolean(defaultScarf);

  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xfff5e1, roughness: 0.75 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.75 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.048, 10, 24), scarfMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, -0.36, 0.02);
  pilotScarf.add(collar);

  const tailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.42), scarfMat);
  tailLeft.name = 'scarfTailLeft';
  tailLeft.position.set(0.14, -0.38, -0.24);
  pilotScarf.add(tailLeft);

  const tailRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.36), stripeMat);
  tailRight.name = 'scarfTailRight';
  tailRight.position.set(0.05, -0.40, -0.22);
  pilotScarf.add(tailRight);
  pilotGear.add(pilotScarf);

  // 3. Captain's Cap
  const captainCap = new THREE.Group();
  captainCap.name = 'captainCap';
  captainCap.visible = Boolean(defaultCap);

  const capNavy = new THREE.MeshStandardMaterial({ color: 0x1d2d50, roughness: 0.55 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.15, metalness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.25, metalness: 0.85 });

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.14, 20), capNavy);
  crown.position.set(0, 0.48, 0.02);
  captainCap.add(crown);

  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.025, 18, 1, false, -Math.PI * 0.4, Math.PI * 0.8), visorMat);
  visor.position.set(0, 0.42, 0.14);
  visor.rotation.x = 0.22;
  captainCap.add(visor);

  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 1), goldMat);
  badge.position.set(0, 0.49, 0.23);
  captainCap.add(badge);
  pilotGear.add(captainCap);

  return pilotGear;
}

export function countGroupStats(rootGroup) {
  let vertexCount = 0;
  let meshCount = 0;
  rootGroup.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.geometry.attributes && obj.geometry.attributes.position) {
      meshCount += 1;
      vertexCount += obj.geometry.attributes.position.count;
    }
  });
  return { vertexCount, meshCount };
}
