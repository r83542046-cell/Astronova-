import * as THREE from 'three';
import { WorldId } from '../../types/game';

export interface TerrainPbrMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2d(ix, iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix, iy + 1);
  const d = hash2d(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

/**
 * Generates high-resolution 1024x1024 paired Albedo + Sobel-derived Normal Map + Roughness Map
 * for realistic close-up & grazing-angle lighting across planetary regolith and aerospace hulls.
 */
export function createTerrainPbrMaps(worldId: WorldId, maxAnisotropy: number): TerrainPbrMaps {
  const size = 256;
  const heightField = new Float32Array(size * size);

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  if (worldId === 'station') {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const tileX = x % 64;
        const tileY = y % 64;
        const isSeam = tileX < 2 || tileY < 2 || tileX > 61 || tileY > 61;
        const isRivet =
          (tileX === 6 || tileX === 57) && (tileY === 6 || tileY === 57);
        const isHazard =
          y >= 246 && y <= 266 && Math.floor((x + y) / 14) % 2 === 0;
        const isVentSlot =
          tileX > 22 && tileX < 42 && tileY > 9 && tileY < 15 && tileX % 4 < 2;

        const brush = (fbm(x * 0.25, y * 0.05, 2) - 0.5) * 20;
        const microWear = (hash2d(x, y) - 0.5) * 8;
        let r = 36 + brush + microWear;
        let g = 49 + brush + microWear;
        let b = 72 + brush + microWear;
        let rough = 102;
        let h = 0.56 + brush * 0.004;

        if (isHazard) {
          r = 228;
          g = 162;
          b = 26;
          rough = 132;
          h = 0.6;
        } else if (isSeam) {
          r = 12;
          g = 19;
          b = 32;
          rough = 205;
          h = 0.12;
        } else if (isVentSlot) {
          r = 16;
          g = 24;
          b = 38;
          rough = 190;
          h = 0.22;
        } else if (isRivet) {
          r = 165;
          g = 180;
          b = 200;
          rough = 48;
          h = 0.88;
        } else if (tileX > 13 && tileX < 51 && tileY > 18 && tileY < 51) {
          r += 9;
          g += 12;
          b += 16;
          rough = 78;
          h = 0.65;
        }

        heightField[y * size + x] = h;
        aImg.data[idx] = Math.max(0, Math.min(255, r));
        aImg.data[idx + 1] = Math.max(0, Math.min(255, g));
        aImg.data[idx + 2] = Math.max(0, Math.min(255, b));
        aImg.data[idx + 3] = 255;

        rImg.data[idx] = rough;
        rImg.data[idx + 1] = rough;
        rImg.data[idx + 2] = rough;
        rImg.data[idx + 3] = 255;
      }
    }
  } else {
    const isMars = worldId === 'mars';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;
        const wind = Math.sin(nx * Math.PI * 16 + Math.sin(ny * Math.PI * 8) * 1.4) * 0.5 + 0.5;
        const ridge = Math.cos(ny * Math.PI * 8 + Math.sin(nx * Math.PI * 5) * 1.0) * 0.5 + 0.5;
        const n1 = fbm(nx * 12, ny * 12, 2);
        const grit = hash2d(x, y);
        const pebbleMask = grit > 0.965 ? 0.28 : 0;

        const h =
          n1 * 0.6 +
          wind * (isMars ? 0.24 : 0.08) +
          ridge * (isMars ? 0.08 : 0.12) +
          grit * 0.08 +
          pebbleMask;
        heightField[y * size + x] = h;

        let r: number;
        let g: number;
        let b: number;
        let rough: number;

        if (worldId === 'earth') {
          const isGrass = h > 0.36;
          if (isGrass) {
            r = 38 + h * 36 + (grit - 0.5) * 16;
            g = 124 + h * 54 + (grit - 0.5) * 22;
            b = 32 + h * 22 + (grit - 0.5) * 12;
            rough = Math.round(212 - h * 30);
          } else {
            r = 74 + h * 24 + (grit - 0.5) * 18;
            g = 58 + h * 18 + (grit - 0.5) * 14;
            b = 42 + h * 14 + (grit - 0.5) * 12;
            rough = Math.round(236 - h * 26);
          }
        } else if (isMars) {
          const rockPatch = pebbleMask > 0 ? -24 : 0;
          r = 124 + h * 76 + (grit - 0.5) * 22 + rockPatch;
          g = 55 + h * 44 + (grit - 0.5) * 15 + rockPatch * 0.7;
          b = 33 + h * 26 + (grit - 0.5) * 10 + rockPatch * 0.4;
          rough = Math.round(220 - h * 42);
        } else if (worldId === 'venus') {
          r = 112 + h * 72 + (grit - 0.5) * 20;
          g = 62 + h * 44 + (grit - 0.5) * 14;
          b = 20 + h * 18 + (grit - 0.5) * 10;
          rough = Math.round(218 - h * 38);
        } else if (worldId === 'mercury') {
          const base = 58 + h * 72 + (grit - 0.5) * 24;
          r = base + 4;
          g = base + 2;
          b = base;
          rough = Math.round(238 - h * 42);
        } else if (worldId === 'jupiter') {
          r = 152 + h * 68 + wind * 24;
          g = 104 + h * 52 + wind * 18;
          b = 64 + h * 36;
          rough = Math.round(190 - h * 35);
        } else if (worldId === 'saturn') {
          r = 172 + h * 54 + wind * 18;
          g = 144 + h * 48 + wind * 16;
          b = 82 + h * 34;
          rough = Math.round(188 - h * 32);
        } else if (worldId === 'uranus') {
          r = 46 + h * 48;
          g = 146 + h * 68;
          b = 164 + h * 64;
          rough = Math.round(170 - h * 36);
        } else if (worldId === 'neptune') {
          r = 26 + h * 42;
          g = 72 + h * 58;
          b = 178 + h * 66;
          rough = Math.round(168 - h * 38);
        } else {
          const base = 74 + h * 94 + (grit - 0.5) * 26 - (pebbleMask > 0 ? 18 : 0);
          r = base;
          g = base + 3;
          b = base + 8;
          rough = Math.round(234 - h * 46);
        }

        aImg.data[idx] = Math.max(0, Math.min(255, r));
        aImg.data[idx + 1] = Math.max(0, Math.min(255, g));
        aImg.data[idx + 2] = Math.max(0, Math.min(255, b));
        aImg.data[idx + 3] = 255;

        rImg.data[idx] = Math.max(40, Math.min(255, rough));
        rImg.data[idx + 1] = Math.max(40, Math.min(255, rough));
        rImg.data[idx + 2] = Math.max(40, Math.min(255, rough));
        rImg.data[idx + 3] = 255;
      }
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  // Sobel Height-to-Normal conversion
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);
  const strength = worldId === 'station' ? 3.5 : 3.2;

  const sampleH = (px: number, py: number) => {
    const wx = ((px % size) + size) % size;
    const wy = ((py % size) + size) % size;
    return heightField[wy * size + wx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = sampleH(x - 1, y - 1);
      const t = sampleH(x, y - 1);
      const tr = sampleH(x + 1, y - 1);
      const l = sampleH(x - 1, y);
      const r = sampleH(x + 1, y);
      const bl = sampleH(x - 1, y + 1);
      const b = sampleH(x, y + 1);
      const br = sampleH(x + 1, y + 1);

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);
      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);

      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const repeat = worldId === 'station' ? 38 : 42;
  const aniso = Math.min(4, maxAnisotropy);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat, repeat);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.anisotropy = aniso;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat, repeat);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = aniso;

  return { map, normalMap, roughnessMap };
}

/**
 * Injects photorealistic world-space macro-variation, slope-driven rock stratification,
 * and close-up mineral micro-relief into MeshStandardMaterial while preserving full PBR
 * lighting, directional shadows, and horizon fog.
 */
export function applyRealisticTerrainShader(
  material: THREE.MeshStandardMaterial,
  worldId: WorldId
) {
  if (worldId === 'station') return;

  const cliffHexMap: Partial<Record<WorldId, string>> = {
    earth: 'vec3(0.42, 0.44, 0.48)',
    mars: 'vec3(0.36, 0.15, 0.09)',
    venus: 'vec3(0.45, 0.22, 0.06)',
    mercury: 'vec3(0.24, 0.25, 0.29)',
    moon: 'vec3(0.28, 0.31, 0.36)',
  };
  const cliffColorExpr = cliffHexMap[worldId] || 'vec3(0.30, 0.32, 0.36)';

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vTerrainWorldPos;
         varying vec3 vTerrainWorldNormal;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vTerrainWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vTerrainWorldPos;
         varying vec3 vTerrainWorldNormal;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float slope = clamp(1.0 - abs(vTerrainWorldNormal.y), 0.0, 1.0);
         float cliffMask = smoothstep(0.16, 0.44, slope);
         diffuseColor.rgb = mix(diffuseColor.rgb, ${cliffColorExpr}, cliffMask * 0.72);
         ${
           worldId === 'earth'
             ? `if (vTerrainWorldPos.y < -0.6) {
                  float damp = smoothstep(-0.6, -1.8, vTerrainWorldPos.y);
                  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.14, 0.22, 0.18), damp * 0.6);
                }`
             : ''
         }`
      );
  };
}

export interface EarthPbrMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

export type SolarPlanetId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

/**
 * Generates paired Earth Albedo + Ocean-Specular Roughness + Night-Side City Lights maps.
 */
export function createEarthPbrMaps(maxAnisotropy: number): EarthPbrMaps {
  const w = 512;
  const h = 256;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(w, h);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(w, h);

  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = w;
  nightCanvas.height = h;
  const nCtx = nightCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * Math.PI;
    const polar = Math.abs(lat) > 1.2;
    const temperate = Math.abs(lat) < 1.05;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const u = (x / w) * 6.5;
      const v = (y / h) * 3.5;
      const continent = fbm(u + 2.1, v + 1.3, 3);
      const ridge = fbm(u * 3.4 + 1.1, v * 3.4 + 2.8, 2);

      let r = 8;
      let g = 42;
      let b = 118;
      let rough = 46; // Specular ocean water (~0.18 roughness)
      let cityGlow = 0;

      if (polar) {
        r = 234;
        g = 243;
        b = 252;
        rough = 195;
      } else if (continent > 0.53) {
        const arid = continent > 0.67 ? 1 : 0;
        const mtn = ridge > 0.6 ? 1.18 : 0.92;
        r = (arid ? 158 : 40) * mtn;
        g = (arid ? 130 : 108) * mtn;
        b = (arid ? 82 : 52) * mtn;
        rough = 218; // Matte land (~0.85 roughness)

        // Coastal/temperate metropolitan clusters on night side
        if (temperate && continent < 0.65) {
          const urbanCluster = fbm(u * 6.2 + 4.3, v * 6.2 + 1.7, 2);
          if (urbanCluster > 0.66 && hash2d(x * 1.7, y * 1.7) > 0.58) {
            cityGlow = Math.min(255, (urbanCluster - 0.66) * 1100);
          }
        }
      } else {
        const shelf = Math.pow(continent / 0.53, 2.2);
        r = 6 + shelf * 22;
        g = 36 + shelf * 78;
        b = 110 + shelf * 92;
      }

      aImg.data[idx] = Math.min(255, Math.round(r));
      aImg.data[idx + 1] = Math.min(255, Math.round(g));
      aImg.data[idx + 2] = Math.min(255, Math.round(b));
      aImg.data[idx + 3] = 255;

      rImg.data[idx] = rough;
      rImg.data[idx + 1] = rough;
      rImg.data[idx + 2] = rough;
      rImg.data[idx + 3] = 255;

      nImg.data[idx] = cityGlow;
      nImg.data[idx + 1] = Math.round(cityGlow * 0.76);
      nImg.data[idx + 2] = Math.round(cityGlow * 0.34);
      nImg.data[idx + 3] = 255;
    }
  }
  aCtx.putImageData(aImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);
  nCtx.putImageData(nImg, 0, 0);

  const aniso = Math.min(8, maxAnisotropy);
  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = aniso;

  const emissiveMap = new THREE.CanvasTexture(nightCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = aniso;

  return { map, roughnessMap, emissiveMap };
}

/**
 * Masks Earth's night-side emissive city lights so they glow only away from the Sun.
 */
export function applyEarthNightLightsShader(
  material: THREE.MeshStandardMaterial,
  sunDir: THREE.Vector3
) {
  const dir = sunDir.clone().normalize();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDirPlanet = { value: dir };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vPlanetWorldNormal;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vPlanetWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uSunDirPlanet;
         varying vec3 vPlanetWorldNormal;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float sunDot = dot(normalize(vPlanetWorldNormal), normalize(uSunDirPlanet));
         float nightMask = smoothstep(0.14, -0.22, sunDot);
         totalEmissiveRadiance *= nightMask;`
      );
  };
}

export function createEarthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const { map, roughnessMap, emissiveMap } = createEarthPbrMaps(maxAnisotropy);
  roughnessMap.dispose();
  emissiveMap.dispose();
  return map;
}

/**
 * Generates high-detail procedural equirectangular textures for Solar System planets & moons.
 */
export function createPlanetTexture(
  planetId: SolarPlanetId,
  maxAnisotropy: number
): THREE.CanvasTexture {
  if (planetId === 'earth') {
    return createEarthTexture(maxAnisotropy);
  }

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    const lat = (ny - 0.5) * Math.PI;
    const absLat = Math.abs(lat);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const nx = x / w;
      let r = 180;
      let g = 180;
      let b = 180;

      if (planetId === 'sun') {
        const gran = fbm(nx * 24, ny * 12, 4);
        const flare = fbm(nx * 9 + 2, ny * 5 + 1, 3);
        const spot = flare < 0.34 ? 0.55 : 1.0;
        r = Math.min(255, (235 + gran * 40) * spot);
        g = Math.min(255, (145 + gran * 95) * spot);
        b = Math.min(255, (32 + gran * 65) * spot);
      } else if (planetId === 'mercury') {
        const n = fbm(nx * 14, ny * 7, 4);
        const c = Math.sin(nx * 36 + n * 5) * Math.cos(ny * 20 - n * 4);
        const crater = c > 0.62 ? -24 : c < -0.58 ? 22 : 0;
        const base = 105 + n * 65 + crater + (hash2d(x, y) - 0.5) * 12;
        r = base + 5;
        g = base + 2;
        b = base - 2;
      } else if (planetId === 'venus') {
        const chevron = Math.sin(nx * Math.PI * 2 + Math.cos(ny * Math.PI) * 1.6) * 0.2;
        const bands = fbm(nx * 5 + chevron, ny * 14, 4);
        r = 212 + bands * 38;
        g = 172 + bands * 42;
        b = 98 + bands * 35;
      } else if (planetId === 'moon') {
        const maria = fbm(nx * 5.2 + 1.4, ny * 3.1 + 0.8, 5);
        const detail = fbm(nx * 22, ny * 12, 3);
        const isMaria = maria < 0.48;
        const base = isMaria ? 64 + detail * 38 : 138 + detail * 68;
        r = base;
        g = base + 2;
        b = base + 6;
      } else if (planetId === 'mars') {
        const terrain = fbm(nx * 8 + 3.1, ny * 4.5 + 1.2, 5);
        const basalt = terrain < 0.44 ? 0.72 : 1.0;
        const canyon = Math.exp(-Math.pow((ny - 0.54) / 0.045, 2)) * (nx > 0.35 && nx < 0.65 ? 0.65 : 1.0);
        const iceCap = absLat > 1.33 - terrain * 0.08;
        if (iceCap) {
          r = 242;
          g = 238;
          b = 235;
        } else {
          const factor = basalt * (canyon || 1.0);
          r = (165 + terrain * 68) * factor;
          g = (78 + terrain * 42) * factor;
          b = (46 + terrain * 24) * factor;
        }
      } else if (planetId === 'jupiter') {
        const eddy = fbm(nx * 14, ny * 10, 4) * 0.07;
        const yBand = ny + eddy;
        const belt = Math.sin(yBand * Math.PI * 16) * 0.5 + 0.5;
        const storm = fbm(nx * 24 + eddy * 8, ny * 14, 3);
        r = 165 + belt * 65 + (storm - 0.5) * 26;
        g = 115 + belt * 78 + (storm - 0.5) * 20;
        b = 82 + belt * 64 + (storm - 0.5) * 16;

        // Great Red Spot at southern tropical belt
        const dx = (nx - 0.58) / 0.075;
        const dy = (ny - 0.63) / 0.052;
        const dSpot = dx * dx + dy * dy;
        if (dSpot < 1.0) {
          const swirl = 1.0 - dSpot;
          r = r * (1 - swirl) + 214 * swirl;
          g = g * (1 - swirl) + 86 * swirl;
          b = b * (1 - swirl) + 52 * swirl;
        }
      } else if (planetId === 'saturn') {
        const eddy = fbm(nx * 8, ny * 8, 3) * 0.03;
        const belt = Math.sin((ny + eddy) * Math.PI * 18) * 0.5 + 0.5;
        r = 198 + belt * 42;
        g = 176 + belt * 38;
        b = 126 + belt * 32;
      } else if (planetId === 'uranus') {
        const band = Math.sin(ny * Math.PI * 8) * 8;
        r = 128 + band;
        g = 216 + band;
        b = 228 + band;
      } else {
        // Neptune deep azure storms + bright methane cirrus streaks
        const eddy = fbm(nx * 10, ny * 8, 4);
        const streak = eddy > 0.68 ? (eddy - 0.68) * 240 : 0;
        r = 34 + streak;
        g = 86 + eddy * 45 + streak;
        b = 205 + eddy * 40 + streak * 0.4;
      }

      img.data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      img.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      img.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Overlay crisp impact craters with shadowed bowls & sunlit rims for rocky moons/planets
  if (planetId === 'moon' || planetId === 'mercury' || planetId === 'mars') {
    const craterCount = planetId === 'mars' ? 28 : 72;
    for (let i = 0; i < craterCount; i++) {
      const cx = hash2d(i * 3.1, 1.7) * w;
      const cy = (0.12 + hash2d(i * 5.7, 2.9) * 0.76) * h;
      const rad = (planetId === 'mars' ? 4 : 3) + hash2d(i * 7.3, 4.1) * (w * 0.042);

      // Sunlit bright ejecta rim
      ctx.strokeStyle =
        planetId === 'mars' ? 'rgba(235, 148, 102, 0.34)' : 'rgba(232, 240, 250, 0.48)';
      ctx.lineWidth = Math.max(1.2, rad * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();

      // Shadowed inner crater bowl
      const bowl = ctx.createRadialGradient(
        cx - rad * 0.18,
        cy - rad * 0.18,
        rad * 0.1,
        cx,
        cy,
        rad * 0.92
      );
      bowl.addColorStop(0, planetId === 'mars' ? 'rgba(65, 22, 12, 0.42)' : 'rgba(28, 34, 46, 0.52)');
      bowl.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bowl;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.92, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, maxAnisotropy);
  return tex;
}

/**
 * Generates an authentic photovoltaic solar cell wafer array texture with metallic silver grid fingers
 * and gold busbars for orbital station solar wings and rovers.
 */
export function createSolarPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, '#0a1e5c');
  grad.addColorStop(0.5, '#133185');
  grad.addColorStop(1, '#0b2266');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  const cols = 8;
  const rows = 16;
  const cw = s / cols;
  const ch = s / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const shade = 0.85 + hash2d(col + 3, r + 9) * 0.3;
      ctx.fillStyle = `rgba(${Math.round(18 * shade)}, ${Math.round(56 * shade)}, ${Math.round(165 * shade)}, 0.45)`;
      ctx.fillRect(col * cw + 2, r * ch + 2, cw - 4, ch - 4);
    }
  }

  // Fine silver collector fingers
  ctx.strokeStyle = 'rgba(148, 197, 255, 0.32)';
  ctx.lineWidth = 1;
  for (let y = 0; y < s; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y);
    ctx.stroke();
  }

  // Heavy structural cell dividers + gold-copper busbars
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
  ctx.lineWidth = 2;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cw, 0);
    ctx.lineTo(i * cw, s);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(245, 194, 78, 0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * ch);
    ctx.lineTo(s, i * ch);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, maxAnisotropy);
  return tex;
}

/**
 * Generates radial translucent ice/dust bands for Saturn's rings including the Cassini Division.
 */
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 32;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1); // 0 = inner edge, 1 = outer edge
    let alpha = 0;
    let tint = 0.85;

    if (t > 0.08 && t < 0.25) {
      // C-ring (faint dusty)
      alpha = 0.25 * Math.sin(((t - 0.08) / 0.17) * Math.PI);
      tint = 0.72;
    } else if (t >= 0.25 && t < 0.6) {
      // B-ring (dense, bright icy)
      const ripple = 0.78 + 0.22 * Math.sin(t * 140);
      alpha = 0.92 * ripple;
      tint = 0.96;
    } else if (t >= 0.6 && t < 0.66) {
      // Cassini Division gap
      alpha = 0.06;
    } else if (t >= 0.66 && t < 0.94) {
      // A-ring (translucent finely striated)
      const ripple = 0.72 + 0.28 * Math.sin(t * 210);
      const encke = Math.abs(t - 0.86) < 0.01 ? 0.15 : 1.0;
      alpha = 0.68 * ripple * encke;
      tint = 0.86;
    }

    const r = Math.round(234 * tint);
    const g = Math.round(212 * tint);
    const b = Math.round(176 * tint);
    const a = Math.round(Math.max(0, Math.min(255, alpha * 255)));

    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an irregular cratered asteroid-moon geometry (like Phobos & Deimos).
 */
export function createIrregularMoonGeometry(radius: number, seedOffset = 0): THREE.IcosahedronGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const len = Math.hypot(vx, vy, vz) || 1;
    const nx = vx / len;
    const ny = vy / len;
    const nz = vz / len;
    const bump =
      0.86 +
      0.18 * Math.sin(nx * 4.2 + seedOffset) * Math.cos(ny * 3.8 - seedOffset) +
      0.08 * Math.sin(nz * 8.5 + nx * 6.0);
    pos.setXYZ(i, vx * bump * 1.18, vy * bump * 0.88, vz * bump);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an independent rotating alpha-blended cloud layer texture for Orbital Earth.
 */
export function createEarthCloudsTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const u = (x / w) * 8.0;
      const v = (y / h) * 4.5;
      const swirl = Math.sin(u * 1.4 + v * 2.1) * 0.14;
      const c = fbm(u + swirl + 7.2, v + 3.4, 3);
      const alpha = c > 0.5 ? Math.min(240, Math.round((c - 0.5) * 620)) : 0;
      img.data[idx] = 248;
      img.data[idx + 1] = 251;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAnisotropy);
  return tex;
}

/**
 * Generates a procedural chevron-tread bump/normal texture for 6x6 rover tires.
 */
export function createTireTreadTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e5e5e5';
  for (let y = 0; y < h; y += 20) {
    ctx.fillRect(10, y, w * 0.42, 10);
    ctx.fillRect(w * 0.52, y + 10, w * 0.42, 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Generates a subtle woven thermal-fabric bump texture for the astronaut suit.
 */
export function createSuitFabricTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const idx = (y * s + x) * 4;
      const weave = ((x % 4 < 2 ? 1 : 0) ^ (y % 4 < 2 ? 1 : 0)) ? 185 : 105;
      img.data[idx] = weave;
      img.data[idx + 1] = weave;
      img.data[idx + 2] = weave;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Generates a per-world equirectangular reflection texture for PMREMGenerator
 * so metallic spacecraft hulls, visors, and solar panels reflect authentic world colors.
 */
export function createWorldEnvironmentTexture(worldId: WorldId): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (worldId === 'earth') {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.4, '#38bdf8');
    grad.addColorStop(0.5, '#bae6fd');
    grad.addColorStop(0.65, '#15803d');
    grad.addColorStop(1, '#064e3b');
  } else if (worldId === 'mars') {
    grad.addColorStop(0, '#1e2c4d');
    grad.addColorStop(0.36, '#a95c34');
    grad.addColorStop(0.5, '#f6b177');
    grad.addColorStop(0.66, '#7a3117');
    grad.addColorStop(1, '#2b1008');
  } else if (worldId === 'venus') {
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.38, '#b45309');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(0.68, '#78350f');
    grad.addColorStop(1, '#271104');
  } else if (worldId === 'jupiter') {
    grad.addColorStop(0, '#2b1c0c');
    grad.addColorStop(0.42, '#92400e');
    grad.addColorStop(0.5, '#fcd34d');
    grad.addColorStop(0.66, '#78350f');
    grad.addColorStop(1, '#1c1106');
  } else if (worldId === 'saturn') {
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.42, '#854d0e');
    grad.addColorStop(0.5, '#fde68a');
    grad.addColorStop(0.66, '#713f12');
    grad.addColorStop(1, '#1c1406');
  } else if (worldId === 'uranus') {
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.42, '#0e7490');
    grad.addColorStop(0.5, '#67e8f9');
    grad.addColorStop(0.66, '#155e75');
    grad.addColorStop(1, '#082f49');
  } else if (worldId === 'neptune') {
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.42, '#1e3a8a');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(0.66, '#1d4ed8');
    grad.addColorStop(1, '#091536');
  } else if (worldId === 'moon' || worldId === 'mercury') {
    grad.addColorStop(0, '#02040a');
    grad.addColorStop(0.45, '#0b1324');
    grad.addColorStop(0.5, '#4c5b75');
    grad.addColorStop(0.68, '#3f4b5e');
    grad.addColorStop(1, '#141c2b');
  } else {
    grad.addColorStop(0, '#010510');
    grad.addColorStop(0.42, '#0b224a');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(0.65, '#1d4ed8');
    grad.addColorStop(1, '#071530');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Secondary crisp horizon rim band for brushed metal & helmet visor reflections
  const rimGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.56);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(
    0.5,
    worldId === 'mars' || worldId === 'venus' || worldId === 'jupiter'
      ? 'rgba(255,214,170,0.42)'
      : 'rgba(186,230,253,0.4)'
  );
  rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, h * 0.45, w, h * 0.11);

  // Bright Sun IBL hotspot
  const sunX = w * 0.72;
  const sunY = h * 0.27;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 68);
  sunGrad.addColorStop(0, 'rgba(255, 254, 245, 1.0)');
  sunGrad.addColorStop(0.25, 'rgba(255, 226, 175, 0.85)');
  sunGrad.addColorStop(1, 'rgba(255, 226, 175, 0.0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an anamorphic sun lens glare sprite texture (core + horizontal flare).
 */
export function createSunFlareTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;

  const core = ctx.createRadialGradient(128, 128, 2, 128, 128, 122);
  core.addColorStop(0, 'rgba(255, 252, 240, 1)');
  core.addColorStop(0.18, 'rgba(255, 224, 165, 0.76)');
  core.addColorStop(0.48, 'rgba(251, 146, 60, 0.18)');
  core.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, s, s);

  const streak = ctx.createLinearGradient(0, 128, s, 128);
  streak.addColorStop(0, 'rgba(255, 220, 170, 0)');
  streak.addColorStop(0.5, 'rgba(255, 240, 210, 0.72)');
  streak.addColorStop(1, 'rgba(255, 220, 170, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, 123, s, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a soft gaussian dust/exhaust sprite texture for crisp round particles.
 */
export function createSoftParticleTexture(): THREE.CanvasTexture {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Advanced cinematic sky rendering with physical Rayleigh & Mie atmospheric scattering,
 * sunset/sunrise horizon glow, and volumetric raymarched cloud layers.
 */
export function createSkyDome(worldId: WorldId, sunDir: THREE.Vector3): THREE.Mesh {
  const skyThemes: Record<
    WorldId,
    { zenith: number; horizon: number; sun: number; scatter: number; cloudOpacity: number; cloudTint: number }
  > = {
    earth: { zenith: 0x0284c7, horizon: 0xbae6fd, sun: 0xfffaeb, scatter: 1.15, cloudOpacity: 0.48, cloudTint: 0xf8fafc },
    mars: { zenith: 0x2c3b5c, horizon: 0xe28743, sun: 0xffe4c4, scatter: 1.35, cloudOpacity: 0.42, cloudTint: 0xe88a56 },
    moon: { zenith: 0x010206, horizon: 0x080d1a, sun: 0xffffff, scatter: 0.25, cloudOpacity: 0.0, cloudTint: 0x000000 },
    mercury: { zenith: 0x010206, horizon: 0x0b101e, sun: 0xfff8dc, scatter: 0.3, cloudOpacity: 0.0, cloudTint: 0x000000 },
    station: { zenith: 0x01040f, horizon: 0x0a1936, sun: 0xfffbea, scatter: 0.45, cloudOpacity: 0.0, cloudTint: 0x000000 },
    venus: { zenith: 0x5c2d08, horizon: 0xd97706, sun: 0xfde68a, scatter: 1.5, cloudOpacity: 0.72, cloudTint: 0xf59e0b },
    jupiter: { zenith: 0x3b210d, horizon: 0xb45309, sun: 0xfef3c7, scatter: 1.2, cloudOpacity: 0.65, cloudTint: 0xfbbf24 },
    saturn: { zenith: 0x261f0b, horizon: 0xa16207, sun: 0xfef3c7, scatter: 1.05, cloudOpacity: 0.55, cloudTint: 0xfde68a },
    uranus: { zenith: 0x062d38, horizon: 0x0891b2, sun: 0xe0f2fe, scatter: 0.95, cloudOpacity: 0.5, cloudTint: 0xa5f3fc },
    neptune: { zenith: 0x06143a, horizon: 0x1d4ed8, sun: 0xdbeafe, scatter: 1.0, cloudOpacity: 0.58, cloudTint: 0x60a5fa },
  };
  const theme = skyThemes[worldId];

  const skyUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: sunDir.clone().normalize() },
    uZenithColor: { value: new THREE.Color(theme.zenith) },
    uHorizonColor: { value: new THREE.Color(theme.horizon) },
    uSunColor: { value: new THREE.Color(theme.sun) },
    uCloudTint: { value: new THREE.Color(theme.cloudTint) },
    uScatterStrength: { value: theme.scatter },
    uCloudOpacity: { value: theme.cloudOpacity },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform vec3 uCloudTint;
      uniform float uScatterStrength;
      uniform float uCloudOpacity;
      varying vec3 vWorldDir;

      float skyHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float skyNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(skyHash(i), skyHash(i + vec2(1.0, 0.0)), u.x),
          mix(skyHash(i + vec2(0.0, 1.0)), skyHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float sunDot = max(0.0, dot(dir, normalize(uSunDir)));

        float zenithFactor = clamp(dir.y * 1.25 + 0.04, 0.0, 1.0);
        vec3 baseSky = mix(uHorizonColor, uZenithColor, pow(zenithFactor, 0.52));

        float horizonGlow = pow(1.0 - abs(dir.y), 4.2) * max(0.0, uSunDir.y + 0.2);
        vec3 scatteringColor = mix(baseSky, uHorizonColor * 1.15 + vec3(0.28, 0.16, 0.06), horizonGlow * uScatterStrength * 0.45);

        if (uCloudOpacity > 0.01 && dir.y > -0.02) {
          vec2 cloudUv = dir.xz / (dir.y + 0.2) + vec2(uTime * 0.012, uTime * 0.006);
          float c1 = skyNoise(cloudUv * 2.4);
          float c2 = skyNoise(cloudUv * 5.2 + vec2(uTime * 0.008, 0.0));
          float cloudDensity = c1 * 0.65 + c2 * 0.35;
          float cloudShape = smoothstep(0.46, 0.80, cloudDensity) * smoothstep(-0.02, 0.25, dir.y);
          float sunLighting = pow(sunDot, 2.0) * 0.45 + 0.55;
          scatteringColor = mix(scatteringColor, uCloudTint * sunLighting, cloudShape * uCloudOpacity);
        }

        float corona = pow(sunDot, 12.0) * 0.55 * uScatterStrength;
        float halo = pow(sunDot, 96.0) * 1.1;
        float sunDisc = smoothstep(0.9985, 0.9996, sunDot) * 2.8;

        if (uCloudOpacity < 0.05) {
          float band = exp(-abs(dir.y - dir.x * 0.35) * 4.8);
          float nebula = skyNoise(dir.zy * 4.0 + 1.6);
          scatteringColor += mix(vec3(0.10, 0.20, 0.42), vec3(0.20, 0.12, 0.38), nebula) * band * 0.09;
        }

        scatteringColor += uSunColor * (corona + halo + sunDisc);
        gl_FragColor = vec4(scatteringColor, 1.0);
      }
    `,
  });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(480, 36, 24), mat);
  dome.renderOrder = -10;
  dome.userData.skyUniforms = skyUniforms;
  return dome;
}

/**
 * Fresnel atmospheric rim shell around Earth or distant celestial worlds.
 */
export function createAtmosphereHalo(
  radius: number,
  colorHex = 0x38a6ff,
  intensityScale = 1.35
): THREE.Mesh {
  const c = new THREE.Color(colorHex);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: c },
      uIntensityScale: { value: intensityScale },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform float uIntensityScale;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, vViewDir), 3.2);
        gl_FragColor = vec4(uRimColor, 1.0) * max(0.0, intensity) * uIntensityScale;
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 30), mat);
}

/**
 * Photorealistic Cinematic Shader Pass:
 * - Camera-velocity directional + sprint/rover radial motion blur (8-tap)
 * - Optical micro-clarity sharpening so terrain rocks & suit seams look razor sharp
 * - Subtle edge chromatic dispersion during rapid camera sweeps / turbo driving
 * - Anti-banding optical micro-grain + vignette
 */
export const CinematicGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.30 },
    uContrast: { value: 1.09 },
    uClarity: { value: 0.24 },
    uMotionVec: { value: new THREE.Vector2(0, 0) },
    uRadialSpeed: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1280, 720) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uContrast;
    uniform float uClarity;
    uniform vec2 uMotionVec;
    uniform float uRadialSpeed;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);
      float edgeMask = smoothstep(0.14, 0.72, dist);

      vec2 blurVec = uMotionVec + centered * (uRadialSpeed * edgeMask);
      float blurMag = length(blurVec);

      vec4 tex;
      if (blurMag < 0.0007) {
        tex = texture2D(tDiffuse, vUv);
      } else {
        vec2 capped = blurVec * min(1.0, 0.022 / blurMag);
        vec4 accum = vec4(0.0);
        for (int i = 0; i < 8; i++) {
          float t = (float(i) / 7.0) - 0.5;
          vec2 sampleUv = clamp(vUv + capped * t, vec2(0.001), vec2(0.999));
          accum += texture2D(tDiffuse, sampleUv);
        }
        tex = accum / 8.0;
      }

      // Optical micro-dispersion at extreme peripheral speed
      float fringe = (0.0005 + blurMag * 0.09) * edgeMask;
      if (fringe > 0.0006) {
        vec2 dir = normalize(centered + vec2(0.0001));
        float rSample = texture2D(tDiffuse, clamp(vUv + dir * fringe, vec2(0.001), vec2(0.999))).r;
        float bSample = texture2D(tDiffuse, clamp(vUv - dir * fringe, vec2(0.001), vec2(0.999))).b;
        tex.r = mix(tex.r, rSample, 0.45);
        tex.b = mix(tex.b, bSample, 0.45);
      }

      // Crisp 4-neighbor optical clarity sharpening when camera is steady
      vec3 col = tex.rgb;
      if (blurMag < 0.003) {
        vec2 px = 1.0 / max(uResolution, vec2(1.0));
        vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb;
        vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb;
        vec3 e = texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb;
        vec3 w = texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb;
        vec3 avg = (n + s + e + w) * 0.25;
        col = clamp(col + (col - avg) * uClarity, 0.0, 1.0);
      }

      // Filmic split-tone color grade (cool cosmic shadows, warm sunlit highlights)
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowTint = vec3(0.95, 0.99, 1.06);
      vec3 highlightTint = vec3(1.04, 1.01, 0.96);
      col *= mix(shadowTint, highlightTint, smoothstep(0.18, 0.82, luma));

      // Filmic contrast S-curve
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);

      // Subtle anti-banding optical film grain
      float grain = fract(sin(dot(vUv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
      col += grain * 0.01;

      // Subtle cinematic edge vignette
      float vig = smoothstep(0.42, 0.95, dist) * uVignette;
      col *= (1.0 - vig);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
    }
  `,
};

/**
 * Lightweight 3D Volumetric Cloud Layer using optimized stratified raymarching:
 * Evaluates 3D cloud density along view rays inside a high-altitude cloud slab
 * with Henyey-Greenstein forward scattering and low fragment overhead.
 */
/**
 * Ultra-lightweight stylized scrolling cloud deck using a cached 256x256 procedural CanvasTexture
 * instead of per-pixel raymarching shaders — ideal for mobile & standard laptops.
 */
export function createVolumetricCloudLayer(
  worldId: WorldId,
  _sunDir: THREE.Vector3
): THREE.Mesh {
  const cloudPalettes: Partial<
    Record<WorldId, { tint: number; opacity: number; speedX: number; speedY: number; yPos: number }>
  > = {
    earth: { tint: 0xf8fafc, opacity: 0.62, speedX: 0.012, speedY: 0.004, yPos: 46 },
    mars: { tint: 0xfdba74, opacity: 0.34, speedX: 0.024, speedY: 0.008, yPos: 44 },
    venus: { tint: 0xfbbf24, opacity: 0.78, speedX: 0.036, speedY: 0.012, yPos: 38 },
    jupiter: { tint: 0xfde68a, opacity: 0.72, speedX: 0.038, speedY: 0.006, yPos: 42 },
    saturn: { tint: 0xfef3c7, opacity: 0.65, speedX: 0.028, speedY: 0.005, yPos: 44 },
    uranus: { tint: 0xa5f3fc, opacity: 0.62, speedX: 0.022, speedY: -0.014, yPos: 42 },
    neptune: { tint: 0x93c5fd, opacity: 0.68, speedX: 0.048, speedY: 0.01, yPos: 42 },
  };
  const cfg = cloudPalettes[worldId] || cloudPalettes.earth!;

  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const idx = (y * s + x) * 4;
      const n = fbm((x / s) * 6.0, (y / s) * 6.0, 2);
      const a = n > 0.44 ? Math.min(255, Math.round((n - 0.44) * 520)) : 0;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: cfg.tint,
    transparent: true,
    opacity: cfg.opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const geo = new THREE.PlaneGeometry(680, 680, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const cloudMesh = new THREE.Mesh(geo, mat);
  cloudMesh.position.y = cfg.yPos;
  cloudMesh.renderOrder = -5;
  cloudMesh.userData.cloudSpeedX = cfg.speedX;
  cloudMesh.userData.cloudSpeedY = cfg.speedY;
  cloudMesh.userData.cloudTexture = tex;
  return cloudMesh;
}

