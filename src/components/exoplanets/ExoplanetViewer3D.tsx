import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Globe, Maximize2, Minimize2, Pause, Play, RotateCcw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { NearbyExoplanet } from '../../data/nearbyExoplanetsData';
import { soundEngine } from '../../utils/sound';

interface ExoplanetViewer3DProps {
  planet: NearbyExoplanet;
}

function generatePlanetTexture(type: NearbyExoplanet['surfaceTextureType']): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill base color
  if (type === 'cratered-red') {
    // Reddish-brown basalt terrain (Proxima b)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#5a2218');
    grad.addColorStop(0.5, '#782d20');
    grad.addColorStop(1, '#42160f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Craters and ridges
    for (let i = 0; i < 180; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = 3 + Math.random() * 24;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(35, 12, 8, 0.4)' : 'rgba(165, 75, 55, 0.25)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(215, 115, 90, 0.2)';
      ctx.stroke();
    }
  } else if (type === 'cratered-basalt') {
    // Charcoal and dark silicate regolith (Proxima d)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#21262d');
    grad.addColorStop(0.5, '#30363d');
    grad.addColorStop(1, '#161b22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 200; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = 2 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 18, 22, 0.45)' : 'rgba(80, 95, 115, 0.3)';
      ctx.fill();
    }
  } else if (type === 'sub-earth-scorched') {
    // Scorched tectonic terrain with glowing lava veins (Barnard's Star b)
    ctx.fillStyle = '#1e1410';
    ctx.fillRect(0, 0, width, height);

    // Dark crusted tectonic plates
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(40, 25, 20, 0.7)';
      ctx.fillRect(Math.random() * width, Math.random() * height, 80 + Math.random() * 120, 50 + Math.random() * 80);
    }

    // Glowing fissures
    ctx.strokeStyle = 'rgba(255, 85, 20, 0.4)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      let sx = Math.random() * width;
      let sy = Math.random() * height;
      ctx.moveTo(sx, sy);
      for (let s = 0; s < 6; s++) {
        sx += (Math.random() - 0.5) * 80;
        sy += (Math.random() - 0.5) * 50;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  } else if (type === 'temperate-water') {
    // Deep oceans & reddish-green continents (Ross 128 b, GJ 887 c)
    ctx.fillStyle = '#0f274a'; // Deep ocean
    ctx.fillRect(0, 0, width, height);

    // Continents
    ctx.fillStyle = '#6b4f3b';
    for (let c = 0; c < 12; c++) {
      const cx = (c / 12) * width + (Math.random() - 0.5) * 60;
      const cy = height * 0.2 + Math.random() * (height * 0.6);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70 + Math.random() * 90, 45 + Math.random() * 60, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coastal fringes
    ctx.fillStyle = '#2b635f';
    for (let c = 0; c < 14; c++) {
      const cx = Math.random() * width;
      const cy = height * 0.25 + Math.random() * (height * 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, 35 + Math.random() * 50, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'gas-turbulent') {
    // Zonal ammonia & methane cloud bands (Epsilon Eridani b)
    const bands = 24;
    for (let b = 0; b < bands; b++) {
      const y = (b / bands) * height;
      const h = height / bands;
      const alt = b % 4;
      if (alt === 0) ctx.fillStyle = '#8a5e3c';
      else if (alt === 1) ctx.fillStyle = '#b38258';
      else if (alt === 2) ctx.fillStyle = '#5c4028';
      else ctx.fillStyle = '#cda47b';
      ctx.fillRect(0, y, width, h);
    }

    // Great atmospheric storm oval
    ctx.fillStyle = '#a64426';
    ctx.beginPath();
    ctx.ellipse(width * 0.65, height * 0.62, 55, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#df7350';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    // Super-earth haze / thick atmosphere (GJ 887 b, Barnard's Star c)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#2c435e');
    grad.addColorStop(0.5, '#41658a');
    grad.addColorStop(1, '#1b2d42');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(120, 170, 210, 0.25)';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(0, Math.random() * height, width, 12 + Math.random() * 20);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function generateCloudsTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

  // Swirling cloud filaments
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const rx = 40 + Math.random() * 70;
    const ry = 15 + Math.random() * 30;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function ExoplanetViewer3D({ planet }: ExoplanetViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'illustration'>(
    planet.illustrationSrc ? 'illustration' : '3d'
  );
  const [isRotating, setIsRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2.8);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const ringsMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Update viewMode if planet changes and has illustration
  useEffect(() => {
    if (planet.illustrationSrc) {
      setViewMode('illustration');
    } else {
      setViewMode('3d');
    }
  }, [planet.id]);

  useEffect(() => {
    if (viewMode !== '3d' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, zoomLevel);
    cameraRef.current = camera;

    // 3. Renderer with realistic tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Starfield backdrop particles
    const starCount = 350;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 40;
      starPos[i + 1] = (Math.random() - 0.5) * 40;
      starPos[i + 2] = -10 - Math.random() * 20;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xc8d6e5, size: 0.08, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // 5. Host Star Sunlight Lighting (Calibrated to star type)
    let starLightColor = 0xffe6d0;
    if (planet.starType.includes('M')) {
      starLightColor = 0xff7b54; // Red dwarf crimson warm glow
    } else if (planet.starType.includes('K')) {
      starLightColor = 0xffb86c; // K-type orange dwarf glow
    }
    const sunLight = new THREE.DirectionalLight(starLightColor, 2.4);
    sunLight.position.set(3.5, 1.8, 2.5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0c1628, 0.35); // Ambient starlight on night side
    scene.add(ambientLight);

    // 6. Planet Mesh & Material
    const planetGeom = new THREE.SphereGeometry(1, 64, 64);
    const planetTex = generatePlanetTexture(planet.surfaceTextureType);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: planet.planetaryClass === 'Gas Giant' ? 0.4 : 0.85,
      metalness: planet.planetaryClass === 'Gas Giant' ? 0.05 : 0.15,
    });
    const planetMesh = new THREE.Mesh(planetGeom, planetMat);
    planetMeshRef.current = planetMesh;
    scene.add(planetMesh);

    // 7. Optional Cloud Deck for temperate/water worlds
    if (planet.surfaceTextureType === 'temperate-water') {
      const cloudsGeom = new THREE.SphereGeometry(1.015, 48, 48);
      const cloudsTex = generateCloudsTexture();
      const cloudsMat = new THREE.MeshStandardMaterial({
        map: cloudsTex,
        transparent: true,
        opacity: 0.65,
        blending: THREE.NormalBlending,
      });
      const cloudsMesh = new THREE.Mesh(cloudsGeom, cloudsMat);
      cloudsMeshRef.current = cloudsMesh;
      scene.add(cloudsMesh);
    }

    // 8. Optional Dust/Ring System for Gas Giants (Epsilon Eridani b)
    if (planet.planetaryClass === 'Gas Giant') {
      const ringGeom = new THREE.RingGeometry(1.35, 2.1, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xc89d7c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
        roughness: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI * 0.42;
      ringMesh.rotation.y = Math.PI * 0.08;
      ringsMeshRef.current = ringMesh;
      scene.add(ringMesh);
    }

    // 9. Atmospheric Rayleigh Rim Glow
    const atmoGeom = new THREE.SphereGeometry(1.035, 48, 48);
    const atmoColor =
      planet.surfaceTextureType === 'cratered-red'
        ? 0xff5533
        : planet.surfaceTextureType === 'temperate-water'
        ? 0x38bdf8
        : 0x94a3b8;
    const atmoMat = new THREE.MeshBasicMaterial({
      color: atmoColor,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    scene.add(atmoMesh);

    // Mouse / Touch Drag Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !planetMeshRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      planetMeshRef.current.rotation.y += dx * 0.008;
      planetMeshRef.current.rotation.x += dy * 0.008;
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += dx * 0.008;
        cloudsMeshRef.current.rotation.x += dy * 0.008;
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel((prev) => {
        const next = Math.min(4.8, Math.max(1.6, prev + e.deltaY * 0.003));
        if (cameraRef.current) cameraRef.current.position.z = next;
        return next;
      });
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isRotating && !isDraggingRef.current && planetMeshRef.current) {
        planetMeshRef.current.rotation.y += dt * 0.15;
        if (cloudsMeshRef.current) {
          cloudsMeshRef.current.rotation.y += dt * 0.18; // Differential cloud rotation
        }
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      planetGeom.dispose();
      planetMat.dispose();
      planetTex.dispose();
      atmoGeom.dispose();
      atmoMat.dispose();
      starGeom.dispose();
      starMat.dispose();
    };
  }, [viewMode, planet.id, isRotating]);

  const handleZoom = (delta: number) => {
    soundEngine.playClick();
    setZoomLevel((prev) => {
      const next = Math.min(4.8, Math.max(1.6, prev + delta));
      if (cameraRef.current) cameraRef.current.position.z = next;
      return next;
    });
  };

  const handleResetCamera = () => {
    soundEngine.playClick();
    setZoomLevel(2.8);
    if (cameraRef.current) cameraRef.current.position.set(0, 0.2, 2.8);
    if (planetMeshRef.current) planetMeshRef.current.rotation.set(0, 0, 0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#060913]">
      {/* Top HUD Controls Overlay */}
      <div className="absolute top-3 right-3 left-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0C1222]/90 p-1 backdrop-blur-md">
          {planet.illustrationSrc && (
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => {
                soundEngine.playClick();
                setViewMode('illustration');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'illustration'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Scientific Illustration</span>
            </button>
          )}

          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => {
              soundEngine.playClick();
              setViewMode('3d');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              viewMode === '3d'
                ? 'bg-cyan-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Interactive 3D Sphere</span>
          </button>
        </div>

        {viewMode === '3d' && (
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0C1222]/90 p-1 backdrop-blur-md">
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => setIsRotating((p) => !p)}
              title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
              className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {isRotating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => handleZoom(-0.5)}
              title="Zoom In"
              className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => handleZoom(0.5)}
              title="Zoom Out"
              className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={handleResetCamera}
              title="Reset View"
              className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="relative h-80 sm:h-96 w-full flex items-center justify-center">
        {viewMode === '3d' ? (
          <div
            ref={mountRef}
            className="h-full w-full cursor-grab active:cursor-grabbing select-none"
            title="Click and drag to rotate the planet. Scroll to zoom."
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-black">
            <img
              src={planet.illustrationSrc}
              alt={`${planet.name} NASA scientific illustration`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent"
            />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                  NASA Scientific Visualization
                </span>
                <div className="font-display text-base font-bold text-white drop-shadow-md">
                  {planet.name} · {planet.hostStar}
                </div>
              </div>
              <span className="font-mono text-[10px] text-amber-300/90 bg-black/60 px-2 py-0.5 rounded border border-amber-400/30">
                Scientific Illustration · Not a Photograph
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="border-t border-slate-800/90 bg-[#090F1E] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Host Star: <strong className="text-white">{planet.hostStar}</strong> ({planet.starType})
          </span>
          <span>·</span>
          <span>
            Distance: <strong className="text-yellow-300">{planet.distanceLy} ly</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Drag to inspect 360° · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
