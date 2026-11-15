import * as THREE from 'three';
import { createSolarPanelTexture, createTireTreadTexture } from './proceduralMaterials';

export interface RoverHandle {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  sensorHead?: THREE.Object3D;
}

export interface RoverBuildOptions {
  isPlayerBuggy?: boolean;
  beaconColorHex?: number;
  maxAnisotropy?: number;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHullLiveryTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Ceramic warm-white composite base
  ctx.fillStyle = '#eef2f6';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle metallic panel seams
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.beginPath();
  ctx.moveTo(170, 10);
  ctx.lineTo(170, 246);
  ctx.moveTo(350, 10);
  ctx.lineTo(350, 246);
  ctx.stroke();

  // Aerospace accent band (cyan + amber hazard trim)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 186, 512, 34);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 180, 512, 6);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(24, 196, 86, 14);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('ASTRONOVA // LTV-6X', 128, 210);

  // Micro vent grille slots
  ctx.fillStyle = '#64748b';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(376 + i * 16, 48, 8, 42);
  }

  // Rivet dots
  ctx.fillStyle = '#94a3b8';
  for (let x = 24; x <= 488; x += 58) {
    ctx.beginPath();
    ctx.arc(x, 24, 2.5, 0, Math.PI * 2);
    ctx.arc(x, 232, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function createDashboardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#050b16';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 244, 116);

  // Mini radar circle
  ctx.beginPath();
  ctx.arc(62, 64, 34, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(62, 54, 4, 0, Math.PI * 2);
  ctx.fill();

  // Telemetry bars
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('PWR 98%', 116, 40);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(116, 48, 108, 10);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('TORQUE OK', 116, 82);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(116, 90, 88, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBeveledBodyGeo(w: number, h: number, d: number, bevel = 0.06): THREE.ExtrudeGeometry {
  const hw = w / 2 - bevel;
  const hh = h / 2 - bevel;
  const r = Math.min(hw, hh) * 0.25;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.05, d - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

function makeStrutTube(p1: THREE.Vector3, p2: THREE.Vector3, radius: number): THREE.TubeGeometry {
  const curve = new THREE.LineCurve3(p1, p2);
  return new THREE.TubeGeometry(curve, 2, radius, 7, false);
}

/**
 * Builds a NASA Artemis LTV / Perseverance-inspired 6x6 Planetary Exploration Rover.
 * Origin sits flush at bottom-center (y = 0 at tire contact patch), facing +Z.
 */
export function createSpaceRover(options: RoverBuildOptions = {}): RoverHandle {
  const {
    isPlayerBuggy = false,
    beaconColorHex = isPlayerBuggy ? 0x22d3ee : 0xf59e0b,
    maxAnisotropy = 4,
  } = options;

  const g = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const scaleFactor = isPlayerBuggy ? 1.24 : 1.04;
  g.scale.setScalar(scaleFactor);

  // Varied PBR Material Library
  const liveryTex = createHullLiveryTexture(maxAnisotropy);
  const hullMat = new THREE.MeshPhysicalMaterial({
    map: liveryTex,
    color: isPlayerBuggy ? 0xffffff : 0xf1f5f9,
    roughness: 0.34,
    metalness: 0.14,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
  });

  const titaniumMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    roughness: 0.24,
    metalness: 0.88,
    clearcoat: 0.35,
  });

  const carbonFrameMat = new THREE.MeshStandardMaterial({
    color: 0x161f30,
    roughness: 0.62,
    metalness: 0.42,
  });

  const orangeCageMat = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    roughness: 0.32,
    metalness: 0.35,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  });

  const goldMliMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    roughness: 0.24,
    metalness: 0.94,
    clearcoat: 0.5,
  });

  const beaconGlowMat = new THREE.MeshStandardMaterial({
    color: beaconColorHex,
    emissive: beaconColorHex,
    emissiveIntensity: 1.5,
    roughness: 0.18,
  });

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });

  const headlightLensMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0xbae6fd,
    emissiveIntensity: 1.85,
    roughness: 0.1,
  });

  const solarTex = createSolarPanelTexture(maxAnisotropy);
  const solarDeckMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.22,
    metalness: 0.68,
  });

  // Grounding contact shadow beneath tires
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65, 3.1),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  g.add(contactShadow);

  // 1. Sculpted Carbon Undercarriage & Angled Front Bash Skid Plate
  const underTray = new THREE.Mesh(createBeveledBodyGeo(1.36, 0.16, 1.98, 0.03), carbonFrameMat);
  underTray.position.set(0, 0.44, -0.02);
  underTray.castShadow = true;
  g.add(underTray);

  const skidPlate = new THREE.Mesh(createBeveledBodyGeo(1.12, 0.08, 0.42, 0.02), titaniumMat);
  skidPlate.position.set(0, 0.48, 1.05);
  skidPlate.rotation.x = -0.52;
  g.add(skidPlate);

  // 2. Sculpted Aerospace Main Fuselage + Sloped Hood + Side MLI Equipment Bays
  const mainBody = new THREE.Mesh(createBeveledBodyGeo(1.38, 0.34, 1.86, 0.055), hullMat);
  mainBody.position.set(0, 0.68, -0.04);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  g.add(mainBody);

  // Sloped front nose cowl (+Z)
  const frontCowl = new THREE.Mesh(createBeveledBodyGeo(1.26, 0.24, 0.46, 0.045), hullMat);
  frontCowl.position.set(0, 0.64, 0.94);
  frontCowl.rotation.x = 0.26;
  frontCowl.castShadow = true;
  g.add(frontCowl);

  // Gold Kapton MLI Thermal Insulation Pods on both sides
  [-0.74, 0.74].forEach((sx) => {
    const mliPod = new THREE.Mesh(createBeveledBodyGeo(0.14, 0.24, 1.24, 0.03), goldMliMat);
    mliPod.position.set(sx, 0.69, -0.08);
    mliPod.castShadow = true;
    g.add(mliPod);
  });

  // Heavy Front & Rear Protective Bumpers
  const frontBumper = new THREE.Mesh(createBeveledBodyGeo(1.48, 0.12, 0.16, 0.03), carbonFrameMat);
  frontBumper.position.set(0, 0.58, 1.15);
  g.add(frontBumper);

  const rearBumper = new THREE.Mesh(createBeveledBodyGeo(1.46, 0.14, 0.16, 0.03), carbonFrameMat);
  rearBumper.position.set(0, 0.58, -1.04);
  g.add(rearBumper);

  // Flush Dual LED Headlight Housings + Taillight Strip
  [-0.44, 0.44].forEach((lx) => {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.1), carbonFrameMat);
    pod.position.set(lx, 0.66, 1.13);
    g.add(pod);

    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.04), headlightLensMat);
    lens.position.set(lx, 0.66, 1.18);
    g.add(lens);
  });

  const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.055, 0.04), tailLightMat);
  tailStrip.position.set(0, 0.63, -1.12);
  g.add(tailStrip);

  if (isPlayerBuggy) {
    // Ground-skimming volumetric light cones
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeo = new THREE.ConeGeometry(0.95, 4.6, 10, 1, true);
    beamGeo.rotateX(-Math.PI / 2);
    [-0.44, 0.44].forEach((lx) => {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(lx, 0.6, 3.45);
      beam.rotation.x = 0.06;
      g.add(beam);
    });
  }

  // 3. Rocker-Bogie Suspension Linkage & 6 Heavy-Duty Deep-Dish Wheels
  const treadTex = createTireTreadTexture();
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a2232,
    bumpMap: treadTex,
    bumpScale: 0.035,
    roughness: 0.84,
    metalness: 0.16,
  });

  const wheelRadius = 0.30;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, 0.255, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const hubCapGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.28, 8);
  hubCapGeo.rotateZ(Math.PI / 2);

  const spokeGeo = new THREE.BoxGeometry(0.26, 0.045, wheelRadius * 1.24);
  const fenderGeo = new THREE.CylinderGeometry(
    wheelRadius + 0.075,
    wheelRadius + 0.075,
    0.26,
    10,
    1,
    true,
    Math.PI * 0.18,
    Math.PI * 0.64
  );
  fenderGeo.rotateZ(Math.PI / 2);
  const fenderMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });

  [-0.95, 0.95].forEach((wx) => {
    const sx = Math.sign(wx);
    const pivotHip = new THREE.Vector3(sx * 0.72, 0.66, -0.05);
    const rearHub = new THREE.Vector3(wx, wheelRadius, -0.82);
    const bogieJoint = new THREE.Vector3(sx * 0.86, 0.48, 0.40);
    const midHub = new THREE.Vector3(wx, wheelRadius, 0.0);
    const frontHub = new THREE.Vector3(wx, wheelRadius, 0.82);

    // Tubular rocker-bogie arms
    const struts = [
      makeStrutTube(pivotHip, rearHub, 0.036),
      makeStrutTube(pivotHip, bogieJoint, 0.038),
      makeStrutTube(bogieJoint, midHub, 0.033),
      makeStrutTube(bogieJoint, frontHub, 0.035),
    ];
    struts.forEach((tubeGeo) => {
      const mesh = new THREE.Mesh(tubeGeo, titaniumMat);
      mesh.castShadow = true;
      g.add(mesh);
    });

    // Anodized differential pivot & orange suspension coil sleeves
    const diffPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 10), carbonFrameMat);
    diffPivot.rotation.z = Math.PI / 2;
    diffPivot.position.copy(pivotHip);
    g.add(diffPivot);

    const shockCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 8), orangeCageMat);
    shockCollar.position.set(sx * 0.80, 0.56, 0.20);
    shockCollar.rotation.x = 0.7;
    g.add(shockCollar);

    [-0.82, 0.0, 0.82].forEach((wz) => {
      // Static fender mudguard over each wheel
      const fender = new THREE.Mesh(fenderGeo, fenderMat);
      fender.position.set(wx, wheelRadius + 0.02, wz);
      g.add(fender);

      // Rotating Wheel Pivot (spins visually around X-axis when driving)
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(wx, wheelRadius, wz);

      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      wheelPivot.add(tire);

      const rim = new THREE.Mesh(rimGeo, titaniumMat);
      wheelPivot.add(rim);

      // Twin crossed wheel spokes so wheel spin reads clearly at all speeds
      const spokeA = new THREE.Mesh(spokeGeo, carbonFrameMat);
      const spokeB = new THREE.Mesh(spokeGeo, carbonFrameMat);
      spokeB.rotation.x = Math.PI / 2;
      wheelPivot.add(spokeA, spokeB);

      const hubCap = new THREE.Mesh(hubCapGeo, orangeCageMat);
      wheelPivot.add(hubCap);

      g.add(wheelPivot);
      wheels.push(wheelPivot);
    });
  });

  // 4. Cockpit Crew Deck (Player Buggy) vs Science Payload Deck (Autonomous Rover)
  if (isPlayerBuggy) {
    // Tubular sculpted roll-cage arches along smooth 3D CatmullRomCurve3
    [-0.56, 0.56].forEach((rx) => {
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, 0.82, -0.58),
        new THREE.Vector3(rx * 0.94, 1.48, -0.34),
        new THREE.Vector3(rx * 0.94, 1.52, 0.24),
        new THREE.Vector3(rx, 0.84, 0.58),
      ]);
      const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 18, 0.042, 8, false), orangeCageMat);
      archMesh.castShadow = true;
      g.add(archMesh);
    });

    // Overhead Roll-Cage Crossbar + 3-Pod Roof Light Bar
    const roofBar = new THREE.Mesh(
      makeStrutTube(new THREE.Vector3(-0.56, 1.50, 0.08), new THREE.Vector3(0.56, 1.50, 0.08), 0.036),
      orangeCageMat
    );
    g.add(roofBar);

    const lightBarFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.12), carbonFrameMat);
    lightBarFrame.position.set(0, 1.56, 0.14);
    g.add(lightBarFrame);

    [-0.24, 0, 0.24].forEach((px) => {
      const spotLed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.04), headlightLensMat);
      spotLed.position.set(px, 1.56, 0.21);
      g.add(spotLed);
    });

    // Sculpted Astronaut Seat (cushion + backrest + headrest)
    const seatBase = new THREE.Mesh(createBeveledBodyGeo(0.68, 0.14, 0.56, 0.03), carbonFrameMat);
    seatBase.position.set(0, 0.90, -0.06);
    g.add(seatBase);

    const seatBack = new THREE.Mesh(createBeveledBodyGeo(0.64, 0.48, 0.14, 0.03), carbonFrameMat);
    seatBack.position.set(0, 1.12, -0.32);
    seatBack.rotation.x = -0.14;
    g.add(seatBack);

    const headrest = new THREE.Mesh(createBeveledBodyGeo(0.36, 0.18, 0.12, 0.025), hullMat);
    headrest.position.set(0, 1.40, -0.36);
    g.add(headrest);

    // Holographic Dashboard Console + Twin-Grip Steering Yoke
    const dashPod = new THREE.Mesh(createBeveledBodyGeo(0.68, 0.22, 0.24, 0.03), carbonFrameMat);
    dashPod.position.set(0, 0.98, 0.44);
    dashPod.rotation.x = 0.35;
    g.add(dashPod);

    const dashScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.15),
      new THREE.MeshBasicMaterial({ map: createDashboardTexture() })
    );
    dashScreen.position.set(0, 1.03, 0.33);
    dashScreen.rotation.x = -0.52;
    g.add(dashScreen);

    const yokeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.24, 8), titaniumMat);
    yokeStem.position.set(0, 0.95, 0.30);
    yokeStem.rotation.x = 0.58;
    g.add(yokeStem);

    const yokeBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.06), orangeCageMat);
    yokeBar.position.set(0, 1.04, 0.23);
    g.add(yokeBar);

    // Rear Cargo Rack + Glowing Cyan Sample Canister
    const cargoTray = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.10, 0.44), carbonFrameMat);
    cargoTray.position.set(0, 0.89, -0.74);
    g.add(cargoTray);

    const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.34, 10), titaniumMat);
    canister.rotation.z = Math.PI / 2;
    canister.position.set(0.22, 0.98, -0.74);
    g.add(canister);

    const canisterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.08, 10), beaconGlowMat);
    canisterRing.rotation.z = Math.PI / 2;
    canisterRing.position.set(0.22, 0.98, -0.74);
    g.add(canisterRing);
  } else {
    // Autonomous Rover: Top Solar Wing Deck + Front Articulated Science Arm
    const solarDeck = new THREE.Mesh(createBeveledBodyGeo(1.36, 0.07, 1.48, 0.02), solarDeckMat);
    solarDeck.position.set(0, 0.89, -0.14);
    g.add(solarDeck);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, 0.68, 1.08),
      new THREE.Vector3(-0.38, 0.86, 1.42),
      new THREE.Vector3(-0.14, 0.72, 1.62),
    ]);
    const armTube = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 10, 0.042, 7, false), titaniumMat);
    g.add(armTube);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 10), orangeCageMat);
    turret.position.set(-0.14, 0.72, 1.64);
    g.add(turret);
  }

  // 5. Elevated Stereo Mastcam Head (front-right mount)
  const mastBaseX = isPlayerBuggy ? 0.50 : 0.0;
  const mastBaseZ = isPlayerBuggy ? 0.76 : 0.66;
  const mastHeight = isPlayerBuggy ? 0.68 : 0.84;

  const mastPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.062, mastHeight, 8),
    titaniumMat
  );
  mastPole.position.set(mastBaseX, 0.84 + mastHeight * 0.5, mastBaseZ);
  mastPole.castShadow = true;
  g.add(mastPole);

  const sensorHead = new THREE.Group();
  sensorHead.position.set(mastBaseX, 0.84 + mastHeight + 0.06, mastBaseZ + 0.02);

  const camHousing = new THREE.Mesh(createBeveledBodyGeo(0.42, 0.18, 0.24, 0.03), hullMat);
  sensorHead.add(camHousing);

  const camVisor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.06), carbonFrameMat);
  camVisor.position.set(0, 0, 0.11);
  sensorHead.add(camVisor);

  // Twin Stereo Sapphire Optics
  [-0.10, 0.10].forEach((ex) => {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.06, 10), titaniumMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(ex, 0.01, 0.14);
    sensorHead.add(bezel);

    const eyeGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.07, 10), beaconGlowMat);
    eyeGlow.rotation.x = Math.PI / 2;
    eyeGlow.position.set(ex, 0.01, 0.145);
    sensorHead.add(eyeGlow);
  });

  // Top laser spectrometer dome
  const chemCam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.07, 8), goldMliMat);
  chemCam.position.set(0, 0.11, 0);
  sensorHead.add(chemCam);

  g.add(sensorHead);

  // 6. Rear High-Gain Parabolic Dish (LatheGeometry) & Whip Antenna
  const dishPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.12, 0.02),
    new THREE.Vector2(0.24, 0.07),
    new THREE.Vector2(0.30, 0.14),
  ];
  const dishGeo = new THREE.LatheGeometry(dishPoints, 16);
  const dishGroup = new THREE.Group();
  dishGroup.position.set(-0.46, 1.02, -0.78);
  dishGroup.rotation.x = -0.58;
  dishGroup.rotation.z = 0.18;

  const dishMesh = new THREE.Mesh(dishGeo, hullMat);
  dishGroup.add(dishMesh);

  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.18, 8), goldMliMat);
  feedHorn.position.set(0, 0.09, 0);
  dishGroup.add(feedHorn);
  g.add(dishGroup);

  const whipAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.72, 6), titaniumMat);
  whipAntenna.position.set(0.56, 1.24, -0.84);
  g.add(whipAntenna);

  const whipTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), beaconGlowMat);
  whipTip.position.set(0.56, 1.60, -0.84);
  g.add(whipTip);

  // 7. Finned Rear MMRTG Nuclear Power Pack
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(0, 0.86, -1.04);
  rtgGroup.rotation.x = Math.PI * 0.28;

  const rtgCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.50, 10), goldMliMat);
  rtgGroup.add(rtgCore);

  const rtgCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 10), carbonFrameMat);
  rtgCap.position.y = 0.26;
  rtgGroup.add(rtgCap);

  // 4 radial heat-dissipating fins
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.025), titaniumMat);
    fin.rotation.y = (i * Math.PI) / 4;
    rtgGroup.add(fin);
  }
  g.add(rtgGroup);

  return {
    group: g,
    wheels,
    sensorHead,
  };
}
