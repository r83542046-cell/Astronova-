import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Award,
  Backpack,
  Compass,
  Globe2,
  Lock,
  MapPin,
  Plane,
  Rocket,
  Unlock,
  X,
} from 'lucide-react';
import {
  SCIENTIFIC_INVESTIGATIONS,
  SPACECRAFT_CATALOG,
  WORLDS,
} from '../../data/openWorldMissions';
import { SpacecraftId, TraineeProfile, WorldId } from '../../types/game';
import { calculateLevelFromXp } from '../../utils/storage';
import {
  createEarthPbrMaps,
  createPlanetTexture,
  createSaturnRingTexture,
  createSunFlareTexture,
  SolarPlanetId,
} from './proceduralMaterials';

export type OrreryBodyId = SolarPlanetId;

interface SolarSystemFact {
  id: OrreryBodyId;
  name: string;
  category: string;
  distanceLabel: string;
  diameterKm: string;
  fact: string;
  launchWorld?: WorldId;
  orbitRadius: number;
  visualRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  tiltRad?: number;
}

const SOLAR_BODIES: SolarSystemFact[] = [
  {
    id: 'sun',
    name: 'The Sun',
    category: 'G2V Yellow Dwarf Star',
    distanceLabel: 'Center (0 AU)',
    diameterKm: '1,392,700 km',
    fact: 'Holds 99.86% of all mass in the Solar System and fuses 600 million tons of hydrogen into helium every second.',
    orbitRadius: 0,
    visualRadius: 2.55,
    orbitSpeed: 0,
    initialAngle: 0,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    category: 'Rocky Terrestrial Planet',
    distanceLabel: '0.39 AU from Sun',
    diameterKm: '4,879 km',
    fact: 'Smallest and fastest planet! One Mercury year takes only 88 Earth days, with cratered plains baked up to 430°C.',
    launchWorld: 'mercury',
    orbitRadius: 4.8,
    visualRadius: 0.42,
    orbitSpeed: 0.85,
    initialAngle: 0.7,
  },
  {
    id: 'venus',
    name: 'Venus',
    category: 'Rocky Terrestrial Planet',
    distanceLabel: '0.72 AU from Sun',
    diameterKm: '12,104 km',
    fact: 'Spins backwards compared to most planets under thick carbon dioxide clouds that trap heat at 465°C.',
    launchWorld: 'venus',
    orbitRadius: 6.9,
    visualRadius: 0.68,
    orbitSpeed: 0.62,
    initialAngle: 2.3,
  },
  {
    id: 'earth',
    name: 'Earth',
    category: 'Ocean World & Biosphere Ground',
    distanceLabel: '1.00 AU from Sun',
    diameterKm: '12,742 km',
    fact: 'Our home planet features lush ecosystems, breathable nitrogen-oxygen atmosphere, liquid oceans, and NASA Kennedy Space Center.',
    launchWorld: 'earth',
    orbitRadius: 9.5,
    visualRadius: 0.78,
    orbitSpeed: 0.48,
    initialAngle: 4.1,
    tiltRad: 0.41,
  },
  {
    id: 'moon',
    name: 'The Moon',
    category: "Earth's Natural Satellite",
    distanceLabel: '384,400 km from Earth',
    diameterKm: '3,474 km',
    fact: "Earth's rocky companion has 1/6th Earth gravity and permanently shadowed polar craters preserving ancient water ice.",
    launchWorld: 'moon',
    orbitRadius: 1.55,
    visualRadius: 0.24,
    orbitSpeed: 1.9,
    initialAngle: 1.2,
  },
  {
    id: 'mars',
    name: 'Mars',
    category: 'Iron-Oxide Desert Planet',
    distanceLabel: '1.52 AU from Sun',
    diameterKm: '6,779 km',
    fact: 'Red iron-oxide dust covers dry riverbeds like Jezero Crater, orbited by two tiny asteroid-like moons: Phobos and Deimos.',
    launchWorld: 'mars',
    orbitRadius: 12.6,
    visualRadius: 0.56,
    orbitSpeed: 0.36,
    initialAngle: 5.4,
    tiltRad: 0.44,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    category: 'Gas Giant (Flight Mode)',
    distanceLabel: '5.20 AU from Sun',
    diameterKm: '139,820 km',
    fact: 'Largest planet in our Solar System! No solid ground exists—pilot your spacecraft past swirling storms and the Great Red Spot.',
    launchWorld: 'jupiter',
    orbitRadius: 17.8,
    visualRadius: 1.58,
    orbitSpeed: 0.2,
    initialAngle: 1.1,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    category: 'Ringed Gas Giant (Flight Mode)',
    distanceLabel: '9.58 AU from Sun',
    diameterKm: '116,460 km',
    fact: 'Surrounded by dazzling rings made of billions of water-ice and rock chunks separated by the dark Cassini Division.',
    launchWorld: 'saturn',
    orbitRadius: 23.4,
    visualRadius: 1.32,
    orbitSpeed: 0.14,
    initialAngle: 3.2,
    tiltRad: 0.46,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    category: 'Tilted Ice Giant (Flight Mode)',
    distanceLabel: '19.2 AU from Sun',
    diameterKm: '50,724 km',
    fact: 'Knocked onto a 98-degree tilt long ago, this pale-cyan methane world practically rolls around the Sun on its side.',
    launchWorld: 'uranus',
    orbitRadius: 28.8,
    visualRadius: 0.92,
    orbitSpeed: 0.095,
    initialAngle: 5.9,
    tiltRad: 1.48,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    category: 'Supersonic Wind Ice Giant (Flight Mode)',
    distanceLabel: '30.1 AU from Sun',
    diameterKm: '49,244 km',
    fact: 'Outermost major planet, whipped by freezing dark-blue storms and supersonic methane winds over 2,000 km/h.',
    launchWorld: 'neptune',
    orbitRadius: 33.4,
    visualRadius: 0.9,
    orbitSpeed: 0.072,
    initialAngle: 2.0,
    tiltRad: 0.49,
  },
];

function createOrreryRadialRingMesh(
  innerR: number,
  outerR: number,
  ringTex: THREE.Texture
): THREE.Mesh {
  const geo = new THREE.RingGeometry(innerR, outerR, 56, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const span = outerR - innerR || 1;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, THREE.MathUtils.clamp((r - innerR) / span, 0, 1), 0.5);
  }
  uv.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

interface SolarSystemOrrery3DProps {
  selectedBody: OrreryBodyId;
  onSelectBody: (id: OrreryBodyId) => void;
}

function SolarSystemOrrery3D({ selectedBody, onSelectBody }: SolarSystemOrrery3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<OrreryBodyId>(selectedBody);
  selectedRef.current = selectedBody;
  const onSelectRef = useRef(onSelectBody);
  onSelectRef.current = onSelectBody;

  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 260;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030612);
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 240);

    const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const disposableTextures: THREE.Texture[] = [];
    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    // Lightweight Cosmic Lighting (no heavy PMREM cubemap needed)
    scene.add(new THREE.AmbientLight(0x334155, 0.85));
    scene.add(new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.65));
    const sunLight = new THREE.PointLight(0xfff1d6, 4.0, 180, 0.16);
    scene.add(sunLight);

    // Lightweight Starfield
    const starCount = 520;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 95 + Math.random() * 40;
      starPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      starPos[i * 3 + 1] = Math.cos(ph) * r;
      starPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.44, transparent: true, opacity: 0.85 });
    disposableGeometries.push(starGeo);
    disposableMaterials.push(starMat);
    scene.add(new THREE.Points(starGeo, starMat));

    // Asteroid Belt between Mars & Jupiter
    const beltCount = 180;
    const beltPos = new Float32Array(beltCount * 3);
    for (let i = 0; i < beltCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 14.2 + Math.random() * 1.9;
      beltPos[i * 3] = Math.cos(a) * r;
      beltPos[i * 3 + 1] = (Math.random() - 0.5) * 0.45;
      beltPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const beltGeo = new THREE.BufferGeometry();
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3));
    const beltMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.18, transparent: true, opacity: 0.72 });
    disposableGeometries.push(beltGeo);
    disposableMaterials.push(beltMat);
    const asteroidBelt = new THREE.Points(beltGeo, beltMat);
    scene.add(asteroidBelt);

    const planetGroups = new Map<OrreryBodyId, THREE.Group>();
    const pickMeshes: THREE.Mesh[] = [];
    const earthCenter = new THREE.Vector3();

    SOLAR_BODIES.forEach((body) => {
      const group = new THREE.Group();
      scene.add(group);
      planetGroups.set(body.id, group);

      if (body.id === 'sun') {
        const sunTex = createPlanetTexture('sun', maxAniso);
        disposableTextures.push(sunTex);
        const sunGeo = new THREE.SphereGeometry(body.visualRadius, 28, 20);
        const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
        disposableGeometries.push(sunGeo);
        disposableMaterials.push(sunMat);
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.userData.bodyId = 'sun';
        group.add(sunMesh);
        pickMeshes.push(sunMesh);

        const flareTex = createSunFlareTexture();
        disposableTextures.push(flareTex);
        const coronaMat = new THREE.SpriteMaterial({
          map: flareTex,
          color: 0xffd27d,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposableMaterials.push(coronaMat);
        const corona = new THREE.Sprite(coronaMat);
        corona.scale.set(11.5, 11.5, 1);
        group.add(corona);
      } else {
        if (body.id !== 'moon') {
          const orbitSegs = 72;
          const pts: THREE.Vector3[] = [];
          for (let s = 0; s < orbitSegs; s++) {
            const ang = (s / orbitSegs) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(ang) * body.orbitRadius, 0, Math.sin(ang) * body.orbitRadius));
          }
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const orbitMat = new THREE.LineBasicMaterial({
            color: body.launchWorld ? 0x0ea5e9 : 0x334155,
            transparent: true,
            opacity: body.launchWorld ? 0.55 : 0.38,
          });
          disposableGeometries.push(orbitGeo);
          disposableMaterials.push(orbitMat);
          scene.add(new THREE.LineLoop(orbitGeo, orbitMat));
        }

        const sphereGeo = new THREE.SphereGeometry(body.visualRadius, 24, 18);
        disposableGeometries.push(sphereGeo);

        let mat: THREE.MeshStandardMaterial;
        if (body.id === 'earth') {
          const maps = createEarthPbrMaps(maxAniso);
          disposableTextures.push(maps.map, maps.roughnessMap, maps.emissiveMap);
          mat = new THREE.MeshStandardMaterial({
            map: maps.map,
            roughnessMap: maps.roughnessMap,
            roughness: 0.85,
            metalness: 0.06,
          });
        } else {
          const tex = createPlanetTexture(body.id, maxAniso);
          disposableTextures.push(tex);
          mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.78,
            metalness: 0.05,
          });
        }
        disposableMaterials.push(mat);

        const mesh = new THREE.Mesh(sphereGeo, mat);
        if (body.tiltRad) mesh.rotation.z = body.tiltRad;
        mesh.userData.bodyId = body.id;
        group.add(mesh);
        pickMeshes.push(mesh);

        const hitGeo = new THREE.SphereGeometry(Math.max(body.visualRadius * 1.65, 1.05), 12, 10);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        disposableGeometries.push(hitGeo);
        disposableMaterials.push(hitMat);
        const hitSphere = new THREE.Mesh(hitGeo, hitMat);
        hitSphere.userData.bodyId = body.id;
        group.add(hitSphere);
        pickMeshes.push(hitSphere);

        if (body.id === 'saturn') {
          const ringTex = createSaturnRingTexture();
          disposableTextures.push(ringTex);
          const ringMesh = createOrreryRadialRingMesh(
            body.visualRadius * 1.35,
            body.visualRadius * 2.45,
            ringTex
          );
          ringMesh.rotation.z = body.tiltRad ?? 0.45;
          disposableGeometries.push(ringMesh.geometry);
          disposableMaterials.push(ringMesh.material as THREE.Material);
          group.add(ringMesh);
        } else if (body.id === 'uranus') {
          const uranusRingGeo = new THREE.RingGeometry(body.visualRadius * 1.45, body.visualRadius * 1.62, 36);
          const uranusRingMat = new THREE.MeshBasicMaterial({
            color: 0xa5f3fc,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          disposableGeometries.push(uranusRingGeo);
          disposableMaterials.push(uranusRingMat);
          const uRing = new THREE.Mesh(uranusRingGeo, uranusRingMat);
          uRing.rotation.x = Math.PI / 2;
          uRing.rotation.z = body.tiltRad ?? 1.48;
          group.add(uRing);
        }
      }
    });

    const reticleGeo = new THREE.RingGeometry(1.15, 1.3, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    disposableGeometries.push(reticleGeo);
    disposableMaterials.push(reticleMat);
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.rotation.x = -Math.PI / 2;
    scene.add(reticleMesh);

    let camYaw = 0.55;
    let camPitch = 0.52;
    let camDist = 36;
    let targetDist = 36;
    const lookTarget = new THREE.Vector3(0, 0, 0);
    const desiredLook = new THREE.Vector3(0, 0, 0);

    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let prevPtr = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const ptrNdc = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      prevPtr = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      camYaw -= (e.clientX - prevPtr.x) * 0.007;
      camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - prevPtr.y) * 0.006, 0.15, 1.38);
      prevPtr = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (moved < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        ptrNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ptrNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ptrNdc, camera);
        const hits = raycaster.intersectObjects(pickMeshes, false);
        if (hits.length > 0) {
          const hitId = hits[0].object.userData.bodyId as OrreryBodyId | undefined;
          if (hitId) onSelectRef.current(hitId);
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDist = THREE.MathUtils.clamp(targetDist + e.deltaY * 0.02, 10, 62);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      const cw = container.clientWidth || 640;
      const ch = container.clientHeight || 260;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      if (!dragging) {
        camYaw += dt * 0.045;
      }

      SOLAR_BODIES.forEach((b) => {
        const g = planetGroups.get(b.id);
        if (!g) return;
        if (b.id === 'sun') {
          g.rotation.y = elapsed * 0.08;
          return;
        }
        if (b.id === 'earth') {
          const ang = b.initialAngle + elapsed * b.orbitSpeed * 0.35;
          earthCenter.set(Math.cos(ang) * b.orbitRadius, 0, Math.sin(ang) * b.orbitRadius);
          g.position.copy(earthCenter);
          g.children[0].rotation.y += dt * 0.35;
        } else if (b.id === 'moon') {
          const ang = b.initialAngle + elapsed * b.orbitSpeed * 0.55;
          g.position.set(
            earthCenter.x + Math.cos(ang) * b.orbitRadius,
            0.25 * Math.sin(ang),
            earthCenter.z + Math.sin(ang) * b.orbitRadius
          );
          g.children[0].rotation.y += dt * 0.25;
        } else {
          const ang = b.initialAngle + elapsed * b.orbitSpeed * 0.35;
          g.position.set(Math.cos(ang) * b.orbitRadius, 0, Math.sin(ang) * b.orbitRadius);
          g.children[0].rotation.y += dt * 0.32;
        }
      });

      asteroidBelt.rotation.y = elapsed * 0.03;

      const selGroup = planetGroups.get(selectedRef.current);
      const selMeta = SOLAR_BODIES.find((b) => b.id === selectedRef.current);
      if (selGroup && selMeta) {
        reticleMesh.position.copy(selGroup.position);
        const s = selMeta.visualRadius * 1.55 + Math.sin(elapsed * 4) * 0.08;
        reticleMesh.scale.set(s, s, 1);
        desiredLook.copy(selGroup.position).multiplyScalar(0.38);
      }
      lookTarget.lerp(desiredLook, 1 - Math.exp(-5 * dt));

      camDist = THREE.MathUtils.damp(camDist, targetDist, 7, dt);
      const cp = Math.cos(camPitch);
      const sp = Math.sin(camPitch);
      camera.position.set(
        lookTarget.x + Math.sin(camYaw) * cp * camDist,
        lookTarget.y + sp * camDist,
        lookTarget.z + Math.cos(camYaw) * cp * camDist
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      renderer.dispose();
      dom.remove();
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-slate-800 bg-[#050916] text-xs text-slate-400">
        3D Solar System Planetarium requires WebGL. Choose any destination card below to travel!
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="relative h-56 sm:h-64 w-full cursor-grab active:cursor-grabbing overflow-hidden rounded-xl border border-slate-800 bg-[#030612]"
    />
  );
}

interface StarMapModalProps {
  currentWorld: WorldId;
  profile: TraineeProfile;
  onSelectWorld: (worldId: WorldId) => void;
  onSelectSpacecraft: (craftId: SpacecraftId) => void;
  onToggleSandboxUnlock: () => void;
  onClose: () => void;
}

export function StarMapModal({
  currentWorld,
  profile,
  onSelectWorld,
  onSelectSpacecraft,
  onToggleSandboxUnlock,
  onClose,
}: StarMapModalProps) {
  const worldList: WorldId[] = [
    'earth',
    'moon',
    'mars',
    'station',
    'mercury',
    'venus',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
  ];
  const defaultBody: OrreryBodyId =
    currentWorld === 'station' ? 'earth' : (currentWorld as OrreryBodyId);
  const [selectedBody, setSelectedBody] = useState<OrreryBodyId>(defaultBody);
  const activeFact = SOLAR_BODIES.find((b) => b.id === selectedBody) ?? SOLAR_BODIES[3];
  const activeLaunchCfg = activeFact.launchWorld ? WORLDS[activeFact.launchWorld] : null;
  const activeLaunchUnlocked = activeLaunchCfg
    ? profile.openWorld.xp >= activeLaunchCfg.unlockXp || profile.openWorld.sandboxUnlocked
    : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/85 p-3 sm:p-4"
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1222] p-4 text-slate-100 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-300">
                3D Solar System Planetarium · Spacecraft Hangar & Destinations
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                Star Map & Planet Exploration Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSandboxUnlock}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                profile.openWorld.sandboxUnlocked
                  ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                  : 'border-slate-700 bg-[#070B19] text-slate-300 hover:border-cyan-400'
              }`}
            >
              {profile.openWorld.sandboxUnlocked ? (
                <Unlock className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span>
                {profile.openWorld.sandboxUnlocked ? 'Free Explore: ON' : 'Unlock All Planets'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Star Map"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 1: Select Exploration Spacecraft */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Plane className="h-3.5 w-3.5" />
              1. Choose Your Spacecraft
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Piloted on Gas Giants (Jupiter, Saturn, Uranus, Neptune) & Shuttle Transfers
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {SPACECRAFT_CATALOG.map((craft) => {
              const selected = profile.openWorld.selectedSpacecraft === craft.id;
              return (
                <button
                  key={craft.id}
                  type="button"
                  onClick={() => onSelectSpacecraft(craft.id)}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-800 bg-[#070B19] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-white">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: craft.accentHex }}
                        />
                        {craft.name}
                      </span>
                      <span className="font-mono text-[11px] text-cyan-300 tabular-nums">
                        {Math.round(craft.speedMultiplier * 100)}% Speed
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-mono text-amber-300/90">{craft.role}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {craft.description}
                    </p>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-cyan-300">
                    {selected ? 'Active Craft Ready' : 'Select Craft'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Interactive 3D Solar System Planetarium */}
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider">
              <Globe2 className="h-3.5 w-3.5" />
              2. Explore the Solar System (Drag to orbit · Click any planet)
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Your XP: {profile.openWorld.xp} XP
            </span>
          </div>

          <SolarSystemOrrery3D selectedBody={selectedBody} onSelectBody={setSelectedBody} />

          {/* Quick Body Tabs */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SOLAR_BODIES.map((b) => {
              const active = b.id === selectedBody;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBody(b.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'border border-slate-800 bg-[#070B19] text-slate-300 hover:border-cyan-500/50 hover:text-white'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>

          {/* Inspected Planet Telemetry + PlanetFacts Card */}
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-800 bg-[#080D1A]">
            <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-cyan-300">
                  <span>{activeFact.category}</span>
                  <span className="text-slate-600">·</span>
                  <span>{activeFact.distanceLabel}</span>
                  <span className="text-slate-600">·</span>
                  <span>Diameter {activeFact.diameterKm}</span>
                </div>
                <div className="font-display text-base font-bold text-white">{activeFact.name}</div>
                <p className="text-xs leading-relaxed text-slate-300">{activeFact.fact}</p>
              </div>

              {activeFact.launchWorld && activeFact.launchWorld !== currentWorld && activeLaunchCfg && (
                <button
                  type="button"
                  disabled={!activeLaunchUnlocked}
                  onClick={() => onSelectWorld(activeFact.launchWorld!)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap ${
                    activeLaunchUnlocked
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : 'border border-slate-700 bg-slate-800/70 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {activeLaunchUnlocked ? (
                    <>
                      <Rocket className="h-4 w-4" />
                      <span>Travel Here</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Requires {activeLaunchCfg.unlockXp} XP</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {activeLaunchCfg && (
              <div className="grid grid-cols-2 divide-y divide-slate-800/80 border-t border-slate-800/90 text-[11px] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="px-4 py-2.5">
                  <span className="font-mono text-slate-400">Temperature</span>
                  <div className="mt-0.5 font-semibold text-amber-200">{activeLaunchCfg.planetFacts.temperature}</div>
                </div>
                <div className="px-4 py-2.5">
                  <span className="font-mono text-slate-400">Gravity</span>
                  <div className="mt-0.5 font-semibold text-cyan-200">{activeLaunchCfg.planetFacts.gravity}</div>
                </div>
                <div className="px-4 py-2.5">
                  <span className="font-mono text-slate-400">Day Length</span>
                  <div className="mt-0.5 font-semibold text-slate-100">{activeLaunchCfg.planetFacts.dayLength}</div>
                </div>
                <div className="px-4 py-2.5">
                  <span className="font-mono text-slate-400">Moons</span>
                  <div className="mt-0.5 font-semibold text-slate-100">{activeLaunchCfg.planetFacts.moonsCount}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Destination Cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {worldList.map((wId) => {
            const w = WORLDS[wId];
            const isHere = currentWorld === wId;
            const isUnlocked = profile.openWorld.xp >= w.unlockXp || profile.openWorld.sandboxUnlocked;
            const isFlight = w.explorationMode === 'flight';
            const worldInvs = SCIENTIFIC_INVESTIGATIONS.filter((i) => i.worldId === wId);
            const solvedCount = worldInvs.filter((i) =>
              profile.openWorld.solvedInvestigations.includes(i.id)
            ).length;

            return (
              <div
                key={wId}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  isHere
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : isUnlocked
                    ? 'border-slate-800 bg-[#070B19] hover:border-slate-700'
                    : 'border-slate-800/60 bg-[#070B19]/60 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className={isFlight ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                      {isFlight ? 'Spacecraft Flight' : 'Surface Mode'}
                    </span>
                    <span className="text-cyan-300">
                      {solvedCount}/{worldInvs.length} solved
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-white">{w.name}</h3>
                  <p className="text-[11px] text-slate-400">{w.subtitle}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-cyan-200/90">
                    {w.atmosphereLabel}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{w.realScienceNote}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>Temp: {w.planetFacts.temperature}</span>
                    <span>Day: {w.planetFacts.dayLength}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isHere || !isUnlocked}
                  onClick={() => onSelectWorld(wId)}
                  className={`mt-3.5 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    isHere
                      ? 'border border-cyan-400/50 bg-cyan-400/15 text-cyan-200 cursor-default'
                      : isUnlocked
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : 'border border-slate-700 bg-slate-800/70 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isHere ? (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span>Current Location</span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Rocket className="h-4 w-4" />
                      <span>{isFlight ? 'Fly Craft Here' : 'Land & Explore'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Unlocks at {w.unlockXp} XP</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface InventoryModalProps {
  profile: TraineeProfile;
  onClose: () => void;
}

export function InventoryModal({ profile, onClose }: InventoryModalProps) {
  const rank = calculateLevelFromXp(profile.openWorld.xp);
  const badges = profile.openWorld.earnedBadges || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/85 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1222] p-5 text-slate-100 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <Backpack className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-300">
                Level {rank.level} {rank.title} · {profile.openWorld.xp} XP
              </div>
              <h2 className="font-display text-xl font-bold text-white">
                Astronaut Field Inventory, Samples & Badges
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inventory"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-[#070B19] p-3.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">Rank Progress to Level {rank.level + 1}</span>
            <span className="text-cyan-300 tabular-nums">
              {profile.openWorld.xp} / {rank.nextLevelXp} XP
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              style={{ width: `${rank.progressPct}%` }}
              className="h-full rounded-full bg-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Earned Explorer Badges */}
        <div className="mt-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Award className="h-4 w-4 text-amber-300" />
            Earned Planet Explorer Badges ({badges.length})
          </h3>
          {badges.length === 0 ? (
            <div className="mt-2 rounded-xl border border-slate-800 bg-[#070B19] p-4 text-xs text-slate-400">
              Complete any planet mission to unlock your first official Astronaut Explorer Badge!
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-200"
                >
                  <Award className="h-3.5 w-3.5 text-amber-300" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collected Field Samples & Telemetry */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white">
            Collected Samples & Telemetry ({profile.openWorld.inventory.length})
          </h3>
          {profile.openWorld.inventory.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-[#070B19] p-6 text-center text-sm text-slate-400">
              No samples collected yet. Explore Earth, Mars, the Moon, or outer planets, fly through floating crystals, and press{' '}
              <strong>E</strong> near glowing beacons!
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {profile.openWorld.inventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-[#070B19] p-3.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                    <span>{item.worldId.toUpperCase()}</span>
                    <span>{item.category.toUpperCase()}</span>
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-white">{item.name}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.reading}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
