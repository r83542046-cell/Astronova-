import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Backpack,
  BookOpen,
  Bot,
  Camera,
  Car,
  ChevronDown,
  ChevronUp,
  Compass,
  FlaskConical,
  Gauge,
  Globe,
  LayoutGrid,
  Rocket,
  ScanLine,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ASTRONAUT_AVATARS } from '../../data/nasaScienceData';
import {
  SCIENTIFIC_INVESTIGATIONS,
  SPACECRAFT_CATALOG,
  WORLDS,
  WORLD_NODES,
  WORLD_PICKUPS,
  WorldInteractiveNode,
  WorldPickup,
} from '../../data/openWorldMissions';
import {
  DifficultyTier,
  GameScreen,
  SpacecraftId,
  TraineeProfile,
  WorldId,
} from '../../types/game';
import { calculateLevelFromXp } from '../../utils/storage';
import { soundEngine } from '../../utils/sound';
import { BottomLeftRankWidget } from '../BottomLeftRankWidget';
import { AstronautRig, createAstronautModel, updateAstronautAnimation } from './astronautModel';
import { createSoftParticleTexture } from './proceduralMaterials';
import {
  WorldSceneHandles,
  buildPlayerSpacecraftMesh,
  buildWorldEnvironment,
  disposeObjectTree,
  groundHeightAt,
} from './worldBuilder';
import {
  WorldCollider,
  getSupportHeightAt,
  makeBoxCollider,
  makeCylinderCollider,
  resolveFlightMovementWithCCD,
  resolveSurfaceMovementWithCCD,
} from './physicsCollision';
import { InvestigationModal } from './InvestigationModal';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { NasaArchiveModal } from './NasaArchiveModal';
import { InventoryModal, StarMapModal } from './StarMapAndInventoryModals';

// Pre-allocated math helpers (zero GC inside animation loop)
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _moveVec = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _rayMouse = new THREE.Vector2();
const _dynamicColliders: WorldCollider[] = [];
const _sunDirStation = new THREE.Vector3(24, 30, 18).normalize();
const _sunDirEarth = new THREE.Vector3(26, 38, 22).normalize();
const _sunDirMars = new THREE.Vector3(28, 19, 22).normalize();
const _sunDirMoon = new THREE.Vector3(32, 16, 14).normalize();
const _sunDirVenus = new THREE.Vector3(18, 34, 14).normalize();
const _sunDirMercury = new THREE.Vector3(36, 22, 8).normalize();
const _sunDirJupiter = new THREE.Vector3(26, 20, 26).normalize();
const _sunDirSaturn = new THREE.Vector3(24, 18, 28).normalize();
const _sunDirUranus = new THREE.Vector3(30, 14, 22).normalize();
const _sunDirNeptune = new THREE.Vector3(28, 16, 24).normalize();

type CameraPreset = 'chase' | 'wide' | 'cinematic';
const CAMERA_PRESET_CONFIG: Record<CameraPreset, { dist: number; pitch: number; label: string }> = {
  chase: { dist: 7.4, pitch: 0.28, label: 'Chase' },
  wide: { dist: 11.4, pitch: 0.4, label: 'Wide' },
  cinematic: { dist: 5.8, pitch: 0.16, label: 'Close' },
};

function getSunDirection(worldId: WorldId): THREE.Vector3 {
  switch (worldId) {
    case 'earth':
      return _sunDirEarth;
    case 'mars':
      return _sunDirMars;
    case 'moon':
      return _sunDirMoon;
    case 'venus':
      return _sunDirVenus;
    case 'mercury':
      return _sunDirMercury;
    case 'jupiter':
      return _sunDirJupiter;
    case 'saturn':
      return _sunDirSaturn;
    case 'uranus':
      return _sunDirUranus;
    case 'neptune':
      return _sunDirNeptune;
    default:
      return _sunDirStation;
  }
}

const WORLD_LIGHT_THEMES: Record<
  WorldId,
  { hemiSky: number; hemiGround: number; key: number; bounce: number; fxDust: number }
> = {
  earth: { hemiSky: 0x7dd3fc, hemiGround: 0x14532d, key: 0xfffaed, bounce: 0x22c55e, fxDust: 0xbae6fd },
  mars: { hemiSky: 0xfdba74, hemiGround: 0x5c2814, key: 0xffe2ba, bounce: 0xd96b38, fxDust: 0xfdba74 },
  moon: { hemiSky: 0x94a3b8, hemiGround: 0x1e293b, key: 0xffffff, bounce: 0x64748b, fxDust: 0xe2e8f0 },
  venus: { hemiSky: 0xfbbf24, hemiGround: 0x451a03, key: 0xfde68a, bounce: 0xd97706, fxDust: 0xf59e0b },
  mercury: { hemiSky: 0xcbd5e1, hemiGround: 0x1e293b, key: 0xfffbeb, bounce: 0x94a3b8, fxDust: 0xfef3c7 },
  jupiter: { hemiSky: 0xfdba74, hemiGround: 0x78350f, key: 0xffedd5, bounce: 0xf59e0b, fxDust: 0xfcd34d },
  saturn: { hemiSky: 0xfef08a, hemiGround: 0x422006, key: 0xfef9c3, bounce: 0xeab308, fxDust: 0xfef08a },
  uranus: { hemiSky: 0x67e8f9, hemiGround: 0x083344, key: 0xcffafe, bounce: 0x06b6d4, fxDust: 0x67e8f9 },
  neptune: { hemiSky: 0x60a5fa, hemiGround: 0x172554, key: 0xdbeafe, bounce: 0x2563eb, fxDust: 0x60a5fa },
  station: { hemiSky: 0x93c5fd, hemiGround: 0x334155, key: 0xfff1db, bounce: 0x38bdf8, fxDust: 0x38bdf8 },
};

function applyWorldLighting(
  worldId: WorldId,
  scene: THREE.Scene,
  hemiLight: THREE.HemisphereLight,
  keyLight: THREE.DirectionalLight,
  bounceLight: THREE.DirectionalLight,
  poolMat: THREE.PointsMaterial
): THREE.Vector3 {
  const cfg = WORLDS[worldId];
  const sunDir = getSunDirection(worldId);
  const theme = WORLD_LIGHT_THEMES[worldId];
  keyLight.position.copy(sunDir).multiplyScalar(38);
  scene.background = new THREE.Color(cfg.skyColorHex);
  scene.fog = new THREE.FogExp2(cfg.fogColorHex, cfg.fogDensity);
  hemiLight.color.setHex(theme.hemiSky);
  hemiLight.groundColor.setHex(theme.hemiGround);
  keyLight.color.setHex(theme.key);
  bounceLight.color.setHex(theme.bounce);
  poolMat.color.setHex(theme.fxDust);
  return sunDir;
}

interface RadarBlip {
  id: string;
  dx: number;
  dy: number;
  status: 'unscanned' | 'scanned' | 'solved';
}

interface RoverRadarPos {
  dx: number;
  dy: number;
}

interface SpaceWorld3DProps {
  profile: TraineeProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateScreen: (screen: GameScreen) => void;
  onChangeWorld: (worldId: WorldId) => void;
  onSelectSpacecraft: (craftId: SpacecraftId) => void;
  onToggleSandboxUnlock: () => void;
  onCollectPickup: (pickup: WorldPickup) => void;
  onDiscoverNode: (node: WorldInteractiveNode) => void;
  onSolveInvestigation: (
    investigationId: string,
    score: number,
    xpGain: number,
    nextTier: DifficultyTier
  ) => void;
  onCompleteFollowUp: (passed: boolean, xpGain: number) => void;
  onHintUsed: () => void;
}

export function SpaceWorld3D({
  profile,
  isMuted,
  onToggleMute,
  onNavigateScreen,
  onChangeWorld,
  onSelectSpacecraft,
  onToggleSandboxUnlock,
  onCollectPickup,
  onDiscoverNode,
  onSolveInvestigation,
  onCompleteFollowUp,
  onHintUsed,
}: SpaceWorld3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const worldId = profile.openWorld.currentWorld;
  const worldCfg = WORLDS[worldId];
  const isFlightMode = worldCfg.explorationMode === 'flight';
  const avatar = ASTRONAUT_AVATARS.find((a) => a.id === profile.avatarId) || ASTRONAUT_AVATARS[0];
  const rank = calculateLevelFromXp(profile.openWorld.xp);

  const [webglError, setWebglError] = useState(false);
  const [nearbyNode, setNearbyNode] = useState<WorldInteractiveNode | null>(null);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiWrongNote, setAiWrongNote] = useState<string | undefined>(undefined);
  const [starMapOpen, setStarMapOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [nasaOpen, setNasaOpen] = useState(false);
  const [planetGuideOpen, setPlanetGuideOpen] = useState(false);
  const [travelTarget, setTravelTarget] = useState<WorldId | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [crispQuality, setCrispQuality] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('chase');
  const [staminaPct, setStaminaPct] = useState(100);
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);
  const [roverBlip, setRoverBlip] = useState<RoverRadarPos | null>(null);
  const [inRover, setInRover] = useState(false);
  const [nearRover, setNearRover] = useState(false);
  const [speedReadout, setSpeedReadout] = useState(0);
  const [altitudeReadout, setAltitudeReadout] = useState(0);
  const [compassDeg, setCompassDeg] = useState(0);
  const [orbitalView, setOrbitalView] = useState(false);
  const orbitalViewRef = useRef(orbitalView);
  orbitalViewRef.current = orbitalView;
  const [toast, setToast] = useState<string | null>(
    isFlightMode
      ? `Piloting in ${worldCfg.name} atmosphere! WASD to steer, Space/Q to climb/dive, E to scan probes.`
      : `Landed at ${worldCfg.name}. WASD to explore, F to drive Rover, I for Planet Guide.`
  );

  // Refs for latest state inside Three.js loop
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const onCollectPickupRef = useRef(onCollectPickup);
  onCollectPickupRef.current = onCollectPickup;
  const travelTargetRef = useRef(travelTarget);
  travelTargetRef.current = travelTarget;
  const modalPausedRef = useRef(false);
  modalPausedRef.current = Boolean(
    activeInvestigationId || starMapOpen || inventoryOpen || nasaOpen || planetGuideOpen || travelTarget
  );

  const keysRef = useRef<Record<string, boolean>>({});
  const touchMoveRef = useRef({ x: 0, z: 0, jump: false, descend: false });
  const playerStateRef = useRef({
    x: 0,
    y: isFlightMode
      ? 12.5
      : worldId === 'station'
        ? 0.545
        : worldId === 'earth'
          ? groundHeightAt('earth', 0, 5) + 0.72
          : groundHeightAt(worldId, 0, 5) + 0.12,
    z: isFlightMode ? 19.5 : 5,
    vx: 0,
    vz: 0,
    vy: 0,
    yaw: Math.PI,
    grounded: true,
    camYaw: 0,
    camPitch: CAMERA_PRESET_CONFIG.chase.pitch,
    camDist: isFlightMode ? 10.5 : CAMERA_PRESET_CONFIG.chase.dist,
    targetCamPitch: CAMERA_PRESET_CONFIG.chase.pitch,
    targetCamDist: isFlightMode ? 10.5 : CAMERA_PRESET_CONFIG.chase.dist,
    stamina: 100,
    stepTimer: 0,
    impactRecoil: 0,
    bankAngle: 0,
    craftSpeed: 0,
    inRover: false,
    roverX: 6.5,
    roverZ: 10,
    roverYaw: -0.35,
    roverSpeed: 0,
  });

  const threeRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    keyLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    bounceLight: THREE.DirectionalLight;
    jetLight: THREE.PointLight;
    roverSpot: THREE.SpotLight;
    poolMat: THREE.PointsMaterial;
    worldHandles: WorldSceneHandles | null;
    astronaut: AstronautRig;
    craftGroup: THREE.Group;
    maxAnisotropy: number;
    isSoftwareGl: boolean;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const cycleCameraPreset = useCallback(() => {
    soundEngine.playClick();
    setCameraPreset((prev) => {
      const next: CameraPreset =
        prev === 'chase' ? 'wide' : prev === 'wide' ? 'cinematic' : 'chase';
      const cfg = CAMERA_PRESET_CONFIG[next];
      const flightBoost = WORLDS[profileRef.current.openWorld.currentWorld].explorationMode === 'flight' ? 3.2 : 0;
      playerStateRef.current.targetCamDist = cfg.dist + flightBoost;
      playerStateRef.current.targetCamPitch = cfg.pitch;
      return next;
    });
  }, []);

  const launchToWorld = useCallback(
    (nextWorld: WorldId) => {
      soundEngine.playWarp();
      setStarMapOpen(false);
      setTravelTarget(nextWorld);
      window.setTimeout(() => {
        onChangeWorld(nextWorld);
        setTravelTarget(null);
      }, 1550);
    },
    [onChangeWorld]
  );

  const handleInteractNode = useCallback(
    (node: WorldInteractiveNode) => {
      if (node.actionType === 'warp_hub') {
        soundEngine.playClick();
        setStarMapOpen(true);
        return;
      }
      if (node.actionType === 'open_training_sim') {
        soundEngine.playClick();
        onNavigateScreen('DASHBOARD');
        return;
      }

      const alreadyScanned = profileRef.current.openWorld.discoveredNodes.includes(node.id);
      soundEngine.playScan();
      if (!alreadyScanned) {
        onDiscoverNode(node);
        showToast(`Scanned ${node.title}! +35 XP & logged telemetry.`);
      } else {
        showToast(`Reviewing ${node.title} sensor data.`);
      }

      if (node.investigationId) {
        setActiveInvestigationId(node.investigationId);
      }
    },
    [onDiscoverNode, onNavigateScreen, showToast]
  );

  const handleInteractRef = useRef(handleInteractNode);
  handleInteractRef.current = handleInteractNode;

  const toggleRoverDrive = useCallback(() => {
    const wId = profileRef.current.openWorld.currentWorld;
    if (wId === 'station' || WORLDS[wId].explorationMode === 'flight') return;
    const ps = playerStateRef.current;
    const tRef = threeRef.current;
    if (!tRef?.worldHandles?.drivableRover) return;

    if (ps.inRover) {
      ps.inRover = false;
      ps.roverSpeed = 0;
      const spatialGrid = tRef.worldHandles.spatialGrid;
      const roverFloor = getSupportHeightAt(wId, ps.roverX, ps.y, ps.roverZ, 0.8, 0.85, groundHeightAt, spatialGrid);
      const roverWall = makeBoxCollider(
        'parked-rover-exit',
        ps.roverX,
        ps.roverZ,
        roverFloor - 0.2,
        roverFloor + 2.2,
        1.25,
        1.48,
        ps.roverYaw,
        false,
        'vehicle'
      );
      // Try left side, then right side, then rear of rover so astronaut never spawns inside walls
      const candidates: [number, number][] = [
        [ps.roverX + Math.cos(ps.roverYaw) * 2.8, ps.roverZ - Math.sin(ps.roverYaw) * 2.8],
        [ps.roverX - Math.cos(ps.roverYaw) * 2.8, ps.roverZ + Math.sin(ps.roverYaw) * 2.8],
        [ps.roverX - Math.sin(ps.roverYaw) * 3.1, ps.roverZ - Math.cos(ps.roverYaw) * 3.1],
      ];
      let chosenX = candidates[0][0];
      let chosenZ = candidates[0][1];
      let chosenY = getSupportHeightAt(wId, chosenX, roverFloor, chosenZ, 0.32, 0.3, groundHeightAt, spatialGrid);
      for (const [cx, cz] of candidates) {
        const cy = getSupportHeightAt(wId, cx, roverFloor, cz, 0.32, 0.3, groundHeightAt, spatialGrid);
        const test = resolveSurfaceMovementWithCCD({
          worldId: wId,
          x: cx,
          y: cy,
          z: cz,
          vx: 0,
          vz: 0,
          vy: 0,
          dt: 0.016,
          radius: 0.48,
          height: 1.85,
          stepHeight: 0.28,
          maxWorldRadius: 280,
          spatialGrid,
          dynamicColliders: [roverWall],
          terrainHeight: groundHeightAt,
        });
        chosenX = test.x;
        chosenZ = test.z;
        chosenY = getSupportHeightAt(wId, chosenX, cy, chosenZ, 0.32, 0.3, groundHeightAt, spatialGrid);
        if (!test.collided) break;
      }

      ps.x = chosenX;
      ps.z = chosenZ;
      ps.y = chosenY;
      ps.vx = 0;
      ps.vz = 0;
      ps.vy = 0;
      ps.grounded = true;
      ps.targetCamDist = CAMERA_PRESET_CONFIG[cameraPreset].dist;
      tRef.astronaut.root.visible = true;
      setInRover(false);
      soundEngine.playClick();
      showToast('Exited 6x6 Exploration Rover.');
    } else {
      const dist = Math.hypot(ps.roverX - ps.x, ps.roverZ - ps.z);
      if (dist <= 5.2) {
        ps.inRover = true;
        ps.x = ps.roverX;
        ps.z = ps.roverZ;
        ps.y = getSupportHeightAt(
          wId,
          ps.x,
          ps.y,
          ps.z,
          0.8,
          0.85,
          groundHeightAt,
          tRef.worldHandles.spatialGrid
        );
        ps.vx = 0;
        ps.vz = 0;
        ps.vy = 0;
        ps.grounded = true;
        ps.targetCamDist = 11.0;
        tRef.astronaut.root.visible = false;
        setInRover(true);
        setNearRover(false);
        soundEngine.playThrust();
        showToast('Rover online! WASD to steer, Shift for Turbo Boost, F to exit.');
      }
    }
  }, [cameraPreset, showToast]);

  const toggleRoverRef = useRef(toggleRoverDrive);
  toggleRoverRef.current = toggleRoverDrive;

  // Toggle lightweight quality preset dynamically (Mobile Fast vs Crisp HD)
  useEffect(() => {
    const tRef = threeRef.current;
    if (!tRef) return;
    const dpr = tRef.isSoftwareGl ? 1 : crispQuality ? Math.min(window.devicePixelRatio, 1.5) : 1.0;
    tRef.renderer.setPixelRatio(dpr);
    tRef.renderer.shadowMap.enabled = !tRef.isSoftwareGl && crispQuality;
    tRef.keyLight.castShadow = !tRef.isSoftwareGl && crispQuality;
  }, [crispQuality]);

  // Swap 3D Spacecraft model dynamically when user changes craft in Star Map
  useEffect(() => {
    const tRef = threeRef.current;
    if (!tRef) return;
    const oldCraft = tRef.craftGroup;
    const nextCraft = buildPlayerSpacecraftMesh(profile.openWorld.selectedSpacecraft);
    nextCraft.visible = WORLDS[profile.openWorld.currentWorld].explorationMode === 'flight';
    nextCraft.position.copy(oldCraft.position);
    nextCraft.rotation.copy(oldCraft.rotation);
    tRef.scene.remove(oldCraft);
    disposeObjectTree(oldCraft);
    tRef.scene.add(nextCraft);
    tRef.craftGroup = nextCraft;
  }, [profile.openWorld.selectedSpacecraft, profile.openWorld.currentWorld]);

  // Initialize Lightweight Three.js Renderer & Scene ONCE
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
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const renderDpr = isSoftwareGl ? 1 : crispQuality ? Math.min(window.devicePixelRatio, 1.5) : 1.0;
    renderer.setSize(width, height);
    renderer.setPixelRatio(renderDpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl && crispQuality;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const onContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 1400);

    // Lightweight High-Contrast Lighting Rig (No heavy PMREM cubemap stalls)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x334155, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1db, 2.0);
    keyLight.castShadow = !isSoftwareGl && crispQuality;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 110;
    const d = 24;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const bounceLight = new THREE.DirectionalLight(0x38bdf8, 0.52);
    bounceLight.position.set(0, -18, 6);
    scene.add(bounceLight);

    const jetLight = new THREE.PointLight(0x38bdf8, 0, 8, 2);
    scene.add(jetLight);

    const roverSpot = new THREE.SpotLight(0xbae6fd, 0, 28, Math.PI / 5, 0.55, 1.4);
    scene.add(roverSpot);
    scene.add(roverSpot.target);

    const initWorldId = profileRef.current.openWorld.currentWorld;
    const initIsFlight = WORLDS[initWorldId].explorationMode === 'flight';

    const astronaut = createAstronautModel(avatar.accentColor);
    astronaut.root.visible = !initIsFlight;
    scene.add(astronaut.root);

    const craftGroup = buildPlayerSpacecraftMesh(profileRef.current.openWorld.selectedSpacecraft);
    craftGroup.visible = initIsFlight;
    scene.add(craftGroup);

    const maxAnisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const POOL_COUNT = 40;
    const poolPos = new Float32Array(POOL_COUNT * 3);
    const poolVel = new Float32Array(POOL_COUNT * 3);
    const poolLife = new Float32Array(POOL_COUNT);
    for (let i = 0; i < POOL_COUNT; i++) {
      poolPos[i * 3 + 1] = -999;
      poolLife[i] = 0;
    }
    const poolGeo = new THREE.BufferGeometry();
    const poolPosAttr = new THREE.BufferAttribute(poolPos, 3);
    poolGeo.setAttribute('position', poolPosAttr);
    const poolMat = new THREE.PointsMaterial({
      map: createSoftParticleTexture(),
      color: WORLD_LIGHT_THEMES[initWorldId].fxDust,
      size: 0.4,
      transparent: true,
      opacity: 0.54,
      alphaTest: 0.01,
      depthWrite: false,
    });
    const fxPoints = new THREE.Points(poolGeo, poolMat);
    fxPoints.frustumCulled = false;
    scene.add(fxPoints);
    let poolCursor = 0;
    const spawnFxParticle = (px: number, py: number, pz: number, vx: number, vy: number, vz: number) => {
      const i3 = poolCursor * 3;
      poolPos[i3] = px;
      poolPos[i3 + 1] = py;
      poolPos[i3 + 2] = pz;
      poolVel[i3] = vx;
      poolVel[i3 + 1] = vy;
      poolVel[i3 + 2] = vz;
      poolLife[poolCursor] = 0.6;
      poolCursor = (poolCursor + 1) % POOL_COUNT;
    };

    const initSunDir = applyWorldLighting(initWorldId, scene, hemiLight, keyLight, bounceLight, poolMat);
    const worldHandles = buildWorldEnvironment(
      initWorldId,
      maxAnisotropy,
      profileRef.current.openWorld.discoveredNodes,
      profileRef.current.openWorld.solvedInvestigations,
      initSunDir,
      profileRef.current.openWorld.collectedPickups
    );
    scene.add(worldHandles.worldGroup);

    threeRef.current = {
      scene,
      renderer,
      camera,
      keyLight,
      hemiLight,
      bounceLight,
      jetLight,
      roverSpot,
      poolMat,
      worldHandles,
      astronaut,
      craftGroup,
      maxAnisotropy,
      isSoftwareGl,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let isDragging = false;
    let dragDist = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragDist = 0;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      dragDist += Math.hypot(dx, dy);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      playerStateRef.current.camYaw -= dx * 0.0065;
      playerStateRef.current.targetCamPitch = THREE.MathUtils.clamp(
        playerStateRef.current.targetCamPitch + dy * 0.005,
        0.08,
        1.15
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (dragDist < 6 && threeRef.current?.worldHandles && !modalPausedRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(_rayMouse, camera);
        const colliders = threeRef.current.worldHandles.nodeHandles.map((h) => h.colliderMesh);
        const hits = raycaster.intersectObjects(colliders, false);
        if (hits.length > 0) {
          const nodeId = hits[0].object.userData.nodeId as string;
          const found = threeRef.current.worldHandles.nodeHandles.find(
            (h) => h.node.id === nodeId
          );
          if (found) {
            const ps = playerStateRef.current;
            const nodeY = found.node.y ?? groundHeightAt(profileRef.current.openWorld.currentWorld, found.node.x, found.node.z);
            const distToPlayer = Math.hypot(found.node.x - ps.x, nodeY - ps.y, found.node.z - ps.z);
            const isFlight = WORLDS[profileRef.current.openWorld.currentWorld].explorationMode === 'flight';
            const clickMaxDist = isFlight ? 12.0 : ps.inRover ? 9.5 : 8.0;
            if (distToPlayer <= clickMaxDist) {
              handleInteractRef.current(found.node);
            } else {
              showToast(`Travel closer to ${found.node.title} to scan it!`);
            }
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      playerStateRef.current.targetCamDist = THREE.MathUtils.clamp(
        playerStateRef.current.targetCamDist + e.deltaY * 0.005,
        4.4,
        22.0
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      const cw = container.clientWidth || window.innerWidth;
      const ch = container.clientHeight || window.innerHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener('resize', onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keysRef.current[e.code] = true;

      if (e.code === 'KeyV' && !modalPausedRef.current) {
        cycleCameraPreset();
      }
      if (e.code === 'KeyO' && !modalPausedRef.current) {
        soundEngine.playClick();
        setOrbitalView((prev) => !prev);
      }
      if (e.code === 'KeyI' && !travelTargetRef.current) {
        soundEngine.playClick();
        setPlanetGuideOpen((prev) => !prev);
      }
      if (e.code === 'KeyF' && !modalPausedRef.current) {
        toggleRoverRef.current();
      }

      if (e.code === 'KeyE' && !modalPausedRef.current && threeRef.current?.worldHandles) {
        const ps = playerStateRef.current;
        const wId = profileRef.current.openWorld.currentWorld;
        const isFlight = WORLDS[wId].explorationMode === 'flight';
        let closest: WorldInteractiveNode | null = null;
        let bestDist = isFlight ? 9.5 : ps.inRover ? 6.5 : 5.2;
        for (const h of threeRef.current.worldHandles.nodeHandles) {
          const ny = h.node.y ?? groundHeightAt(wId, h.node.x, h.node.z);
          const dist = isFlight
            ? Math.hypot(h.node.x - ps.x, ny - ps.y, h.node.z - ps.z)
            : Math.hypot(h.node.x - ps.x, h.node.z - ps.z);
          if (dist < bestDist) {
            bestDist = dist;
            closest = h.node;
          }
        }
        if (closest) {
          handleInteractRef.current(closest);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onBlur = () => {
      keysRef.current = {};
      touchMoveRef.current = { x: 0, z: 0, jump: false, descend: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let hudTimer = 0;
    let currentNearestId: string | null = null;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
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
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      const tRef = threeRef.current;
      if (!tRef) return;
      const ps = playerStateRef.current;
      const wId = profileRef.current.openWorld.currentWorld;
      const wCfg = WORLDS[wId];
      const flightMode = wCfg.explorationMode === 'flight';
      const craftSpec =
        SPACECRAFT_CATALOG.find((c) => c.id === profileRef.current.openWorld.selectedSpacecraft) ||
        SPACECRAFT_CATALOG[0];

      let horizSpeed = 0;
      let isSprinting = false;

      // Update autonomous Mars patrol rover first so dynamic collision matches its exact position
      _dynamicColliders.length = 0;
      const spatialGrid = tRef.worldHandles?.spatialGrid ?? null;

      if (!flightMode && tRef.worldHandles?.patrolRover && wId === 'mars') {
        const orbitAngle = elapsed * 0.14;
        const rx = Math.cos(orbitAngle) * 24;
        const rz = Math.sin(orbitAngle) * 24;
        const ry = groundHeightAt('mars', rx, rz);
        tRef.worldHandles.patrolRover.position.set(rx, ry, rz);
        tRef.worldHandles.patrolRover.rotation.y = -orbitAngle;
        _dynamicColliders.push(
          makeCylinderCollider('mars-patrol-rover', rx, rz, ry - 0.2, ry + 1.85, 1.35, false, 'vehicle')
        );
      }

      if (!flightMode && !ps.inRover && tRef.worldHandles?.drivableRover && wId !== 'station') {
        const parkedY = getSupportHeightAt(
          wId,
          ps.roverX,
          ps.y,
          ps.roverZ,
          0.8,
          0.85,
          groundHeightAt,
          spatialGrid
        );
        _dynamicColliders.push(
          makeBoxCollider(
            'player-parked-rover',
            ps.roverX,
            ps.roverZ,
            parkedY - 0.2,
            parkedY + 2.15,
            1.22,
            1.46,
            ps.roverYaw,
            false,
            'vehicle'
          )
        );
      }

      if (!modalPausedRef.current) {
        const k = keysRef.current;
        let inForward = 0;
        let inRight = 0;
        if (k['KeyW'] || k['ArrowUp']) inForward += 1;
        if (k['KeyS'] || k['ArrowDown']) inForward -= 1;
        if (k['KeyD'] || k['ArrowRight']) inRight += 1;
        if (k['KeyA'] || k['ArrowLeft']) inRight -= 1;

        inForward += touchMoveRef.current.z;
        inRight += touchMoveRef.current.x;

        const wantsSprint = Boolean(k['ShiftLeft'] || k['ShiftRight']);

        if (flightMode) {
          // =====================================================================
          // 3D SPACECRAFT ATMOSPHERIC / RING FLIGHT PHYSICS WITH 3D CCD
          // =====================================================================
          tRef.astronaut.root.visible = false;
          tRef.craftGroup.visible = true;

          const isBoosting = wantsSprint && Math.abs(inForward) > 0.05 && ps.stamina > 2;
          if (isBoosting) {
            isSprinting = true;
            ps.stamina = Math.max(0, ps.stamina - 18 * dt);
          } else {
            ps.stamina = Math.min(100, ps.stamina + 20 * dt);
          }

          const maxFlightSpeed = (isBoosting ? 36 : 24) * craftSpec.speedMultiplier;
          const targetSpeed = inForward > 0.05 ? maxFlightSpeed : inForward < -0.05 ? -10 : 0;
          ps.craftSpeed = THREE.MathUtils.damp(ps.craftSpeed, targetSpeed, 4.5, dt);

          // Steer heading smoothly & bank wings into turns
          ps.yaw -= inRight * 1.95 * dt;
          const targetBank = THREE.MathUtils.clamp(-inRight * 0.42, -0.42, 0.42);
          ps.bankAngle = THREE.MathUtils.damp(ps.bankAngle, targetBank, 8, dt);

          let climb = 0;
          if (k['Space'] || k['KeyR'] || touchMoveRef.current.jump) climb += 1;
          if (k['KeyQ'] || k['KeyC'] || touchMoveRef.current.descend) climb -= 1;
          ps.vy = THREE.MathUtils.damp(ps.vy, climb * 11.5, 6, dt);

          const sinHeading = Math.sin(ps.yaw);
          const cosHeading = Math.cos(ps.yaw);
          const flightRes = resolveFlightMovementWithCCD({
            x: ps.x,
            y: ps.y,
            z: ps.z,
            vx: sinHeading * ps.craftSpeed,
            vy: ps.vy,
            vz: cosHeading * ps.craftSpeed,
            dt,
            radius: 1.95,
            minY: 3.0,
            maxY: 28.0,
            maxWorldRadius: 180,
            spatialGrid,
          });

          ps.x = flightRes.x;
          ps.y = flightRes.y;
          ps.z = flightRes.z;
          ps.vy = flightRes.vy;
          if (flightRes.collided) {
            ps.craftSpeed = flightRes.vx * sinHeading + flightRes.vz * cosHeading;
          }

          horizSpeed = Math.hypot(ps.craftSpeed, ps.vy);

          // Smooth camera chase behind flying spacecraft
          if (Math.abs(ps.craftSpeed) > 2.5) {
            const targetCamYaw = ps.yaw + Math.PI;
            let camDiff = targetCamYaw - ps.camYaw;
            while (camDiff > Math.PI) camDiff -= Math.PI * 2;
            while (camDiff < -Math.PI) camDiff += Math.PI * 2;
            ps.camYaw += camDiff * Math.min(1, dt * 2.2);
          }

          const hoverBob = Math.sin(elapsed * 2.4) * 0.14;
          tRef.craftGroup.position.set(ps.x, ps.y + hoverBob, ps.z);
          tRef.craftGroup.rotation.order = 'YXZ';
          tRef.craftGroup.rotation.y = ps.yaw;
          tRef.craftGroup.rotation.x = THREE.MathUtils.clamp(-ps.vy * 0.032, -0.35, 0.35);
          tRef.craftGroup.rotation.z = ps.bankAngle;

          // Pulse thruster flame scale by thrust speed
          const flameScale = 0.65 + (Math.abs(ps.craftSpeed) / 36) * 0.95;
          tRef.craftGroup.traverse((child) => {
            if (child.name === 'thrusterFlame') {
              child.scale.set(1, flameScale, 1);
            }
          });
        } else if (ps.inRover && tRef.worldHandles?.drivableRover) {
          // =====================================================================
          // DRIVABLE 6x6 ROVER PHYSICS WITH SWEPT CCD COLLISION
          // =====================================================================
          tRef.craftGroup.visible = false;
          const isBoosting = wantsSprint && Math.abs(inForward) > 0.05 && ps.stamina > 2;
          if (isBoosting) {
            isSprinting = true;
            ps.stamina = Math.max(0, ps.stamina - 20 * dt);
          } else {
            ps.stamina = Math.min(100, ps.stamina + 18 * dt);
          }

          const maxFwd = isBoosting ? 31 : 23;
          const accel = inForward > 0 ? 28 : inForward < 0 ? 22 : 0;
          if (Math.abs(inForward) > 0.05) {
            ps.roverSpeed += inForward * accel * dt;
            ps.roverSpeed = THREE.MathUtils.clamp(ps.roverSpeed, -11, maxFwd);
          } else {
            ps.roverSpeed = THREE.MathUtils.damp(ps.roverSpeed, 0, 5.5, dt);
          }

          if (k['Space'] || touchMoveRef.current.jump) {
            ps.roverSpeed = THREE.MathUtils.damp(ps.roverSpeed, 0, 12, dt);
            touchMoveRef.current.jump = false;
          }

          const steerFactor = ps.roverSpeed < -0.5 ? -1 : 1;
          ps.roverYaw -= inRight * steerFactor * 2.15 * dt;

          const sinR = Math.sin(ps.roverYaw);
          const cosR = Math.cos(ps.roverYaw);
          const roverRes = resolveSurfaceMovementWithCCD({
            worldId: wId,
            x: ps.roverX,
            y: ps.y,
            z: ps.roverZ,
            vx: sinR * ps.roverSpeed,
            vz: cosR * ps.roverSpeed,
            vy: 0,
            dt,
            radius: 1.45,
            height: 2.1,
            stepHeight: 0.78,
            maxWorldRadius: 280,
            spatialGrid,
            dynamicColliders: _dynamicColliders,
            terrainHeight: groundHeightAt,
          });

          ps.roverX = roverRes.x;
          ps.roverZ = roverRes.z;
          if (roverRes.collided) {
            ps.roverSpeed = roverRes.vx * sinR + roverRes.vz * cosR;
          }

          ps.x = ps.roverX;
          ps.z = ps.roverZ;
          ps.yaw = ps.roverYaw;
          horizSpeed = Math.abs(ps.roverSpeed);

          if (horizSpeed > 3) {
            const targetCamYaw = ps.roverYaw + Math.PI;
            let camDiff = targetCamYaw - ps.camYaw;
            while (camDiff > Math.PI) camDiff -= Math.PI * 2;
            while (camDiff < -Math.PI) camDiff += Math.PI * 2;
            ps.camYaw += camDiff * Math.min(1, dt * 1.4);
          }

          if (horizSpeed > 6 && Math.random() < 0.45) {
            const backX = ps.roverX - sinR * 1.4;
            const backZ = ps.roverZ - cosR * 1.4;
            spawnFxParticle(
              backX,
              ps.y + 0.18,
              backZ,
              (Math.random() - 0.5) * 1.5,
              0.6 + Math.random() * 0.7,
              (Math.random() - 0.5) * 1.5
            );
          }
        } else {
          // =====================================================================
          // ASTRONAUT SURFACE WALK / JUMP / SLOPE + SWEPT CCD COLLISION
          // =====================================================================
          tRef.craftGroup.visible = false;
          _forwardVec.set(-Math.sin(ps.camYaw), 0, -Math.cos(ps.camYaw));
          _rightVec.set(Math.cos(ps.camYaw), 0, -Math.sin(ps.camYaw));
          _moveVec.set(0, 0, 0).addScaledVector(_forwardVec, inForward).addScaledVector(_rightVec, inRight);

          const movingNow = _moveVec.lengthSq() > 0.01;
          if (wantsSprint && movingNow && ps.stamina > 2) {
            isSprinting = true;
            ps.stamina = Math.max(0, ps.stamina - 22 * dt);
          } else {
            ps.stamina = Math.min(100, ps.stamina + 18 * dt);
          }

          const baseWalk = wId === 'station' ? 7.8 : wId === 'earth' ? 7.4 : 7.2;
          const targetSpeed = isSprinting ? baseWalk * 1.62 : baseWalk;
          let targetVx = 0;
          let targetVz = 0;

          if (movingNow) {
            _moveVec.normalize();
            targetVx = _moveVec.x * targetSpeed;
            targetVz = _moveVec.z * targetSpeed;
          }

          const accel = ps.grounded ? (isSprinting ? 48.0 : 36.0) : 11.0;
          const friction = ps.grounded ? (movingNow ? 14.0 : 9.5) : 1.2;

          if (movingNow) {
            ps.vx = THREE.MathUtils.damp(ps.vx, targetVx, accel, dt);
            ps.vz = THREE.MathUtils.damp(ps.vz, targetVz, accel, dt);
          } else {
            ps.vx = THREE.MathUtils.damp(ps.vx, 0, friction, dt);
            ps.vz = THREE.MathUtils.damp(ps.vz, 0, friction, dt);
          }

          const eps = 0.45;
          const hR = groundHeightAt(wId, ps.x + eps, ps.z);
          const hL = groundHeightAt(wId, ps.x - eps, ps.z);
          const hD = groundHeightAt(wId, ps.x, ps.z + eps);
          const hU = groundHeightAt(wId, ps.x, ps.z - eps);
          const slopeGradX = (hR - hL) / (2 * eps);
          const slopeGradZ = (hD - hU) / (2 * eps);
          const slopeSteepness = Math.hypot(slopeGradX, slopeGradZ);

          if (ps.grounded && slopeSteepness > 0.62) {
            const slideForce = Math.min(1.0, (slopeSteepness - 0.62) * 2.2) * (wCfg.gravityAccel * 0.72);
            ps.vx -= (slopeGradX / (slopeSteepness + 0.001)) * slideForce * dt;
            ps.vz -= (slopeGradZ / (slopeSteepness + 0.001)) * slideForce * dt;
          }

          const astroRes = resolveSurfaceMovementWithCCD({
            worldId: wId,
            x: ps.x,
            y: ps.y,
            z: ps.z,
            vx: ps.vx,
            vz: ps.vz,
            vy: ps.vy,
            dt,
            radius: 0.48,
            height: 1.85,
            stepHeight: 0.28,
            maxWorldRadius: 280,
            spatialGrid,
            dynamicColliders: _dynamicColliders,
            terrainHeight: groundHeightAt,
          });

          ps.x = astroRes.x;
          ps.z = astroRes.z;
          ps.vx = astroRes.vx;
          ps.vz = astroRes.vz;
          if (astroRes.hitRoof) ps.vy = Math.min(0, astroRes.vy);
          horizSpeed = Math.hypot(ps.vx, ps.vz);

          if (horizSpeed > 0.4) {
            const targetYaw = Math.atan2(ps.vx, ps.vz);
            let diff = targetYaw - ps.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            ps.yaw += diff * Math.min(1, dt * 11);

            const targetBank = THREE.MathUtils.clamp(-diff * horizSpeed * 0.07, -0.2, 0.2);
            ps.bankAngle = THREE.MathUtils.damp(ps.bankAngle, targetBank, 9, dt);
          } else {
            ps.bankAngle = THREE.MathUtils.damp(ps.bankAngle, 0, 7, dt);
          }

          if (ps.grounded && horizSpeed > 0.8) {
            ps.stepTimer += dt;
            if (ps.stepTimer > (isSprinting ? 0.22 : 0.32)) {
              ps.stepTimer = 0;
              soundEngine.playStep();
            }
          }

          if ((k['Space'] || touchMoveRef.current.jump) && ps.grounded) {
            ps.vy = wCfg.jumpForce;
            ps.grounded = false;
            touchMoveRef.current.jump = false;
            soundEngine.playThrust();
            for (let p = 0; p < 5; p++) {
              spawnFxParticle(
                ps.x + (Math.random() - 0.5) * 0.4,
                ps.y + 0.45,
                ps.z + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2.0,
                -0.4 + Math.random() * 1.1,
                (Math.random() - 0.5) * 2.0
              );
            }
          }
        }
      }

      if (!flightMode) {
        const floorY = getSupportHeightAt(
          wId,
          ps.x,
          ps.y,
          ps.z,
          ps.inRover ? 0.8 : 0.32,
          ps.inRover ? 0.78 : 0.28,
          groundHeightAt,
          spatialGrid,
          _dynamicColliders
        );
        if (ps.inRover) {
          ps.y = floorY;
          ps.vy = 0;
          ps.grounded = true;
        } else if (ps.grounded && ps.vy <= 0 && ps.y >= floorY && ps.y - floorY <= 0.12) {
          // Stick smoothly to downhill slopes without triggering airborne jitter
          ps.y = floorY;
          ps.vy = 0;
        } else if (!ps.grounded || ps.y > floorY + 0.12) {
          ps.grounded = false;
          ps.vy -= wCfg.gravityAccel * dt;
          ps.y += ps.vy * dt;
          const postFloorY = getSupportHeightAt(
            wId,
            ps.x,
            ps.y,
            ps.z,
            0.32,
            0.28,
            groundHeightAt,
            spatialGrid,
            _dynamicColliders
          );
          if (ps.y <= postFloorY) {
            ps.y = postFloorY;
            if (ps.vy < -3.6) {
              ps.impactRecoil = Math.min(0.38, Math.abs(ps.vy) * 0.035);
              soundEngine.playStep();
            }
            ps.vy = 0;
            ps.grounded = true;
          }
        } else {
          ps.y = floorY;
        }

        if (!ps.inRover) {
          tRef.astronaut.root.visible = true;
          const heightAboveGround = Math.max(0, ps.y - floorY);
          tRef.astronaut.root.position.set(ps.x, ps.y, ps.z);
          tRef.astronaut.root.rotation.order = 'YXZ';
          tRef.astronaut.root.rotation.y = ps.yaw;
          tRef.astronaut.root.rotation.z = ps.bankAngle;
          updateAstronautAnimation(
            tRef.astronaut,
            dt,
            horizSpeed,
            ps.grounded,
            isSprinting,
            heightAboveGround
          );
        }
      }

      const floorYRef = flightMode
        ? 0
        : getSupportHeightAt(
            wId,
            ps.x,
            ps.y,
            ps.z,
            0.32,
            0.3,
            groundHeightAt,
            spatialGrid,
            _dynamicColliders
          );

      // Sync drivable 6x6 rover transform
      if (!flightMode && tRef.worldHandles?.drivableRover) {
        const rHandle = tRef.worldHandles.drivableRover;
        const ry = getSupportHeightAt(wId, ps.roverX, ps.y, ps.roverZ, 0.8, 0.85, groundHeightAt, spatialGrid);
        rHandle.group.position.set(ps.roverX, ry, ps.roverZ);
        rHandle.group.rotation.order = 'YXZ';
        rHandle.group.rotation.y = ps.roverYaw;

        const sinY = Math.sin(ps.roverYaw);
        const cosY = Math.cos(ps.roverYaw);
        const hFront = groundHeightAt(wId, ps.roverX + sinY * 1.1, ps.roverZ + cosY * 1.1);
        const hBack = groundHeightAt(wId, ps.roverX - sinY * 1.1, ps.roverZ - cosY * 1.1);
        const hLeft = groundHeightAt(wId, ps.roverX + cosY * 0.9, ps.roverZ - sinY * 0.9);
        const hRight = groundHeightAt(wId, ps.roverX - cosY * 0.9, ps.roverZ + sinY * 0.9);
        rHandle.group.rotation.x = Math.atan2(hBack - hFront, 2.2);
        rHandle.group.rotation.z = Math.atan2(hRight - hLeft, 1.8);

        if (ps.inRover && Math.abs(ps.roverSpeed) > 0.05) {
          for (const w of rHandle.wheels) {
            w.rotation.x += ps.roverSpeed * dt * 2.2;
          }
        }

        tRef.roverSpot.intensity = ps.inRover ? 22 : 6;
        tRef.roverSpot.position.set(ps.roverX + sinY * 1.45, ry + 1.05, ps.roverZ + cosY * 1.45);
        tRef.roverSpot.target.position.set(
          ps.roverX + sinY * 14,
          groundHeightAt(wId, ps.roverX + sinY * 14, ps.roverZ + cosY * 14),
          ps.roverZ + cosY * 14
        );
      } else {
        tRef.roverSpot.intensity = 0;
      }

      // Advance zero-GC FX particle pool
      let poolDirty = false;
      for (let i = 0; i < POOL_COUNT; i++) {
        if (poolLife[i] > 0) {
          poolLife[i] -= dt;
          const i3 = i * 3;
          if (poolLife[i] <= 0) {
            poolPos[i3 + 1] = -999;
          } else {
            poolPos[i3] += poolVel[i3] * dt;
            poolPos[i3 + 1] += poolVel[i3 + 1] * dt;
            poolPos[i3 + 2] += poolVel[i3 + 2] * dt;
            poolVel[i3 + 1] -= 1.2 * dt;
          }
          poolDirty = true;
        }
      }
      if (poolDirty) poolPosAttr.needsUpdate = true;

      tRef.jetLight.position.set(ps.x, ps.y + 0.8, ps.z);
      tRef.jetLight.intensity = !flightMode && ps.grounded ? 0 : 2.2;

      const sunDir = getSunDirection(wId);
      tRef.keyLight.position.set(
        ps.x + sunDir.x * 38,
        ps.y + sunDir.y * 38,
        ps.z + sunDir.z * 38
      );
      tRef.keyLight.target.position.set(ps.x, ps.y, ps.z);

      // 2. Third-Person Damped Camera + Orbital Globe View
      if (orbitalViewRef.current) {
        const orbitAng = elapsed * 0.16;
        const cx = Math.cos(orbitAng) * 110;
        const cz = Math.sin(orbitAng) * 110;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, cx, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 44, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cz, 6, dt);
        camera.lookAt(0, flightMode ? 12 : 0, 0);
      } else {
        ps.camDist = THREE.MathUtils.damp(ps.camDist, ps.targetCamDist, 7, dt);
        ps.camPitch = THREE.MathUtils.damp(ps.camPitch, ps.targetCamPitch, 7, dt);

        const targetFov = flightMode
          ? isSprinting
            ? 70
            : 63
          : ps.inRover
          ? isSprinting
            ? 68
            : 63
          : isSprinting
          ? 64
          : 58;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 7, dt);
          camera.updateProjectionMatrix();
        }

        const cosPitch = Math.cos(ps.camPitch);
        const sinPitch = Math.sin(ps.camPitch);
        _camDesired.set(
          ps.x + Math.sin(ps.camYaw) * cosPitch * ps.camDist,
          ps.y + (flightMode ? 1.8 : ps.inRover ? 2.35 : 1.85) + sinPitch * ps.camDist,
          ps.z + Math.cos(ps.camYaw) * cosPitch * ps.camDist
        );
        if (!flightMode) {
          const camGround = Math.max(floorYRef, groundHeightAt(wId, _camDesired.x, _camDesired.z)) + 0.95;
          if (_camDesired.y < camGround) _camDesired.y = camGround;
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camDesired.x, 11, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camDesired.y, 11, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camDesired.z, 11, dt);

        ps.impactRecoil = THREE.MathUtils.damp(ps.impactRecoil, 0, 7.5, dt);
        _camTarget.set(
          ps.x,
          ps.y + (flightMode ? 0.85 : ps.inRover ? 1.55 : 1.42) - ps.impactRecoil,
          ps.z
        );
        camera.lookAt(_camTarget);
      }

      // 3. Animate Interactive Probes, Pickups, Cloud Layer, Patrol Rover & Atmosphere Particles
      if (tRef.worldHandles) {
        const disc = profileRef.current.openWorld.discoveredNodes;
        const solved = profileRef.current.openWorld.solvedInvestigations;

        for (const h of tRef.worldHandles.nodeHandles) {
          if (h.animatedPart) {
            h.animatedPart.rotation.y = elapsed * 0.72;
          }
          const isSolved = h.node.investigationId
            ? solved.includes(h.node.investigationId)
            : false;
          const isDisc = disc.includes(h.node.id);
          const hexColor = isSolved ? 0x10b981 : isDisc ? 0xf59e0b : 0x22d3ee;

          const ringMat = h.beaconRing.material as THREE.MeshBasicMaterial;
          ringMat.color.setHex(hexColor);
          const pulse = 1 + 0.08 * Math.sin(elapsed * 3.2);
          h.beaconRing.scale.set(pulse, pulse, 1);

          const beamMat = h.beaconBeam.material as THREE.MeshBasicMaterial;
          beamMat.color.setHex(hexColor);
          beamMat.opacity = isSolved ? 0.07 : 0.24;

          const orb = tRef.worldHandles.effectMeshes[h.node.id] as THREE.Mesh | undefined;
          if (orb) {
            orb.rotation.y = elapsed * 1.9;
            orb.position.y = 3.6 + Math.sin(elapsed * 2.6) * 0.14;
            const orbMat = orb.material as THREE.MeshStandardMaterial;
            orbMat.color.setHex(isSolved ? 0x10b981 : 0x22d3ee);
            orbMat.emissive.setHex(isSolved ? 0x10b981 : 0x22d3ee);
          }
        }

        // Collectible floating sample pickups collision & animation
        for (const pHandle of tRef.worldHandles.pickupMeshes) {
          if (!pHandle.mesh.visible) continue;
          pHandle.mesh.rotation.y = elapsed * 2.1;
          pHandle.mesh.position.y = (pHandle.mesh.userData.baseY as number) + Math.sin(elapsed * 3.0) * 0.22;

          const dist = flightMode
            ? Math.hypot(
                pHandle.pickup.x - ps.x,
                pHandle.mesh.position.y - ps.y,
                pHandle.pickup.z - ps.z
              )
            : Math.hypot(pHandle.pickup.x - ps.x, pHandle.pickup.z - ps.z);

          if (dist <= (flightMode ? 5.2 : 3.2)) {
            pHandle.mesh.visible = false;
            soundEngine.playSuccess();
            onCollectPickupRef.current(pHandle.pickup);
            showToast(`+20 XP · Collected ${pHandle.pickup.title}!`);
          }
        }

        if (tRef.worldHandles.rotatingArray) {
          for (const arr of tRef.worldHandles.rotatingArray) {
            arr.rotation.y = elapsed * 0.22;
          }
        }

        if (tRef.worldHandles.dustPoints && tRef.worldHandles.dustVelocities) {
          const pAttr = tRef.worldHandles.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
          const vArr = tRef.worldHandles.dustVelocities;
          const pos = pAttr.array as Float32Array;
          const count = pos.length / 3;
          const gustWave = Math.sin(elapsed * 0.55);

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const px = pos[i3];
            const pz = pos[i3 + 2];
            let dx = vArr[i3];
            let dy = vArr[i3 + 1];
            let dz = vArr[i3 + 2];

            if (wId === 'mars') {
              const marsWind = 4.4 + gustWave * 2.2;
              dx += marsWind;
              dz += marsWind * 0.4;
            } else if (wId === 'jupiter') {
              const radial = Math.hypot(px, pz) + 4.0;
              dx += (-pz / radial) * 5.6 + Math.sin(pz * 0.1 + elapsed * 0.5) * 3.0;
              dz += (px / radial) * 5.6;
            } else if (wId === 'saturn') {
              const radial = Math.hypot(px, pz) + 6.0;
              dx += (-pz / radial) * 4.0 + 1.0;
              dz += (px / radial) * 4.0;
            } else if (wId === 'neptune') {
              dx += 10.5;
              dz += 2.5;
            } else if (wId === 'uranus') {
              dx += 3.4;
              dy += Math.sin(elapsed * 0.8 + px * 0.06) * 1.8;
            }

            pos[i3] += dx * dt;
            pos[i3 + 1] += dy * dt;
            pos[i3 + 2] += dz * dt;

            if (pos[i3] > 80) pos[i3] = -80;
            if (pos[i3] < -80) pos[i3] = 80;
            if (pos[i3 + 1] > 28) pos[i3 + 1] = 1;
            if (pos[i3 + 1] < 0.5) pos[i3 + 1] = 24;
            if (pos[i3 + 2] > 80) pos[i3 + 2] = -80;
            if (pos[i3 + 2] < -80) pos[i3 + 2] = 80;
          }
          pAttr.needsUpdate = true;
        }

        if (tRef.worldHandles.planetBackdrop) {
          tRef.worldHandles.planetBackdrop.rotation.y = elapsed * 0.014;
        }
        if (tRef.worldHandles.cloudLayer) {
          const cl = tRef.worldHandles.cloudLayer;
          const tex = cl.userData.cloudTexture as THREE.Texture | undefined;
          if (tex) {
            tex.offset.x += (cl.userData.cloudSpeedX as number) * dt;
            tex.offset.y += (cl.userData.cloudSpeedY as number) * dt;
          } else {
            cl.rotation.y = elapsed * 0.008;
          }
        }
        if (tRef.worldHandles.skyDome?.userData.skyUniforms?.uTime) {
          tRef.worldHandles.skyDome.userData.skyUniforms.uTime.value = elapsed;
        }
        if (tRef.worldHandles.skyOrbiters) {
          for (const skyBody of tRef.worldHandles.skyOrbiters) {
            skyBody.rotation.y += dt * 0.04;
          }
        }
      }

      // 4. Proximity Check + Radar Minimap (~10Hz)
      hudTimer += dt;
      if (hudTimer >= 0.1 && tRef.worldHandles) {
        hudTimer = 0;
        let closest: WorldInteractiveNode | null = null;
        let bestDist = flightMode ? 9.5 : ps.inRover ? 6.5 : 5.2;
        const disc = profileRef.current.openWorld.discoveredNodes;
        const solved = profileRef.current.openWorld.solvedInvestigations;
        const blips: RadarBlip[] = [];

        const cosCam = Math.cos(-ps.camYaw);
        const sinCam = Math.sin(-ps.camYaw);
        const radarScale = 38 / 82;

        for (const h of tRef.worldHandles.nodeHandles) {
          const dxWorld = h.node.x - ps.x;
          const dzWorld = h.node.z - ps.z;
          const ny = h.node.y ?? groundHeightAt(wId, h.node.x, h.node.z);
          const dist = flightMode
            ? Math.hypot(dxWorld, ny - ps.y, dzWorld)
            : Math.hypot(dxWorld, dzWorld);

          if (dist < bestDist) {
            bestDist = dist;
            closest = h.node;
          }

          const rotX = dxWorld * cosCam - dzWorld * sinCam;
          const rotY = dxWorld * sinCam + dzWorld * cosCam;
          const bx = THREE.MathUtils.clamp(rotX * radarScale, -36, 36);
          const by = THREE.MathUtils.clamp(rotY * radarScale, -36, 36);
          const isSolved = h.node.investigationId ? solved.includes(h.node.investigationId) : false;
          const isDisc = disc.includes(h.node.id);
          blips.push({
            id: h.node.id,
            dx: bx,
            dy: by,
            status: isSolved ? 'solved' : isDisc ? 'scanned' : 'unscanned',
          });
        }

        if (!flightMode && !ps.inRover && wId !== 'station') {
          const rdx = ps.roverX - ps.x;
          const rdz = ps.roverZ - ps.z;
          const rRotX = rdx * cosCam - rdz * sinCam;
          const rRotY = rdx * sinCam + rdz * cosCam;
          setRoverBlip({
            dx: THREE.MathUtils.clamp(rRotX * radarScale, -36, 36),
            dy: THREE.MathUtils.clamp(rRotY * radarScale, -36, 36),
          });
          setNearRover(Math.hypot(rdx, rdz) <= 5.2);
        } else {
          setRoverBlip(null);
          setNearRover(false);
        }

        setRadarBlips(blips);
        setStaminaPct(Math.round(ps.stamina));
        setSpeedReadout(Math.round(horizSpeed * 3.6));
        setAltitudeReadout(Math.round(ps.y));
        setCompassDeg(Math.round(((ps.camYaw * 180) / Math.PI) % 360));

        const nextId = closest ? closest.id : null;
        if (nextId !== currentNearestId) {
          currentNearestId = nextId;
          setNearbyNode(closest);
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    if (isSoftwareGl) {
      frameId = window.setTimeout(tick, 16);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      dom.removeEventListener('webglcontextlost', onContextLost);
      dom.removeEventListener('webglcontextrestored', onContextRestored);

      if (threeRef.current?.worldHandles) {
        scene.remove(threeRef.current.worldHandles.worldGroup);
        disposeObjectTree(threeRef.current.worldHandles.worldGroup);
      }
      disposeObjectTree(astronaut.root);
      disposeObjectTree(craftGroup);
      poolGeo.dispose();
      poolMat.map?.dispose();
      poolMat.dispose();
      renderer.dispose();
      if (dom.parentNode === container) {
        container.removeChild(dom);
      }
      threeRef.current = null;
    };
  }, [avatar.accentColor, cycleCameraPreset, showToast]);

  // Swap 3D World Environment cleanly when worldId changes
  useEffect(() => {
    const tRef = threeRef.current;
    if (!tRef) return;
    const cfg = WORLDS[worldId];
    const flight = cfg.explorationMode === 'flight';

    if (tRef.worldHandles) {
      tRef.scene.remove(tRef.worldHandles.worldGroup);
      disposeObjectTree(tRef.worldHandles.worldGroup);
    }

    const sunDir = applyWorldLighting(
      worldId,
      tRef.scene,
      tRef.hemiLight,
      tRef.keyLight,
      tRef.bounceLight,
      tRef.poolMat
    );

    const newHandles = buildWorldEnvironment(
      worldId,
      tRef.maxAnisotropy,
      profileRef.current.openWorld.discoveredNodes,
      profileRef.current.openWorld.solvedInvestigations,
      sunDir,
      profileRef.current.openWorld.collectedPickups
    );
    tRef.scene.add(newHandles.worldGroup);
    tRef.worldHandles = newHandles;

    playerStateRef.current.inRover = false;
    playerStateRef.current.roverX = 6.5;
    playerStateRef.current.roverZ = 10;
    playerStateRef.current.roverYaw = -0.35;
    playerStateRef.current.roverSpeed = 0;
    playerStateRef.current.craftSpeed = 0;

    tRef.astronaut.root.visible = !flight;
    tRef.craftGroup.visible = flight;
    setInRover(false);
    setNearRover(false);

    if (flight) {
      playerStateRef.current.x = 0;
      playerStateRef.current.z = 19.5;
      playerStateRef.current.y = 12.5;
      playerStateRef.current.vx = 0;
      playerStateRef.current.vz = 0;
      playerStateRef.current.vy = 0;
      playerStateRef.current.yaw = Math.PI;
      playerStateRef.current.targetCamDist = 10.5;
      showToast(`Atmospheric flight in ${cfg.name}! Steer with WASD, climb Space / dive Q.`);
    } else {
      const initGroundY = groundHeightAt(worldId, 0, 5);
      const spawnY = getSupportHeightAt(
        worldId,
        0,
        initGroundY + 2.0,
        5,
        0.32,
        2.0,
        groundHeightAt,
        newHandles.spatialGrid
      );
      playerStateRef.current.x = 0;
      playerStateRef.current.z = 5;
      playerStateRef.current.y = spawnY;
      playerStateRef.current.vx = 0;
      playerStateRef.current.vz = 0;
      playerStateRef.current.vy = 0;
      playerStateRef.current.grounded = true;
      playerStateRef.current.targetCamDist = CAMERA_PRESET_CONFIG[cameraPreset].dist;
      showToast(`Landed at ${cfg.name} (${cfg.gravityMs2} m/s² gravity).`);
    }
    setNearbyNode(null);
  }, [worldId, cameraPreset, showToast]);

  const worldNodesHere = WORLD_NODES.filter((n) => n.worldId === worldId && n.investigationId);
  const solvedHereCount = SCIENTIFIC_INVESTIGATIONS.filter(
    (inv) =>
      inv.worldId === worldId && profile.openWorld.solvedInvestigations.includes(inv.id)
  ).length;
  const totalWorldInvs = SCIENTIFIC_INVESTIGATIONS.filter((inv) => inv.worldId === worldId).length;
  const worldPickupsHere = WORLD_PICKUPS.filter((p) => p.worldId === worldId);
  const collectedHereCount = worldPickupsHere.filter((p) =>
    profile.openWorld.collectedPickups.includes(p.id)
  ).length;

  const activeCraftSpec =
    SPACECRAFT_CATALOG.find((c) => c.id === profile.openWorld.selectedSpacecraft) ||
    SPACECRAFT_CATALOG[0];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050914] select-none">
      {/* Isolated WebGL Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Graceful fallback if WebGL is unavailable */}
      {webglError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070B19] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-slate-700 bg-[#0D1428] p-6">
            <h2 className="font-display text-xl font-bold text-white">
              3D Graphics Context Paused
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Your browser paused WebGL rendering. Switch to the Training Simulators Hub or reload
              the page to restore 3D exploration.
            </p>
            <button
              type="button"
              onClick={() => onNavigateScreen('DASHBOARD')}
              className="mt-4 min-h-[44px] rounded-xl bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950"
            >
              Open Training Simulators
            </button>
          </div>
        </div>
      )}

      {/* Non-occluding Compact Aerospace Visor HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-2 sm:p-2.5">
        {/* Top-Left Visor Telemetry Strip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-800 bg-[#060913]/90 px-2.5 py-1 shadow-lg">
          <img
            src={avatar.imageUrl}
            alt={profile.name}
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 rounded-md border border-cyan-400/60 bg-slate-900 object-cover"
          />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
              <span className="truncate font-display">{profile.name}</span>
              <span className="font-mono text-cyan-300 tabular-nums">Lv.{rank.level}</span>
              <span
                className={`hidden sm:inline font-mono text-[9px] ${
                  isFlightMode ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                · {isFlightMode ? 'FLIGHT' : 'SURFACE'}
              </span>
            </div>
            <div className="truncate font-mono text-[10px] text-slate-300 tabular-nums">
              {worldCfg.name} · {worldCfg.gravityMs2} m/s² · {profile.openWorld.xp} XP
            </div>
          </div>
        </div>

        {/* Top-Right Grouped Segmented Visor Consoles */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          {/* Primary Exploration Group */}
          <div className="flex items-center divide-x divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-[#060913]/90 shadow-lg">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStarMapOpen(true);
              }}
              className="inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-slate-950 whitespace-nowrap"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Star Map</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setPlanetGuideOpen(true);
              }}
              className="inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400 hover:text-slate-950 whitespace-nowrap"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setAiWrongNote(undefined);
                setAiOpen((v) => !v);
              }}
              className={`inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                aiOpen
                  ? 'bg-violet-500 text-white'
                  : 'text-violet-200 hover:bg-violet-500 hover:text-white'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>ARIA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigateScreen('DASHBOARD');
              }}
              className="inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden md:inline">Hub</span>
            </button>
          </div>

          {/* Utility Group */}
          <div className="flex items-center divide-x divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-[#060913]/90 shadow-lg">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setOrbitalView((prev) => !prev);
              }}
              className={`inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                orbitalView
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden lg:inline">{orbitalView ? 'Surface' : 'Orbit'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setInventoryOpen(true);
              }}
              className="inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap tabular-nums"
            >
              <Backpack className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Pack ({profile.openWorld.inventory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setNasaOpen(true);
              }}
              className="inline-flex min-h-[30px] items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap"
            >
              <Globe className="h-3.5 w-3.5 text-blue-300" />
              <span className="hidden xl:inline">NASA</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="flex min-h-[30px] min-w-[30px] items-center justify-center text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mission Notification Toast */}
      {toast && (
        <div className="pointer-events-none absolute top-13 left-1/2 z-20 -translate-x-1/2 px-3">
          <div className="rounded-lg border border-cyan-400/50 bg-[#060913]/92 px-3 py-1.5 text-center font-mono text-[11px] font-medium text-cyan-100 shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Calibrated Corner Tactical Radar + Telemetry Readout */}
      {!dockCollapsed && (
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 hidden flex-col items-center gap-1 md:flex">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-cyan-400/50 bg-[#060913]/88 shadow-lg">
            <svg viewBox="-44 -44 88 88" className="h-full w-full">
              <circle cx="0" cy="0" r="38" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line x1="-38" y1="0" x2="38" y2="0" stroke="#1e293b" strokeWidth="0.6" />
              <line x1="0" y1="-38" x2="0" y2="38" stroke="#1e293b" strokeWidth="0.6" />
              <g transform={`rotate(${compassDeg})`}>
                <text
                  x="0"
                  y="-33"
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize="6.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  N
                </text>
                <text x="33" y="2" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">
                  E
                </text>
                <text x="0" y="38" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">
                  S
                </text>
                <text x="-33" y="2" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">
                  W
                </text>
              </g>
              {roverBlip && (
                <rect
                  x={roverBlip.dx - 2.6}
                  y={roverBlip.dy - 2.6}
                  width="5.2"
                  height="5.2"
                  rx="1"
                  fill="#fb923c"
                />
              )}
              {radarBlips.map((b) => (
                <circle
                  key={b.id}
                  cx={b.dx}
                  cy={b.dy}
                  r="3.1"
                  fill={
                    b.status === 'solved'
                      ? '#10b981'
                      : b.status === 'scanned'
                        ? '#f59e0b'
                        : '#22d3ee'
                  }
                />
              ))}
              <polygon points="0,-5 4,4 0,2 -4,4" fill="#ffffff" />
            </svg>
          </div>
          <div className="h-1.5 w-16 overflow-hidden rounded border border-slate-800 bg-[#060913]/90 p-[1px]">
            <div
              style={{ width: `${staminaPct}%` }}
              className="h-full rounded-[1px] bg-emerald-400 transition-all duration-100"
            />
          </div>
          {(isFlightMode || inRover || speedReadout > 4) && (
            <span className="rounded border border-slate-800 bg-[#060913]/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-200 tabular-nums">
              {speedReadout} km/h{isFlightMode ? ` · ${altitudeReadout}m` : inRover ? ' · ROVER' : ''}
            </span>
          )}
        </div>
      )}

      {/* Interactive Proximity Prompts */}
      {(nearbyNode || nearRover || inRover) && !activeInvestigationId && (
        <div className="pointer-events-auto absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
          {nearbyNode && (
            <button
              type="button"
              onClick={() => handleInteractNode(nearbyNode)}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-cyan-300 whitespace-nowrap"
            >
              <ScanLine className="h-3.5 w-3.5" />
              <span>[E] {nearbyNode.shortPrompt}</span>
            </button>
          )}
          {!isFlightMode && (nearRover || inRover) && (
            <button
              type="button"
              onClick={toggleRoverDrive}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-orange-400 whitespace-nowrap"
            >
              <Car className="h-3.5 w-3.5" />
              <span>{inRover ? '[F] Exit Rover' : '[F] Drive Rover'}</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile Touch Movement & Flight Controls */}
      <div className="pointer-events-auto absolute bottom-14 left-2.5 z-20 flex md:hidden items-end gap-1.5">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            type="button"
            aria-label="Move Forward"
            onPointerDown={() => (touchMoveRef.current.z = 1)}
            onPointerUp={() => (touchMoveRef.current.z = 0)}
            onPointerLeave={() => (touchMoveRef.current.z = 0)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1224]/90 text-white touch-none"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <div />
          <button
            type="button"
            aria-label="Move Left"
            onPointerDown={() => (touchMoveRef.current.x = -1)}
            onPointerUp={() => (touchMoveRef.current.x = 0)}
            onPointerLeave={() => (touchMoveRef.current.x = 0)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1224]/90 text-white touch-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move Backward"
            onPointerDown={() => (touchMoveRef.current.z = -1)}
            onPointerUp={() => (touchMoveRef.current.z = 0)}
            onPointerLeave={() => (touchMoveRef.current.z = 0)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1224]/90 text-white touch-none"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move Right"
            onPointerDown={() => (touchMoveRef.current.x = 1)}
            onPointerUp={() => (touchMoveRef.current.x = 0)}
            onPointerLeave={() => (touchMoveRef.current.x = 0)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1224]/90 text-white touch-none"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onPointerDown={() => (touchMoveRef.current.jump = true)}
            onPointerUp={() => (touchMoveRef.current.jump = false)}
            onPointerLeave={() => (touchMoveRef.current.jump = false)}
            className="flex h-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-[#0B1224]/90 px-2.5 text-[11px] font-bold text-cyan-300 touch-none"
          >
            <Rocket className="mr-1 h-3 w-3" />
            {isFlightMode ? 'Climb' : 'Jump'}
          </button>
          {isFlightMode && (
            <button
              type="button"
              onPointerDown={() => (touchMoveRef.current.descend = true)}
              onPointerUp={() => (touchMoveRef.current.descend = false)}
              onPointerLeave={() => (touchMoveRef.current.descend = false)}
              className="flex h-9 items-center justify-center rounded-lg border border-amber-500/40 bg-[#0B1224]/90 px-2.5 text-[11px] font-bold text-amber-300 touch-none"
            >
              Dive
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Compact Bottom Control & Performance Dock */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 w-fit max-w-[94vw] -translate-x-1/2">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-t-md border border-b-0 border-slate-800 bg-[#060913]/90 px-2.5 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white"
          >
            {dockCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{dockCollapsed ? 'Show HUD' : 'Hide HUD'}</span>
          </button>
        </div>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#060913]/90 px-3 py-1 text-[11px] shadow-lg">
            <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <FlaskConical className="h-3.5 w-3.5 text-cyan-300" />
                <span>
                  Missions {solvedHereCount}/{totalWorldInvs}
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-700">
                |
              </span>
              <span className="text-[10px] text-emerald-300">
                Samples {collectedHereCount}/{worldPickupsHere.length}
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-slate-700">
                |
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-400">
                Nodes{' '}
                {worldNodesHere.filter((n) => profile.openWorld.discoveredNodes.includes(n.id)).length}/
                {worldNodesHere.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleCameraPreset}
                className="inline-flex min-h-[26px] items-center gap-1 rounded-md border border-slate-800 bg-[#0C1222] px-2 py-0.5 font-mono text-[10px] text-slate-200 transition-colors hover:border-cyan-400 whitespace-nowrap"
              >
                <Camera className="h-3 w-3 text-cyan-300" />
                <span>[V] {CAMERA_PRESET_CONFIG[cameraPreset].label}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCrispQuality((q) => !q);
                }}
                className={`inline-flex min-h-[26px] items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] whitespace-nowrap transition-colors ${
                  crispQuality
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                }`}
              >
                <Gauge className="h-3 w-3" />
                <span>{crispQuality ? 'HD' : 'Fast'}</span>
              </button>

              <span className="hidden lg:inline font-mono text-[10px] text-slate-400 whitespace-nowrap">
                {isFlightMode
                  ? 'WASD Fly · Space Climb · Q Dive · E Scan'
                  : `WASD · Shift Sprint · ${worldId === 'station' ? 'Space Jump' : 'F Rover / Space Jump'} · E Scan`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stylized Interplanetary Warp / Travel Transition Overlay */}
      {travelTarget && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040814]/95 p-6 text-center">
          <div className="max-w-lg rounded-2xl border border-cyan-400/50 bg-[#0B1224] p-7 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 animate-bounce">
              <Rocket className="h-8 w-8" />
            </div>
            <div className="mt-4 text-xs font-mono uppercase tracking-widest text-cyan-300">
              {activeCraftSpec.name} · Interplanetary Transfer
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              Traveling to {WORLDS[travelTarget].name}
            </h2>
            <p className="mt-2 text-xs font-mono text-amber-300">
              {WORLDS[travelTarget].explorationMode === 'flight'
                ? 'Entering Atmospheric Spacecraft Flight Mode (No Solid Ground)'
                : `Preparing Landing · Gravity ${WORLDS[travelTarget].gravityMs2} m/s²`}
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#070B19] p-3.5 text-xs leading-relaxed text-slate-200">
              <span className="font-bold text-cyan-300">Science Brief: </span>
              {WORLDS[travelTarget].planetFacts.funFacts[0]}
            </div>
          </div>
        </div>
      )}

      {/* [I] In-World Planet Guide Modal */}
      {planetGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/85 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1222] p-5 text-slate-100 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-emerald-300">
                    {isFlightMode ? 'Atmospheric Spacecraft Flight' : 'Planetary Surface Guide'}
                  </div>
                  <h2 className="font-display text-xl font-bold text-white">{worldCfg.name}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlanetGuideOpen(false)}
                aria-label="Close Planet Guide"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-[#080D1A] text-slate-300 hover:border-cyan-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Hairline-Divided Telemetry Matrix */}
            <div className="mt-4 grid grid-cols-1 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-[#080D1A] sm:grid-cols-2 sm:divide-x">
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Distance from Sun
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {worldCfg.planetFacts.distanceFromSun}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Temperature
                </div>
                <div className="mt-1 text-sm font-bold text-amber-300">
                  {worldCfg.planetFacts.temperature}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Gravity
                </div>
                <div className="mt-1 text-sm font-bold text-cyan-300">
                  {worldCfg.planetFacts.gravity}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Length of a Day
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {worldCfg.planetFacts.dayLength}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Moons
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {worldCfg.planetFacts.moonsCount}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Surface &amp; Atmosphere
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-200">
                  {worldCfg.planetFacts.surfaceType}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-[#080D1A] p-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                Amazing Facts
              </h3>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-200">
                {worldCfg.planetFacts.funFacts.map((f, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-bold text-cyan-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>
                Reward Badge on Completion:{' '}
                <strong className="text-amber-300">{worldCfg.badgeTitle}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPlanetGuideOpen(false);
                  setStarMapOpen(true);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap"
              >
                <Compass className="h-4 w-4" />
                <span>Open Star Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      {activeInvestigationId && (
        <InvestigationModal
          investigationId={activeInvestigationId}
          profile={profile}
          onClose={() => setActiveInvestigationId(null)}
          onSolveInvestigation={onSolveInvestigation}
          onCompleteFollowUp={onCompleteFollowUp}
          onOpenAiHelp={(wrongReason) => {
            setAiWrongNote(wrongReason);
            setAiOpen(true);
          }}
        />
      )}

      {aiOpen && (
        <AiAssistantDrawer
          profile={profile}
          activeInvestigationId={activeInvestigationId}
          initialPromptNote={aiWrongNote}
          onClose={() => setAiOpen(false)}
          onHintUsed={onHintUsed}
        />
      )}

      {starMapOpen && (
        <StarMapModal
          currentWorld={worldId}
          profile={profile}
          onSelectWorld={launchToWorld}
          onSelectSpacecraft={(craftId) => {
            soundEngine.playClick();
            onSelectSpacecraft(craftId);
          }}
          onToggleSandboxUnlock={() => {
            soundEngine.playClick();
            onToggleSandboxUnlock();
          }}
          onClose={() => setStarMapOpen(false)}
        />
      )}

      {inventoryOpen && (
        <InventoryModal profile={profile} onClose={() => setInventoryOpen(false)} />
      )}

      {nasaOpen && (
        <NasaArchiveModal
          initialTopic={worldCfg.nasaTopic}
          onClose={() => setNasaOpen(false)}
        />
      )}

      <BottomLeftRankWidget
        profile={profile}
        onOpenRanks={() => onNavigateScreen('RANKS_REWARDS')}
      />
    </div>
  );
}
