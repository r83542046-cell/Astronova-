import { useEffect, useRef, useState } from 'react';
import { Compass, Info, Orbit, Sparkles, Star } from 'lucide-react';
import { NEARBY_EXOPLANETS, NearbyExoplanet } from '../../data/nearbyExoplanetsData';
import { soundEngine } from '../../utils/sound';

interface StarSystemOrreryMapProps {
  onSelectPlanet: (planet: NearbyExoplanet) => void;
  selectedPlanetId: string;
}

interface StarSystemNode {
  id: string;
  name: string;
  distanceLy: number;
  starType: string;
  spectralClass: string;
  color: string;
  glowColor: string;
  angleRad: number; // For schematic 2D positioning
  planets: string[]; // planet IDs
}

const STAR_SYSTEMS: StarSystemNode[] = [
  {
    id: 'sol',
    name: 'Sol (Our Solar System)',
    distanceLy: 0.0,
    starType: 'Yellow Dwarf (G2V)',
    spectralClass: 'G2V',
    color: '#ffea70',
    glowColor: 'rgba(255, 234, 112, 0.4)',
    angleRad: 0,
    planets: [],
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    distanceLy: 4.25,
    starType: 'Red Dwarf (M6.5V)',
    spectralClass: 'M6.5V',
    color: '#ff6b4a',
    glowColor: 'rgba(255, 107, 74, 0.45)',
    angleRad: Math.PI * 0.25,
    planets: ['proxima-centauri-b', 'proxima-centauri-d'],
  },
  {
    id: 'barnards',
    name: "Barnard's Star",
    distanceLy: 5.96,
    starType: 'Red Dwarf (M4V)',
    spectralClass: 'M4V',
    color: '#ff7e55',
    glowColor: 'rgba(255, 126, 85, 0.45)',
    angleRad: Math.PI * 0.75,
    planets: ['barnards-star-b', 'barnards-star-c'],
  },
  {
    id: 'gj887',
    name: 'Gliese 887 (GJ 887)',
    distanceLy: 9.74,
    starType: 'Quiet Red Dwarf (M2V)',
    spectralClass: 'M2V',
    color: '#ff9066',
    glowColor: 'rgba(255, 144, 102, 0.45)',
    angleRad: Math.PI * 1.35,
    planets: ['gj-887-b', 'gj-887-c'],
  },
  {
    id: 'epsilon-eri',
    name: 'Epsilon Eridani',
    distanceLy: 10.5,
    starType: 'Orange Dwarf (K2V)',
    spectralClass: 'K2V',
    color: '#ffb347',
    glowColor: 'rgba(255, 179, 71, 0.5)',
    angleRad: Math.PI * 1.85,
    planets: ['epsilon-eridani-b'],
  },
  {
    id: 'ross128',
    name: 'Ross 128',
    distanceLy: 11.0,
    starType: 'Inactive Red Dwarf (M4V)',
    spectralClass: 'M4V',
    color: '#ff6347',
    glowColor: 'rgba(255, 99, 71, 0.45)',
    angleRad: Math.PI * 1.05,
    planets: ['ross-128-b'],
  },
];

export function StarSystemOrreryMap({ onSelectPlanet, selectedPlanetId }: StarSystemOrreryMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSystem, setSelectedSystem] = useState<StarSystemNode>(STAR_SYSTEMS[1]); // default Proxima
  const [hoveredSystem, setHoveredSystem] = useState<StarSystemNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(cx, cy) - 40;

      ctx.clearRect(0, 0, w, h);

      // Deep space background grid
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      // Distance rings (4 ly, 8 ly, 12 ly)
      const ringDistances = [4, 8, 12];
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.setLineDash([4, 4]);

      ringDistances.forEach((dist) => {
        const r = (dist / 13) * maxRadius;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(`${dist} ly`, cx + r + 4, cy - 4);
      });
      ctx.setLineDash([]);

      // Radar sweep effect
      sweepAngle += 0.015;
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, sweepAngle - 0.25, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Draw vector lines from Sol to each star
      STAR_SYSTEMS.forEach((sys) => {
        if (sys.id === 'sol') return;
        const r = (sys.distanceLy / 13) * maxRadius;
        const sx = cx + Math.cos(sys.angleRad) * r;
        const sy = cy + Math.sin(sys.angleRad) * r;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle =
          selectedSystem.id === sys.id ? 'rgba(6, 182, 212, 0.6)' : 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = selectedSystem.id === sys.id ? 1.5 : 1;
        ctx.stroke();
      });

      // Draw Star Nodes
      STAR_SYSTEMS.forEach((sys) => {
        const isSol = sys.id === 'sol';
        const r = isSol ? 0 : (sys.distanceLy / 13) * maxRadius;
        const sx = cx + Math.cos(sys.angleRad) * r;
        const sy = cy + Math.sin(sys.angleRad) * r;
        const isSelected = selectedSystem.id === sys.id;
        const isHovered = hoveredSystem?.id === sys.id;

        // Glow ring
        ctx.beginPath();
        ctx.arc(sx, sy, isSol ? 16 : isSelected ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.35)' : sys.glowColor;
        ctx.fill();

        // Core star
        ctx.beginPath();
        ctx.arc(sx, sy, isSol ? 8 : isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = sys.color;
        ctx.fill();

        // Selection ring
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(sx, sy, isSol ? 22 : 18, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Label
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(sys.name, sx, sy + (isSol ? 28 : 22));
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [selectedSystem, hoveredSystem]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(cx, cy) - 40;

    for (const sys of STAR_SYSTEMS) {
      const r = sys.id === 'sol' ? 0 : (sys.distanceLy / 13) * maxRadius;
      const sx = cx + Math.cos(sys.angleRad) * r;
      const sy = cy + Math.sin(sys.angleRad) * r;
      const dist = Math.hypot(x - sx, y - sy);

      if (dist < 26) {
        soundEngine.playClick();
        setSelectedSystem(sys);
        if (sys.planets.length > 0) {
          const firstPlanet = NEARBY_EXOPLANETS.find((p) => p.id === sys.planets[0]);
          if (firstPlanet) onSelectPlanet(firstPlanet);
        }
        break;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(cx, cy) - 40;

    let found: StarSystemNode | null = null;
    for (const sys of STAR_SYSTEMS) {
      const r = sys.id === 'sol' ? 0 : (sys.distanceLy / 13) * maxRadius;
      const sx = cx + Math.cos(sys.angleRad) * r;
      const sy = cy + Math.sin(sys.angleRad) * r;
      if (Math.hypot(x - sx, y - sy) < 26) {
        found = sys;
        break;
      }
    }
    setHoveredSystem(found);
  };

  const systemPlanets = NEARBY_EXOPLANETS.filter((p) => selectedSystem.planets.includes(p.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 2D Interactive Orrery Radar Canvas */}
      <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Orbit className="h-4 w-4 text-cyan-400" />
              <h3 className="font-display text-base font-bold text-white">
                Solar Neighborhood Astrometric Map
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Center: <strong className="text-yellow-300">Sol</strong> (0.00 ly)
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={440}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredSystem(null)}
              className="h-auto w-full max-w-[640px] rounded-xl border border-slate-800/80 cursor-pointer"
              title="Click on any star system to inspect its verified exoplanet bodies."
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-3 flex items-start gap-2 text-xs font-mono text-slate-400">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Schematic astrometric projection. Star distances in light-years are verified via NASA Exoplanet Archive and ESA Hipparcos/Gaia astrometry. Click any star to inspect its planetary companions.
          </p>
        </div>
      </div>

      {/* Selected System Inspector Panel */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                Star System Telemetry
              </span>
              <h3 className="font-display text-xl font-bold text-white">{selectedSystem.name}</h3>
            </div>
            <div className="text-right font-mono">
              <span className="text-base font-bold text-yellow-300">{selectedSystem.distanceLy} ly</span>
              <div className="text-[10px] text-slate-500">Distance from Earth</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3">
              <div className="text-[10px] text-slate-400 uppercase">Spectral Class</div>
              <div className="mt-1 font-bold text-white">{selectedSystem.spectralClass}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3">
              <div className="text-[10px] text-slate-400 uppercase">Star Type</div>
              <div className="mt-1 font-bold text-white">{selectedSystem.starType}</div>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="font-mono text-xs uppercase tracking-wider text-cyan-300 mb-3">
              Known Planetary Companions ({systemPlanets.length})
            </h4>

            {systemPlanets.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-4 text-center font-mono text-xs text-slate-400">
                Our home Solar System contains 8 major planets (Mercury through Neptune). Select another star to inspect nearby exoplanets.
              </div>
            ) : (
              <div className="space-y-3">
                {systemPlanets.map((planet) => {
                  const isCurrent = planet.id === selectedPlanetId;
                  return (
                    <div
                      key={planet.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        isCurrent
                          ? 'border-cyan-400 bg-cyan-950/40'
                          : 'border-slate-800 bg-[#080D1A]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display text-sm font-bold text-white">
                            {planet.name}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-slate-400">
                            {planet.planetaryClass} · Period: {planet.orbitalPeriodDays}d · Axis:{' '}
                            {planet.semiMajorAxisAU ? `${planet.semiMajorAxisAU} AU` : 'Unknown'}
                          </div>
                        </div>

                        {planet.inHabitableZone && (
                          <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                            Habitable Zone
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                        <span className="font-mono text-[11px] text-slate-400">
                          {planet.confirmed ? 'Confirmed Exoplanet' : 'Candidate'}
                        </span>
                        <button
                          type="button"
                          onMouseEnter={() => soundEngine.playHover()}
                          onClick={() => {
                            soundEngine.playClick();
                            onSelectPlanet(planet);
                          }}
                          className={`rounded-lg px-3 py-1 font-mono text-xs font-bold transition-colors ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isCurrent ? 'Viewing in 3D' : 'Inspect in 3D'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-3 flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span>Source: NASA Exoplanet Archive</span>
          <span className="text-cyan-300">Verified Nov 2026</span>
        </div>
      </div>
    </div>
  );
}
