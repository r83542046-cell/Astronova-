import { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Milestone,
  Play,
  Quote,
  Radio,
  Rocket,
  ShieldAlert,
  Sparkles,
  Star,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { TraineeProfile } from '../../types/game';
import {
  SPACE_TRAVEL_EVENTS,
  SPACE_TRAVEL_PHENOMENA,
  SPACE_TRAVEL_PROBLEMS,
  SpaceTravelEvent,
  SpaceTravelProblem,
} from '../../data/spaceTravelHistoryData';
import { soundEngine } from '../../utils/sound';
import { calculateStarBreakdown } from '../../utils/storage';

interface SpaceTravelHistoryScreenProps {
  profile: TraineeProfile;
  onCompleteHistoryStudy: (studyId: string, xpGain: number) => void;
}

export function SpaceTravelHistoryScreen({
  profile,
  onCompleteHistoryStudy,
}: SpaceTravelHistoryScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<SpaceTravelEvent>(SPACE_TRAVEL_EVENTS[0]);
  const [selectedProblem, setSelectedProblem] = useState<SpaceTravelProblem>(SPACE_TRAVEL_PROBLEMS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'problems' | 'phenomena' | 'simulator'>('problems');
  const [studiedEvents, setStudiedEvents] = useState<string[]>(
    profile.openWorld.claimedRewardIds?.filter((id) => id.startsWith('history-study-')) || []
  );

  // Problem Quiz State
  const [problemSelections, setProblemSelections] = useState<Record<string, number>>({});
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>(
    profile.openWorld.claimedRewardIds?.filter((id) => id.startsWith('problem-solve-')) || []
  );
  const [quizFeedback, setQuizFeedback] = useState<Record<string, 'correct' | 'wrong' | null>>({});

  // Interactive Re-entry Simulator State
  const [reentryStep, setReentryStep] = useState<number>(0);
  const [reentryRunning, setReentryRunning] = useState<boolean>(false);

  const starBreakdown = calculateStarBreakdown(profile);

  const filteredEvents = SPACE_TRAVEL_EVENTS.filter(
    (ev) => categoryFilter === 'all' || ev.category === categoryFilter
  );

  const handleStudyMission = (eventId: string) => {
    if (studiedEvents.includes(eventId)) return;
    soundEngine.playSuccess();
    setStudiedEvents((prev) => [...prev, eventId]);
    onCompleteHistoryStudy(eventId, 40);
  };

  const handleSelectProblemOption = (problemId: string, optionIndex: number) => {
    soundEngine.playClick();
    setProblemSelections((prev) => ({ ...prev, [problemId]: optionIndex }));
  };

  const handleVerifyProblemSolution = (problem: SpaceTravelProblem) => {
    const selected = problemSelections[problem.id];
    if (selected === undefined) return;

    if (selected === problem.interactiveCorrectIndex) {
      soundEngine.playSuccess();
      setQuizFeedback((prev) => ({ ...prev, [problem.id]: 'correct' }));
      if (!solvedProblemIds.includes(problem.id)) {
        setSolvedProblemIds((prev) => [...prev, problem.id]);
        onCompleteHistoryStudy(`problem-solve-${problem.id}`, 50);
      }
    } else {
      soundEngine.playFailure();
      setQuizFeedback((prev) => ({ ...prev, [problem.id]: 'wrong' }));
    }
  };

  const runReentrySimulation = () => {
    soundEngine.playClick();
    setReentryRunning(true);
    setReentryStep(1);

    const timers = [
      setTimeout(() => setReentryStep(2), 2200),
      setTimeout(() => setReentryStep(3), 4600),
      setTimeout(() => setReentryStep(4), 7200),
      setTimeout(() => {
        setReentryStep(5);
        setReentryRunning(false);
        soundEngine.playSuccess();
      }, 9800),
    ];

    return () => timers.forEach(clearTimeout);
  };

  const reentryStages = [
    {
      step: 1,
      title: 'De-Orbit Retrograde Burn',
      alt: '400 km',
      speed: '27,800 km/h (Mach 23)',
      temp: '-50°C',
      telemetry: 'RCS thrusters fire retrograde for 4m 30s. Orbital periapsis lowered into upper atmosphere.',
      status: 'nominal',
    },
    {
      step: 2,
      title: 'Atmospheric Entry Interface',
      alt: '122 km (400,000 ft)',
      speed: '28,000 km/h (Mach 25)',
      temp: '450°C',
      telemetry: 'First trace atmospheric molecules compress against heat shield. Attitude guidance active.',
      status: 'nominal',
    },
    {
      step: 3,
      title: 'Peak Heating & 1,600°C Plasma Radio Blackout',
      alt: '65 km',
      speed: '21,000 km/h',
      temp: '1,650°C (3,000°F)',
      telemetry: 'Shockwave air ionization envelopes capsule in glowing plasma sheath. ALL RADIO SIGNALS DEAD.',
      status: 'critical',
    },
    {
      step: 4,
      title: 'Supersonic Drogue Chute Deployment',
      alt: '7.5 km',
      speed: '550 km/h',
      temp: '65°C',
      telemetry: 'Plasma dissipates; radio link restored! Twin drogue chutes deploy to stabilize capsule orientation.',
      status: 'nominal',
    },
    {
      step: 5,
      title: 'Main Parachutes & Pacific Ocean Splashdown',
      alt: '0 m (Ocean Surface)',
      speed: '28 km/h',
      temp: '24°C',
      telemetry: 'Triple main parachutes deploy at 3,000 m. Soft water touchdown. Recovery team deployed!',
      status: 'historic',
    },
  ];

  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Top Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>NASA Flight Anomaly &amp; Emergency Investigation Archive</span>
              <span aria-hidden="true">·</span>
              <span>Verified In-Flight Telemetry</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl">
              PROBLEMS &amp; EMERGENCIES IN SPACE TRAVELS
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-300 max-w-3xl">
              Inspect the greatest real-world technical crises, hardware failures, computer overloads, and in-flight near-disasters in human spaceflight history—and the engineering solutions that brought the crews home alive.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-slate-800 bg-[#080D1A] px-4 py-2 font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Emergencies Analyzed</div>
              <div className="text-xl font-bold text-amber-300 tabular-nums">
                {SPACE_TRAVEL_PROBLEMS.length} Critical Cases
              </div>
            </div>
          </div>
        </div>

        {/* Top Functional Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'problems', label: 'Critical In-Flight Problems & Emergencies', icon: ShieldAlert },
            { id: 'timeline', label: 'Historic Space Flight Chronicles', icon: Milestone },
            { id: 'phenomena', label: 'Physical Phenomena: What Happens to Humans in Space', icon: Flame },
            { id: 'simulator', label: 'Atmospheric Re-entry Flight Simulator', icon: Radio },
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
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'border border-slate-800 bg-[#080D1A] text-slate-300 hover:border-amber-400/50 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 0: CRITICAL IN-FLIGHT PROBLEMS & EMERGENCIES (NEW) */}
      {activeTab === 'problems' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Emergency Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                Select Spaceflight Anomaly
              </span>
              <span className="font-mono text-xs text-amber-300">
                {SPACE_TRAVEL_PROBLEMS.length} Case Studies
              </span>
            </div>

            {SPACE_TRAVEL_PROBLEMS.map((prob) => {
              const isSelected = selectedProblem.id === prob.id;
              const isSolved = solvedProblemIds.includes(prob.id);
              return (
                <button
                  key={prob.id}
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedProblem(prob);
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/35 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                      : 'border-slate-800 bg-[#0C1222] hover:border-slate-700 hover:bg-[#0E162B]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-amber-300">
                    <span>{prob.mission} ({prob.year})</span>
                    {isSolved ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Solved</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold uppercase text-[10px]">
                        {prob.criticality === 'life-threatening' ? 'Life Hazard' : 'System Critical'}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-display text-sm font-bold text-white">
                    {prob.title}
                  </h3>
                  <div className="mt-1 font-mono text-[10px] text-slate-400 truncate">
                    Alarm: <span className="text-slate-300">{prob.alarmCode}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deep-Dive Problem Investigation & Resolution Console */}
          <div className="lg:col-span-8 space-y-5">
            {/* Mission Anomaly Briefing Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-amber-300">
                    <AlertOctagon className="h-4 w-4 text-rose-400" />
                    <span>{selectedProblem.mission}</span>
                    <span aria-hidden="true">·</span>
                    <span>Year {selectedProblem.year}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-400 uppercase font-bold">
                      {selectedProblem.criticality.replace('-', ' ')}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                    {selectedProblem.title}
                  </h2>
                </div>

                <div className="rounded-lg border border-rose-500/40 bg-rose-950/20 px-3 py-1.5 font-mono text-xs text-rose-200">
                  <div className="text-[9px] uppercase tracking-wider text-rose-400">Master Alarm</div>
                  <div className="font-bold">{selectedProblem.alarmCode}</div>
                </div>
              </div>

              {/* Subsystem & Root Cause */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-4">
                  <div className="font-mono text-xs font-bold text-cyan-300 uppercase flex items-center gap-1.5 mb-1.5">
                    <Cpu className="h-4 w-4" />
                    <span>Affected Subsystem</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {selectedProblem.subsystem}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-4">
                  <div className="font-mono text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5 mb-1.5">
                    <Flame className="h-4 w-4" />
                    <span>Root Cause Failure</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProblem.rootCause}
                  </p>
                </div>
              </div>

              {/* Mortal Danger Faced by the Crew */}
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/15 p-4">
                <h4 className="font-mono text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Immediate Life-or-Death Danger</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {selectedProblem.immediateDanger}
                </p>
              </div>

              {/* The Emergency Solution That Saved the Crew */}
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4">
                <h4 className="font-mono text-xs font-bold text-emerald-300 uppercase flex items-center gap-1.5 mb-1.5">
                  <Wrench className="h-4 w-4 text-emerald-400" />
                  <span>How the Problem Was Solved in Space</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {selectedProblem.emergencySolution}
                </p>
              </div>

              {/* Real Audio / Radio Quote */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-[#080D1A] p-4 flex items-start gap-3">
                <Quote className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                    Actual Air-to-Ground Radio Transmission
                  </div>
                  <blockquote className="mt-1 font-display text-sm font-semibold italic text-amber-100">
                    "{selectedProblem.radioQuote}"
                  </blockquote>
                </div>
              </div>

              {/* Aerospace Reform & Prevention */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-[#080D1A] p-4">
                <h4 className="font-mono text-xs font-bold text-cyan-300 uppercase mb-1">
                  Aerospace Engineering Reform (How NASA Prevented It From Happening Again)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedProblem.reformAndPrevention}
                </p>
              </div>
            </div>

            {/* Interactive Cadet Emergency Challenge */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#0C1222] p-5 sm:p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-display text-base font-bold text-white">
                    Cadet Flight Controller Challenge: Solve the Emergency
                  </h3>
                </div>
                <span className="font-mono text-xs text-yellow-300 font-bold">
                  +50 Academy XP · 1 Star
                </span>
              </div>

              <div className="mt-4">
                <p className="font-display text-sm font-semibold text-white">
                  {selectedProblem.interactiveChallengeQuestion}
                </p>

                <div className="mt-3 space-y-2">
                  {selectedProblem.interactiveChallengeOptions.map((opt, optIdx) => {
                    const isSelected = problemSelections[selectedProblem.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onMouseEnter={() => soundEngine.playHover()}
                        onClick={() => handleSelectProblemOption(selectedProblem.id, optIdx)}
                        className={`w-full text-left rounded-xl border p-3 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-white'
                            : 'border-slate-800 bg-[#080D1A] text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] text-cyan-400 font-bold">
                            [{optIdx + 1}]
                          </span>
                          <span>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => handleVerifyProblemSolution(selectedProblem)}
                    disabled={problemSelections[selectedProblem.id] === undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 whitespace-nowrap"
                  >
                    <span>Execute Emergency Protocol</span>
                  </button>

                  {quizFeedback[selectedProblem.id] === 'correct' && (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        EMERGENCY RESOLVED! Correct action taken. +50 XP awarded to Cadet record.
                      </span>
                    </div>
                  )}

                  {quizFeedback[selectedProblem.id] === 'wrong' && (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-rose-300">
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>
                        INCORRECT PROCEDURE: Telemetry failure persists. Review the emergency solution above and retry.
                      </span>
                    </div>
                  )}
                </div>

                {quizFeedback[selectedProblem.id] === 'correct' && (
                  <p className="mt-3 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2.5">
                    <strong>Flight Debrief: </strong>
                    {selectedProblem.interactiveExplanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: HISTORIC SPACE FLIGHT CHRONICLES */}
      {activeTab === 'timeline' && (
        <div className="mt-6 space-y-6">
          {/* Category Filter Pills (Functional Buttons) */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Historic Flights' },
              { id: 'moon', label: 'Moon Expeditions (Apollo & Artemis)' },
              { id: 'human-flight', label: 'Human Spaceflight Milestones' },
              { id: 'stations', label: 'Space Stations (ISS & Mir)' },
              { id: 'deep-space', label: 'Deep Space Probes (Voyager)' },
              { id: 'mars', label: 'Mars Expeditions (Perseverance & Ingenuity)' },
              { id: 'telescopes', label: 'Space Telescopes (JWST & Hubble)' },
            ].map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playClick();
                    setCategoryFilter(cat.id);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-200 text-slate-950 shadow-sm'
                      : 'border border-slate-800 bg-[#0C1222] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mission Selector Sidebar */}
            <div className="lg:col-span-4 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredEvents.map((ev) => {
                const isSelected = selectedEvent.id === ev.id;
                const isStudied = studiedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedEvent(ev);
                    }}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
                        : 'border-slate-800 bg-[#0C1222] hover:border-slate-700 hover:bg-[#0E162B]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                      <span>{ev.year} · {ev.dateStr}</span>
                      {isStudied && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Studied</span>
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-display text-sm font-bold text-white">
                      {ev.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {ev.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detailed Mission Inspector Card */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                      <span>{selectedEvent.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedEvent.dateStr}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedEvent.spacecraft}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-white">
                      {selectedEvent.title}
                    </h2>
                  </div>

                  <div className="font-mono text-xs text-slate-400">
                    Crew / Agency: <strong className="text-white">{selectedEvent.crewOrAgency}</strong>
                  </div>
                </div>

                {/* Optional Historic Documentary Image */}
                {selectedEvent.imageSrc && (
                  <div className="relative mt-5 h-64 sm:h-80 w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
                    <img
                      src={selectedEvent.imageSrc}
                      alt={selectedEvent.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1222] via-transparent to-transparent"
                    />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <span className="font-mono text-xs text-white bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm">
                        {selectedEvent.title} · NASA Historical Record
                      </span>
                    </div>
                  </div>
                )}

                {/* Historic Quote */}
                {selectedEvent.keyQuote && (
                  <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex items-start gap-3">
                    <Quote className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <blockquote className="font-display text-sm sm:text-base font-semibold italic text-cyan-100">
                      "{selectedEvent.keyQuote}"
                    </blockquote>
                  </div>
                )}

                {/* What Happened During the Flight */}
                <div className="mt-5">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>What Happened During Space Travel (Chronological Flight Log)</span>
                  </h4>

                  <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
                    {selectedEvent.whatHappened.map((para, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-cyan-400 font-mono text-xs font-bold mt-0.5">
                          0{idx + 1}.
                        </span>
                        <span>{para}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Flight Telemetry Logs */}
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Flight Telemetry Log &amp; Parameters
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedEvent.telemetryLogs.map((log, idx) => {
                      const isCritical = log.status === 'critical' || log.status === 'alert';
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 font-mono ${
                            isCritical
                              ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                              : 'border-slate-800 bg-[#080D1A] text-slate-300'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 uppercase">{log.label}</div>
                          <div className="mt-1 text-xs font-bold text-white truncate">{log.value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scientific & Physics Breakthroughs */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-4">
                    <h5 className="font-mono text-xs font-bold text-cyan-300 uppercase mb-1">
                      Scientific Legacy
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedEvent.scientificBreakthrough}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-4">
                    <h5 className="font-mono text-xs font-bold text-amber-300 uppercase mb-1">
                      Spaceflight Physics
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedEvent.spaceflightPhysics}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action & Verification Footer */}
              <div className="mt-6 border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="font-mono text-xs text-slate-400">
                  Archive Source: <strong className="text-white">{selectedEvent.sourceLabel}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={selectedEvent.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => soundEngine.playClick()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#080D1A] px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400 hover:text-white transition-colors"
                  >
                    <span>NASA History Archive</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => handleStudyMission(selectedEvent.id)}
                    disabled={studiedEvents.includes(selectedEvent.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                      studiedEvents.includes(selectedEvent.id)
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>
                      {studiedEvents.includes(selectedEvent.id)
                        ? 'Lesson Studied (+40 XP)'
                        : 'Study Flight Log (+40 XP)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL PHENOMENA: WHAT HAPPENS TO HUMANS IN SPACE */}
      {activeTab === 'phenomena' && (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0C1222] p-5">
            <h2 className="font-display text-xl font-bold text-white">
              What Happens to Human Biology &amp; Physics During Space Travel
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Leaving Earth’s atmosphere subjects human astronauts to forces and environments unlike anything experienced on Earth. Here is what actually happens to the human body and spacecraft during real space missions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SPACE_TRAVEL_PHENOMENA.map((phenom) => (
              <div
                key={phenom.id}
                className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">{phenom.title}</h3>
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        phenom.severity === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {phenom.severity} Impact
                    </span>
                  </div>

                  <p className="font-mono text-xs text-cyan-300 mt-2 font-semibold">
                    {phenom.subtitle}
                  </p>

                  <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-300">
                    <div>
                      <strong className="text-white">What Astronauts Experience: </strong>
                      {phenom.astronautExperience}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3">
                      <strong className="text-cyan-300 font-mono">Underlying Physics &amp; Biology: </strong>
                      <span className="text-slate-300">{phenom.physicsExplanation}</span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#080D1A] p-3">
                      <strong className="text-amber-300 font-mono">NASA Countermeasures: </strong>
                      <span className="text-slate-300">{phenom.countermeasures}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATMOSPHERIC RE-ENTRY FLIGHT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Atmospheric Re-entry &amp; Plasma Shockwave Simulator
              </h2>
              <p className="text-sm text-slate-300">
                Experience the 5 critical stages as a returning spacecraft decelerates from Mach 25 into Earth’s dense atmosphere.
              </p>
            </div>

            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={runReentrySimulation}
              disabled={reentryRunning}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors shrink-0 ${
                reentryRunning
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{reentryRunning ? 'Re-entry in Progress...' : 'Initiate Re-entry Sequence'}</span>
            </button>
          </div>

          {/* Re-entry Stage Progress Bar */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
            {reentryStages.map((stage) => {
              const isCurrent = reentryStep === stage.step;
              const isPast = reentryStep > stage.step;
              return (
                <div
                  key={stage.step}
                  className={`rounded-xl border p-4 transition-colors ${
                    isCurrent
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/80'
                      : isPast
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-slate-800 bg-[#080D1A] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Phase 0{stage.step}</span>
                    <span className={stage.status === 'critical' ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
                      {stage.alt}
                    </span>
                  </div>

                  <h4 className="mt-1 font-display text-xs font-bold text-white truncate">
                    {stage.title}
                  </h4>

                  <div className="mt-2 font-mono text-[11px] text-slate-300">
                    <div>Speed: {stage.speed}</div>
                    <div>Heat: {stage.temp}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Stage Deep Telemetry Log */}
          {reentryStep > 0 && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-[#080D1A] p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                    Live Telemetry Stream · Phase 0{reentryStep}
                  </span>
                </div>
                <span className="font-mono text-xs text-white">
                  Altitude: {reentryStages[reentryStep - 1].alt}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-display text-lg font-bold text-white">
                  {reentryStages[reentryStep - 1].title}
                </h3>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed font-mono">
                  {reentryStages[reentryStep - 1].telemetry}
                </p>
              </div>

              {reentryStep === 3 && (
                <div className="mt-4 rounded-lg bg-amber-500/20 border border-amber-500/40 p-3 font-mono text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    COMMUNICATION BLACKOUT: Atmospheric plasma ionization blocks all radio signals. Houston awaiting telemetry acquisition of signal (AOS).
                  </span>
                </div>
              )}

              {reentryStep === 5 && (
                <div className="mt-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 font-mono text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    SPLASHDOWN CONFIRMED: Capsule is floating upright. Recovery helicopters airborne. Welcome back to Earth!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
