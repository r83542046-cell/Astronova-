import { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Orbit,
  Play,
  Sparkles,
  Star,
  Telescope,
  Thermometer,
} from 'lucide-react';
import { TraineeProfile } from '../types/game';
import { NEARBY_EXOPLANETS, NearbyExoplanet } from '../data/nearbyExoplanetsData';
import { soundEngine } from '../utils/sound';
import { calculateStarBreakdown } from '../utils/storage';
import { ExoplanetViewer3D } from './exoplanets/ExoplanetViewer3D';
import { StarSystemOrreryMap } from './exoplanets/StarSystemOrreryMap';
import { ExoplanetScienceTelemetry } from './exoplanets/ExoplanetScienceTelemetry';

interface NearbyExoplanetsScreenProps {
  profile: TraineeProfile;
  onCompleteMission: (missionId: string, xp: number) => void;
}

export function NearbyExoplanetsScreen({ profile, onCompleteMission }: NearbyExoplanetsScreenProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<NearbyExoplanet>(NEARBY_EXOPLANETS[0]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'map' | 'telemetry' | 'missions'>('catalog');
  const [completedExoMissions, setCompletedExoMissions] = useState<string[]>(
    profile.openWorld.claimedRewardIds?.filter((id) => id.startsWith('exo-mission-')) || []
  );

  const starBreakdown = calculateStarBreakdown(profile);

  const explorationMissions = [
    {
      id: 'exo-mission-proxima',
      title: 'Proxima Centauri Reconnaissance',
      system: 'Proxima Centauri',
      targetPlanet: 'Proxima Centauri b',
      description: 'Analyze atmospheric retention and stellar flare exposure on humanity’s closest exoplanet neighbor located 4.25 light-years away.',
      rewardXp: 45,
      rewardStars: 2,
    },
    {
      id: 'exo-mission-barnard',
      title: "Barnard's Star Astrometry Survey",
      system: "Barnard's Star",
      targetPlanet: "Barnard's Star b",
      description: 'Measure proper motion Doppler shifts to verify sub-Earth rocky worlds orbiting high-velocity red dwarf stars.',
      rewardXp: 50,
      rewardStars: 2,
    },
    {
      id: 'exo-mission-ross',
      title: 'Ross 128 Temperate Climate Survey',
      system: 'Ross 128',
      targetPlanet: 'Ross 128 b',
      description: 'Investigate greenhouse climate stability on a quiet red dwarf world with near-Earth equilibrium temperatures.',
      rewardXp: 60,
      rewardStars: 3,
    },
    {
      id: 'exo-mission-comparison',
      title: 'Multi-System Comparative Astrophysics',
      system: 'Various Systems',
      targetPlanet: 'Epsilon Eridani b & GJ 887 c',
      description: 'Compare super-Earth densities, gas giant circumstellar dust disks, and transmission spectroscopy signatures across K and M spectral classes.',
      rewardXp: 40,
      rewardStars: 2,
    },
  ];

  const handleClaimExoMission = (missionId: string, xp: number) => {
    if (completedExoMissions.includes(missionId)) return;
    soundEngine.playSuccess();
    setCompletedExoMissions((prev) => [...prev, missionId]);
    onCompleteMission(missionId, xp);
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header Banner: Clean NASA Mission Control Telemetry Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
              <span>NASA Exoplanet Archive Data Feed</span>
              <span aria-hidden="true">·</span>
              <span>Verified Astronomical Measurements</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Status: Calibrated</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl">
              NEARBY EXOPLANETS – Explore Worlds Beyond Our Solar System
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-300 max-w-3xl">
              Inspect confirmed exoplanets and candidates located within 12 light-years of Earth. All planetary mass, radius, distance, and host star properties are synchronized with the official NASA Exoplanet Archive.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-slate-800 bg-[#080D1A] px-4 py-2 font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cataloged Worlds</div>
              <div className="text-xl font-bold text-cyan-300 tabular-nums">
                {NEARBY_EXOPLANETS.length} Targets
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Functional Segmented Control) */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'catalog', label: '3D Planet Exploration & Catalog', icon: Telescope },
            { id: 'map', label: 'Interactive Star System Orrery Map', icon: Orbit },
            { id: 'telemetry', label: 'Spectroscopy & Habitable Zone Data', icon: Activity },
            { id: 'missions', label: 'Research Exploration Missions', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                    : 'border border-slate-800 bg-[#080D1A] text-slate-300 hover:border-cyan-400/50 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CATALOG & 3D PLANET EXPLORATION */}
      {activeTab === 'catalog' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Planet Selection Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                Select Planetary Target
              </span>
              <span className="font-mono text-xs text-cyan-300">
                {NEARBY_EXOPLANETS.length} Solar Neighbors
              </span>
            </div>

            <div className="max-h-[660px] space-y-2.5 overflow-y-auto pr-1">
              {NEARBY_EXOPLANETS.map((planet) => {
                const isSelected = selectedPlanet.id === planet.id;
                return (
                  <button
                    key={planet.id}
                    type="button"
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPlanet(planet);
                    }}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
                        : 'border-slate-800 bg-[#0C1222] hover:border-slate-700 hover:bg-[#0E162B]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-bold text-white">
                            {planet.name}
                          </h3>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                          {planet.hostStar} · {planet.starType}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-xs font-bold text-yellow-300 tabular-nums">
                          {planet.distanceLy} ly
                        </div>
                        <div className="text-[10px] text-slate-500">from Earth</div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-300 border-t border-slate-800/80 pt-2">
                      <span>{planet.planetaryClass}</span>
                      <span className={planet.confirmed ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                        {planet.confirmed ? 'Confirmed' : 'Candidate'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive 3D Viewer & Specification Console */}
          <div className="lg:col-span-8 space-y-6">
            {/* 3D Sphere & Scientific Illustration Viewer */}
            <ExoplanetViewer3D planet={selectedPlanet} />

            {/* Scientific Specification Cards */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                    <span>{selectedPlanet.planetaryClass} Exoplanet</span>
                    <span aria-hidden="true">·</span>
                    <span>Distance {selectedPlanet.distanceLy} light-years</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold text-white">
                    {selectedPlanet.name} Astrometric Profile
                  </h2>
                </div>

                <div className="font-mono text-xs text-slate-400">
                  Discovery: <strong className="text-white">{selectedPlanet.discoveryYear}</strong> (
                  {selectedPlanet.discoveryMethod})
                </div>
              </div>

              {/* 4-Column Scientific Data Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Mass (Earth = 1)</div>
                  <div className="mt-1 text-base font-bold text-white tabular-nums">
                    {selectedPlanet.massEarthRatio !== null
                      ? `${selectedPlanet.massEarthRatio} M⊕`
                      : 'Unknown'}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Radius (Earth = 1)</div>
                  <div className="mt-1 text-base font-bold text-white tabular-nums">
                    {selectedPlanet.radiusEarthRatio !== null
                      ? `${selectedPlanet.radiusEarthRatio} R⊕`
                      : 'Unknown'}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Orbital Period</div>
                  <div className="mt-1 text-base font-bold text-white tabular-nums">
                    {selectedPlanet.orbitalPeriodDays !== null
                      ? `${selectedPlanet.orbitalPeriodDays} Days`
                      : 'Unknown'}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Equilibrium Temp</div>
                  <div className="mt-1 text-base font-bold text-white tabular-nums">
                    {selectedPlanet.temperatureCelsius !== null
                      ? `${selectedPlanet.temperatureCelsius}°C (${selectedPlanet.temperatureKelvin} K)`
                      : 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Scientific Facts & Open Scientific Questions */}
              <div className="mt-5 space-y-4">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
                    Verified Astronomical Findings
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    {selectedPlanet.scientificFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    What Scientists Still Don't Know (Active Research Areas)
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    {selectedPlanet.openQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Source & Verification Citation */}
              <div className="mt-6 border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="font-mono text-xs text-slate-400">
                  Scientific Source: <strong className="text-white">{selectedPlanet.sourceName}</strong> · Last Verified:{' '}
                  <span className="text-cyan-300">{selectedPlanet.lastVerified}</span>
                </div>
                <a
                  href={selectedPlanet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => soundEngine.playClick()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080D1A] px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400 hover:text-white transition-colors"
                >
                  <span>NASA Exoplanet Archive Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE STAR SYSTEM ORRERY MAP */}
      {activeTab === 'map' && (
        <div className="mt-6">
          <StarSystemOrreryMap
            selectedPlanetId={selectedPlanet.id}
            onSelectPlanet={(planet) => {
              setSelectedPlanet(planet);
              setActiveTab('catalog');
            }}
          />
        </div>
      )}

      {/* TAB 3: SPECTROSCOPY & HABITABLE ZONE DATA */}
      {activeTab === 'telemetry' && (
        <div className="mt-6 space-y-6">
          {/* Target Selector Header */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0C1222] px-4 py-3">
            <div className="font-mono text-xs text-slate-400">
              Active Spectroscopic Target:{' '}
              <strong className="text-white">{selectedPlanet.name}</strong> ({selectedPlanet.hostStar})
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="font-mono text-xs text-cyan-300 hover:text-white transition-colors"
            >
              Switch Target in Catalog →
            </button>
          </div>

          <ExoplanetScienceTelemetry planet={selectedPlanet} />
        </div>
      )}

      {/* TAB 4: EXPLORATION MISSIONS */}
      {activeTab === 'missions' && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Exoplanet Science Research Missions
              </h2>
              <p className="text-sm text-slate-300">
                Complete targeted observational research campaigns to earn XP and stars for your Academy rank progression.
              </p>
            </div>
            <div className="font-mono text-xs text-yellow-300 font-bold flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              <span>{starBreakdown.totalStars} Stars Earned</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {explorationMissions.map((mission) => {
              const isCompleted = completedExoMissions.includes(mission.id);
              return (
                <div
                  key={mission.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-slate-800 bg-[#080D1A]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-cyan-300 font-semibold">
                        System: {mission.system}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Research Complete</span>
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-yellow-300 tabular-nums">
                          +{mission.rewardXp} XP · +{mission.rewardStars} Stars
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-white">{mission.title}</h3>
                    <p className="mt-1 text-sm text-slate-300 leading-relaxed">{mission.description}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5">
                    <span className="font-mono text-xs text-slate-400">Target: {mission.targetPlanet}</span>
                    <button
                      type="button"
                      onMouseEnter={() => soundEngine.playHover()}
                      onClick={() => handleClaimExoMission(mission.id, mission.rewardXp)}
                      disabled={isCompleted}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isCompleted ? 'Completed' : 'Execute Research'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
