import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  Cpu,
  Hand,
  HelpCircle,
  Play,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { soundEngine } from '../../utils/sound';
import artRobotics from '../../assets/images/mission_robotics_arm_1794737394980.jpg';

interface ArmTask {
  id: number;
  name: string;
  briefing: string;
  itemName: string;
  itemStartX: number;
  itemStartY: number;
  itemStartAngle: number; // degrees
  bayX: number;
  bayY: number;
  bayAngle: number; // degrees required to release
  obstacle?: { x: number; y: number; w: number; h: number };
}

const ARM_TASKS: ArmTask[] = [
  {
    id: 1,
    name: 'Task 1: Tool Transfer',
    briefing:
      'Move the robotic arm over the Titanium Wrench, press Grab, carry it right to the green Repair Tray, and press Release!',
    itemName: 'Titanium Wrench',
    itemStartX: 250,
    itemStartY: 365,
    itemStartAngle: 0,
    bayX: 600,
    bayY: 365,
    bayAngle: 0,
  },
  {
    id: 2,
    name: 'Task 2: Battery Alignment',
    briefing:
      'The Solar Power Cell is tilted at +45°. Grab it, rotate the robotic wrist to 0° (straight upright), and place it gently inside the Power Bay!',
    itemName: 'Solar Power Cell',
    itemStartX: 235,
    itemStartY: 355,
    itemStartAngle: 45,
    bayX: 625,
    bayY: 360,
    bayAngle: 0,
  },
  {
    id: 3,
    name: 'Task 3: Obstacle & Angled Docking',
    briefing:
      'Lift the Research Pod high over the central Solar Mast barrier without hitting it! Rotate the wrist to -45° to match the Angled Science Cradle and release.',
    itemName: 'Research Pod',
    itemStartX: 215,
    itemStartY: 360,
    itemStartAngle: 0,
    bayX: 650,
    bayY: 335,
    bayAngle: -45,
    obstacle: { x: 425, y: 245, w: 30, h: 170 },
  },
];

interface MissionRoboticArmProps {
  onComplete: (score: number, accuracy: number, details: string) => void;
  onExit: () => void;
}

const BASE_X = 110;
const BASE_Y = 395;
const L1 = 310;
const L2 = 285;

export function MissionRoboticArm({ onComplete, onExit }: MissionRoboticArmProps) {
  const [taskIndex, setTaskIndex] = useState(0);
  const task = ARM_TASKS[taskIndex];

  const [phase, setPhase] = useState<'BRIEFING' | 'PLAYING' | 'TASK_DONE' | 'MISSION_DONE'>('BRIEFING');
  const [isHolding, setIsHolding] = useState(false);
  const [wristDeg, setWristDeg] = useState(0);
  const [bumps, setBumps] = useState(0);
  const [totalBumps, setTotalBumps] = useState(0);
  const [taskScores, setTaskScores] = useState<number[]>([]);
  const [hudStatus, setHudStatus] = useState('Move claw over cargo and press Grab');
  const [clawCoords, setClawCoords] = useState({ x: 300, y: 210 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const controlsRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    rotLeft: false,
    rotRight: false,
  });

  const simRef = useRef({
    clawX: 300,
    clawY: 210,
    wristAngle: 0, // degrees
    holding: false,
    itemX: task.itemStartX,
    itemY: task.itemStartY,
    itemAngle: task.itemStartAngle,
    shakeTime: 0,
    bumpCooldown: 0,
    taskStartTime: performance.now(),
  });

  const resetTaskState = useCallback((t: ArmTask) => {
    simRef.current = {
      clawX: 300,
      clawY: 205,
      wristAngle: 0,
      holding: false,
      itemX: t.itemStartX,
      itemY: t.itemStartY,
      itemAngle: t.itemStartAngle,
      shakeTime: 0,
      bumpCooldown: 0,
      taskStartTime: performance.now(),
    };
    setIsHolding(false);
    setWristDeg(0);
    setBumps(0);
    setClawCoords({ x: 300, y: 205 });
    setHudStatus(`Move claw over ${t.itemName} and press Grab`);
  }, []);

  const handleGrabOrRelease = useCallback(() => {
    if (phase !== 'PLAYING') return;
    const sim = simRef.current;

    if (!sim.holding) {
      const dist = Math.hypot(sim.clawX - sim.itemX, sim.clawY - sim.itemY);
      const angleDiff = Math.abs(sim.wristAngle - sim.itemAngle);

      if (dist <= 40 && angleDiff <= 25) {
        sim.holding = true;
        sim.wristAngle = sim.itemAngle;
        setIsHolding(true);
        setWristDeg(Math.round(sim.wristAngle));
        soundEngine.playGrab();
        setHudStatus(
          task.bayAngle !== sim.itemAngle
            ? `Grabbed! Rotate wrist to ${task.bayAngle}° and move to green target bay.`
            : `Grabbed ${task.itemName}! Carry it to the green target bay and release.`
        );
      } else if (dist > 40) {
        soundEngine.playBump();
        setHudStatus('Move the claw closer to the orange grapple ring first.');
      } else {
        soundEngine.playBump();
        setHudStatus(`Rotate wrist near ${sim.itemAngle}° to align with the cargo handle!`);
      }
    } else {
      // Attempting release
      const distToBay = Math.hypot(sim.clawX - task.bayX, sim.clawY - task.bayY);
      const bayAngleDiff = Math.abs(sim.wristAngle - task.bayAngle);

      if (distToBay <= 38 && bayAngleDiff <= 16) {
        sim.holding = false;
        sim.itemX = task.bayX;
        sim.itemY = task.bayY;
        sim.itemAngle = task.bayAngle;
        setIsHolding(false);

        const elapsedSec = (performance.now() - sim.taskStartTime) / 1000;
        const timePenalty = Math.max(0, Math.floor((elapsedSec - 18) * 0.7));
        const bumpPenalty = bumps * 10;
        const score = Math.max(55, Math.min(100, 100 - timePenalty - bumpPenalty));
        const nextScores = [...taskScores, score];
        setTaskScores(nextScores);

        if (taskIndex < ARM_TASKS.length - 1) {
          soundEngine.playOutcome('success');
          setPhase('TASK_DONE');
        } else {
          const avgScore = Math.round(nextScores.reduce((a, b) => a + b, 0) / nextScores.length);
          const accuracy = Math.max(50, Math.min(100, 100 - totalBumps * 8));
          soundEngine.playOutcome(avgScore >= 65 ? 'success' : 'failure');
          setPhase('MISSION_DONE');
          onComplete(
            avgScore,
            accuracy,
            `${ARM_TASKS.length} payloads docked · ${totalBumps} barrier touches`
          );
        }
      } else if (distToBay <= 38 && bayAngleDiff > 16) {
        soundEngine.playFailure();
        setHudStatus(`Almost there! Rotate wrist to ${task.bayAngle}° (currently ${Math.round(sim.wristAngle)}°) before releasing.`);
      } else {
        soundEngine.playFailure();
        setHudStatus('Move over the green Target Bay before releasing the cargo!');
      }
    }
  }, [bumps, onComplete, phase, task, taskIndex, taskScores, totalBumps]);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        controlsRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        controlsRef.current.right = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        controlsRef.current.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        controlsRef.current.down = true;
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        controlsRef.current.rotLeft = true;
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        controlsRef.current.rotRight = true;
      } else if (e.key === ' ') {
        e.preventDefault();
        handleGrabOrRelease();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') controlsRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') controlsRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controlsRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controlsRef.current.down = false;
      if (e.key === 'q' || e.key === 'Q') controlsRef.current.rotLeft = false;
      if (e.key === 'e' || e.key === 'E') controlsRef.current.rotRight = false;
    };

    const clearKeys = () => {
      controlsRef.current = {
        left: false,
        right: false,
        up: false,
        down: false,
        rotLeft: false,
        rotRight: false,
      };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [handleGrabOrRelease, phase]);

  // 60fps Robotic Arm IK Simulation & Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let hudSyncTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const sim = simRef.current;
      const ctrl = controlsRef.current;

      if (sim.shakeTime > 0) sim.shakeTime = Math.max(0, sim.shakeTime - dt);
      if (sim.bumpCooldown > 0) sim.bumpCooldown = Math.max(0, sim.bumpCooldown - dt);

      if (phase === 'PLAYING') {
        const moveSpeed = 195;
        const rotSpeed = 95;

        let nextX = sim.clawX;
        let nextY = sim.clawY;

        if (ctrl.left) nextX -= moveSpeed * dt;
        if (ctrl.right) nextX += moveSpeed * dt;
        if (ctrl.up) nextY -= moveSpeed * dt;
        if (ctrl.down) nextY += moveSpeed * dt;

        if (ctrl.rotLeft) sim.wristAngle = Math.max(-90, sim.wristAngle - rotSpeed * dt);
        if (ctrl.rotRight) sim.wristAngle = Math.min(90, sim.wristAngle + rotSpeed * dt);

        // Keep within workspace bounds and reachable arm radius (L1 + L2 - 12)
        nextX = Math.max(155, Math.min(720, nextX));
        nextY = Math.max(60, Math.min(378, nextY));

        const dxBase = nextX - BASE_X;
        const dyBase = nextY - BASE_Y;
        const distBase = Math.hypot(dxBase, dyBase);
        const maxReach = L1 + L2 - 15;
        const minReach = 90;
        if (distBase > maxReach) {
          nextX = BASE_X + (dxBase / distBase) * maxReach;
          nextY = BASE_Y + (dyBase / distBase) * maxReach;
        } else if (distBase < minReach) {
          nextX = BASE_X + (dxBase / distBase) * minReach;
          nextY = BASE_Y + (dyBase / distBase) * minReach;
        }

        // Obstacle collision check (with held payload or claw)
        let collided = false;
        if (task.obstacle) {
          const obs = task.obstacle;
          const pad = sim.holding ? 28 : 16;
          if (
            nextX >= obs.x - pad &&
            nextX <= obs.x + obs.w + pad &&
            nextY >= obs.y - pad &&
            nextY <= obs.y + obs.h + pad
          ) {
            collided = true;
          }
        }

        if (collided) {
          if (sim.bumpCooldown <= 0) {
            soundEngine.playCriticalError();
            sim.shakeTime = 0.2;
            sim.bumpCooldown = 0.55;
            setBumps((b) => b + 1);
            setTotalBumps((tb) => tb + 1);
            setHudStatus('Critical collision! Lift the robotic arm higher to clear the Solar Mast.');
          }
        } else {
          sim.clawX = nextX;
          sim.clawY = nextY;
        }

        if (sim.holding) {
          sim.itemX = sim.clawX;
          sim.itemY = sim.clawY;
          sim.itemAngle = sim.wristAngle;
        }

        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.08) {
          hudSyncTimer = 0;
          setWristDeg(Math.round(sim.wristAngle) || 0);
          setClawCoords({ x: Math.round(sim.clawX), y: Math.round(sim.clawY) });
        }
      }

      // 2-Link Inverse Kinematics (elbow-up configuration for natural space crane look)
      const dx = sim.clawX - BASE_X;
      const dy = sim.clawY - BASE_Y;
      const d = Math.min(L1 + L2 - 2, Math.max(Math.abs(L1 - L2) + 2, Math.hypot(dx, dy)));
      const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
      const angleToTarget = Math.atan2(dy, dx);
      const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));
      // Elbow up -> subtract angleA
      const shoulderAngle = angleToTarget - angleA;
      const elbowX = BASE_X + Math.cos(shoulderAngle) * L1;
      const elbowY = BASE_Y + Math.sin(shoulderAngle) * L1;

      // Render Frame
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sim.shakeTime > 0) {
        const mag = sim.shakeTime * 18;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }

      // Space backdrop
      ctx.fillStyle = '#070C1D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle blueprint grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < canvas.width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
      for (let gy = 0; gy < canvas.height; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }

      // Station Truss Deck
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 400, canvas.width, 60);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.lineTo(canvas.width, 400);
      ctx.stroke();

      // Obstacle (Solar Mast) if present
      if (task.obstacle) {
        const o = task.obstacle;
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = 2;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        // Hazard stripes
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        for (let sy = o.y + 8; sy < o.y + o.h - 10; sy += 22) {
          ctx.fillRect(o.x + 3, sy, o.w - 6, 9);
        }
        ctx.fillStyle = '#FDA4AF';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SOLAR MAST', o.x + o.w / 2, o.y - 10);
      }

      // Target Bay
      const distToBay = Math.hypot(sim.clawX - task.bayX, sim.clawY - task.bayY);
      const bayAngleAligned = Math.abs(sim.wristAngle - task.bayAngle) <= 16;
      const readyToDrop = sim.holding && distToBay <= 38 && bayAngleAligned;

      ctx.save();
      ctx.translate(task.bayX, task.bayY);
      ctx.rotate((task.bayAngle * Math.PI) / 180);
      ctx.strokeStyle = readyToDrop ? '#10B981' : '#34D399';
      ctx.lineWidth = readyToDrop ? 3.5 : 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-32, -26, 64, 52);
      ctx.setLineDash([]);
      ctx.fillStyle = readyToDrop ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.1)';
      ctx.fillRect(-32, -26, 64, 52);
      ctx.restore();

      ctx.fillStyle = '#6EE7B7';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TARGET BAY (${task.bayAngle}°)`, task.bayX, task.bayY + 46);

      // Cargo Item
      ctx.save();
      ctx.translate(sim.itemX, sim.itemY);
      ctx.rotate((sim.itemAngle * Math.PI) / 180);
      ctx.fillStyle = '#1D4ED8';
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-24, -18, 48, 36, 6);
      ctx.fill();
      ctx.stroke();
      // Gold solar cells / handle detail
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-16, -6, 32, 12);
      // Grapple Pin center
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Pickup alignment ring when not holding
      if (!sim.holding) {
        const nearItem = Math.hypot(sim.clawX - sim.itemX, sim.clawY - sim.itemY) <= 40;
        const angOk = Math.abs(sim.wristAngle - sim.itemAngle) <= 25;
        ctx.strokeStyle = nearItem && angOk ? '#22D3EE' : 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sim.itemX, sim.itemY, 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Robotic Arm Segments (Base -> Elbow -> Wrist)
      // Base mount
      ctx.fillStyle = '#475569';
      ctx.fillRect(BASE_X - 28, BASE_Y - 12, 56, 22);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.strokeRect(BASE_X - 28, BASE_Y - 12, 56, 22);

      // Upper Boom
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(BASE_X, BASE_Y);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();
      ctx.strokeStyle = '#0EA5E9';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(BASE_X, BASE_Y);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      // Forearm Boom
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(sim.clawX, sim.clawY);
      ctx.stroke();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(sim.clawX, sim.clawY);
      ctx.stroke();

      // Shoulder & Elbow Joints
      [
        { x: BASE_X, y: BASE_Y, r: 12 },
        { x: elbowX, y: elbowY, r: 10 },
      ].forEach((j) => {
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // End-Effector Wrist & Claw Pincers
      ctx.save();
      ctx.translate(sim.clawX, sim.clawY);
      ctx.rotate((sim.wristAngle * Math.PI) / 180);
      const jawSpread = sim.holding ? 14 : 23;
      ctx.strokeStyle = sim.holding ? '#22D3EE' : '#F8FAFC';
      ctx.lineWidth = 4;
      // Left jaw
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-jawSpread, -4);
      ctx.lineTo(-jawSpread + 4, 14);
      ctx.stroke();
      // Right jaw
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.lineTo(jawSpread, -4);
      ctx.lineTo(jawSpread - 4, 14);
      ctx.stroke();
      // Wrist hub
      ctx.fillStyle = sim.holding ? '#22D3EE' : '#0F172A';
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, task]);

  const holdControl = (key: keyof typeof controlsRef.current, active: boolean) => {
    controlsRef.current[key] = active;
  };

  const handleNextTask = () => {
    soundEngine.playClick();
    const nextIdx = taskIndex + 1;
    setTaskIndex(nextIdx);
    resetTaskState(ARM_TASKS[nextIdx]);
    setPhase('BRIEFING');
  };

  const avgScore =
    taskScores.length > 0 ? Math.round(taskScores.reduce((a, b) => a + b, 0) / taskScores.length) : 0;

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      {/* Header Strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0C1222] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-blue-300">{task.name}</div>
            <h1 className="font-display text-lg font-bold text-white">Robotic Arm Simulation</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <span>
            Claw <strong className="text-cyan-300">({clawCoords.x}, {clawCoords.y})</strong>
          </span>
          <span>
            Wrist <strong className="text-white">{wristDeg}°</strong>
          </span>
          <span>
            Gripper{' '}
            <strong className={isHolding ? 'text-emerald-400' : 'text-amber-300'}>
              {isHolding ? 'HOLDING' : 'OPEN'}
            </strong>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Robotic Arm Canvas */}
        <div className="relative lg:col-span-8 rounded-2xl border border-slate-800 bg-[#080D1A] p-2 sm:p-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={780}
            height={460}
            className="w-full h-auto rounded-xl block"
          />

          {/* Live Bottom Telemetry Prompt inside canvas frame */}
          <div className="mt-2 rounded-xl border border-slate-800 bg-[#0C1222] px-3.5 py-2 text-xs text-slate-200">
            <strong className="text-cyan-300">Operator Guide: </strong>
            <span>{hudStatus}</span>
          </div>

          {phase === 'BRIEFING' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
                <div className="relative h-32 w-full overflow-hidden border-b border-slate-800 bg-[#080D1A] sm:h-40">
                  <img
                    src={artRobotics}
                    alt="Space station robotic manipulator gripping a solar payload"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1222] via-[#0C1222]/30 to-transparent"
                  />
                  <div className="absolute bottom-3 left-6 font-mono text-xs font-semibold text-blue-300">
                    {task.name}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <h2 className="font-display text-2xl font-bold text-white">
                    Robotics Briefing
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{task.briefing}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    Controls: Hold Arrow Keys / WASD (or on-screen buttons) to move, Q / E to rotate the wrist, and Space to Grab or Release.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      resetTaskState(task);
                      setPhase('PLAYING');
                    }}
                    className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-blue-300 whitespace-nowrap"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Activate Robotic Arm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'TASK_DONE' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="max-w-md rounded-2xl border border-emerald-500/40 bg-[#0C1222] p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  Payload Secured!
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {task.itemName} was safely docked into the target bay.
                </p>
                <div className="mt-4 font-mono text-3xl font-bold text-blue-300 tabular-nums">
                  {taskScores[taskScores.length - 1]}/100
                </div>
                <button
                  type="button"
                  onClick={handleNextTask}
                  className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                >
                  <span>Next Robotics Task</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'MISSION_DONE' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060913]/92 p-4">
              <div className="max-w-md rounded-2xl border border-blue-400/50 bg-[#0C1222] p-6 text-center">
                <Award className="mx-auto h-12 w-12 text-blue-300" />
                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  Mission 2 Complete!
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  All 3 Canadarm-style robotic transfers succeeded!
                </p>
                <div className="mt-4 font-mono text-3xl font-bold text-blue-300 tabular-nums">
                  {avgScore} / 100
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskIndex(0);
                      setTaskScores([]);
                      setTotalBumps(0);
                      resetTaskState(ARM_TASKS[0]);
                      setPhase('BRIEFING');
                    }}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:border-blue-400"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Replay</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-blue-300"
                  >
                    <span>Training Hub</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Tactile Robotic Console (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0C1222] p-4">
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Arm Movement (Hold)</h2>
              <p className="mt-1 text-xs text-slate-400">
                Hold buttons or Arrow Keys / WASD to steer the robotic arm.
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 max-w-[216px] mx-auto select-none">
                <div />
                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('up', true)}
                  onPointerUp={() => holdControl('up', false)}
                  onPointerLeave={() => holdControl('up', false)}
                  onPointerCancel={() => holdControl('up', false)}
                  aria-label="Move Arm Up"
                  className="flex min-h-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
                <div />

                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('left', true)}
                  onPointerUp={() => holdControl('left', false)}
                  onPointerLeave={() => holdControl('left', false)}
                  onPointerCancel={() => holdControl('left', false)}
                  aria-label="Move Arm Left"
                  className="flex min-h-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center justify-center text-[11px] font-mono text-slate-400">
                  MOVE
                </div>
                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('right', true)}
                  onPointerUp={() => holdControl('right', false)}
                  onPointerLeave={() => holdControl('right', false)}
                  onPointerCancel={() => holdControl('right', false)}
                  aria-label="Move Arm Right"
                  className="flex min-h-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div />
                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('down', true)}
                  onPointerUp={() => holdControl('down', false)}
                  onPointerLeave={() => holdControl('down', false)}
                  onPointerCancel={() => holdControl('down', false)}
                  aria-label="Move Arm Down"
                  className="flex min-h-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <ArrowDown className="h-5 w-5" />
                </button>
                <div />
              </div>
            </div>

            {/* Wrist Rotation */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Rotate Wrist</span>
                <span className="font-mono text-xs text-cyan-300 tabular-nums">
                  {wristDeg}° (Target {task.bayAngle}°)
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 select-none">
                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('rotLeft', true)}
                  onPointerUp={() => holdControl('rotLeft', false)}
                  onPointerLeave={() => holdControl('rotLeft', false)}
                  onPointerCancel={() => holdControl('rotLeft', false)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <RotateCcw className="h-4 w-4 text-cyan-300" />
                  <span>Rotate Left (Q)</span>
                </button>
                <button
                  type="button"
                  disabled={phase !== 'PLAYING'}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={() => holdControl('rotRight', true)}
                  onPointerUp={() => holdControl('rotRight', false)}
                  onPointerLeave={() => holdControl('rotRight', false)}
                  onPointerCancel={() => holdControl('rotRight', false)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-white active:bg-blue-500/30 disabled:opacity-40 touch-none"
                >
                  <RotateCw className="h-4 w-4 text-cyan-300" />
                  <span>Rotate Right (E)</span>
                </button>
              </div>
            </div>

            {/* Grab / Release Primary Action */}
            <div className="border-t border-slate-800 pt-4">
              <button
                type="button"
                disabled={phase !== 'PLAYING'}
                onClick={handleGrabOrRelease}
                className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-40 ${
                  isHolding
                    ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                }`}
              >
                <Hand className="h-5 w-5" />
                <span>{isHolding ? 'Release Cargo (Space)' : 'Grab Cargo (Space)'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              resetTaskState(task);
            }}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Task</span>
          </button>
        </aside>
      </div>
    </main>
  );
}
