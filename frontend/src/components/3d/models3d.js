import * as THREE from 'three';

/**
 * Procedural 3D Badminton Assets
 * Zero external download dependencies - 100% free, fast, and self-contained.
 */

// 1. Procedural High-Definition Badminton Court Texture
export function generateCourtTexture(theme = 'green') {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Themes
  let matColor = '#006B3F'; // TUC Forest Court Green
  let borderOuterColor = '#00472A';
  let lineColor = '#FFFFFF';

  if (theme === 'blue') {
    matColor = '#1E40AF'; // BWF Olympic Blue
    borderOuterColor = '#172554';
    lineColor = '#FFFFFF';
  } else if (theme === 'wood') {
    matColor = '#C89357'; // Indoor Sports Hall Parquet
    borderOuterColor = '#9A6B38';
    lineColor = '#FFFFFF';
  }

  // Draw outer safety run-off area
  ctx.fillStyle = borderOuterColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Court proportions: 13.4m long x 6.1m wide
  // Padding around court:
  const padX = 140;
  const padY = 110;
  const courtW = canvas.width - padX * 2; // represents 13.4m
  const courtH = canvas.height - padY * 2; // represents 6.1m

  // Draw main mat
  ctx.fillStyle = matColor;
  ctx.fillRect(padX, padY, courtW, courtH);

  // Subtle court texture (subtle PVC mat texture or wood planks)
  if (theme === 'wood') {
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let y = padY; y < padY + courtH; y += 14) {
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + courtW, y);
      ctx.stroke();
    }
  } else {
    // Mat texture grain
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 4000; i++) {
      const rx = padX + Math.random() * courtW;
      const ry = padY + Math.random() * courtH;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  // Draw lines (White 40mm)
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 6;
  ctx.lineCap = 'square';

  // 1. Outer boundary (Doubles perimeter)
  ctx.strokeRect(padX, padY, courtW, courtH);

  // Scaling helpers
  // courtW = 13.4m -> scaleX = courtW / 13.4
  // courtH = 6.10m -> scaleY = courtH / 6.10
  const scaleX = courtW / 13.4;
  const scaleY = courtH / 6.1;

  // 2. Net Line (Center dividing line across length)
  const netX = padX + courtW / 2;
  ctx.beginPath();
  ctx.moveTo(netX, padY);
  ctx.lineTo(netX, padY + courtH);
  ctx.stroke();

  // 3. Singles sidelines (5.18m wide -> 0.46m inside doubles sidelines on each side)
  const singlesOffset = 0.46 * scaleY;
  ctx.beginPath();
  // Top singles sideline
  ctx.moveTo(padX, padY + singlesOffset);
  ctx.lineTo(padX + courtW, padY + singlesOffset);
  // Bottom singles sideline
  ctx.moveTo(padX, padY + courtH - singlesOffset);
  ctx.lineTo(padX + courtW, padY + courtH - singlesOffset);
  ctx.stroke();

  // 4. Short service lines (1.98m from net on each side)
  const shortServiceOffset = 1.98 * scaleX;
  const leftShortServiceX = netX - shortServiceOffset;
  const rightShortServiceX = netX + shortServiceOffset;

  ctx.beginPath();
  ctx.moveTo(leftShortServiceX, padY);
  ctx.lineTo(leftShortServiceX, padY + courtH);
  ctx.moveTo(rightShortServiceX, padY);
  ctx.lineTo(rightShortServiceX, padY + courtH);
  ctx.stroke();

  // 5. Long service lines for doubles (0.76m inside back boundary line)
  const doublesLongServiceOffset = 0.76 * scaleX;
  const leftDoublesLongX = padX + doublesLongServiceOffset;
  const rightDoublesLongX = padX + courtW - doublesLongServiceOffset;

  ctx.beginPath();
  ctx.moveTo(leftDoublesLongX, padY);
  ctx.lineTo(leftDoublesLongX, padY + courtH);
  ctx.moveTo(rightDoublesLongX, padY);
  ctx.lineTo(rightDoublesLongX, padY + courtH);
  ctx.stroke();

  // 6. Center lines (running from short service line to back boundary line)
  const centerY = padY + courtH / 2;
  ctx.beginPath();
  // Left half center line
  ctx.moveTo(padX, centerY);
  ctx.lineTo(leftShortServiceX, centerY);
  // Right half center line
  ctx.moveTo(rightShortServiceX, centerY);
  ctx.lineTo(padX + courtW, centerY);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 2. Procedural 3D Shuttlecock
export function createShuttlecock({ scale = 1, featherColor = 0xffffff, corkColor = 0xf5f3ee } = {}) {
  const group = new THREE.Group();
  group.name = 'Shuttlecock';

  // A. Cork Base
  const corkGeo = new THREE.SphereGeometry(0.26 * scale, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const corkMat = new THREE.MeshStandardMaterial({
    color: corkColor,
    roughness: 0.55,
    metalness: 0.05,
  });
  const corkMesh = new THREE.Mesh(corkGeo, corkMat);
  corkMesh.castShadow = true;
  group.add(corkMesh);

  // Cork leather ribbon trim (dark green or red band)
  const bandGeo = new THREE.TorusGeometry(0.245 * scale, 0.025 * scale, 16, 32);
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x005A36,
    roughness: 0.3,
    metalness: 0.2,
  });
  const bandMesh = new THREE.Mesh(bandGeo, bandMat);
  bandMesh.rotation.x = Math.PI / 2;
  bandMesh.position.y = 0.06 * scale;
  group.add(bandMesh);

  // B. 16 Feathers in conical aerodynamic layout
  const featherCount = 16;
  const skirtHeight = 0.72 * scale;
  const bottomRadius = 0.24 * scale;
  const topRadius = 0.65 * scale;

  const featherMat = new THREE.MeshStandardMaterial({
    color: featherColor,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.94,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.4,
  });

  for (let i = 0; i < featherCount; i++) {
    const angle = (i / featherCount) * Math.PI * 2;
    const featherGroup = new THREE.Group();

    // Quill / Stem
    const stemGeo = new THREE.CylinderGeometry(0.012 * scale, 0.014 * scale, skirtHeight, 8);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.y = skirtHeight / 2;
    featherGroup.add(stemMesh);

    // Feather Blade (Vane)
    const bladeGeo = new THREE.PlaneGeometry(0.14 * scale, skirtHeight * 0.75);
    const bladeMesh = new THREE.Mesh(bladeGeo, featherMat);
    bladeMesh.position.y = skirtHeight * 0.6;
    bladeMesh.position.x = 0.03 * scale;
    bladeMesh.rotation.y = 0.28; // overlap angle for real badminton spin
    featherGroup.add(bladeMesh);

    // Position and angle outward
    const x = Math.cos(angle) * bottomRadius;
    const z = Math.sin(angle) * bottomRadius;
    featherGroup.position.set(x, 0.08 * scale, z);

    // Tilt outward toward topRadius
    const tiltAngle = Math.atan2(topRadius - bottomRadius, skirtHeight);
    featherGroup.rotation.y = -angle + Math.PI / 2;
    featherGroup.rotation.z = -tiltAngle;

    group.add(featherGroup);
  }

  // C. Twin Binding Thread Rings
  const ring1Geo = new THREE.TorusGeometry(0.40 * scale, 0.015 * scale, 12, 32);
  const ring2Geo = new THREE.TorusGeometry(0.53 * scale, 0.015 * scale, 12, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });

  const ring1Mesh = new THREE.Mesh(ring1Geo, ringMat);
  ring1Mesh.rotation.x = Math.PI / 2;
  ring1Mesh.position.y = 0.35 * scale;
  group.add(ring1Mesh);

  const ring2Mesh = new THREE.Mesh(ring2Geo, ringMat);
  ring2Mesh.rotation.x = Math.PI / 2;
  ring2Mesh.position.y = 0.58 * scale;
  group.add(ring2Mesh);

  return group;
}

// 3. Procedural 3D Badminton Racket
export function createRacket({ scale = 1, frameColor = 0x005A36 } = {}) {
  const group = new THREE.Group();
  group.name = 'Racket';

  // A. Oval Frame (Head)
  const frameGeo = new THREE.TorusGeometry(0.9 * scale, 0.045 * scale, 16, 48);
  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.25,
    metalness: 0.65,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.scale.set(0.72, 1.0, 1.0); // stretch oval head
  frameMesh.position.y = 2.4 * scale;
  group.add(frameMesh);

  // String Grid Bed (semi-transparent crossed mesh)
  const stringGeo = new THREE.CircleGeometry(0.85 * scale, 32);
  const stringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
    side: THREE.DoubleSide,
  });
  const stringMesh = new THREE.Mesh(stringGeo, stringMat);
  stringMesh.scale.set(0.68, 0.95, 1.0);
  stringMesh.position.y = 2.4 * scale;
  group.add(stringMesh);

  // B. T-Joint
  const jointGeo = new THREE.CylinderGeometry(0.06 * scale, 0.05 * scale, 0.2 * scale, 16);
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
  const jointMesh = new THREE.Mesh(jointGeo, jointMat);
  jointMesh.position.y = 1.4 * scale;
  group.add(jointMesh);

  // C. Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.035 * scale, 0.035 * scale, 1.3 * scale, 16);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.2,
  });
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  shaftMesh.position.y = 0.75 * scale;
  group.add(shaftMesh);

  // D. Grip Handle
  const gripGeo = new THREE.CylinderGeometry(0.065 * scale, 0.075 * scale, 0.85 * scale, 16);
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
    metalness: 0.05,
  });
  const gripMesh = new THREE.Mesh(gripGeo, gripMat);
  gripMesh.position.y = -0.3 * scale;
  group.add(gripMesh);

  // Grip End Cap
  const capGeo = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.06 * scale, 16);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x005A36, metalness: 0.5 });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.y = -0.73 * scale;
  group.add(capMesh);

  return group;
}

// 4. Procedural Full 3D Badminton Court
export function createCourtScene({ theme = 'green' } = {}) {
  const courtGroup = new THREE.Group();
  courtGroup.name = 'BadmintonCourt';

  // Court geometry: 13.4m long x 6.1m wide, with 1.0m safety surround
  const courtFloorGeo = new THREE.PlaneGeometry(15.4, 8.1);
  const courtMat = new THREE.MeshStandardMaterial({
    map: generateCourtTexture(theme),
    roughness: 0.7,
    metalness: 0.05,
  });
  const floorMesh = new THREE.Mesh(courtFloorGeo, courtMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  courtGroup.add(floorMesh);

  // Outer Floor Platform / Stadium Hall Floor Base
  const baseGeo = new THREE.BoxGeometry(16.0, 0.15, 8.7);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0a1612,
    roughness: 0.9,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.08;
  baseMesh.receiveShadow = true;
  courtGroup.add(baseMesh);

  // Posts & Net Setup (At Center: x = 0, along z = -3.05 to +3.05)
  const postHeight = 1.55;
  const postGeo = new THREE.CylinderGeometry(0.035, 0.045, postHeight, 24);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x003B23,
    metalness: 0.8,
    roughness: 0.25,
  });

  // Post Left (z = -3.05)
  const postLeft = new THREE.Mesh(postGeo, postMat);
  postLeft.position.set(0, postHeight / 2, -3.05);
  postLeft.castShadow = true;
  courtGroup.add(postLeft);

  // Post Right (z = +3.05)
  const postRight = new THREE.Mesh(postGeo, postMat);
  postRight.position.set(0, postHeight / 2, 3.05);
  postRight.castShadow = true;
  courtGroup.add(postRight);

  // Post base plates
  const basePlateGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.04, 24);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
  const plateLeft = new THREE.Mesh(basePlateGeo, plateMat);
  plateLeft.position.set(0, 0.02, -3.05);
  courtGroup.add(plateLeft);

  const plateRight = new THREE.Mesh(basePlateGeo, plateMat);
  plateRight.position.set(0, 0.02, 3.05);
  courtGroup.add(plateRight);

  // Net Mesh (6.10m long, 0.76m tall, bottom at 0.764m, top at 1.524m/1.55m)
  const netGeo = new THREE.PlaneGeometry(6.10, 0.76, 24, 8);
  // Generate net grid texture
  const netCanvas = document.createElement('canvas');
  netCanvas.width = 512;
  netCanvas.height = 128;
  const nctx = netCanvas.getContext('2d');
  nctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  nctx.fillRect(0, 0, netCanvas.width, netCanvas.height);
  nctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  nctx.lineWidth = 1.2;
  for (let x = 0; x < netCanvas.width; x += 6) {
    nctx.beginPath();
    nctx.moveTo(x, 0);
    nctx.lineTo(x, netCanvas.height);
    nctx.stroke();
  }
  for (let y = 0; y < netCanvas.height; y += 6) {
    nctx.beginPath();
    nctx.moveTo(0, y);
    nctx.lineTo(netCanvas.width, y);
    nctx.stroke();
  }
  const netTex = new THREE.CanvasTexture(netCanvas);
  netTex.wrapS = THREE.RepeatWrapping;
  netTex.wrapT = THREE.RepeatWrapping;
  netTex.repeat.set(10, 2);

  const netMat = new THREE.MeshStandardMaterial({
    map: netTex,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    roughness: 0.5,
  });
  const netMesh = new THREE.Mesh(netGeo, netMat);
  netMesh.rotation.y = Math.PI / 2;
  netMesh.position.set(0, 0.764 + 0.38, 0);
  netMesh.castShadow = true;
  courtGroup.add(netMesh);

  // Top White Net Tape (75mm width along the top of net)
  const tapeGeo = new THREE.BoxGeometry(0.04, 0.075, 6.10);
  const tapeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
  });
  const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
  tapeMesh.position.set(0, 1.53, 0);
  tapeMesh.castShadow = true;
  courtGroup.add(tapeMesh);

  return courtGroup;
}
