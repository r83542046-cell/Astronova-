import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  Compass,
  HelpCircle,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '../../utils/sound';
import artNavigation from '../../assets/images/mission_navigation_orbit_1794737394472.jpg';

interface Coord {
  x: number;
  y: number;
}

interface MovingAsteroid {
  axis: 'x' | 'y';
  baseX: number;
  baseY: number;
  min: number;
  max: number;
  speed: number; // tiles per second
  phase: number;
}

interface SectorConfig {
  id: number;
  name: string;
  briefing: string;
  start: Coord;
  target: Coord;
  beacons: Coord[];
  asteroids: Coord[];
  solarWind: Coord[]; // pushes +1 X gently if landed on
  movingAsteroids: MovingAsteroid[];
  maxFuel: number;
  parMoves: number;
}

const GRID_COLS = 12;
const GRID_ROWS = 8;

const SECTORS: SectorConfig[] = [
  {
    id: 1,
    name: 'Sector 1: Orbital Basics',
    briefing:
      'Guide your spacecraft from Start (1, 3) to the Docking Station (10, 4). Collect the glowing Science Beacon at (5, 5) for bonus points and avoid the asteroids!',
    start: { x: 1, y: 3 },
    target: { x: 10, y: 4 },
    beacons: [{ x: 5, y: 5 }],
    asteroids: [
      { x: 4, y: 3 },
      { x: 6, y: 4 },
      { x: 7, y: 2 },
      { x: 3, y: 5 },
    ],
    solarWind: [],
    movingAsteroids: [],
    maxFuel: 24,
    parMoves: 12,
  },
  {
    id: 2,
    name: 'Sector 2: Asteroid Corridor',
    briefing:
      'Navigate across the Asteroid Corridor from (0, 6) to (11, 1). Watch out for the cyan Solar Wind zone—it pushes your spacecraft 1 tile to the right (+X)!',
    start: { x: 0, y: 6 },
    target: { x: 11, y: 1 },
    beacons: [
      { x: 4, y: 2 },
      { x: 8, y: 5 },
    ],
    asteroids: [
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 4, y: 4 },
      { x: 5, y: 1 },
      { x: 6, y: 3 },
      { x: 7, y: 6 },
      { x: 9, y: 2 },
      { x: 9, y: 4 },
    ],
    solarWind: [
      { x: 5, y: 4 },
      { x: 5, y: 5 },
    ],
    movingAsteroids: [],
    maxFuel: 28,
    parMoves: 15,
  },
  {
    id: 3,
    name: 'Sector 3: Moving Debris Field',
    briefing:
      'Final navigation test! Watch the dotted paths of moving space rocks and dock safely at (10, 6). Plan your timing carefully!',
    start: { x: 1, y: 1 },
    target: { x: 10, y: 6 },
    beacons: [
      { x: 2, y: 6 },
      { x: 8, y: 1 },
    ],
    asteroids: [
      { x: 3, y: 2 },
      { x: 4, y: 5 },
      { x: 6, y: 3 },
      { x: 8, y: 5 },
      { x: 9, y: 3 },
    ],
    solarWind: [{ x: 6, y: 5 }],
    movingAsteroids: [
      { axis: 'y', baseX: 5, baseY: 3, min: 1, max: 6, speed: 1.15, phase: 0 },
      { axis: 'x', baseX: 7, baseY: 4, min: 4, max: 10, speed: 1.05, phase: 1.5 },
    ],
    maxFuel: 32,
    parMoves: 17,
  },
];

interface MissionNavigationProps {
  onComplete: (score: number, accuracy: number, details: string) => void;
  onExit: () => void;
}

export function MissionNavigation({ onComplete, onExit }: MissionNavigationProps) {
  const [sectorIndex, setSectorIndex] = useState(0);
  const sector = SECTORS[sectorIndex];

  const [phase, setPhase] = useState<'BRIEFING' | 'PLAYING' | 'SECTOR_DONE' | 'MISSION_DONE'>('BRIEFING');
  const [shipPos, setShipPos] = useState<Coord>(sector.start);
  const [shipAngle, setShipAngle] = useState(0);
  const [fuel, setFuel] = useState(sector.maxFuel);
  const [movesUsed, setMovesUsed] = useState(0);
  const [collisions, setCollisions] = useState(0);
  const [collectedBeacons, setCollectedBeacons] = useState<Coord[]>([]);
  const [plannedRoute, setPlannedRoute] = useState<Coord[]>([]);
  const [isAutoFlying, setIsAutoFlying] = useState(false);
  const [feedback, setFeedback] = useState<string>('Use Arrow Keys, D-Pad, or click adjacent tiles to plot a route.');
  const [sectorScores, setSectorScores] = useState<number[]>([]);
  const [totalCollisions, setTotalCollisions] = useState(0);
  const [totalBeacons, setTotalBeacons] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable simulation state for 60fps canvas rendering (no React re-render overhead per frame)
  const simRef = useRef({
    renderX: sector.start.x,
    renderY: sector.start.y,
    renderAngle: 0,
    shakeTime: 0,
    hitFlash: 0,
    time: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    movingCoords: [] as Coord[],
  });

  const resetSectorState = useCallback((sec: SectorConfig) => {
    setShipPos(sec.start);
    setShipAngle(0);
    setFuel(sec.maxFuel);
    setMovesUsed(0);
    setCollisions(0);
    setCollectedBeacons([]);
    setPlannedRoute([]);
    setIsAutoFlying(false);
    setFeedback('Ready! Use Arrow Keys, D-Pad, or tap neighboring tiles to plot a route.');
    simRef.current.renderX = sec.start.x;
    simRef.current.renderY = sec.start.y;
    simRef.current.renderAngle = 0;
    simRef.current.shakeTime = 0;
    simRef.current.hitFlash = 0;
    simRef.current.particles = [];
  }, []);

  const startSector = () => {
    soundEngine.playClick();
    resetSectorState(sector);
    setPhase('PLAYING');
  };

  const spawnBurst = (gx: number, gy: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 0.8 + Math.random() * 2.2;
      simRef.current.particles.push({
        x: gx + 0.5,
        y: gy + 0.5,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.55,
        color,
      });
    }
  };

  const attemptMove = useCallback(
    (dx: number, dy: number) => {
      if (phase !== 'PLAYING') return;
      if (fuel <= 0) {
        setFeedback('Out of fuel! Press Reset Sector to try a shorter route.');
        soundEngine.playFailure();
        setIsAutoFlying(false);
        return;
      }

      const nx = shipPos.x + dx;
      const ny = shipPos.y + dy;

      // Update facing angle
      let angle = shipAngle;
      if (dx === 1) angle = 0;
      else if (dx === -1) angle = Math.PI;
      else if (dy === 1) angle = -Math.PI / 2;
      else if (dy === -1) angle = Math.PI / 2;
      setShipAngle(angle);
      simRef.current.renderAngle = angle;

      // Boundary check
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) {
        setFeedback(`Boundary reached! Coordinates stay within X: 0–11 and Y: 0–7.`);
        soundEngine.playBump();
        simRef.current.shakeTime = 0.18;
        setIsAutoFlying(false);
        return;
      }

      // Static asteroid collision check
      const hitStatic = sector.asteroids.some((a) => a.x === nx && a.y === ny);
      // Moving asteroid collision check (nearest integer tile)
      const hitMoving = simRef.current.movingCoords.some((m) => m.x === nx && m.y === ny);

      if (hitStatic || hitMoving) {
        soundEngine.playCriticalError();
        simRef.current.shakeTime = 0.25;
        simRef.current.hitFlash = 0.25;
        spawnBurst(nx, ny, '#F43F5E', 16);
        setCollisions((c) => c + 1);
        setTotalCollisions((tc) => tc + 1);
        const remainingAfterHit = Math.max(0, fuel - 1);
        setFuel(remainingAfterHit);
        setMovesUsed((m) => m + 1);
        setIsAutoFlying(false);
        setPlannedRoute([]);
        setFeedback(
          remainingAfterHit === 0
            ? `Critical asteroid impact near (${nx}, ${ny}) and fuel depleted! Press Reset Sector.`
            : `Critical asteroid impact near (${nx}, ${ny})! Steer around obstacles to protect your ship.`
        );
        return;
      }

      soundEngine.playThrust();
      let finalX = nx;
      let finalY = ny;
      let statusNote = `Moved to coordinate (${nx}, ${ny}).`;

      // Solar wind push check
      const inSolarWind = sector.solarWind.some((w) => w.x === nx && w.y === ny);
      if (inSolarWind && nx + 1 < GRID_COLS && !sector.asteroids.some((a) => a.x === nx + 1 && a.y === ny)) {
        finalX = nx + 1;
        statusNote = `Solar wind pushed your ship from (${nx}, ${ny}) to (${finalX}, ${finalY})!`;
        spawnBurst(nx, ny, '#22D3EE', 10);
      }

      const nextFuel = Math.max(0, fuel - 1);
      setShipPos({ x: finalX, y: finalY });
      setFuel(nextFuel);
      setMovesUsed((m) => m + 1);
      spawnBurst(shipPos.x, shipPos.y, '#38BDF8', 6);

      // Beacon collection
      const beaconHit = sector.beacons.find(
        (b) => b.x === finalX && b.y === finalY && !collectedBeacons.some((cb) => cb.x === b.x && cb.y === b.y)
      );
      let newBeaconsCount = collectedBeacons.length;
      if (beaconHit) {
        soundEngine.playBeacon();
        spawnBurst(finalX, finalY, '#F59E0B', 18);
        setCollectedBeacons((prev) => [...prev, beaconHit]);
        setTotalBeacons((tb) => tb + 1);
        newBeaconsCount += 1;
        statusNote = `Science Beacon collected at (${finalX}, ${finalY})! +10 bonus points.`;
      }

      // Target reached!
      if (finalX === sector.target.x && finalY === sector.target.y) {
        setFeedback(statusNote);
        spawnBurst(finalX, finalY, '#10B981', 26);
        setIsAutoFlying(false);
        setPlannedRoute([]);

        const nextMoves = movesUsed + 1;
        const efficiencyPenalty = Math.max(0, nextMoves - sector.parMoves) * 2;
        const collisionPenalty = collisions * 12;
        const beaconBonus = newBeaconsCount * 8;
        const secScore = Math.max(45, Math.min(100, 92 - efficiencyPenalty - collisionPenalty + beaconBonus));

        const updatedScores = [...sectorScores, secScore];
        setSectorScores(updatedScores);

        if (sectorIndex < SECTORS.length - 1) {
          soundEngine.playOutcome('success');
          setPhase('SECTOR_DONE');
        } else {
          // Mission 1 Complete!
          const avgScore = Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length);
          const totalPossibleBeacons = SECTORS.reduce((acc, s) => acc + s.beacons.length, 0);
          const acc = Math.max(
            40,
            Math.min(100, Math.round(100 - totalCollisions * 10 + (totalBeacons / totalPossibleBeacons) * 8))
          );
          soundEngine.playOutcome(avgScore >= 65 ? 'success' : 'failure');
          setPhase('MISSION_DONE');
          onComplete(
            avgScore,
            acc,
            `${SECTORS.length} sectors docked · ${totalBeacons}/${totalPossibleBeacons} beacons · ${totalCollisions} bumps`
          );
        }
        return;
      }

      if (nextFuel === 0) {
        soundEngine.playFailure();
        setIsAutoFlying(false);
        setPlannedRoute([]);
        setFeedback('Fuel tanks empty before docking! Press Reset Sector to optimize your path.');
        return;
      }

      setFeedback(statusNote);
    },
    [
      collectedBeacons,
      collisions,
      fuel,
      movesUsed,
      onComplete,
      phase,
      sector,
      sectorIndex,
      sectorScores,
      shipAngle,
      shipPos,
      totalBeacons,
      totalCollisions,
    ]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING' || isAutoFlying) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        attemptMove(0, 1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        attemptMove(0, -1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        attemptMove(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        attemptMove(1, 0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [attemptMove, isAutoFlying, phase]);

  // Autopilot route stepping
  useEffect(() => {
    if (!isAutoFlying || phase !== 'PLAYING') return;
    if (plannedRoute.length === 0) {
      setIsAutoFlying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const nextStep = plannedRoute[0];
      const dx = nextStep.x - shipPos.x;
      const dy = nextStep.y - shipPos.y;
      setPlannedRoute((prev) => prev.slice(1));
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        attemptMove(dx, dy);
      } else {
        setIsAutoFlying(false);
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [attemptMove, isAutoFlying, phase, plannedRoute, shipPos]);

  // 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const sim = simRef.current;
      sim.time += dt;

      // Smooth interpolation of spacecraft position
      sim.renderX += (shipPos.x - sim.renderX) * Math.min(1, dt * 14);
      sim.renderY += (shipPos.y - sim.renderY) * Math.min(1, dt * 14);

      if (sim.shakeTime > 0) sim.shakeTime = Math.max(0, sim.shakeTime - dt);
      if (sim.hitFlash > 0) sim.hitFlash = Math.max(0, sim.hitFlash - dt);

      // Update particles
      sim.particles = sim.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0);

      // Update moving asteroid positions
      sim.movingCoords = sector.movingAsteroids.map((m) => {
        const span = m.max - m.min;
        const wave = (Math.sin(sim.time * m.speed + m.phase) + 1) / 2;
        const pos = Math.round(m.min + wave * span);
        return m.axis === 'x' ? { x: pos, y: m.baseY } : { x: m.baseX, y: pos };
      });

      const w = canvas.width;
      const h = canvas.height;
      const padLeft = 38;
      const padBottom = 34;
      const padTop = 16;
      const padRight = 16;
      const cellW = (w - padLeft - padRight) / GRID_COLS;
      const cellH = (h - padTop - padBottom) / GRID_ROWS;

      const toScreenX = (gx: number) => padLeft + gx * cellW;
      // Y=0 at bottom, Y=7 at top (standard math coordinates!)
      const toScreenY = (gy: number) => padTop + (GRID_ROWS - 1 - gy) * cellH;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      if (sim.shakeTime > 0) {
        const mag = sim.shakeTime * 22;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }

      // Space canvas background
      ctx.fillStyle = '#080E21';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c++) {
        const x = padLeft + c * cellW;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + GRID_ROWS * cellH);
        ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        const y = padTop + r * cellH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + GRID_COLS * cellW, y);
        ctx.stroke();
      }

      // Coordinate Labels (X: 0..11, Y: 0..7)
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.fillText(String(c), toScreenX(c) + cellW / 2, h - 15);
      }
      for (let r = 0; r < GRID_ROWS; r++) {
        ctx.fillText(String(r), 18, toScreenY(r) + cellH / 2);
      }

      // Solar Wind Zones
      for (const sw of sector.solarWind) {
        const sx = toScreenX(sw.x);
        const sy = toScreenY(sw.y);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
        ctx.fillRect(sx + 2, sy + 2, cellW - 4, cellH - 4);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.strokeRect(sx + 2, sy + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = '#67E8F9';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText('>>', sx + cellW / 2, sy + cellH / 2);
      }

      // Planned Route Path
      if (plannedRoute.length > 0) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(toScreenX(shipPos.x) + cellW / 2, toScreenY(shipPos.y) + cellH / 2);
        for (const pt of plannedRoute) {
          ctx.lineTo(toScreenX(pt.x) + cellW / 2, toScreenY(pt.y) + cellH / 2);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        for (const pt of plannedRoute) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.beginPath();
          ctx.arc(toScreenX(pt.x) + cellW / 2, toScreenY(pt.y) + cellH / 2, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Moving Asteroid Telegraph Tracks
      for (const m of sector.movingAsteroids) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (m.axis === 'x') {
          ctx.moveTo(toScreenX(m.min) + cellW / 2, toScreenY(m.baseY) + cellH / 2);
          ctx.lineTo(toScreenX(m.max) + cellW / 2, toScreenY(m.baseY) + cellH / 2);
        } else {
          ctx.moveTo(toScreenX(m.baseX) + cellW / 2, toScreenY(m.min) + cellH / 2);
          ctx.lineTo(toScreenX(m.baseX) + cellW / 2, toScreenY(m.max) + cellH / 2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Static Asteroids
      const drawRock = (cx: number, cy: number, isMoving: boolean) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(isMoving ? sim.time * 1.4 : 0.4);
        ctx.fillStyle = isMoving ? '#9F1239' : '#475569';
        ctx.strokeStyle = isMoving ? '#FB7185' : '#94A3B8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const r = Math.min(cellW, cellH) * 0.34;
        const pts = 7;
        for (let i = 0; i < pts; i++) {
          const ang = (Math.PI * 2 * i) / pts;
          const rad = r * (i % 2 === 0 ? 1.0 : 0.78);
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      for (const a of sector.asteroids) {
        drawRock(toScreenX(a.x) + cellW / 2, toScreenY(a.y) + cellH / 2, false);
      }
      for (const m of sector.movingAsteroids) {
        const span = m.max - m.min;
        const wave = (Math.sin(sim.time * m.speed + m.phase) + 1) / 2;
        const smoothPos = m.min + wave * span;
        const gx = m.axis === 'x' ? smoothPos : m.baseX;
        const gy = m.axis === 'y' ? smoothPos : m.baseY;
        drawRock(toScreenX(gx) + cellW / 2, toScreenY(gy) + cellH / 2, true);
      }

      // Science Beacons
      for (const b of sector.beacons) {
        const already = collectedBeacons.some((cb) => cb.x === b.x && cb.y === b.y);
        if (already) continue;
        const bx = toScreenX(b.x) + cellW / 2;
        const by = toScreenY(b.y) + cellH / 2;
        const pulse = 1 + 0.14 * Math.sin(sim.time * 4);
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(cellW, cellH) * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Target Docking Station
      const tx = toScreenX(sector.target.x) + cellW / 2;
      const ty = toScreenY(sector.target.y) + cellH / 2;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(cellW, cellH) * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      // Station solar wings
      ctx.fillStyle = '#34D399';
      ctx.fillRect(-16, -4, 32, 8);
      ctx.fillStyle = '#ECFDF5';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Particles
      for (const p of sim.particles) {
        const px = padLeft + p.x * cellW;
        const py = padTop + (GRID_ROWS - p.y) * cellH;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 0.55);
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player Spacecraft
      const sx = toScreenX(sim.renderX) + cellW / 2;
      const sy = toScreenY(sim.renderY) + cellH / 2;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sim.renderAngle);
      // Thruster glow
      ctx.fillStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.beginPath();
      ctx.arc(-13, 0, 5 + Math.sin(sim.time * 18) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Ship hull
      ctx.fillStyle = sim.hitFlash > 0 ? '#FB7185' : '#E2E8F0';
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -11);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cockpit visor
      ctx.fillStyle = '#0EA5E9';
      ctx.beginPath();
      ctx.arc(3, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [collectedBeacons, plannedRoute, sector, shipPos]);

  // Click/Tap on canvas tile to build waypoint route
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'PLAYING' || isAutoFlying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const padLeft = 38;
    const padBottom = 34;
    const padTop = 16;
    const padRight = 16;
    const cellW = (canvas.width - padLeft - padRight) / GRID_COLS;
    const cellH = (canvas.height - padTop - padBottom) / GRID_ROWS;

    const gx = Math.floor((px - padLeft) / cellW);
    const gyFromTop = Math.floor((py - padTop) / cellH);
    const gy = GRID_ROWS - 1 - gyFromTop;

    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return;

    const lastPt = plannedRoute.length > 0 ? plannedRoute[plannedRoute.length - 1] : shipPos;

    // Clicking the last waypoint removes it
    if (plannedRoute.length > 0 && lastPt.x === gx && lastPt.y === gy) {
      soundEngine.playClick();
      setPlannedRoute((prev) => prev.slice(0, -1));
      return;
    }

    const manhattan = Math.abs(gx - lastPt.x) + Math.abs(gy - lastPt.y);
    if (manhattan === 1) {
      soundEngine.playClick();
      setPlannedRoute((prev) => [...prev, { x: gx, y: gy }]);
      setFeedback(`Added waypoint (${gx}, ${gy}) to route. Click more tiles or press Launch Route.`);
    } else if (manhattan > 1) {
      setFeedback(`Tap a tile directly next to (${lastPt.x}, ${lastPt.y})—up, down, left, or right!`);
    }
  };

  const handleNextSector = () => {
    soundEngine.playClick();
    const nextIdx = sectorIndex + 1;
    setSectorIndex(nextIdx);
    resetSectorState(SECTORS[nextIdx]);
    setPhase('BRIEFING');
  };

  const avgMissionScore =
    sectorScores.length > 0 ? Math.round(sectorScores.reduce((a, b) => a + b, 0) / sectorScores.length) : 0;

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      {/* Compact Mission Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0C1222] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-300">{sector.name}</div>
            <h1 className="font-display text-lg font-bold text-white">Space Navigation</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <span>
            Ship <strong className="text-cyan-300">({shipPos.x}, {shipPos.y})</strong>
          </span>
          <span>
            Target <strong className="text-emerald-400">({sector.target.x}, {sector.target.y})</strong>
          </span>
          <span>
            Fuel <strong className={fuel <= 5 ? 'text-rose-400' : 'text-white'}>{fuel}</strong>/{sector.maxFuel}
          </span>
          <span>
            Bumps <strong className={collisions > 0 ? 'text-amber-300' : 'text-white'}>{collisions}</strong>
          </span>
          <button
            type="button"
            onClick={() => setPhase('BRIEFING')}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#080D1A] px-2.5 py-1 text-slate-300 hover:border-cyan-400/60 hover:text-white whitespace-nowrap shrink-0"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Briefing</span>
          </button>
        </div>
      </div>

      {/* Main Playfield + Controls */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Space Coordinate Canvas (9 cols on desktop) */}
        <div className="relative lg:col-span-9 rounded-2xl border border-slate-800 bg-[#080D1A] p-2 sm:p-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={760}
            height={500}
            onClick={handleCanvasClick}
            className="w-full h-auto cursor-crosshair rounded-xl block"
          />

          {/* Modal Overlays for Briefing / Sector Complete / Mission Complete */}
          {phase === 'BRIEFING' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] text-left">
                <div className="relative h-32 w-full overflow-hidden border-b border-slate-800 bg-[#080D1A] sm:h-40">
                  <img
                    src={artNavigation}
                    alt="Orbital spacecraft trajectory vectoring past asteroids"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1222] via-[#0C1222]/30 to-transparent"
                  />
                  <div className="absolute bottom-3 left-6 font-mono text-xs font-semibold text-cyan-300">
                    {sector.name}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <h2 className="font-display text-2xl font-bold text-white">
                    Navigation Briefing
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{sector.briefing}</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li>
                      <strong className="text-white">Manual Flight:</strong> Use Arrow keys, WASD, or the on-screen direction buttons.
                    </li>
                    <li>
                      <strong className="text-white">Route Planner:</strong> Tap neighboring grid squares to draw a coordinate path, then press Launch Route!
                    </li>
                    <li>
                      <strong className="text-emerald-400">Green Ring:</strong> Docking Station target ·{' '}
                      <strong className="text-amber-300">Gold Diamond:</strong> Science Beacon (+bonus).
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={startSector}
                    className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start {sector.name}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'SECTOR_DONE' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="max-w-md rounded-2xl border border-emerald-500/40 bg-[#0C1222] p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  Docking Successful!
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  You reached station ({sector.target.x}, {sector.target.y}) in {movesUsed} moves with{' '}
                  {collisions} obstacle bumps.
                </p>
                <div className="mt-4 font-mono text-3xl font-bold text-cyan-300 tabular-nums">
                  {sectorScores[sectorScores.length - 1]}/100
                </div>
                <button
                  type="button"
                  onClick={handleNextSector}
                  className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                >
                  <span>Continue to Next Sector</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'MISSION_DONE' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="max-w-md rounded-2xl border border-cyan-400/50 bg-[#0C1222] p-6 text-center">
                <Award className="mx-auto h-12 w-12 text-cyan-300" />
                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  Mission 1 Complete!
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  All 3 orbital sectors navigated! Your coordinate routing and obstacle dodging skills are logged.
                </p>
                <div className="mt-4 font-mono text-3xl font-bold text-cyan-300 tabular-nums">
                  {avgMissionScore} / 100
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setSectorIndex(0);
                      setSectorScores([]);
                      setTotalCollisions(0);
                      setTotalBeacons(0);
                      resetSectorState(SECTORS[0]);
                      setPhase('BRIEFING');
                    }}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Replay</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                  >
                    <span>Training Hub</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Flight Controls & Telemetry Feedback (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0C1222] p-4">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Flight Controls</h2>
              <p className="mt-1 text-xs text-slate-400">
                Fly one square at a time or tap tiles to build a route.
              </p>
            </div>

            {/* 4-Way Touch/Click D-Pad */}
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              <div />
              <button
                type="button"
                disabled={phase !== 'PLAYING' || isAutoFlying}
                onClick={() => attemptMove(0, 1)}
                aria-label="Move Up (+Y)"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-slate-800 bg-[#080D1A] text-white transition-colors hover:border-cyan-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <div />
              <button
                type="button"
                disabled={phase !== 'PLAYING' || isAutoFlying}
                onClick={() => attemptMove(-1, 0)}
                aria-label="Move Left (-X)"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-slate-800 bg-[#080D1A] text-white transition-colors hover:border-cyan-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center font-mono text-xs text-slate-400 tabular-nums">
                ({shipPos.x},{shipPos.y})
              </div>
              <button
                type="button"
                disabled={phase !== 'PLAYING' || isAutoFlying}
                onClick={() => attemptMove(1, 0)}
                aria-label="Move Right (+X)"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-slate-800 bg-[#080D1A] text-white transition-colors hover:border-cyan-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div />
              <button
                type="button"
                disabled={phase !== 'PLAYING' || isAutoFlying}
                onClick={() => attemptMove(0, -1)}
                aria-label="Move Down (-Y)"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-slate-800 bg-[#080D1A] text-white transition-colors hover:border-cyan-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
              <div />
            </div>

            {/* Route Planner Controls */}
            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Planned Route</span>
                <span className="font-mono text-cyan-300 tabular-nums">{plannedRoute.length} steps</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={plannedRoute.length === 0 || isAutoFlying || phase !== 'PLAYING'}
                  onClick={() => {
                    soundEngine.playClick();
                    setIsAutoFlying(true);
                  }}
                  className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isAutoFlying ? 'Flying...' : 'Launch Route'}</span>
                </button>
                <button
                  type="button"
                  disabled={plannedRoute.length === 0 || isAutoFlying}
                  onClick={() => {
                    soundEngine.playClick();
                    setPlannedRoute([]);
                  }}
                  aria-label="Clear planned route"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-800 bg-[#080D1A] px-3 text-slate-300 hover:border-rose-400 hover:text-rose-200 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Live Feedback Box */}
            <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3">
              <div className="text-xs font-semibold text-cyan-300">Flight Log</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">{feedback}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              resetSectorState(sector);
            }}
            className={`inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              fuel === 0 && phase === 'PLAYING'
                ? 'border-amber-400 bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 hover:text-white'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{fuel === 0 && phase === 'PLAYING' ? 'Out of Fuel · Reset Sector' : 'Reset Sector'}</span>
          </button>
        </aside>
      </div>
    </main>
  );
}
