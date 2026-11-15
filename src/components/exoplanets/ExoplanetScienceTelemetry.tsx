import { Activity, AlertCircle, BarChart3, ExternalLink, Globe, ShieldAlert, Sun, Thermometer } from 'lucide-react';
import { NearbyExoplanet } from '../../data/nearbyExoplanetsData';
import { soundEngine } from '../../utils/sound';

interface ExoplanetScienceTelemetryProps {
  planet: NearbyExoplanet;
}

export function ExoplanetScienceTelemetry({ planet }: ExoplanetScienceTelemetryProps) {
  const hzMin = planet.habitableZoneAU.min;
  const hzMax = planet.habitableZoneAU.max;
  const semiMajor = planet.semiMajorAxisAU ?? 0.05;

  // Calculate percentage along a 0 to (hzMax * 1.5) scale for visual representation
  const maxScaleAU = Math.max(0.25, hzMax * 1.6);
  const planetPct = Math.min(100, Math.max(0, (semiMajor / maxScaleAU) * 100));
  const hzStartPct = Math.min(100, Math.max(0, (hzMin / maxScaleAU) * 100));
  const hzWidthPct = Math.min(100 - hzStartPct, Math.max(4, ((hzMax - hzMin) / maxScaleAU) * 100));

  return (
    <div className="space-y-6">
      {/* 1. Habitable Zone & Stellar Flux Analysis */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-cyan-400" />
            <h3 className="font-display text-base font-bold text-white">
              Habitable Zone &amp; Insolation Boundary
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Semi-Major Axis:{' '}
            <strong className="text-white">
              {planet.semiMajorAxisAU !== null ? `${planet.semiMajorAxisAU} AU` : 'Unknown'}
            </strong>
          </span>
        </div>

        {/* Habitable Zone Scale Graphic */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>Host Star (0.0 AU)</span>
            <span className="text-cyan-300 font-bold">
              Habitable Zone [{hzMin} AU — {hzMax} AU]
            </span>
            <span>Outer Snowline ({maxScaleAU.toFixed(2)} AU)</span>
          </div>

          <div className="relative h-6 w-full overflow-hidden rounded-lg bg-[#080D1A] border border-slate-800">
            {/* Habitable Zone Green Band */}
            <div
              style={{ left: `${hzStartPct}%`, width: `${hzWidthPct}%` }}
              className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-400/60 flex items-center justify-center"
            >
              <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-widest hidden sm:inline">
                Habitable Zone
              </span>
            </div>

            {/* Planet Position Marker */}
            <div
              style={{ left: `${planetPct}%` }}
              className="absolute top-0 bottom-0 w-2.5 -ml-1.25 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] z-10 flex items-center justify-center rounded-sm"
              title={`${planet.name} at ${planet.semiMajorAxisAU} AU`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Too Hot (Runaway Greenhouse)</span>
            <span className={planet.inHabitableZone ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
              {planet.inHabitableZone
                ? `● ${planet.name} is within the conservative habitable zone`
                : `○ ${planet.name} orbits outside the habitable zone`}
            </span>
            <span>Too Cold (Maximum Greenhouse)</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/15 p-3 flex items-start gap-2.5 text-xs text-amber-200/90 font-mono">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Astrophysical Caution: Presence inside a star's habitable zone allows the theoretical existence of liquid surface water, but does not guarantee an atmosphere or habitability. Atmospheric retention depends heavily on stellar flare activity and magnetic shielding.
          </p>
        </div>
      </div>

      {/* 2. Transmission Spectroscopy Analysis */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="font-display text-base font-bold text-white">
              Transmission Spectroscopy (Simulated JWST NIRSpec Data)
            </h3>
          </div>
          <span className="font-mono text-xs text-cyan-300">
            Wavelength Range: 1.0 – 5.0 μm
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-300">
            Atmospheric Status: <strong className="text-white">{planet.atmosphereStatus}</strong>
          </p>

          {/* Simple Spectroscopic Bar Graph */}
          <div className="mt-4 h-36 w-full rounded-xl border border-slate-800 bg-[#080D1A] p-4 flex items-end justify-between gap-2">
            {planet.spectroscopyData.map((pt, idx) => {
              const maxPpm = 1400;
              const hPct = Math.min(100, Math.max(12, (pt.relativeAbsorptionPpm / maxPpm) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex justify-center">
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all group-hover:from-cyan-400 group-hover:to-sky-200"
                    />
                  </div>
                  <span className="font-mono text-[9px] text-slate-400 tabular-nums">
                    {pt.wavelengthUm}μ
                  </span>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white font-mono text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-20 shadow-lg">
                    {pt.relativeAbsorptionPpm} ppm {pt.chemicalLabel ? `· ${pt.chemicalLabel}` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
            <span>Absorption depth in parts per million (ppm)</span>
            <span className="text-cyan-300">JWST GTO &amp; Ground High-Resolution Target</span>
          </div>
        </div>
      </div>

      {/* 3. Host Star vs. Sun Physical Comparison */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-400" />
            <h3 className="font-display text-base font-bold text-white">
              Host Star Stellar Properties vs. Sol (Our Sun)
            </h3>
          </div>
          <span className="font-mono text-xs text-amber-300 font-bold">{planet.hostStar}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Effective Temp</div>
            <div className="mt-1 text-base font-bold text-white">
              {planet.stellarTempK} K
            </div>
            <div className="text-[10px] text-slate-500">Sun: 5,778 K</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Stellar Radius</div>
            <div className="mt-1 text-base font-bold text-white">
              {planet.stellarRadiusSunRatio} R☉
            </div>
            <div className="text-[10px] text-slate-500">Sun: 1.00 R☉</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Luminosity</div>
            <div className="mt-1 text-base font-bold text-white">
              {planet.stellarLuminositySunRatio} L☉
            </div>
            <div className="text-[10px] text-slate-500">Sun: 1.00 L☉</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Radial Wobble (K)</div>
            <div className="mt-1 text-base font-bold text-white">
              {planet.radialVelocityAmplitudeK !== null
                ? `${planet.radialVelocityAmplitudeK} m/s`
                : 'Unknown'}
            </div>
            <div className="text-[10px] text-slate-500">Semi-amplitude</div>
          </div>
        </div>
      </div>
    </div>
  );
}
