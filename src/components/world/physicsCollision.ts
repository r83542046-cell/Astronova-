import { WorldId } from '../../types/game';

export interface CylinderCollider {
  id: string;
  kind: 'cylinder';
  x: number;
  z: number;
  bottomY: number;
  topY: number;
  radius: number;
  walkableTop?: boolean;
  tag?: string;
}

export interface BoxCollider {
  id: string;
  kind: 'box';
  x: number;
  z: number;
  bottomY: number;
  topY: number;
  halfW: number;
  halfD: number;
  rotY: number;
  cosY: number;
  sinY: number;
  walkableTop?: boolean;
  tag?: string;
}

export interface SphereCollider {
  id: string;
  kind: 'sphere';
  x: number;
  y: number;
  z: number;
  radius: number;
  walkableTop?: boolean;
  tag?: string;
}

export type WorldCollider = CylinderCollider | BoxCollider | SphereCollider;

export function makeCylinderCollider(
  id: string,
  x: number,
  z: number,
  bottomY: number,
  topY: number,
  radius: number,
  walkableTop = false,
  tag?: string
): CylinderCollider {
  return { id, kind: 'cylinder', x, z, bottomY, topY, radius, walkableTop, tag };
}

export function makeBoxCollider(
  id: string,
  x: number,
  z: number,
  bottomY: number,
  topY: number,
  halfW: number,
  halfD: number,
  rotY = 0,
  walkableTop = false,
  tag?: string
): BoxCollider {
  return {
    id,
    kind: 'box',
    x,
    z,
    bottomY,
    topY,
    halfW,
    halfD,
    rotY,
    cosY: Math.cos(rotY),
    sinY: Math.sin(rotY),
    walkableTop,
    tag,
  };
}

export function makeSphereCollider(
  id: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  walkableTop = false,
  tag?: string
): SphereCollider {
  return { id, kind: 'sphere', x, y, z, radius, walkableTop, tag };
}

const GRID_CELL_SIZE = 16;
const GRID_OFFSET = 512;
const GRID_STRIDE = 1024;

function packCellKey(cx: number, cz: number): number {
  return (cx + GRID_OFFSET) * GRID_STRIDE + (cz + GRID_OFFSET);
}

/**
 * Spatial hash grid for O(1) broad-phase collider lookup in large open worlds.
 * Uses integer keys and stamp deduplication for zero per-frame allocations.
 */
export class SpatialColliderIndex {
  private cells = new Map<number, WorldCollider[]>();
  private allColliders: WorldCollider[] = [];
  private walkableColliders: WorldCollider[] = [];
  private stampByCollider = new WeakMap<WorldCollider, number>();
  private queryStamp = 0;

  constructor(initialColliders: WorldCollider[] = []) {
    for (const c of initialColliders) {
      this.insert(c);
    }
  }

  get count(): number {
    return this.allColliders.length;
  }

  getAll(): readonly WorldCollider[] {
    return this.allColliders;
  }

  insert(col: WorldCollider): void {
    this.allColliders.push(col);
    if (col.walkableTop) {
      this.walkableColliders.push(col);
    }

    let minX = 0;
    let maxX = 0;
    let minZ = 0;
    let maxZ = 0;

    if (col.kind === 'cylinder' || col.kind === 'sphere') {
      minX = col.x - col.radius;
      maxX = col.x + col.radius;
      minZ = col.z - col.radius;
      maxZ = col.z + col.radius;
    } else {
      const extentX = Math.abs(col.cosY) * col.halfW + Math.abs(col.sinY) * col.halfD;
      const extentZ = Math.abs(col.sinY) * col.halfW + Math.abs(col.cosY) * col.halfD;
      minX = col.x - extentX;
      maxX = col.x + extentX;
      minZ = col.z - extentZ;
      maxZ = col.z + extentZ;
    }

    const cx0 = Math.floor(minX / GRID_CELL_SIZE);
    const cx1 = Math.floor(maxX / GRID_CELL_SIZE);
    const cz0 = Math.floor(minZ / GRID_CELL_SIZE);
    const cz1 = Math.floor(maxZ / GRID_CELL_SIZE);

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const key = packCellKey(cx, cz);
        let bucket = this.cells.get(key);
        if (!bucket) {
          bucket = [];
          this.cells.set(key, bucket);
        }
        bucket.push(col);
      }
    }
  }

  queryXZ(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    out: WorldCollider[]
  ): WorldCollider[] {
    out.length = 0;
    this.queryStamp += 1;
    const stamp = this.queryStamp;

    const cx0 = Math.floor(minX / GRID_CELL_SIZE);
    const cx1 = Math.floor(maxX / GRID_CELL_SIZE);
    const cz0 = Math.floor(minZ / GRID_CELL_SIZE);
    const cz1 = Math.floor(maxZ / GRID_CELL_SIZE);

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const bucket = this.cells.get(packCellKey(cx, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const col = bucket[i];
          if (this.stampByCollider.get(col) !== stamp) {
            this.stampByCollider.set(col, stamp);
            out.push(col);
          }
        }
      }
    }
    return out;
  }
}

export type TerrainHeightFn = (worldId: WorldId, x: number, z: number) => number;

// Pre-allocated scratch structures for zero-GC runtime physics loops
const _queryScratch: WorldCollider[] = [];
const _pushOut = { x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, hit: false };

function colliderSupportsPointXZ(
  col: WorldCollider,
  px: number,
  pz: number,
  footMargin: number
): number | null {
  if (!col.walkableTop) return null;

  if (col.kind === 'cylinder') {
    const r = col.radius + footMargin;
    const dx = px - col.x;
    const dz = pz - col.z;
    if (dx * dx + dz * dz <= r * r) {
      return col.topY;
    }
    return null;
  }

  if (col.kind === 'box') {
    const dx = px - col.x;
    const dz = pz - col.z;
    const lx = dx * col.cosY - dz * col.sinY;
    const lz = dx * col.sinY + dz * col.cosY;
    if (Math.abs(lx) <= col.halfW + footMargin && Math.abs(lz) <= col.halfD + footMargin) {
      return col.topY;
    }
    return null;
  }

  const r = col.radius + footMargin;
  const dx = px - col.x;
  const dz = pz - col.z;
  const dSq = dx * dx + dz * dz;
  if (dSq <= r * r) {
    const insideSq = Math.max(0, col.radius * col.radius - dSq);
    return col.y + Math.sqrt(insideSq);
  }
  return null;
}

/**
 * Returns authoritative highest walkable support Y (terrain OR raised platform top)
 * beneath an entity at (x, feetY, z). Prevents snapping up to roofs far above head.
 */
export function getSupportHeightAt(
  worldId: WorldId,
  x: number,
  feetY: number,
  z: number,
  footMargin: number,
  maxStepUp: number,
  terrainHeight: TerrainHeightFn,
  spatialGrid?: SpatialColliderIndex | null,
  dynamicColliders?: readonly WorldCollider[]
): number {
  let supportY = terrainHeight(worldId, x, z);

  if (spatialGrid) {
    spatialGrid.queryXZ(
      x - 2 - footMargin,
      x + 2 + footMargin,
      z - 2 - footMargin,
      z + 2 + footMargin,
      _queryScratch
    );
    for (let i = 0; i < _queryScratch.length; i++) {
      const topY = colliderSupportsPointXZ(_queryScratch[i], x, z, footMargin);
      if (topY !== null && topY <= feetY + maxStepUp && topY > supportY) {
        supportY = topY;
      }
    }
  }

  if (dynamicColliders) {
    for (let i = 0; i < dynamicColliders.length; i++) {
      const topY = colliderSupportsPointXZ(dynamicColliders[i], x, z, footMargin);
      if (topY !== null && topY <= feetY + maxStepUp && topY > supportY) {
        supportY = topY;
      }
    }
  }

  return supportY;
}

/**
 * Computes horizontal XZ Minimum Translation Vector between a moving cylinder
 * and a static/dynamic collider, populating `_pushOut`.
 */
function testCylinderVsColliderXZ(
  px: number,
  feetY: number,
  pz: number,
  radius: number,
  height: number,
  stepHeight: number,
  col: WorldCollider
): void {
  _pushOut.hit = false;

  if (col.kind === 'sphere') {
    const capLowY = feetY + Math.min(radius, height * 0.45);
    const capHighY = feetY + Math.max(radius, height - radius);
    const clampedY = Math.max(capLowY, Math.min(capHighY, col.y));

    if (col.walkableTop) {
      const topY = col.y + col.radius;
      if (topY - feetY <= stepHeight) return;
    }

    const dx = px - col.x;
    const dy = clampedY - col.y;
    const dz = pz - col.z;
    const sumR = radius + col.radius;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq >= sumR * sumR) return;

    // Horizontal slice radius at clampedY
    const horizDistSq = dx * dx + dz * dz;
    const maxHorizSq = Math.max(0, sumR * sumR - dy * dy);
    if (horizDistSq >= maxHorizSq) return;

    const targetHoriz = Math.sqrt(maxHorizSq);
    if (horizDistSq > 1e-8) {
      const hDist = Math.sqrt(horizDistSq);
      const nx = dx / hDist;
      const nz = dz / hDist;
      const pen = targetHoriz - hDist;
      _pushOut.x = nx * pen;
      _pushOut.y = 0;
      _pushOut.z = nz * pen;
      _pushOut.nx = nx;
      _pushOut.ny = 0;
      _pushOut.nz = nz;
      _pushOut.hit = true;
    } else {
      _pushOut.x = 0;
      _pushOut.y = 0;
      _pushOut.z = targetHoriz;
      _pushOut.nx = 0;
      _pushOut.ny = 0;
      _pushOut.nz = 1;
      _pushOut.hit = true;
    }
    return;
  }

  // Cylinder / Box vertical bounds check
  if (feetY >= col.topY - 0.03) return;
  if (feetY + height <= col.bottomY + 0.03) return;
  if (col.walkableTop && col.topY - feetY <= stepHeight) return;

  if (col.kind === 'cylinder') {
    const dx = px - col.x;
    const dz = pz - col.z;
    const minDist = radius + col.radius;
    const distSq = dx * dx + dz * dz;
    if (distSq >= minDist * minDist) return;

    if (distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const nz = dz / dist;
      const pen = minDist - dist;
      _pushOut.x = nx * pen;
      _pushOut.y = 0;
      _pushOut.z = nz * pen;
      _pushOut.nx = nx;
      _pushOut.ny = 0;
      _pushOut.nz = nz;
      _pushOut.hit = true;
    } else {
      _pushOut.x = 0;
      _pushOut.y = 0;
      _pushOut.z = minDist;
      _pushOut.nx = 0;
      _pushOut.ny = 0;
      _pushOut.nz = 1;
      _pushOut.hit = true;
    }
    return;
  }

  // Rotated Box OBB in XZ
  const dx = px - col.x;
  const dz = pz - col.z;
  const lx = dx * col.cosY - dz * col.sinY;
  const lz = dx * col.sinY + dz * col.cosY;

  const cx = Math.max(-col.halfW, Math.min(col.halfW, lx));
  const cz = Math.max(-col.halfD, Math.min(col.halfD, lz));
  const ex = lx - cx;
  const ez = lz - cz;
  const distSq = ex * ex + ez * ez;

  if (distSq >= radius * radius) return;

  let localNx = 0;
  let localNz = 0;
  let pen = 0;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    localNx = ex / dist;
    localNz = ez / dist;
    pen = radius - dist;
  } else {
    // Center is inside the OBB — push out through nearest face
    const dLeft = lx + col.halfW;
    const dRight = col.halfW - lx;
    const dBack = lz + col.halfD;
    const dFront = col.halfD - lz;
    const minEdge = Math.min(dLeft, dRight, dBack, dFront);
    if (minEdge === dLeft) {
      localNx = -1;
      localNz = 0;
      pen = dLeft + radius;
    } else if (minEdge === dRight) {
      localNx = 1;
      localNz = 0;
      pen = dRight + radius;
    } else if (minEdge === dBack) {
      localNx = 0;
      localNz = -1;
      pen = dBack + radius;
    } else {
      localNx = 0;
      localNz = 1;
      pen = dFront + radius;
    }
  }

  // Rotate local normal back to world XZ
  const nx = localNx * col.cosY + localNz * col.sinY;
  const nz = -localNx * col.sinY + localNz * col.cosY;

  _pushOut.x = nx * pen;
  _pushOut.y = 0;
  _pushOut.z = nz * pen;
  _pushOut.nx = nx;
  _pushOut.ny = 0;
  _pushOut.nz = nz;
  _pushOut.hit = true;
}

export interface SurfaceMoveInput {
  worldId: WorldId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  vy: number;
  dt: number;
  radius: number;
  height: number;
  stepHeight: number;
  maxWorldRadius: number;
  spatialGrid?: SpatialColliderIndex | null;
  dynamicColliders?: readonly WorldCollider[];
  terrainHeight: TerrainHeightFn;
}

export interface SurfaceMoveResult {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  vy: number;
  collided: boolean;
  hitRoof: boolean;
}

/**
 * Continuous Collision Detection (swept sub-stepped XZ + Y depenetration)
 * for surface astronauts and 6x6 rovers. Prevents tunneling at sprint/turbo speeds,
 * prevents sticking inside walls/rocks/buildings, and smoothly slides along surfaces.
 */
export function resolveSurfaceMovementWithCCD(input: SurfaceMoveInput): SurfaceMoveResult {
  let { x, y, z, vx, vz, vy } = input;
  const {
    worldId,
    dt,
    radius,
    height,
    stepHeight,
    maxWorldRadius,
    spatialGrid,
    dynamicColliders,
    terrainHeight,
  } = input;

  const totalDx = vx * dt;
  const totalDz = vz * dt;
  const moveDist = Math.hypot(totalDx, totalDz);

  // Sub-step threshold <= 0.22m so even thin station railings (0.32m) cannot be tunneled
  const maxStepLen = 0.22;
  const steps = Math.min(64, Math.max(1, Math.ceil(moveDist / maxStepLen)));
  const stepDx = totalDx / steps;
  const stepDz = totalDz / steps;

  let collided = false;
  let hitRoof = false;

  for (let s = 0; s < steps; s++) {
    x += stepDx;
    z += stepDz;

    const queryPad = radius + 2.5;
    if (spatialGrid) {
      spatialGrid.queryXZ(
        x - queryPad,
        x + queryPad,
        z - queryPad,
        z + queryPad,
        _queryScratch
      );
    } else {
      _queryScratch.length = 0;
    }

    // Multi-pass iterative depenetration resolves corners without getting wedged
    for (let iter = 0; iter < 3; iter++) {
      let resolvedAny = false;

      for (let i = 0; i < _queryScratch.length; i++) {
        testCylinderVsColliderXZ(x, y, z, radius, height, stepHeight, _queryScratch[i]);
        if (_pushOut.hit) {
          x += _pushOut.x;
          z += _pushOut.z;
          const vn = vx * _pushOut.nx + vz * _pushOut.nz;
          if (vn < 0) {
            vx -= vn * _pushOut.nx;
            vz -= vn * _pushOut.nz;
          }
          collided = true;
          resolvedAny = true;
        }
      }

      if (dynamicColliders) {
        for (let i = 0; i < dynamicColliders.length; i++) {
          testCylinderVsColliderXZ(x, y, z, radius, height, stepHeight, dynamicColliders[i]);
          if (_pushOut.hit) {
            x += _pushOut.x;
            z += _pushOut.z;
            const vn = vx * _pushOut.nx + vz * _pushOut.nz;
            if (vn < 0) {
              vx -= vn * _pushOut.nx;
              vz -= vn * _pushOut.nz;
            }
            collided = true;
            resolvedAny = true;
          }
        }
      }

      if (!resolvedAny) break;
    }

    // Clamp inside radial world rim
    const radial = Math.hypot(x, z);
    if (radial > maxWorldRadius) {
      const nx = x / radial;
      const nz = z / radial;
      x = nx * maxWorldRadius;
      z = nz * maxWorldRadius;
      const vn = vx * nx + vz * nz;
      if (vn > 0) {
        vx -= vn * nx;
        vz -= vn * nz;
      }
      collided = true;
    }
  }

  // Head-bonk ceiling check when rising
  if (vy > 0) {
    const prevTop = y + height;
    const nextTop = y + vy * dt + height;
    if (spatialGrid) {
      spatialGrid.queryXZ(
        x - radius - 1,
        x + radius + 1,
        z - radius - 1,
        z + radius + 1,
        _queryScratch
      );
      for (let i = 0; i < _queryScratch.length; i++) {
        const col = _queryScratch[i];
        if (col.kind === 'sphere') continue;
        if (prevTop <= col.bottomY + 0.08 && nextTop > col.bottomY) {
          testCylinderVsColliderXZ(x, col.bottomY + 0.1, z, radius * 0.85, 0.5, 0, col);
          if (_pushOut.hit) {
            vy = 0;
            hitRoof = true;
            break;
          }
        }
      }
    }
  }

  // Also ensure landing on walkable deck respects terrain floor
  const minFloor = terrainHeight(worldId, x, z);
  if (y < minFloor - 0.5) {
    y = minFloor;
    vy = Math.max(0, vy);
  }

  return { x, y, z, vx, vz, vy, collided, hitRoof };
}

/**
 * 3D Sphere vs Collider MTV for atmospheric/orbital Spacecraft flight mode.
 */
function testSphereVsCollider3D(
  px: number,
  py: number,
  pz: number,
  radius: number,
  col: WorldCollider
): void {
  _pushOut.hit = false;

  if (col.kind === 'sphere') {
    const dx = px - col.x;
    const dy = py - col.y;
    const dz = pz - col.z;
    const sumR = radius + col.radius;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq >= sumR * sumR) return;

    if (distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      const pen = sumR - dist;
      _pushOut.x = nx * pen;
      _pushOut.y = ny * pen;
      _pushOut.z = nz * pen;
      _pushOut.nx = nx;
      _pushOut.ny = ny;
      _pushOut.nz = nz;
      _pushOut.hit = true;
    } else {
      _pushOut.x = 0;
      _pushOut.y = sumR;
      _pushOut.z = 0;
      _pushOut.nx = 0;
      _pushOut.ny = 1;
      _pushOut.nz = 0;
      _pushOut.hit = true;
    }
    return;
  }

  if (col.kind === 'cylinder') {
    const clampedY = Math.max(col.bottomY, Math.min(col.topY, py));
    const dx = px - col.x;
    const dy = py - clampedY;
    const dz = pz - col.z;
    const sumR = radius + col.radius;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq >= sumR * sumR) return;

    if (distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      const pen = sumR - dist;
      _pushOut.x = nx * pen;
      _pushOut.y = ny * pen;
      _pushOut.z = nz * pen;
      _pushOut.nx = nx;
      _pushOut.ny = ny;
      _pushOut.nz = nz;
      _pushOut.hit = true;
    } else {
      _pushOut.x = 0;
      _pushOut.y = sumR;
      _pushOut.z = 0;
      _pushOut.nx = 0;
      _pushOut.ny = 1;
      _pushOut.nz = 0;
      _pushOut.hit = true;
    }
    return;
  }

  // 3D Rotated OBB vs Sphere
  const dx = px - col.x;
  const dz = pz - col.z;
  const lx = dx * col.cosY - dz * col.sinY;
  const lz = dx * col.sinY + dz * col.cosY;

  const cx = Math.max(-col.halfW, Math.min(col.halfW, lx));
  const cy = Math.max(col.bottomY, Math.min(col.topY, py));
  const cz = Math.max(-col.halfD, Math.min(col.halfD, lz));

  const ex = lx - cx;
  const ey = py - cy;
  const ez = lz - cz;
  const distSq = ex * ex + ey * ey + ez * ez;
  if (distSq >= radius * radius) return;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const lnx = ex / dist;
    const ny = ey / dist;
    const lnz = ez / dist;
    const nx = lnx * col.cosY + lnz * col.sinY;
    const nz = -lnx * col.sinY + lnz * col.cosY;
    const pen = radius - dist;
    _pushOut.x = nx * pen;
    _pushOut.y = ny * pen;
    _pushOut.z = nz * pen;
    _pushOut.nx = nx;
    _pushOut.ny = ny;
    _pushOut.nz = nz;
    _pushOut.hit = true;
  } else {
    _pushOut.x = 0;
    _pushOut.y = radius;
    _pushOut.z = 0;
    _pushOut.nx = 0;
    _pushOut.ny = 1;
    _pushOut.nz = 0;
    _pushOut.hit = true;
  }
}

export interface FlightMoveInput {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  dt: number;
  radius: number;
  minY: number;
  maxY: number;
  maxWorldRadius: number;
  spatialGrid?: SpatialColliderIndex | null;
}

export interface FlightMoveResult {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  collided: boolean;
}

/**
 * 3D Swept CCD solver for Gas/Ice Giant spacecraft flight mode.
 * Prevents passing through Saturn ring ice boulders, giant planet spheres, and orbital structures.
 */
export function resolveFlightMovementWithCCD(input: FlightMoveInput): FlightMoveResult {
  let { x, y, z, vx, vy, vz } = input;
  const { dt, radius, minY, maxY, maxWorldRadius, spatialGrid } = input;

  const totalDx = vx * dt;
  const totalDy = vy * dt;
  const totalDz = vz * dt;
  const moveDist = Math.hypot(totalDx, totalDy, totalDz);

  const maxStepLen = 0.35;
  const steps = Math.min(64, Math.max(1, Math.ceil(moveDist / maxStepLen)));
  const stepDx = totalDx / steps;
  const stepDy = totalDy / steps;
  const stepDz = totalDz / steps;

  let collided = false;

  for (let s = 0; s < steps; s++) {
    x += stepDx;
    y += stepDy;
    z += stepDz;

    const queryPad = radius + 4.0;
    if (spatialGrid) {
      spatialGrid.queryXZ(
        x - queryPad,
        x + queryPad,
        z - queryPad,
        z + queryPad,
        _queryScratch
      );
    } else {
      _queryScratch.length = 0;
    }

    for (let iter = 0; iter < 3; iter++) {
      let resolvedAny = false;
      for (let i = 0; i < _queryScratch.length; i++) {
        testSphereVsCollider3D(x, y, z, radius, _queryScratch[i]);
        if (_pushOut.hit) {
          x += _pushOut.x;
          y += _pushOut.y;
          z += _pushOut.z;
          const vn = vx * _pushOut.nx + vy * _pushOut.ny + vz * _pushOut.nz;
          if (vn < 0) {
            vx -= vn * _pushOut.nx;
            vy -= vn * _pushOut.ny;
            vz -= vn * _pushOut.nz;
          }
          collided = true;
          resolvedAny = true;
        }
      }
      if (!resolvedAny) break;
    }

    if (y < minY) {
      y = minY;
      if (vy < 0) vy = 0;
      collided = true;
    } else if (y > maxY) {
      y = maxY;
      if (vy > 0) vy = 0;
      collided = true;
    }

    const radial = Math.hypot(x, z);
    if (radial > maxWorldRadius) {
      const nx = x / radial;
      const nz = z / radial;
      x = nx * maxWorldRadius;
      z = nz * maxWorldRadius;
      const vn = vx * nx + vz * nz;
      if (vn > 0) {
        vx -= vn * nx;
        vz -= vn * nz;
      }
      collided = true;
    }
  }

  return { x, y, z, vx, vy, vz, collided };
}
