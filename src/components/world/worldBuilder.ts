import * as THREE from 'three';
import { SpacecraftId, WorldId } from '../../types/game';
import {
  SPACECRAFT_CATALOG,
  WORLDS,
  WORLD_NODES,
  WORLD_PICKUPS,
  WorldInteractiveNode,
  WorldPickup,
} from '../../data/openWorldMissions';
import {
  applyEarthNightLightsShader,
  applyRealisticTerrainShader,
  createAtmosphereHalo,
  createEarthCloudsTexture,
  createEarthPbrMaps,
  createIrregularMoonGeometry,
  createPlanetTexture,
  createSaturnRingTexture,
  createSkyDome,
  createSoftParticleTexture,
  createSolarPanelTexture,
  createSunFlareTexture,
  createTerrainPbrMaps,
  createVolumetricCloudLayer,
  SolarPlanetId,
} from './proceduralMaterials';
import { createSpaceRover } from './roverModel';
import {
  SpatialColliderIndex,
  WorldCollider,
  makeBoxCollider,
  makeCylinderCollider,
  makeSphereCollider,
} from './physicsCollision';

function createRadialRingMesh(
  innerR: number,
  outerR: number,
  ringTex: THREE.Texture,
  fogEnabled = false
): THREE.Mesh {
  const geo = new THREE.RingGeometry(innerR, outerR, 64, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const span = outerR - innerR || 1;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const r = Math.hypot(vx, vy);
    uv.setXY(i, THREE.MathUtils.clamp((r - innerR) / span, 0, 1), 0.5);
  }
  uv.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: fogEnabled,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createSkyPlanet(
  planetId: SolarPlanetId,
  radius: number,
  maxAnisotropy: number,
  tintHex = 0xffffff,
  withRings = false
): THREE.Group {
  const group = new THREE.Group();
  const tex = createPlanetTexture(planetId, maxAnisotropy);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 24),
    new THREE.MeshStandardMaterial({
      map: tex,
      color: tintHex,
      roughness: planetId === 'mars' || planetId === 'moon' || planetId === 'mercury' ? 0.92 : 0.72,
      metalness: 0.04,
      fog: false,
    })
  );
  group.add(sphere);

  if (withRings && planetId === 'saturn') {
    const ringTex = createSaturnRingTexture();
    const rings = createRadialRingMesh(radius * 1.28, radius * 2.38, ringTex, false);
    group.add(rings);
  }
  if (planetId === 'mars') {
    group.add(createAtmosphereHalo(radius * 1.07, 0xfb923c, 0.72));
  } else if (planetId === 'jupiter') {
    group.add(createAtmosphereHalo(radius * 1.05, 0xfde68a, 0.42));
  }
  return group;
}

export function groundHeightAt(worldId: WorldId, x: number, z: number): number {
  if (worldId === 'station') {
    const r = Math.hypot(x, z);
    if (r < 8.5) return 0.18;
    if (r > 290) return Math.min(18, (r - 290) * 0.25);
    return 0;
  }

  if (worldId === 'earth') {
    const hills =
      Math.sin(x * 0.038) * Math.cos(z * 0.034) * 2.6 +
      Math.sin((x + z) * 0.019) * 1.8 +
      Math.cos(x * 0.09 - z * 0.08) * 0.55;
    const riverCenter = 32 + Math.sin(z * 0.04) * 16;
    const riverChannel = -Math.exp(-Math.pow((x - riverCenter) / 12, 2)) * 2.4;
    const spawnDist = Math.hypot(x, z - 4);
    const flatBlend = THREE.MathUtils.clamp((spawnDist - 10) / 16, 0.06, 1);
    const dist = Math.hypot(x, z);
    const mountains = dist > 260 ? Math.min(52, Math.pow((dist - 260) * 0.13, 1.5)) : 0;
    return (hills + riverChannel) * flatBlend + mountains;
  }

  if (worldId === 'mars') {
    const dunes =
      Math.sin(x * 0.048) * Math.cos(z * 0.045) * 1.45 +
      Math.sin((x + z) * 0.024) * 1.15 +
      Math.cos(x * 0.14 - z * 0.12) * 0.26;
    const riverChannel = -Math.exp(-Math.pow((x - z * 0.65) / 14, 2)) * 1.35;
    const spawnDist = Math.hypot(x, z - 4);
    const flatBlend = THREE.MathUtils.clamp((spawnDist - 8) / 14, 0.12, 1);

    const dist = Math.hypot(x, z);
    const rim = dist > 270 ? Math.min(46, Math.pow((dist - 270) * 0.12, 1.5)) : 0;
    return (dunes + riverChannel) * flatBlend + rim;
  }

  if (worldId === 'moon') {
    const wave =
      Math.sin(x * 0.055) * 1.05 +
      Math.cos(z * 0.052) * 0.98 +
      Math.sin(x * 0.16 + z * 0.14) * 0.24;
    const iceCraterDist = Math.hypot(x - 46, z + 48);
    const craterDip =
      iceCraterDist < 15.5 ? -Math.cos((iceCraterDist / 15.5) * (Math.PI / 2)) * 2.8 : 0;
    const spawnDist = Math.hypot(x, z - 4);
    const flatBlend = THREE.MathUtils.clamp((spawnDist - 8) / 14, 0.15, 1);

    const dist = Math.hypot(x, z);
    const rim = dist > 270 ? Math.min(48, Math.pow((dist - 270) * 0.12, 1.5)) : 0;
    return wave * flatBlend + craterDip + rim;
  }

  if (worldId === 'venus') {
    const volcanic =
      Math.sin(x * 0.042) * Math.cos(z * 0.038) * 2.2 +
      Math.sin(x * 0.11 + z * 0.09) * 0.8;
    const spawnDist = Math.hypot(x, z - 4);
    const flatBlend = THREE.MathUtils.clamp((spawnDist - 8) / 14, 0.14, 1);
    const dist = Math.hypot(x, z);
    const caldera = dist > 260 ? Math.min(46, Math.pow((dist - 260) * 0.12, 1.5)) : 0;
    return volcanic * flatBlend + caldera;
  }

  if (worldId === 'mercury') {
    const craters =
      Math.sin(x * 0.052) * Math.cos(z * 0.048) * 1.6 +
      Math.sin(x * 0.14) * 0.4;
    const spawnDist = Math.hypot(x, z - 4);
    const flatBlend = THREE.MathUtils.clamp((spawnDist - 8) / 14, 0.14, 1);
    const dist = Math.hypot(x, z);
    const rim = dist > 260 ? Math.min(42, Math.pow((dist - 260) * 0.12, 1.5)) : 0;
    return craters * flatBlend + rim;
  }

  // Flight worlds (Jupiter, Saturn, Uranus, Neptune): virtual cloud deck floor reference
  return 0;
}

/**
 * Builds the player's selectable 3D Exploration Spacecraft for atmospheric & ring flight on Gas/Ice Giants.
 */
export function buildPlayerSpacecraftMesh(spacecraftId: SpacecraftId): THREE.Group {
  const spec =
    SPACECRAFT_CATALOG.find((s) => s.id === spacecraftId) || SPACECRAFT_CATALOG[0];

  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: spec.primaryColor,
    roughness: 0.32,
    metalness: 0.35,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: spec.accentColor,
    roughness: 0.28,
    metalness: 0.45,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.5,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.25,
  });
  const thrusterMat = new THREE.MeshBasicMaterial({
    color: spec.id === 'cloud-skimmer' ? 0xfbbf24 : 0x38bdf8,
  });

  // Main sleek fuselage oriented +Z forward
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.64, 3.2, 14), hullMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.castShadow = true;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.35, 14), trimMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 2.25;
  nose.castShadow = true;
  group.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), canopyMat);
  canopy.scale.set(0.85, 0.68, 1.7);
  canopy.position.set(0, 0.42, 0.72);
  group.add(canopy);

  // Swept wings tailored by spacecraft variant
  const wingSpan = spacecraftId === 'falcon-voyager' ? 4.4 : spacecraftId === 'cloud-skimmer' ? 3.8 : 3.4;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.12, 1.25), trimMat);
  wing.position.set(0, -0.04, -0.35);
  wing.castShadow = true;
  group.add(wing);

  if (spacecraftId === 'cloud-skimmer') {
    const heatRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.08, 8, 20), trimMat);
    heatRing.position.z = 1.1;
    group.add(heatRing);
  }

  // Twin vertical stabilizers
  [-0.95, 0.95].forEach((fx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.72), hullMat);
    fin.position.set(fx, 0.34, -0.92);
    fin.rotation.z = fx > 0 ? -0.22 : 0.22;
    group.add(fin);
  });

  // Twin thruster pods + glowing exhaust cones
  [-0.42, 0.42].forEach((tx) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.85, 10), darkMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(tx, -0.05, -1.65);
    group.add(pod);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 10), thrusterMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(tx, -0.05, -2.42);
    flame.name = 'thrusterFlame';
    group.add(flame);
  });

  return group;
}

export interface NodeVisualHandle {
  node: WorldInteractiveNode;
  group: THREE.Group;
  beaconRing: THREE.Mesh;
  beaconBeam: THREE.Mesh;
  animatedPart?: THREE.Object3D;
  colliderMesh: THREE.Mesh;
}

export interface PickupVisualHandle {
  pickup: WorldPickup;
  mesh: THREE.Mesh;
}

export interface DrivableRoverHandle {
  group: THREE.Group;
  wheels: THREE.Object3D[];
}

export interface WorldSceneHandles {
  worldGroup: THREE.Group;
  nodeHandles: NodeVisualHandle[];
  pickupMeshes: PickupVisualHandle[];
  skyDome?: THREE.Mesh;
  dustPoints?: THREE.Points;
  dustVelocities?: Float32Array;
  planetBackdrop?: THREE.Group;
  cloudLayer?: THREE.Mesh;
  skyOrbiters?: THREE.Object3D[];
  patrolRover?: THREE.Group;
  drivableRover?: DrivableRoverHandle;
  rotatingArray?: THREE.Group[];
  effectMeshes: Record<string, THREE.Object3D>;
  colliders: WorldCollider[];
  spatialGrid: SpatialColliderIndex;
}

export function buildWorldEnvironment(
  worldId: WorldId,
  maxAnisotropy: number,
  discoveredNodes: string[],
  solvedInvestigations: string[],
  sunDir: THREE.Vector3,
  collectedPickups: string[] = []
): WorldSceneHandles {
  const worldGroup = new THREE.Group();
  const nodeHandles: NodeVisualHandle[] = [];
  const pickupMeshes: PickupVisualHandle[] = [];
  const effectMeshes: Record<string, THREE.Object3D> = {};
  const rotatingArray: THREE.Group[] = [];
  const skyOrbiters: THREE.Object3D[] = [];
  const colliders: WorldCollider[] = [];
  const nodes = WORLD_NODES.filter((n) => n.worldId === worldId);

  const worldCfg = WORLDS[worldId];
  const isFlightWorld = worldCfg.explorationMode === 'flight';

  // 1. Lightweight Atmospheric Sky Dome + Sun Glare Sprite
  const skyDome = createSkyDome(worldId, sunDir);
  worldGroup.add(skyDome);

  const flareMat = new THREE.SpriteMaterial({
    map: createSunFlareTexture(),
    color: worldId === 'mars' ? 0xffedd5 : worldId === 'mercury' ? 0xfef08a : 0xffffff,
    transparent: true,
    opacity: worldId === 'mars' ? 0.8 : worldId === 'mercury' ? 0.95 : 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sunFlare = new THREE.Sprite(flareMat);
  sunFlare.position.copy(sunDir).multiplyScalar(340);
  const flareScale = worldId === 'mercury' ? 145 : 90;
  sunFlare.scale.set(flareScale, flareScale, 1);
  worldGroup.add(sunFlare);

  // 2. Optimized Deep-Space Starfield (900 stars — fast GPU point batch)
  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const tmpColor = new THREE.Color();
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * (isFlightWorld ? 0.92 : 0.6);
    const rad = 340 + Math.random() * 80;
    starPos[i * 3] = Math.cos(theta) * Math.sin(phi) * rad;
    starPos[i * 3 + 1] = Math.cos(phi) * rad + 12;
    starPos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * rad;

    const temp = Math.random();
    if (temp < 0.25) tmpColor.setHex(0xbfdbfe);
    else if (temp < 0.45) tmpColor.setHex(0xfef3c7);
    else tmpColor.setHex(0xffffff);
    starColors[i * 3] = tmpColor.r;
    starColors[i * 3 + 1] = tmpColor.g;
    starColors[i * 3 + 2] = tmpColor.b;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: worldId === 'mars' ? 1.2 : 1.9,
    vertexColors: true,
    transparent: true,
    opacity: worldId === 'mars' || worldId === 'venus' ? 0.28 : 0.92,
    depthWrite: false,
  });
  worldGroup.add(new THREE.Points(starGeo, starMat));

  // Shared lightweight stylized StandardMaterials (zero heavy clearcoat/iridescence variants)
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.72,
  });
  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.52,
    metalness: 0.55,
  });
  const solarCellMat = new THREE.MeshStandardMaterial({
    map: createSolarPanelTexture(maxAnisotropy),
    color: 0xffffff,
    emissive: 0x0a1c4d,
    emissiveIntensity: 0.28,
    roughness: 0.25,
    metalness: 0.68,
  });
  const beaconAmberMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.45,
  });
  const beaconCyanMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.45,
  });

  let planetBackdrop: THREE.Group | undefined;
  let cloudLayer: THREE.Mesh | undefined;
  let patrolRover: THREE.Group | undefined;
  let drivableRover: DrivableRoverHandle | undefined;

  if (isFlightWorld) {
    // =========================================================================
    // GAS & ICE GIANT ATMOSPHERIC / ORBITAL FLIGHT MODE (NO SOLID WALKING GROUND)
    // =========================================================================
    const giantGroup = new THREE.Group();
    giantGroup.position.set(0, -118, -18);
    const planetTex = createPlanetTexture(worldId as SolarPlanetId, maxAnisotropy);
    const planetSphere = new THREE.Mesh(
      new THREE.SphereGeometry(98, 42, 30),
      new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness: 0.72,
        metalness: 0.05,
        fog: false,
      })
    );
    // Uranus rolls on its side (~98° tilt)!
    if (worldId === 'uranus') {
      giantGroup.rotation.z = 1.48;
    }
    giantGroup.add(planetSphere);

    const haloColors: Record<string, number> = {
      jupiter: 0xfdba74,
      saturn: 0xfde68a,
      uranus: 0x67e8f9,
      neptune: 0x60a5fa,
    };
    giantGroup.add(createAtmosphereHalo(102, haloColors[worldId] ?? 0x38bdf8, 0.9));
    planetBackdrop = giantGroup;
    worldGroup.add(giantGroup);
    colliders.push(
      makeSphereCollider('planet-backdrop-sphere', 0, -118, -18, 98.5, false, 'planet')
    );

    // Stylized Low-Poly 3D Cloud Clusters floating around the spacecraft flight corridor
    const cloudPalette: Record<string, number[]> = {
      jupiter: [0xfde68a, 0xfdba74, 0xc2410c, 0xfef3c7],
      saturn: [0xfef3c7, 0xfde047, 0xd97706, 0xf59e0b],
      uranus: [0xa5f3fc, 0x67e8f9, 0x22d3ee, 0xcffafe],
      neptune: [0x60a5fa, 0x3b82f6, 0x1d4ed8, 0xe0f2fe],
    };
    const cPalette = cloudPalette[worldId] || [0xf8fafc];
    const cloudPuffGeo = new THREE.DodecahedronGeometry(3.2, 1);

    for (let c = 0; c < 16; c++) {
      const cluster = new THREE.Group();
      const ang = (c / 16) * Math.PI * 2 + hashQuick(c * 7) * 0.35;
      const rad = 28 + hashQuick(c * 13 + 3) * 92;
      const alt = -2 + hashQuick(c * 19 + 5) * 28;
      cluster.position.set(Math.cos(ang) * rad, alt, Math.sin(ang) * rad);

      const pMat = new THREE.MeshStandardMaterial({
        color: cPalette[c % cPalette.length],
        roughness: 0.88,
        metalness: 0.02,
        transparent: true,
        opacity: 0.88,
      });

      const puffs = 3;
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(cloudPuffGeo, pMat);
        puff.position.set((p - 1) * 4.2, (p % 2) * 1.1, hashQuick(c * 10 + p) * 2.4 - 1.2);
        const s = 1.15 + hashQuick(c * 5 + p) * 1.35;
        puff.scale.set(s * 1.65, s * 0.58, s * 1.25);
        cluster.add(puff);
      }
      skyOrbiters.push(cluster);
      worldGroup.add(cluster);
    }

    // Jupiter: Iconic Swirling Great Red Spot Vortex Marker below the flight lane
    if (worldId === 'jupiter') {
      const redSpotGroup = new THREE.Group();
      redSpotGroup.position.set(22, -7, -34);
      for (let r = 0; r < 3; r++) {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(8 + r * 4.5, 1.4 - r * 0.25, 8, 28),
          new THREE.MeshStandardMaterial({
            color: r === 0 ? 0xea580c : r === 1 ? 0xdc2626 : 0xfb923c,
            roughness: 0.85,
            transparent: true,
            opacity: 0.78,
          })
        );
        torus.rotation.x = Math.PI / 2;
        torus.position.y = r * 0.6;
        redSpotGroup.add(torus);
      }
      rotatingArray.push(redSpotGroup);
      worldGroup.add(redSpotGroup);
    }

    // Saturn: Sweeping Icy Rings & Instanced Ring Ice Boulders across the Flight Zone!
    if (worldId === 'saturn') {
      const ringTex = createSaturnRingTexture();
      const nearRingPlane = createRadialRingMesh(48, 175, ringTex, true);
      nearRingPlane.position.set(16, 4, -55);
      nearRingPlane.rotation.set(Math.PI * 0.42, 0.14, -0.18);
      worldGroup.add(nearRingPlane);

      const iceGeo = new THREE.DodecahedronGeometry(0.85, 0);
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        roughness: 0.35,
        metalness: 0.15,
      });
      const iceCount = 130;
      const iceRocks = new THREE.InstancedMesh(iceGeo, iceMat, iceCount);
      const iDummy = new THREE.Object3D();
      for (let i = 0; i < iceCount; i++) {
        const ang = (i / iceCount) * Math.PI * 2;
        const rad = 36 + hashQuick(i * 11) * 95;
        const ix = Math.cos(ang) * rad;
        const iy = 2 + (hashQuick(i * 17) - 0.5) * 18;
        const iz = Math.sin(ang) * rad - 20;

        let clear = Math.hypot(ix, iz - 19.5) > 7.5;
        if (clear) {
          for (const n of nodes) {
            if (Math.hypot(ix - n.x, iz - n.z) < 6.0) {
              clear = false;
              break;
            }
          }
        }
        if (!clear) {
          iDummy.scale.set(0, 0, 0);
          iDummy.updateMatrix();
          iceRocks.setMatrixAt(i, iDummy.matrix);
          continue;
        }

        iDummy.position.set(ix, iy, iz);
        const s = 0.5 + hashQuick(i * 29) * 1.4;
        iDummy.scale.set(s * 1.2, s * 0.8, s);
        iDummy.rotation.set(i * 0.4, i * 0.7, i * 0.2);
        iDummy.updateMatrix();
        iceRocks.setMatrixAt(i, iDummy.matrix);
        colliders.push(
          makeSphereCollider(`saturn-ice-${i}`, ix, iy, iz, s * 0.95, false, 'ring-boulder')
        );
      }
      iceRocks.instanceMatrix.needsUpdate = true;
      iceRocks.computeBoundingSphere();
      worldGroup.add(iceRocks);
    }

    // Uranus: Faint Sideways Pale-Cyan Ring Arc
    if (worldId === 'uranus') {
      const uRing = new THREE.Mesh(
        new THREE.RingGeometry(64, 72, 48),
        new THREE.MeshBasicMaterial({
          color: 0xa5f3fc,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      uRing.position.set(28, 12, -55);
      uRing.rotation.set(0.25, 0.3, 1.42);
      worldGroup.add(uRing);
    }

    // Overhead drifting atmospheric cloud canopy
    cloudLayer = createVolumetricCloudLayer(worldId, sunDir);
    worldGroup.add(cloudLayer);
  } else {
    // =========================================================================
    // SOLID ROCKY SURFACE & ORBITAL STATION MODE (OPTIMIZED MESH)
    // =========================================================================
    const pbrMaps = createTerrainPbrMaps(worldId, maxAnisotropy);
    const terrainGeo = new THREE.PlaneGeometry(640, 640, 80, 80);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    const vertColors = new Float32Array(posAttr.count * 3);
    const vCol = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = groundHeightAt(worldId, vx, vz);
      posAttr.setY(i, vy);

      if (worldId === 'mars') {
        const t = THREE.MathUtils.clamp((vy + 1.8) / 14, 0, 1);
        vCol.setRGB(1.0 - t * 0.26, 0.94 - t * 0.34, 0.88 - t * 0.35);
      } else if (worldId === 'moon') {
        const iceDist = Math.hypot(vx - 46, vz + 48);
        if (iceDist < 13.5) {
          const iceMix = 1 - iceDist / 13.5;
          vCol.setRGB(0.84 - iceMix * 0.14, 0.95 + iceMix * 0.05, 1.0 + iceMix * 0.18);
        } else {
          const t = THREE.MathUtils.clamp((vy + 1.5) / 14, 0, 1);
          vCol.setRGB(0.92 - t * 0.22, 0.94 - t * 0.21, 0.98 - t * 0.18);
        }
      } else {
        const r = Math.hypot(vx, vz);
        const shade = r > 270 ? 0.72 : 1.0;
        vCol.setRGB(shade, shade, shade);
      }
      vertColors[i * 3] = vCol.r;
      vertColors[i * 3 + 1] = vCol.g;
      vertColors[i * 3 + 2] = vCol.b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(vertColors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: pbrMaps.map,
      normalMap: pbrMaps.normalMap,
      normalScale: new THREE.Vector2(
        worldId === 'station' ? 0.85 : 1.25,
        worldId === 'station' ? 0.85 : 1.25
      ),
      roughnessMap: pbrMaps.roughnessMap,
      roughness: worldId === 'station' ? 0.56 : 0.92,
      metalness: worldId === 'station' ? 0.58 : 0.05,
      vertexColors: true,
    });
    applyRealisticTerrainShader(terrainMat, worldId);
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    worldGroup.add(terrainMesh);

    if (worldId === 'station') {
      // Rotating Earth Backdrop w/ City Lights + Cloud Layer
      planetBackdrop = new THREE.Group();
      planetBackdrop.position.set(-48, -118, -75);
      const earthMaps = createEarthPbrMaps(maxAnisotropy);
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthMaps.map,
        roughnessMap: earthMaps.roughnessMap,
        emissiveMap: earthMaps.emissiveMap,
        emissive: new THREE.Color(0xffd28a),
        emissiveIntensity: 1.4,
        roughness: 1.0,
        metalness: 0.08,
        fog: false,
      });
      applyEarthNightLightsShader(earthMat, sunDir);
      const earthSphere = new THREE.Mesh(new THREE.SphereGeometry(105, 42, 30), earthMat);
      planetBackdrop.add(earthSphere);

      cloudLayer = new THREE.Mesh(
        new THREE.SphereGeometry(106.2, 36, 26),
        new THREE.MeshStandardMaterial({
          map: createEarthCloudsTexture(maxAnisotropy),
          transparent: true,
          depthWrite: false,
          roughness: 0.9,
          fog: false,
        })
      );
      planetBackdrop.add(cloudLayer);
      planetBackdrop.add(createAtmosphereHalo(108.8));
      worldGroup.add(planetBackdrop);

      const moonSky = createSkyPlanet('moon', 14.5, maxAnisotropy);
      moonSky.position.set(118, 66, -185);
      skyOrbiters.push(moonSky);
      worldGroup.add(moonSky);

      const saturnSky = createSkyPlanet('saturn', 13.5, maxAnisotropy, 0xffffff, true);
      saturnSky.position.set(158, 86, -170);
      saturnSky.rotation.set(0.32, 0.2, -0.38);
      skyOrbiters.push(saturnSky);
      worldGroup.add(saturnSky);

      const marsSky = createSkyPlanet('mars', 5.8, maxAnisotropy);
      marsSky.position.set(42, 102, -205);
      skyOrbiters.push(marsSky);
      worldGroup.add(marsSky);

      // Central Cupola Plaza
      const cupolaGroup = new THREE.Group();
      const cupolaBase = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 8.2, 0.55, 24), trussMat);
      cupolaBase.position.y = 0.27;
      cupolaBase.receiveShadow = true;
      cupolaGroup.add(cupolaBase);

      const cupolaRim = new THREE.Mesh(new THREE.TorusGeometry(7.35, 0.18, 10, 32), beaconCyanMat);
      cupolaRim.rotation.x = Math.PI / 2;
      cupolaRim.position.y = 0.54;
      cupolaGroup.add(cupolaRim);

      const cupolaGlass = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
        new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          roughness: 0.15,
          metalness: 0.1,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        })
      );
      cupolaGlass.position.y = 0.52;
      cupolaGlass.renderOrder = 2;
      cupolaGroup.add(cupolaGlass);
      worldGroup.add(cupolaGroup);

      colliders.push(
        makeCylinderCollider('station-cupola-base', 0, 0, -0.5, 0.545, 7.65, true, 'platform'),
        makeCylinderCollider('station-cupola-dome', 0, 0, 0.5, 4.1, 3.45, false, 'building')
      );

      // Illuminated Orbital Spine Walkways
      [
        [-44, -32],
        [46, -36],
        [52, 28],
        [-38, 24],
      ].forEach(([tx, tz], idx) => {
        const len = Math.hypot(tx, tz);
        const ang = Math.atan2(tx, tz);
        const spine = new THREE.Group();
        spine.rotation.y = ang;
        const walkway = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, len - 4), darkAlloyMat);
        walkway.position.set(0, 0.08, len * 0.5);
        walkway.receiveShadow = true;
        spine.add(walkway);

        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, len - 5), trussMat);
        railL.position.set(-1.55, 0.32, len * 0.5);
        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, len - 5), trussMat);
        railR.position.set(1.55, 0.32, len * 0.5);
        spine.add(railL, railR);
        worldGroup.add(spine);

        const sinA = Math.sin(ang);
        const cosA = Math.cos(ang);
        const midZ = len * 0.5;
        colliders.push(
          makeBoxCollider(
            `station-walkway-${idx}`,
            sinA * midZ,
            cosA * midZ,
            -0.25,
            0.15,
            1.5,
            (len - 4) * 0.5,
            ang,
            true,
            'platform'
          ),
          makeBoxCollider(
            `station-rail-L-${idx}`,
            -1.55 * cosA + midZ * sinA,
            1.55 * sinA + midZ * cosA,
            0.0,
            0.66,
            0.14,
            (len - 5) * 0.5,
            ang,
            false,
            'wall'
          ),
          makeBoxCollider(
            `station-rail-R-${idx}`,
            1.55 * cosA + midZ * sinA,
            -1.55 * sinA + midZ * cosA,
            0.0,
            0.66,
            0.14,
            (len - 5) * 0.5,
            ang,
            false,
            'wall'
          )
        );
      });

      // Twin Rotating Solar Array Towers
      [
        [-72, 12, -45],
        [72, 12, -45],
      ].forEach(([wx, wy, wz], idx) => {
        const tower = new THREE.Group();
        tower.position.set(wx, wy, wz);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.2, 24, 10), trussMat);
        tower.add(mast);

        const gimbal = new THREE.Group();
        gimbal.position.set(0, 8.5, 0);
        const boom = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 0.7), trussMat);
        gimbal.add(boom);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.18, 8.8), solarCellMat);
        wingL.position.set(-7.6, 0, 0);
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.18, 8.8), solarCellMat);
        wingR.position.set(7.6, 0, 0);
        gimbal.add(wingL, wingR);
        gimbal.rotation.x = 0.38;
        tower.add(gimbal);
        rotatingArray.push(gimbal);
        worldGroup.add(tower);

        colliders.push(
          makeCylinderCollider(`station-solar-mast-${idx}`, wx, wz, -0.5, 24, 1.25, false, 'structure')
        );
      });
    } else {
      // Natural Planetary Cliffs & Boulders (130 optimized instanced meshes)
      const nodesHere = WORLD_NODES.filter((n) => n.worldId === worldId);
      const rockHexMap: Partial<Record<WorldId, number>> = {
        mars: 0x9c4627,
        earth: 0x57606f,
        venus: 0x92400e,
        mercury: 0x525b68,
        moon: 0x7c8594,
      };
      const rockHex = rockHexMap[worldId] ?? 0x7c8594;

      const rockGeo = new THREE.DodecahedronGeometry(1.15, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: rockHex,
        roughness: 0.9,
        metalness: 0.06,
      });
      const rockCount = 130;
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      for (let i = 0; i < rockCount; i++) {
        const ang = (i / rockCount) * Math.PI * 2 + hashQuick(i) * 0.55;
        const isOuterCliff = i < Math.floor(rockCount * 0.55);
        const rad = isOuterCliff
          ? 150 + hashQuick(i + 300) * 140
          : 16 + hashQuick(i + 500) * 130;
        const rx = Math.cos(ang) * rad;
        const rz = Math.sin(ang) * rad;

        let clear = Math.hypot(rx, rz - 4) > 15 && Math.hypot(rx - 6.5, rz - 10) > 6.5;
        if (clear) {
          for (const n of nodesHere) {
            if (Math.hypot(rx - n.x, rz - n.z) < 7.0) {
              clear = false;
              break;
            }
          }
        }
        if (!clear) {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          rocks.setMatrixAt(i, dummy.matrix);
          continue;
        }

        const ry = groundHeightAt(worldId, rx, rz);
        const s = isOuterCliff
          ? 2.2 + hashQuick(i + 700) * 3.8
          : 0.45 + hashQuick(i + 900) * 1.4;
        dummy.position.set(rx, ry + s * 0.25, rz);
        dummy.scale.set(s * 1.35, s * 0.78, s * 1.05);
        dummy.rotation.set(
          hashQuick(i + 11) * 0.5,
          hashQuick(i + 29) * Math.PI * 2,
          hashQuick(i + 47) * 0.5
        );
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);

        colliders.push(
          makeCylinderCollider(
            `rock-${i}`,
            rx,
            rz,
            ry - 0.5,
            ry + s * 1.15,
            s * 1.18,
            false,
            'rock'
          )
        );

        const shade = 0.76 + hashQuick(i + 83) * 0.36;
        color.setHex(rockHex).multiplyScalar(shade);
        rocks.setColorAt(i, color);
      }
      rocks.instanceMatrix.needsUpdate = true;
      if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
      rocks.computeBoundingSphere();
      rocks.castShadow = true;
      rocks.receiveShadow = true;
      worldGroup.add(rocks);

      if (worldId === 'mars') {
        const habGroup = new THREE.Group();
        const hy = groundHeightAt('mars', 0, -9);
        habGroup.position.set(0, hy, -9);

        const domeMat = new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          roughness: 0.35,
          metalness: 0.2,
        });

        const habBase = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.0, 0.95, 20), darkAlloyMat);
        habBase.position.y = 0.46;
        habBase.castShadow = true;
        habBase.receiveShadow = true;
        habGroup.add(habBase);

        const habDome = new THREE.Mesh(
          new THREE.SphereGeometry(5.1, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2),
          domeMat
        );
        habDome.position.y = 0.9;
        habDome.castShadow = true;
        habGroup.add(habDome);

        const habWindowBand = new THREE.Mesh(
          new THREE.CylinderGeometry(5.26, 5.26, 0.34, 22, 1, true),
          beaconCyanMat
        );
        habWindowBand.position.y = 1.65;
        habGroup.add(habWindowBand);

        const bioDome = new THREE.Mesh(
          new THREE.SphereGeometry(3.1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          domeMat
        );
        bioDome.position.set(8.6, 0.55, -1.5);
        bioDome.castShadow = true;
        habGroup.add(bioDome);

        const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.5, 1.6), trussMat);
        bridge.position.set(4.5, 1.0, -0.7);
        habGroup.add(bridge);

        const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 4.2, 10), trussMat);
        dishMast.position.set(-4.2, 4.1, -2.2);
        habGroup.add(dishMast);
        const dishPivot = new THREE.Group();
        dishPivot.position.set(-4.2, 6.2, -2.2);
        const dishCone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.65, 14, 1, true), trussMat);
        dishCone.rotation.x = Math.PI * 0.35;
        dishPivot.add(dishCone);
        habGroup.add(dishPivot);
        rotatingArray.push(dishPivot);

        worldGroup.add(habGroup);
        colliders.push(
          makeCylinderCollider('mars-hab-dome', 0, -9, hy - 0.5, hy + 6.0, 5.75, false, 'building'),
          makeCylinderCollider('mars-biodome', 8.6, -10.5, hy - 0.5, hy + 3.7, 3.15, false, 'building'),
          makeBoxCollider('mars-hab-bridge', 4.5, -9.7, hy - 0.2, hy + 1.85, 2.45, 0.85, 0, false, 'building'),
          makeCylinderCollider('mars-dish-mast', -4.2, -11.2, hy, hy + 6.8, 0.45, false, 'structure')
        );

        patrolRover = createSpaceRover({
          isPlayerBuggy: false,
          beaconColorHex: 0xf59e0b,
          maxAnisotropy,
        }).group;
        worldGroup.add(patrolRover);

        const phobosMat = new THREE.MeshStandardMaterial({
          map: createPlanetTexture('mercury', maxAnisotropy),
          color: 0xfadbd0,
          roughness: 0.95,
          metalness: 0.04,
          fog: false,
        });
        const phobosMesh = new THREE.Mesh(createIrregularMoonGeometry(4.6, 0.6), phobosMat);
        phobosMesh.position.set(66, 78, -138);
        skyOrbiters.push(phobosMesh);
        worldGroup.add(phobosMesh);

        const deimosMesh = new THREE.Mesh(createIrregularMoonGeometry(2.5, 2.3), phobosMat);
        deimosMesh.position.set(-96, 92, -152);
        skyOrbiters.push(deimosMesh);
        worldGroup.add(deimosMesh);
      } else if (worldId === 'moon') {
        planetBackdrop = new THREE.Group();
        planetBackdrop.position.set(-115, 72, -185);
        const earthMaps = createEarthPbrMaps(maxAnisotropy);
        const earthRiseMat = new THREE.MeshStandardMaterial({
          map: earthMaps.map,
          roughnessMap: earthMaps.roughnessMap,
          emissiveMap: earthMaps.emissiveMap,
          emissive: new THREE.Color(0xffd28a),
          emissiveIntensity: 1.4,
          roughness: 1.0,
          metalness: 0.05,
          fog: false,
        });
        applyEarthNightLightsShader(earthRiseMat, sunDir);
        const earthRise = new THREE.Mesh(new THREE.SphereGeometry(26, 28, 20), earthRiseMat);
        planetBackdrop.add(earthRise);
        planetBackdrop.add(createAtmosphereHalo(27.3));
        worldGroup.add(planetBackdrop);

        const artemisY = groundHeightAt('moon', 0, -9);
        const artemisHab = new THREE.Group();
        artemisHab.position.set(0, artemisY, -9);
        const artemisCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(3.4, 3.8, 3.8, 16),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.25 })
        );
        artemisCylinder.position.y = 1.9;
        artemisCylinder.castShadow = true;
        artemisHab.add(artemisCylinder);
        const artemisDome = new THREE.Mesh(
          new THREE.SphereGeometry(3.35, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          trussMat
        );
        artemisDome.position.y = 3.8;
        artemisHab.add(artemisDome);
        worldGroup.add(artemisHab);
        colliders.push(
          makeCylinderCollider('moon-artemis-hab', 0, -9, artemisY - 0.5, artemisY + 7.2, 3.85, false, 'building')
        );

        const iceCrystalMat = new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          emissive: 0x0284c7,
          emissiveIntensity: 0.55,
          roughness: 0.2,
          metalness: 0.2,
        });
        for (let c = 0; c < 10; c++) {
          const ca = (c / 10) * Math.PI * 2;
          const cr = 3.8 + hashQuick(c + 41) * 8.5;
          const cx = 46 + Math.cos(ca) * cr;
          const cz = -48 + Math.sin(ca) * cr;
          const cy = groundHeightAt('moon', cx, cz);
          const h = 0.9 + hashQuick(c + 99) * 2.1;
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.42, h, 6), iceCrystalMat);
          spire.position.set(cx, cy + h * 0.42, cz);
          worldGroup.add(spire);
          colliders.push(
            makeCylinderCollider(`moon-ice-spire-${c}`, cx, cz, cy - 0.5, cy + h + 0.2, 0.48, false, 'rock')
          );
        }
      } else if (worldId === 'earth') {
        const treeTrunkGeo = new THREE.CylinderGeometry(0.28, 0.44, 3.2, 6);
        const treeFoliageGeo = new THREE.ConeGeometry(2.2, 5.4, 6);
        const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x452b1f, roughness: 0.92 });
        const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.88 });

        const treeCount = 65;
        const treeTrunks = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, treeCount);
        const treeFoliage = new THREE.InstancedMesh(treeFoliageGeo, treeFoliageMat, treeCount);
        const dummyTree = new THREE.Object3D();
        const treeColor = new THREE.Color();

        let placedTrees = 0;
        for (let i = 0; i < treeCount; i++) {
          const ang = hashQuick(i * 17 + 3) * Math.PI * 2;
          const rad = 24 + hashQuick(i * 23 + 7) * 220;
          const tx = Math.cos(ang) * rad;
          const tz = Math.sin(ang) * rad;

          const riverCenter = 32 + Math.sin(tz * 0.04) * 16;
          if (Math.hypot(tx, tz) < 24 || Math.abs(tx - riverCenter) < 17) continue;

          const ty = groundHeightAt('earth', tx, tz);
          const s = 0.85 + hashQuick(i * 31) * 0.55;

          dummyTree.position.set(tx, ty + 1.6 * s, tz);
          dummyTree.scale.set(s, s, s);
          dummyTree.rotation.set(0, hashQuick(i * 13) * Math.PI * 2, 0);
          dummyTree.updateMatrix();
          treeTrunks.setMatrixAt(placedTrees, dummyTree.matrix);

          dummyTree.position.set(tx, ty + (1.6 + 2.5) * s, tz);
          dummyTree.updateMatrix();
          treeFoliage.setMatrixAt(placedTrees, dummyTree.matrix);

          treeColor
            .setHex(hashQuick(i * 7) > 0.4 ? 0x15803d : 0x166534)
            .multiplyScalar(0.85 + hashQuick(i * 41) * 0.3);
          treeFoliage.setColorAt(placedTrees, treeColor);
          colliders.push(
            makeCylinderCollider(`earth-tree-${i}`, tx, tz, ty - 0.5, ty + 5.2 * s, 0.55 * s, false, 'tree')
          );
          placedTrees++;
        }
        treeTrunks.count = placedTrees;
        treeFoliage.count = placedTrees;
        treeTrunks.instanceMatrix.needsUpdate = true;
        treeFoliage.instanceMatrix.needsUpdate = true;
        if (treeFoliage.instanceColor) treeFoliage.instanceColor.needsUpdate = true;
        treeTrunks.computeBoundingSphere();
        treeFoliage.computeBoundingSphere();
        treeTrunks.castShadow = true;
        treeFoliage.castShadow = true;
        worldGroup.add(treeTrunks, treeFoliage);

        const riverGeo = new THREE.PlaneGeometry(32, 600, 1, 48);
        riverGeo.rotateX(-Math.PI / 2);
        const rPos = riverGeo.attributes.position;
        for (let i = 0; i < rPos.count; i++) {
          const rz = rPos.getZ(i);
          const rx = rPos.getX(i);
          const windingOffset = 32 + Math.sin(rz * 0.04) * 16;
          rPos.setX(i, rx + windingOffset);
        }
        riverGeo.computeVertexNormals();

        const riverMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.2,
          metalness: 0.25,
          transparent: true,
          opacity: 0.86,
        });
        const riverMesh = new THREE.Mesh(riverGeo, riverMat);
        riverMesh.position.y = -1.1;
        worldGroup.add(riverMesh);

        const launchPadGroup = new THREE.Group();
        const lpy = groundHeightAt('earth', 0, 4);
        launchPadGroup.position.set(0, lpy, 4);

        const padConcrete = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 0.72, 24), darkAlloyMat);
        padConcrete.position.y = 0.36;
        padConcrete.receiveShadow = true;
        launchPadGroup.add(padConcrete);

        const padRing = new THREE.Mesh(
          new THREE.RingGeometry(11.6, 12.2, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.y = 0.74;
        launchPadGroup.add(padRing);

        const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 26, 3.6), trussMat);
        tower.position.set(-8.5, 13, 0);
        tower.castShadow = true;
        launchPadGroup.add(tower);

        const cryoSphere = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 12), trussMat);
        cryoSphere.position.set(12, 3.2, -6);
        launchPadGroup.add(cryoSphere);
        worldGroup.add(launchPadGroup);
        colliders.push(
          makeCylinderCollider('earth-ksc-pad', 0, 4, lpy - 0.5, lpy + 0.72, 14.5, true, 'platform'),
          makeBoxCollider('earth-ksc-tower', -8.5, 4, lpy, lpy + 26.2, 1.85, 1.85, 0, false, 'building'),
          makeSphereCollider('earth-ksc-cryo', 12, lpy + 3.2, -2, 3.2, false, 'structure')
        );
      } else if (worldId === 'venus') {
        const vy = groundHeightAt('venus', 0, -10);
        const veneraBase = new THREE.Group();
        veneraBase.position.set(0, vy, -10);
        const hull = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.9, 2.2, 14), darkAlloyMat);
        hull.position.y = 1.1;
        hull.castShadow = true;
        veneraBase.add(hull);
        const crown = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.24, 8, 22), beaconAmberMat);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 2.2;
        veneraBase.add(crown);
        worldGroup.add(veneraBase);
        colliders.push(
          makeCylinderCollider('venus-venera-base', 0, -10, vy - 0.5, vy + 2.5, 4.85, false, 'building')
        );
      } else if (worldId === 'mercury') {
        const my = groundHeightAt('mercury', 0, -10);
        const obs = new THREE.Group();
        obs.position.set(0, my, -10);
        const shield = new THREE.Mesh(new THREE.BoxGeometry(9.5, 6.2, 0.45), trussMat);
        shield.position.y = 3.2;
        shield.rotation.x = -0.18;
        shield.castShadow = true;
        obs.add(shield);
        worldGroup.add(obs);
        colliders.push(
          makeBoxCollider('mercury-sunshield', 0, -10, my - 0.5, my + 6.4, 4.8, 0.65, 0, false, 'wall')
        );
      }

      // Drivable 6x6 NASA Artemis Exploration Buggy on Rocky Planetary Surfaces
      drivableRover = createSpaceRover({
        isPlayerBuggy: true,
        beaconColorHex: 0x22d3ee,
        maxAnisotropy,
      });
      const ryPark =
        worldId === 'earth' ? groundHeightAt('earth', 0, 4) + 0.72 : groundHeightAt(worldId, 6.5, 10);
      drivableRover.group.position.set(6.5, ryPark, 10);
      drivableRover.group.rotation.y = -0.35;
      worldGroup.add(drivableRover.group);

      // 160 Lightweight Instanced Pebbles
      const pebbleHexMap: Partial<Record<WorldId, number>> = {
        earth: 0x64748b,
        mars: 0xa34828,
        venus: 0x92400e,
        mercury: 0x525b68,
        moon: 0x8590a1,
      };
      const pebbleHex = pebbleHexMap[worldId] ?? 0x8590a1;
      const pebbleGeo = new THREE.DodecahedronGeometry(0.22, 0);
      const pebbleMat = new THREE.MeshStandardMaterial({
        color: pebbleHex,
        roughness: 0.88,
        metalness: 0.08,
      });
      const pebbleCount = 160;
      const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
      const pDummy = new THREE.Object3D();
      const pCol = new THREE.Color();
      for (let i = 0; i < pebbleCount; i++) {
        const ang = hashQuick(i * 3 + 7) * Math.PI * 2;
        const rad = 8 + hashQuick(i * 5 + 19) * 220;
        const px = Math.cos(ang) * rad;
        const pz = Math.sin(ang) * rad;
        const py = groundHeightAt(worldId, px, pz);
        const s = 0.55 + hashQuick(i * 11 + 3) * 1.45;
        pDummy.position.set(px, py + s * 0.06, pz);
        pDummy.scale.set(s * 1.25, s * 0.65, s);
        pDummy.rotation.set(hashQuick(i) * 0.5, hashQuick(i + 2) * Math.PI, hashQuick(i + 4) * 0.5);
        pDummy.updateMatrix();
        pebbles.setMatrixAt(i, pDummy.matrix);
        pCol.setHex(pebbleHex).multiplyScalar(0.7 + hashQuick(i + 9) * 0.45);
        pebbles.setColorAt(i, pCol);
      }
      pebbles.instanceMatrix.needsUpdate = true;
      if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;
      pebbles.computeBoundingSphere();
      worldGroup.add(pebbles);

      if (worldId !== 'mercury' && worldId !== 'moon') {
        cloudLayer = createVolumetricCloudLayer(worldId, sunDir);
        worldGroup.add(cloudLayer);
      }

      if (worldId !== 'earth') {
        const padY = groundHeightAt(worldId, 0, 5);
        const padGroup = new THREE.Group();
        padGroup.position.set(0, padY + 0.04, 5);
        const padDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.16, 8), darkAlloyMat);
        padDeck.receiveShadow = true;
        padGroup.add(padDeck);
        const padTrim = new THREE.Mesh(
          new THREE.RingGeometry(3.2, 3.55, 8),
          new THREE.MeshBasicMaterial({
            color: worldId === 'mars' || worldId === 'venus' ? 0xf59e0b : 0x38bdf8,
            side: THREE.DoubleSide,
          })
        );
        padTrim.rotation.x = -Math.PI / 2;
        padTrim.position.y = 0.09;
        padGroup.add(padTrim);
        worldGroup.add(padGroup);
        colliders.push(
          makeCylinderCollider('outpost-pad', 0, 5, padY - 0.5, padY + 0.12, 4.0, true, 'platform')
        );
      }
    }
  }

  // 5. Lightweight Atmospheric Particle System (90–280 particles for fast mobile framerate)
  const particleTheme: Record<
    WorldId,
    { count: number; color: number; size: number; opacity: number; maxAlt: number }
  > = {
    mars: { count: 260, color: 0xfb923c, size: 0.46, opacity: 0.65, maxAlt: 15 },
    jupiter: { count: 280, color: 0xfcd34d, size: 0.52, opacity: 0.62, maxAlt: 26 },
    saturn: { count: 240, color: 0xfef08a, size: 0.38, opacity: 0.56, maxAlt: 26 },
    venus: { count: 240, color: 0xf59e0b, size: 0.54, opacity: 0.58, maxAlt: 16 },
    neptune: { count: 280, color: 0x60a5fa, size: 0.42, opacity: 0.65, maxAlt: 26 },
    uranus: { count: 240, color: 0x67e8f9, size: 0.4, opacity: 0.54, maxAlt: 26 },
    earth: { count: 140, color: 0xecfdf5, size: 0.28, opacity: 0.42, maxAlt: 13 },
    moon: { count: 90, color: 0xe2e8f0, size: 0.22, opacity: 0.34, maxAlt: 10 },
    mercury: { count: 110, color: 0xfef3c7, size: 0.24, opacity: 0.46, maxAlt: 12 },
    station: { count: 110, color: 0x7dd3fc, size: 0.24, opacity: 0.44, maxAlt: 14 },
  };
  const ptCfg = particleTheme[worldId];
  const dustCount = ptCfg.count;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustVelocities = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 160;
    dustPos[i * 3 + 1] = 0.8 + Math.random() * ptCfg.maxAlt;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 160;

    dustVelocities[i * 3] = (Math.random() - 0.5) * 2.2;
    dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.55;
    dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    map: createSoftParticleTexture(),
    color: ptCfg.color,
    size: ptCfg.size,
    transparent: true,
    opacity: ptCfg.opacity,
    alphaTest: 0.01,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  worldGroup.add(dustPoints);

  // 6. Interactive Composite Probes & Mission Beacons (Supports floating flight altitude node.y)
  for (const node of nodes) {
    const isScanned = discoveredNodes.includes(node.id);
    const isSolved = node.investigationId ? solvedInvestigations.includes(node.investigationId) : false;

    const group = new THREE.Group();
    const gy = node.y ?? groundHeightAt(worldId, node.x, node.z);
    group.position.set(node.x, gy, node.z);

    const { visual, animatedPart } = buildCompositeNodeProp(node.kind, maxAnisotropy);
    group.add(visual);

    // Register physical collider matching each interactive 3D structure
    if (node.kind === 'shuttle') {
      colliders.push(
        makeCylinderCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 4.4, 1.5, false, 'shuttle')
      );
    } else if (node.kind === 'radiator') {
      colliders.push(
        makeBoxCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 3.1, 1.15, 0.95, 0, false, 'prop')
      );
    } else if (node.kind === 'satellite') {
      colliders.push(
        makeCylinderCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 2.8, 1.1, false, 'prop')
      );
    } else if (node.kind === 'solar_sensor') {
      colliders.push(
        makeCylinderCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 3.4, 0.62, false, 'prop')
      );
    } else if (node.kind === 'rover') {
      colliders.push(
        makeBoxCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 2.15, 1.15, 0.85, 0, false, 'prop')
      );
    } else if (node.kind === 'rock_sample') {
      colliders.push(
        makeCylinderCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 1.75, 1.4, false, 'rock')
      );
    } else if (node.kind === 'ice_crater') {
      colliders.push(
        makeCylinderCollider(
          `node-pad-${node.id}`,
          node.x,
          node.z,
          gy - 0.3,
          gy + 0.28,
          2.0,
          !isFlightWorld,
          'platform'
        ),
        makeCylinderCollider(`node-${node.id}`, node.x, node.z, gy + 0.25, gy + 2.0, 0.45, false, 'prop')
      );
    } else if (node.kind === 'drill') {
      colliders.push(
        makeBoxCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 2.8, 0.98, 0.98, 0, false, 'prop')
      );
    } else {
      colliders.push(
        makeBoxCollider(`node-${node.id}`, node.x, node.z, gy - 0.3, gy + 1.95, 1.1, 0.62, 0, false, 'prop')
      );
    }

    const ringColor = isSolved ? 0x10b981 : isScanned ? 0xf59e0b : 0x22d3ee;
    const ringGeo = isFlightWorld
      ? new THREE.TorusGeometry(2.4, 0.1, 8, 28)
      : new THREE.RingGeometry(1.7, 2.05, 24);
    if (!isFlightWorld) ringGeo.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const beaconRing = new THREE.Mesh(ringGeo, ringMat);
    beaconRing.position.y = isFlightWorld ? 1.5 : 0.07;
    group.add(beaconRing);

    const beamMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: isSolved ? 0.08 : 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beaconBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.42, isFlightWorld ? 10 : 20, 8, 1, true),
      beamMat
    );
    beaconBeam.position.y = isFlightWorld ? 4.5 : 10.2;
    group.add(beaconBeam);

    const collider = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 4.6, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    collider.position.y = 1.9;
    collider.layers.set(1);
    collider.userData.nodeId = node.id;
    group.add(collider);

    if (node.investigationId) {
      const statusOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({
          color: isSolved ? 0x10b981 : 0x22d3ee,
          emissive: isSolved ? 0x10b981 : 0x22d3ee,
          emissiveIntensity: 1.4,
          roughness: 0.2,
        })
      );
      statusOrb.position.set(0, 3.6, 0);
      group.add(statusOrb);
      effectMeshes[node.id] = statusOrb;
    }

    worldGroup.add(group);
    nodeHandles.push({
      node,
      group,
      beaconRing,
      beaconBeam,
      animatedPart,
      colliderMesh: collider,
    });
  }

  // 7. Collectible Scientific Field Sample Pickups (3 glowing crystals per world)
  const worldPickups = WORLD_PICKUPS.filter(
    (p) => p.worldId === worldId && !collectedPickups.includes(p.id)
  );
  const pickupGeo = new THREE.OctahedronGeometry(0.68, 0);
  const haloGeo = new THREE.TorusGeometry(0.95, 0.06, 6, 18);

  for (const pickup of worldPickups) {
    const py = isFlightWorld
      ? pickup.yOffset
      : groundHeightAt(worldId, pickup.x, pickup.z) + pickup.yOffset;
    const pMat = new THREE.MeshStandardMaterial({
      color: pickup.colorHex,
      emissive: pickup.colorHex,
      emissiveIntensity: 1.25,
      roughness: 0.2,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(pickupGeo, pMat);
    mesh.position.set(pickup.x, py, pickup.z);
    mesh.userData.baseY = py;

    const halo = new THREE.Mesh(
      haloGeo,
      new THREE.MeshBasicMaterial({
        color: pickup.colorHex,
        transparent: true,
        opacity: 0.72,
      })
    );
    halo.rotation.x = Math.PI / 2;
    mesh.add(halo);

    worldGroup.add(mesh);
    pickupMeshes.push({ pickup, mesh });
  }

  const spatialGrid = new SpatialColliderIndex(colliders);

  return {
    worldGroup,
    nodeHandles,
    pickupMeshes,
    skyDome,
    dustPoints,
    dustVelocities,
    planetBackdrop,
    cloudLayer,
    skyOrbiters,
    patrolRover,
    drivableRover,
    rotatingArray,
    effectMeshes,
    colliders,
    spatialGrid,
  };
}

function hashQuick(seed: number): number {
  const s = Math.sin(seed * 91.3458) * 47453.5453;
  return s - Math.floor(s);
}

function buildCompositeNodeProp(
  kind: WorldInteractiveNode['kind'],
  maxAnisotropy: number
): {
  visual: THREE.Group;
  animatedPart?: THREE.Object3D;
} {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.32,
    metalness: 0.74,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.28,
    metalness: 0.76,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.25,
    roughness: 0.25,
  });

  let animatedPart: THREE.Object3D | undefined;

  if (kind === 'radiator') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.48, 1.8), dark);
    base.position.y = 0.24;
    base.castShadow = true;
    g.add(base);
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 2.0, 12), metal);
    manifold.position.y = 1.3;
    g.add(manifold);
    const vane = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.65, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    vane.position.y = 2.25;
    g.add(vane);
    animatedPart = vane;
  } else if (kind === 'satellite') {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.84, 1.2, 10), dark);
    ped.position.y = 0.6;
    g.add(ped);
    const satGroup = new THREE.Group();
    satGroup.position.y = 2.1;
    const bus = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), gold);
    satGroup.add(bus);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.52, 14, 1, true), metal);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 0.2, 0.84);
    satGroup.add(dish);
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.65, roughness: 0.25 })
    );
    satGroup.add(wing);
    g.add(satGroup);
    animatedPart = satGroup;
  } else if (kind === 'solar_sensor') {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 2.65, 10), metal);
    mast.position.y = 1.32;
    g.add(mast);
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), cyan);
    head.position.y = 2.85;
    g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.07, 8, 20), gold);
    ring.position.y = 2.85;
    g.add(ring);
    animatedPart = ring;
  } else if (kind === 'rover') {
    const roverProp = createSpaceRover({
      isPlayerBuggy: false,
      beaconColorHex: 0x38bdf8,
      maxAnisotropy,
    });
    g.add(roverProp.group);
    animatedPart = roverProp.sensorHead;
  } else if (kind === 'rock_sample') {
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.18, 0),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.88 })
    );
    boulder.scale.set(1.35, 0.85, 1.15);
    boulder.position.y = 0.62;
    g.add(boulder);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), cyan);
    crystal.position.set(0.24, 1.4, 0.12);
    g.add(crystal);
    animatedPart = crystal;
  } else if (kind === 'ice_crater') {
    const icePatch = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 2.1, 0.28, 16),
      new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x0284c7,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.15,
      })
    );
    icePatch.position.y = 0.14;
    g.add(icePatch);
    const probe = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.75, 8), cyan);
    probe.position.y = 1.08;
    g.add(probe);
    animatedPart = probe;
  } else if (kind === 'drill') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.36, 1.85), dark);
    frame.position.y = 0.18;
    g.add(frame);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.65, 0.55), gold);
    tower.position.y = 1.45;
    g.add(tower);
    const auger = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.05, 1.85, 10), metal);
    auger.position.set(0, 1.08, 0.55);
    g.add(auger);
    animatedPart = auger;
  } else if (kind === 'shuttle') {
    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 4.1, 14),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.35 })
    );
    hull.position.y = 2.45;
    g.add(hull);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.84, 0.88, 14), dark);
    nose.position.y = 3.95;
    g.add(nose);
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.55, 0.72, 12), metal);
    pod.position.y = 0.42;
    g.add(pod);
  } else {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 1.1), dark);
    desk.position.y = 0.58;
    g.add(desk);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.85, 0.12), cyan);
    screen.position.set(0, 1.5, -0.18);
    screen.rotation.x = -0.25;
    g.add(screen);
  }

  return { visual: g, animatedPart };
}

export function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) std.map.dispose();
        if (std.normalMap) std.normalMap.dispose();
        if (std.roughnessMap) std.roughnessMap.dispose();
        if (std.bumpMap) std.bumpMap.dispose();
        if (std.emissiveMap) std.emissiveMap.dispose();
        if (std.alphaMap) std.alphaMap.dispose();
        m.dispose();
      });
    }
  });
}
