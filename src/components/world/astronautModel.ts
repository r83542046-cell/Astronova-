import * as THREE from 'three';
import { createSuitFabricTexture } from './proceduralMaterials';

export interface AstronautRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  thrusterLeft: THREE.Mesh;
  thrusterRight: THREE.Mesh;
  contactShadow: THREE.Mesh;
  walkPhase: number;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBeveledArmorGeo(w: number, h: number, depth: number, bevel = 0.045): THREE.ExtrudeGeometry {
  const hw = w / 2 - bevel;
  const hh = h / 2 - bevel;
  const r = Math.min(hw, hh) * 0.35;
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
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

export function createAstronautModel(visorHex: string): AstronautRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const fabricBump = createSuitFabricTexture();

  // Varied PBR Material Library (woven thermal fabric, dark carbon joints, anisotropic titanium, clearcoat iridescent visor)
  const suitMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    bumpMap: fabricBump,
    bumpScale: 0.018,
    roughness: 0.64,
    metalness: 0.05,
    sheen: 0.42,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color(0xcbd5e1),
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.3,
  });

  const metalMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    roughness: 0.18,
    metalness: 0.92,
    anisotropy: 0.78,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
  });

  const goldFoilMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    roughness: 0.24,
    metalness: 0.94,
    clearcoat: 0.55,
  });

  const accentSuitMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(visorHex),
    roughness: 0.36,
    metalness: 0.22,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });

  // Translucent Gold-Tinted Glass Visor revealing the Human Astronaut Face Inside
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(visorHex),
    emissive: new THREE.Color(visorHex),
    emissiveIntensity: 0.18,
    roughness: 0.04,
    metalness: 0.15,
    transmission: 0.68,
    thickness: 0.8,
    ior: 1.52,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    clearcoat: 1.0,
    iridescence: 0.85,
    envMapIntensity: 1.4,
  });

  // Human Face Materials inside helmet
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2c296, roughness: 0.72 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.1 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xc27803, roughness: 0.6 });

  const accentGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.65,
    roughness: 0.2,
  });

  // Grounded radial contact shadow beneath astronaut boots
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  // 1. Beveled Upper Torso Armor & Pelvis
  const torso = new THREE.Mesh(createBeveledArmorGeo(0.64, 0.68, 0.38, 0.05), suitMat);
  torso.position.set(0, 1.14, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  const belt = new THREE.Mesh(createBeveledArmorGeo(0.66, 0.13, 0.4, 0.025), trimMat);
  belt.position.set(0, 0.79, 0);
  belt.castShadow = true;
  bodyGroup.add(belt);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.06), metalMat);
  beltBuckle.position.set(0, 0.79, 0.2);
  bodyGroup.add(beltBuckle);

  // 2. Sculpted Chest Display & Telemetry Pack
  const chestPack = new THREE.Mesh(createBeveledArmorGeo(0.36, 0.3, 0.12, 0.02), trimMat);
  chestPack.position.set(0, 1.18, 0.21);
  chestPack.castShadow = true;
  bodyGroup.add(chestPack);

  const chestLed = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.02), accentGlowMat);
  chestLed.position.set(0, 1.24, 0.275);
  bodyGroup.add(chestLed);

  const chestAccentStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.41), accentSuitMat);
  chestAccentStripe.position.set(0, 1.38, 0);
  bodyGroup.add(chestAccentStripe);

  // 3. PLSS Life-Support Backpack + Radiator Fins + Dual Thrusters
  const backpack = new THREE.Mesh(createBeveledArmorGeo(0.52, 0.66, 0.3, 0.04), suitMat);
  backpack.position.set(0, 1.19, -0.31);
  backpack.castShadow = true;
  backpack.receiveShadow = true;
  bodyGroup.add(backpack);

  const packFrame = new THREE.Mesh(createBeveledArmorGeo(0.55, 0.12, 0.32, 0.02), metalMat);
  packFrame.position.set(0, 1.36, -0.31);
  bodyGroup.add(packFrame);

  const packRadiator = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.04), goldFoilMat);
  packRadiator.position.set(0, 1.14, -0.46);
  bodyGroup.add(packRadiator);

  const packBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.03), accentGlowMat);
  packBeacon.position.set(0, 1.48, -0.46);
  bodyGroup.add(packBeacon);

  // Curved Umbilical Oxygen Hoses (TubeGeometry) connecting PLSS Backpack to Chest Telemetry Unit
  ([-1, 1] as const).forEach((side) => {
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.14, 1.22, 0.22),
      new THREE.Vector3(side * 0.28, 1.44, 0.12),
      new THREE.Vector3(side * 0.26, 1.48, -0.14),
      new THREE.Vector3(side * 0.16, 1.32, -0.26),
    ]);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 18, 0.032, 8, false);
    const hoseMesh = new THREE.Mesh(hoseGeo, trimMat);
    hoseMesh.castShadow = true;
    bodyGroup.add(hoseMesh);
  });

  const nozzleGeo = new THREE.CylinderGeometry(0.055, 0.085, 0.16, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.92,
  });
  const flameGeo = new THREE.ConeGeometry(0.085, 0.48, 12);
  flameGeo.rotateX(Math.PI);

  const nozzleL = new THREE.Mesh(nozzleGeo, metalMat);
  nozzleL.position.set(-0.16, 0.82, -0.34);
  bodyGroup.add(nozzleL);

  const nozzleR = new THREE.Mesh(nozzleGeo, metalMat);
  nozzleR.position.set(0.16, 0.82, -0.34);
  bodyGroup.add(nozzleR);

  const thrusterLeft = new THREE.Mesh(flameGeo, flameMat);
  thrusterLeft.position.set(-0.16, 0.54, -0.34);
  thrusterLeft.visible = false;
  bodyGroup.add(thrusterLeft);

  const thrusterRight = new THREE.Mesh(flameGeo, flameMat);
  thrusterRight.position.set(0.16, 0.54, -0.34);
  thrusterRight.visible = false;
  bodyGroup.add(thrusterRight);

  // 4. Sculpted Helmet, Locking Neck Collar, Shoulder Floodlight, Iridescent Visor & Human Astronaut Face Inside
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 1.72, 0);
  bodyGroup.add(helmetGroup);

  const neckRing = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.26, 0.1, 20), metalMat);
  neckRing.position.set(0, -0.2, 0);
  helmetGroup.add(neckRing);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 22), suitMat);
  helmetShell.castShadow = true;
  helmetShell.receiveShadow = true;
  helmetGroup.add(helmetShell);

  const helmetCrest = new THREE.Mesh(createBeveledArmorGeo(0.12, 0.12, 0.36, 0.02), accentSuitMat);
  helmetCrest.position.set(0, 0.27, -0.02);
  helmetGroup.add(helmetCrest);

  // Human Astronaut Face visible inside transparent glass visor
  const humanHeadGroup = new THREE.Group();
  humanHeadGroup.position.set(0, -0.02, 0.02);

  const faceSkin = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), skinMat);
  faceSkin.scale.set(1.0, 1.18, 0.95);
  humanHeadGroup.add(faceSkin);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.175, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hairCap.position.set(0, 0.05, -0.02);
  humanHeadGroup.add(hairCap);

  // Eyes
  ([-0.058, 0.058] as const).forEach((ex) => {
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), eyeWhiteMat);
    eyeBall.position.set(ex, 0.02, 0.132);
    humanHeadGroup.add(eyeBall);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), pupilMat);
    pupil.position.set(ex, 0.02, 0.152);
    humanHeadGroup.add(pupil);
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 8), skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.155);
  humanHeadGroup.add(nose);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.02), lipMat);
  mouth.position.set(0, -0.08, 0.142);
  humanHeadGroup.add(mouth);

  helmetGroup.add(humanHeadGroup);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.275, 28, 20, -Math.PI * 0.36, Math.PI * 0.72, Math.PI * 0.2, Math.PI * 0.52),
    visorMat
  );
  visor.rotation.y = Math.PI / 2;
  visor.position.set(0, 0.01, 0.072);
  visor.renderOrder = 3;
  helmetGroup.add(visor);

  const visorBezel = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.018, 8, 28), metalMat);
  visorBezel.position.set(0, 0.01, 0.14);
  visorBezel.scale.set(1.02, 0.86, 1);
  helmetGroup.add(visorBezel);

  const lampHousing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.11), trimMat);
  lampHousing.position.set(-0.26, 0.08, 0.12);
  helmetGroup.add(lampHousing);

  const lampLens = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 10), accentGlowMat);
  lampLens.rotation.x = Math.PI / 2;
  lampLens.position.set(-0.26, 0.08, 0.18);
  helmetGroup.add(lampLens);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.26, 8), metalMat);
  antenna.position.set(0.25, 0.22, -0.1);
  helmetGroup.add(antenna);

  // 5. Articulated Arms with Shoulder Pauldrons & Ribbed Elbow Collars
  const makeArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.43, 1.4, 0);

    const pauldron = new THREE.Mesh(createBeveledArmorGeo(0.24, 0.18, 0.26, 0.03), accentSuitMat);
    pauldron.position.set(side * 0.02, 0.02, 0);
    pauldron.castShadow = true;
    armPivot.add(pauldron);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.34, 6, 14), suitMat);
    sleeve.position.set(0, -0.23, 0);
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.06, 14), metalMat);
    cuff.position.set(0, -0.37, 0);
    armPivot.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), trimMat);
    glove.position.set(0, -0.46, 0);
    glove.castShadow = true;
    armPivot.add(glove);
    return armPivot;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyGroup.add(leftArm, rightArm);

  // 6. Articulated Legs, Knee Guards & Heavy EVA Boots (grounded cleanly at y = 0)
  const makeLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.175, 0.76, 0);

    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.36, 6, 14), suitMat);
    leg.position.set(0, -0.32, 0);
    leg.castShadow = true;
    legPivot.add(leg);

    const kneePad = new THREE.Mesh(createBeveledArmorGeo(0.17, 0.14, 0.08, 0.02), trimMat);
    kneePad.position.set(0, -0.32, 0.11);
    legPivot.add(kneePad);

    const boot = new THREE.Mesh(createBeveledArmorGeo(0.24, 0.18, 0.35, 0.03), trimMat);
    boot.position.set(0, -0.67, 0.04);
    boot.castShadow = true;
    boot.receiveShadow = true;
    legPivot.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.36), metalMat);
    sole.position.set(0, -0.74, 0.04);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  return {
    root,
    bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    thrusterLeft,
    thrusterRight,
    contactShadow,
    walkPhase: 0,
  };
}

export function updateAstronautAnimation(
  rig: AstronautRig,
  dt: number,
  horizontalSpeed: number,
  isGrounded: boolean,
  isSprinting = false,
  heightAboveGround = 0
) {
  const moving = horizontalSpeed > 0.25;
  if (moving && isGrounded) {
    rig.walkPhase += dt * horizontalSpeed * (isSprinting ? 2.35 : 2.05);
    const swingAmp = isSprinting ? 0.78 : 0.6;
    const swing = Math.sin(rig.walkPhase) * swingAmp;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    rig.leftArm.rotation.x = -swing * 0.82;
    rig.rightArm.rotation.x = swing * 0.82;
    rig.bodyGroup.position.y = Math.abs(Math.cos(rig.walkPhase)) * (isSprinting ? 0.08 : 0.05);
    rig.bodyGroup.rotation.x = THREE.MathUtils.damp(
      rig.bodyGroup.rotation.x,
      isSprinting ? 0.18 : 0.07,
      10,
      dt
    );
  } else if (!isGrounded) {
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0.25, 8, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, -0.2, 8, dt);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, -0.5, 8, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, -0.5, 8, dt);
    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, 0, 8, dt);
    rig.bodyGroup.rotation.x = THREE.MathUtils.damp(rig.bodyGroup.rotation.x, 0.06, 8, dt);
  } else {
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 12, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 12, dt);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, 0, 12, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, 0, 12, dt);
    rig.bodyGroup.position.y = THREE.MathUtils.damp(rig.bodyGroup.position.y, 0, 12, dt);
    rig.bodyGroup.rotation.x = THREE.MathUtils.damp(rig.bodyGroup.rotation.x, 0, 12, dt);
  }

  // Contact shadow shrinks and softens smoothly when jetpack-jumping high
  const shadowScale = THREE.MathUtils.clamp(1 - heightAboveGround * 0.14, 0.45, 1.0);
  rig.contactShadow.scale.set(shadowScale, shadowScale, 1);
  rig.contactShadow.position.y = Math.max(0.03, 0.03 - heightAboveGround);
  (rig.contactShadow.material as THREE.MeshBasicMaterial).opacity =
    THREE.MathUtils.clamp(0.85 - heightAboveGround * 0.15, 0.25, 0.85);

  rig.thrusterLeft.visible = !isGrounded;
  rig.thrusterRight.visible = !isGrounded;
  if (!isGrounded) {
    const flicker = 0.85 + Math.random() * 0.4;
    rig.thrusterLeft.scale.set(1, flicker, 1);
    rig.thrusterRight.scale.set(1, flicker, 1);
  }
}
