import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { EMERGENCY_SCENARIOS } from '../../data/nasaScienceData';
import { soundEngine } from '../../utils/sound';
import artEmergency from '../../assets/images/mission_emergency_deck_1794737396171.jpg';

interface MissionEmergencyProps {
  onComplete: (score: number, accuracy: number, details: string) => void;
  onExit: () => void;
}

export function MissionEmergency({ onComplete, onExit }: MissionEmergencyProps) {
  const [phase, setPhase] = useState<'BRIEFING' | 'PLAYING' | 'MISSION_DONE'>('BRIEFING');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [wrongAttemptsThisCard, setWrongAttemptsThisCard] = useState(0);
  const [solvedFirstTryCount, setSolvedFirstTryCount] = useState(0);
  const [totalWrongTries, setTotalWrongTries] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const scenario = EMERGENCY_SCENARIOS[scenarioIdx];
  const selectedOption = scenario.options.find((o) => o.id === selectedOptionId) || null;
  const isSolved = selectedOption?.isCorrect === true;

  const startMission = () => {
    soundEngine.playClick();
    setScenarioIdx(0);
    setSelectedOptionId(null);
    setWrongAttemptsThisCard(0);
    setSolvedFirstTryCount(0);
    setTotalWrongTries(0);
    setEarnedPoints(0);
    setPhase('PLAYING');
  };

  const handleSelectOption = (optionId: string) => {
    if (isSolved) return;
    const opt = scenario.options.find((o) => o.id === optionId);
    if (!opt) return;

    setSelectedOptionId(optionId);
    if (opt.isCorrect) {
      soundEngine.playBeacon();
      const cardPoints = wrongAttemptsThisCard === 0 ? 20 : wrongAttemptsThisCard === 1 ? 14 : 10;
      setEarnedPoints((p) => p + cardPoints);
      if (wrongAttemptsThisCard === 0) {
        setSolvedFirstTryCount((c) => c + 1);
      }
    } else {
      if (scenario.severity === 'Warning' || wrongAttemptsThisCard >= 1) {
        soundEngine.playCriticalError();
      } else {
        soundEngine.playFailure();
      }
      setWrongAttemptsThisCard((w) => w + 1);
      setTotalWrongTries((tw) => tw + 1);
    }
  };

  const handleNextScenario = () => {
    soundEngine.playClick();
    if (scenarioIdx < EMERGENCY_SCENARIOS.length - 1) {
      setScenarioIdx((i) => i + 1);
      setSelectedOptionId(null);
      setWrongAttemptsThisCard(0);
    } else {
      const finalScore = Math.max(40, Math.min(100, earnedPoints));
      const totalClicks = EMERGENCY_SCENARIOS.length + totalWrongTries;
      const accuracy = Math.round((EMERGENCY_SCENARIOS.length / Math.max(1, totalClicks)) * 100);
      if (finalScore <= 50) {
        soundEngine.playOutcome('critical_error');
      } else if (finalScore < 70) {
        soundEngine.playOutcome('failure');
      } else {
        soundEngine.playOutcome('success');
      }
      setPhase('MISSION_DONE');
      onComplete(
        finalScore,
        accuracy,
        `${solvedFirstTryCount}/${EMERGENCY_SCENARIOS.length} alerts solved on first decision`
      );
    }
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      {/* Top Status Strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0C1222] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-xs text-amber-300">
              Scenario {scenarioIdx + 1} of {EMERGENCY_SCENARIOS.length} · {scenario.system}
            </div>
            <h1 className="font-display text-lg font-bold text-white">Emergency Mission</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
          <span>
            Points <strong className="text-amber-300">{earnedPoints}</strong>/100
          </span>
          <button
            type="button"
            onClick={() => setPhase('BRIEFING')}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#080D1A] px-2.5 py-1 text-slate-300 hover:border-amber-400/60 hover:text-white"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Briefing</span>
          </button>
        </div>
      </div>

      {phase === 'BRIEFING' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="p-6 sm:p-8 md:col-span-7">
              <div className="font-mono text-xs uppercase tracking-wider text-amber-300">
                Mission 03 · Safety &amp; Command
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                How Astronauts Handle Emergencies
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Real astronauts never guess in an emergency. They stay calm, check the spacecraft
                telemetry numbers first, and choose the safest scientific fix. You will face{' '}
                {EMERGENCY_SCENARIOS.length} realistic training alerts—read each telemetry panel
                carefully before picking your decision.
              </p>
              <button
                type="button"
                onClick={startMission}
                className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 whitespace-nowrap"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Emergency Drill</span>
              </button>
            </div>
            <div className="relative min-h-[200px] overflow-hidden border-t border-slate-800 bg-[#080D1A] md:col-span-5 md:border-t-0 md:border-l">
              <img
                src={artEmergency}
                alt="Orbital Cupola Telemetry Deck"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C1222]/60 via-transparent to-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="space-y-5">
          {/* Alert & Telemetry Card */}
          <section className="rounded-2xl border border-slate-800 bg-[#0D1428]/95 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
                <ShieldAlert className="h-4 w-4" />
                <span>
                  {scenario.severity} · {scenario.system}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                Alert {scenarioIdx + 1}/{EMERGENCY_SCENARIOS.length}
              </span>
            </div>

            <h2 className="mt-2 font-display text-2xl font-bold text-white">{scenario.title}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-200 sm:text-base">
              {scenario.briefing}
            </p>

            {/* Telemetry Clues */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {scenario.telemetry.map((t) => (
                <div
                  key={t.label}
                  className={`rounded-xl border p-3 ${
                    t.status === 'alert'
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-slate-800 bg-[#070B19]'
                  }`}
                >
                  <div className="text-xs text-slate-400">{t.label}</div>
                  <div
                    className={`mt-1 font-mono text-sm font-bold tabular-nums ${
                      t.status === 'alert' ? 'text-amber-300' : 'text-emerald-400'
                    }`}
                  >
                    {t.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Decisions */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Choose the best astronaut response:
            </h3>
            {scenario.options.map((opt) => {
              const isChosen = selectedOptionId === opt.id;
              let borderStyle = 'border-slate-800 bg-[#0D1428]/95 hover:border-cyan-400/60';
              if (isChosen && opt.isCorrect) {
                borderStyle = 'border-emerald-400 bg-emerald-500/10';
              } else if (isChosen && !opt.isCorrect) {
                borderStyle = 'border-rose-400 bg-rose-500/10';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSolved}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`flex min-h-[54px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${borderStyle} disabled:cursor-default`}
                >
                  <span className="text-sm font-medium text-white sm:text-base">{opt.label}</span>
                  {isChosen && opt.isCorrect && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  )}
                  {isChosen && !opt.isCorrect && (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  )}
                </button>
              );
            })}
          </section>

          {/* Educational Explanation Panel */}
          {selectedOption && (
            <section
              className={`rounded-2xl border p-5 ${
                selectedOption.isCorrect
                  ? 'border-emerald-500/50 bg-emerald-950/30'
                  : 'border-rose-500/50 bg-rose-950/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {selectedOption.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <div className="font-display text-base font-bold text-white">
                    {selectedOption.isCorrect
                      ? 'Safe Astronaut Decision!'
                      : 'Not Quite Safe — Try Another Choice'}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200">
                    {selectedOption.explanation}
                  </p>

                  {selectedOption.isCorrect && (
                    <button
                      type="button"
                      onClick={handleNextScenario}
                      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                    >
                      <span>
                        {scenarioIdx < EMERGENCY_SCENARIOS.length - 1
                          ? 'Next Alert'
                          : 'Finish Emergency Mission'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {phase === 'MISSION_DONE' && (
        <div className="rounded-2xl border border-amber-400/50 bg-[#0C1222] p-8 text-center">
          <Award className="mx-auto h-12 w-12 text-amber-300" />
          <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            Mission 3 Complete!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            You resolved all {EMERGENCY_SCENARIOS.length} spacecraft anomalies using telemetry
            analysis and calm astronaut reasoning!
          </p>
          <div className="mt-4 font-mono text-4xl font-bold text-amber-300 tabular-nums">
            {Math.max(40, Math.min(100, earnedPoints))} / 100
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startMission}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white hover:border-amber-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Replay Drill</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              <span>Return to Training Hub</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
