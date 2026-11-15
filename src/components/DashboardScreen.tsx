import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  Globe,
  Milestone,
  Play,
  Rocket,
  RotateCcw,
  Star,
  Telescope,
} from 'lucide-react';
import { GameScreen, TraineeProfile } from '../types/game';
import { SCIENCE_LESSONS } from '../data/nasaScienceData';
import { SCIENTIFIC_INVESTIGATIONS, WORLDS } from '../data/openWorldMissions';
import {
  calculatePerformance,
  calculateLevelFromXp,
  calculateStarBreakdown,
  calculateStarRankProgress,
} from '../utils/storage';
import { soundEngine } from '../utils/sound';
import artNavigation from '../assets/images/mission_navigation_orbit_1794737394472.jpg';
import artRobotics from '../assets/images/mission_robotics_arm_1794737394980.jpg';
import artEmergency from '../assets/images/mission_emergency_deck_1794737396171.jpg';
import artFlightExam from '../assets/images/mission_flight_exam_1794737396677.jpg';
import artExpedition from '../assets/images/academy_solar_expedition_1794737396924.jpg';

interface DashboardScreenProps {
  profile: TraineeProfile;
  onNavigate: (screen: GameScreen) => void;
  onResetProfile: () => void;
}

export function DashboardScreen({ profile, onNavigate, onResetProfile }: DashboardScreenProps) {
  const [brokenArt, setBrokenArt] = useState<Record<string, boolean>>({});
  const perf = calculatePerformance(profile);
  const rank = calculateLevelFromXp(profile.openWorld.xp);
  const starBreakdown = calculateStarBreakdown(profile);
  const starRank = calculateStarRankProgress(starBreakdown.totalStars);
  const currentWorldCfg = WORLDS[profile.openWorld.currentWorld];

  const missionCards: {
    id: keyof TraineeProfile['missions'];
    number: string;
    title: string;
    subtitle: string;
    description: string;
    screen: GameScreen;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    artSrc: string;
    artAlt: string;
    Icon: typeof Compass;
  }[] = [
    {
      id: 'navigation',
      number: 'Mission 01',
      title: 'Space Navigation',
      subtitle: 'Orbital Coordinates & Routing',
      description:
        'Plot coordinate waypoints or fly manually through asteroid belts to dock safely at the station.',
      screen: 'MISSION_NAVIGATION',
      accentText: 'text-cyan-300',
      accentBorder: 'hover:border-cyan-400/70',
      accentBg: 'bg-cyan-400/12',
      artSrc: artNavigation,
      artAlt: 'Orbital spacecraft navigating past asteroids above Earth',
      Icon: Compass,
    },
    {
      id: 'roboticArm',
      number: 'Mission 02',
      title: 'Robotic Arm Simulation',
      subtitle: 'Precision Cargo Transfer',
      description:
        'Operate a multi-joint robotic arm to grab tools, rotate payloads, and dock them in station bays.',
      screen: 'MISSION_ROBOTIC_ARM',
      accentText: 'text-blue-300',
      accentBorder: 'hover:border-blue-400/70',
      accentBg: 'bg-blue-400/12',
      artSrc: artRobotics,
      artAlt: 'Space station robotic manipulator holding a golden solar payload',
      Icon: Cpu,
    },
    {
      id: 'emergency',
      number: 'Mission 03',
      title: 'Emergency Mission',
      subtitle: 'Critical Thinking & Safety',
      description:
        'Inspect real spacecraft telemetry alerts and choose safe engineering solutions to protect the crew.',
      screen: 'MISSION_EMERGENCY',
      accentText: 'text-amber-300',
      accentBorder: 'hover:border-amber-400/70',
      accentBg: 'bg-amber-400/12',
      artSrc: artEmergency,
      artAlt: 'Astronaut commander monitoring orbital telemetry displays inside cupola',
      Icon: AlertTriangle,
    },
    {
      id: 'evaluation',
      number: 'Mission 04',
      title: 'Astronaut Score & Flight Exam',
      subtitle: 'Readiness Check & Certificate',
      description:
        'Complete your final astronaut readiness check to evaluate all skills and unlock your graduation certificate.',
      screen: 'MISSION_EVALUATION',
      accentText: 'text-violet-300',
      accentBorder: 'hover:border-violet-400/70',
      accentBg: 'bg-violet-400/12',
      artSrc: artFlightExam,
      artAlt: 'Orbital spaceplane ascending into deep space above Earth',
      Icon: Award,
    },
  ];

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Unified Aerospace Mission Control Console with 3D Expedition Showcase */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-7">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                Mission Control · Level {rank.level} {rank.title} · Adaptive Tier:{' '}
                {profile.openWorld.difficultyTier.toUpperCase()}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Welcome to Mission Control, {profile.name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-300">
                {perf.encouragement}
              </p>
            </div>

            {/* Hairline-Divided 3-Column Tabular Metrics */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800 pt-4">
              <div className="pr-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Academy XP
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                  {profile.openWorld.xp}
                </div>
              </div>
              <div className="px-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  3D Mysteries
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                  {profile.openWorld.solvedInvestigations.length}
                  <span className="text-xs font-normal text-slate-500">
                    {' '}
                    / {SCIENTIFIC_INVESTIGATIONS.length}
                  </span>
                </div>
              </div>
              <div className="pl-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Simulators
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  {perf.missionsCompletedCount}
                  <span className="text-xs font-normal text-slate-500"> / 4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Illustrated Expedition Backdrop */}
          <div className="relative min-h-[190px] overflow-hidden border-t border-slate-800 bg-[#080D1A] lg:col-span-5 lg:border-t-0 lg:border-l">
            {!brokenArt.expedition ? (
              <img
                src={artExpedition}
                alt="Planetary rover outpost overlooking crater ridge and ringed giant"
                referrerPolicy="no-referrer"
                onError={() => setBrokenArt((prev) => ({ ...prev, expedition: true }))}
                className="h-full w-full object-cover object-center opacity-90"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#080D1A] via-[#0F1E3D] to-[#162848]">
                <Globe className="h-12 w-12 text-cyan-400/60" />
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080D1A] via-[#080D1A]/30 to-transparent lg:bg-gradient-to-r lg:from-[#0C1222]/75 lg:via-transparent lg:to-transparent"
            />
            <div className="absolute right-4 bottom-3 left-4 flex items-end justify-between gap-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">
                  Active Sector
                </div>
                <div className="font-display text-base font-bold text-white">
                  {currentWorldCfg.name}
                </div>
              </div>
              <span className="font-mono text-xs text-slate-200 tabular-nums">
                {currentWorldCfg.gravityMs2} m/s²
              </span>
            </div>
          </div>
        </div>

        {/* XP & Star Rank Progression Ladder */}
        <div className="border-t border-slate-800/90 bg-[#090F1E] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="font-bold text-white">
                Star Rank: <span className="text-yellow-300">{starRank.currentRank.title}</span>
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-yellow-300 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                <span>{starBreakdown.totalStars} Stars</span>
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-400 tabular-nums">
                {rank.isMaxLevel
                  ? 'Maximum Level 100 Reached'
                  : `${rank.xpToNext} XP to Level ${rank.level + 1} (${rank.nextLevelXp} XP)`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                {profile.openWorld.xp}
                {!rank.isMaxLevel ? ` / ${rank.nextLevelXp}` : ''} XP ({rank.progressPct}%)
              </span>
              <button
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playRankSelect();
                  onNavigate('RANKS_REWARDS');
                }}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-yellow-400/50 bg-yellow-400/12 px-3 py-1 text-xs font-bold text-yellow-200 transition-colors hover:bg-yellow-400 hover:text-slate-950 whitespace-nowrap shrink-0"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Ranks &amp; Rewards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Level Progression Milestones (Every 25 Levels) */}
        <div className="border-t border-slate-800/90 bg-[#090F1E] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-3">
            <span>Level Milestones &amp; Titles (Max Level 100 · Title changes every 25 levels)</span>
            <span className="text-yellow-300 font-bold">Current Title: {rank.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { lvl: 1, title: 'Cadet Explorer' },
              { lvl: 26, title: 'Senior Flight Engineer' },
              { lvl: 51, title: 'Elite Space Commander' },
              { lvl: 76, title: 'Mission Hero Commander' },
            ].map((m) => {
              const unlocked = rank.level >= m.lvl;
              const isCurrent = rank.level >= m.lvl && (m.lvl === 76 ? rank.level >= 76 : rank.level < m.lvl + 25);
              return (
                <div
                  key={m.lvl}
                  className={`rounded-xl border px-3 py-2 ${
                    isCurrent
                      ? 'border-cyan-400/70 bg-cyan-500/12'
                      : unlocked
                        ? 'border-emerald-500/35 bg-[#0C1222]'
                        : 'border-slate-800/90 bg-[#080D1A] opacity-70'
                  }`}
                >
                  <div className="font-mono text-[10px] text-cyan-300">Level {m.lvl}+</div>
                  <div className="mt-0.5 font-display text-xs font-bold text-white truncate">{m.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrated Launch Bay Strip */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-800/90 bg-[#080D1A] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/12 text-cyan-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-xs text-cyan-300">
                3D Open-World Exploration · 10 Solar System Destinations
              </div>
              <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
                Walk terrain &amp; pilot 6×6 rovers, scan equipment with [E], collect samples (
                {profile.openWorld.inventory.length} logged), and consult ARIA AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('WORLD_EXPLORE')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0"
          >
            <Rocket className="h-4 w-4" />
            <span>Enter 3D World</span>
          </button>
        </div>
      </section>

      {/* 4 Main Playable Missions with Illustrated Artwork Headers */}
      <section className="mt-7">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">
            Astronaut Training Simulators
          </h2>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {perf.missionsCompletedCount} / 4 COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {missionCards.map((card) => {
            const metric = profile.missions[card.id];
            const Icon = card.Icon;
            return (
              <article
                key={card.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] transition-colors duration-150 ${card.accentBorder}`}
              >
                <div>
                  {/* Illustrated 16:9 Artwork Banner */}
                  <div className="relative h-40 w-full overflow-hidden border-b border-slate-800/80 bg-[#080D1A]">
                    {!brokenArt[card.id] ? (
                      <img
                        src={card.artSrc}
                        alt={card.artAlt}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenArt((prev) => ({ ...prev, [card.id]: true }))}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#080D1A] to-[#13203C]">
                        <Icon className={`h-10 w-10 ${card.accentText}`} />
                      </div>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1222] via-[#0C1222]/25 to-transparent"
                    />
                    <div className="absolute right-4 bottom-3 left-4 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {card.number} · {card.subtitle}
                      </span>
                      {metric.completed ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-medium text-slate-300 shrink-0">
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.accentBg}`}
                      >
                        <Icon className={`h-4 w-4 ${card.accentText}`} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white">{card.title}</h3>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-800/80 px-5 py-4">
                  <div className="font-mono text-xs text-slate-400 tabular-nums">
                    {metric.attempts > 0 ? (
                      <span>
                        Best <strong className="text-white">{metric.score}</strong>/100 ·{' '}
                        {metric.accuracy}% acc
                      </span>
                    ) : (
                      <span>No flights logged</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(card.screen)}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>{metric.completed ? 'Play Again' : 'Start Mission'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Secondary Row: Nearby Exoplanets + Space Travel History + Academy + Full Evaluation */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-[#0C1222] via-[#0E1832] to-[#121E3D] p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="font-mono text-xs text-cyan-300 uppercase tracking-wider">
                NASA Exoplanet Archive
              </div>
              <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                Nearby Exoplanets
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Explore verified real exoplanets like Proxima Centauri b, Barnard's Star b, and Ross 128 b with 3D visualizations, star system maps, and exploration missions.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('NEARBY_EXOPLANETS')}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Telescope className="h-4 w-4" />
              <span>Explore Exoplanets</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#0C1222] via-[#1A162B] to-[#1E142B] p-5 sm:p-6 shadow-[0_0_25px_rgba(245,158,11,0.12)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
              <Milestone className="h-6 w-6" />
            </div>
            <div>
              <div className="font-mono text-xs text-amber-300 uppercase tracking-wider">
                Historic Space Flights &amp; Physics
              </div>
              <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                What Happened in Space Travels
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Witness what happens during real space travel: Apollo 11 alarms, Gagarin’s 5G re-entry, Apollo 13 rescue, 1,600°C plasma blackouts, and human body microgravity changes.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('SPACE_TRAVEL_HISTORY')}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Rocket className="h-4 w-4" />
              <span>Explore Space Travels</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/12">
              <BookOpen className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-mono text-xs text-cyan-300 tabular-nums">
                NASA Open Data · {profile.academy.completedLessons.length}/{SCIENCE_LESSONS.length}{' '}
                Lessons Completed
              </div>
              <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                Space Science Academy
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Compare planetary gravity, inspect Space Station orbital telemetry, and complete
                science readiness quizzes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('SCIENCE_ACADEMY')}
            className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-400/12 px-5 py-2 text-sm font-bold text-cyan-200 transition-colors hover:bg-cyan-400 hover:text-slate-950 sm:mt-0 whitespace-nowrap shrink-0"
          >
            <span>Open Academy</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0C1222] p-5">
          <div>
            <div className="font-mono text-xs text-amber-300">Performance &amp; Award</div>
            <h3 className="mt-0.5 font-display text-lg font-bold text-white">
              Results &amp; Certificate
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              View skill calibration and download your Astronaut Certificate.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('RESULTS')}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap"
            >
              <Award className="h-4 w-4" />
              <span>View Report</span>
            </button>

            <button
              type="button"
              onClick={onResetProfile}
              title="Switch astronaut or reset progress"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-800 bg-[#080D1A] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/60 hover:text-rose-200 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch Cadet</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
