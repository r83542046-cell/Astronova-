import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
  Play,
  RefreshCw,
  RotateCcw,
  Sun,
  XCircle,
} from 'lucide-react';
import {
  NasaLiveTelemetryFallback,
  PLANETARY_BODIES,
  SCIENCE_LESSONS,
  VERIFIED_ISS_FALLBACK,
} from '../../data/nasaScienceData';
import { TraineeProfile } from '../../types/game';
import { soundEngine } from '../../utils/sound';
import artExpedition from '../../assets/images/academy_solar_expedition_1794737396924.jpg';

interface SpaceScienceAcademyProps {
  profile: TraineeProfile;
  onSaveQuizResult: (lessonId: string, scorePct: number, answered: number, correct: number) => void;
}

export function SpaceScienceAcademy({ profile, onSaveQuizResult }: SpaceScienceAcademyProps) {
  const [activeLessonId, setActiveLessonId] = useState(SCIENCE_LESSONS[0].id);
  const lesson = SCIENCE_LESSONS.find((l) => l.id === activeLessonId) || SCIENCE_LESSONS[0];

  // Interactive Gravity Simulator state
  const [earthWeightKg, setEarthWeightKg] = useState(40);
  const [dropActive, setDropActive] = useState(false);
  const [dropProgress, setDropProgress] = useState({ earth: 0, moon: 0, mars: 0 });
  const dropAnimRef = useRef<number>(0);

  // Interactive Space Environment state
  const [sunlightMode, setSunlightMode] = useState<'sun' | 'shadow'>('sun');

  // Interactive Live ISS Open Data state
  const [issData, setIssData] = useState<NasaLiveTelemetryFallback>(VERIFIED_ISS_FALLBACK);
  const [issLoading, setIssLoading] = useState(false);

  // Quiz state per lesson
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  }, [activeLessonId]);

  // Gravity Drop animation
  const runGravityDrop = () => {
    soundEngine.playClick();
    cancelAnimationFrame(dropAnimRef.current);
    setDropActive(true);
    setDropProgress({ earth: 0, moon: 0, mars: 0 });
    const start = performance.now();
    const dropHeightMeters = 10; // simulated 10m drop

    const step = (now: number) => {
      const t = (now - start) / 1000;
      // d = 0.5 * g * t^2 -> normalized 0..1
      const dEarth = Math.min(1, (0.5 * 9.81 * t * t) / dropHeightMeters);
      const dMars = Math.min(1, (0.5 * 3.72 * t * t) / dropHeightMeters);
      const dMoon = Math.min(1, (0.5 * 1.62 * t * t) / dropHeightMeters);
      setDropProgress({ earth: dEarth, moon: dMoon, mars: dMars });

      if (dMoon < 1) {
        dropAnimRef.current = requestAnimationFrame(step);
      } else {
        setDropActive(false);
      }
    };
    dropAnimRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(dropAnimRef.current);
  }, []);

  // Fetch real-time ISS orbital telemetry with verified NASA fallback
  const fetchLiveIssData = async () => {
    setIssLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('ISS feed unavailable');
      const data = await res.json();
      setIssData({
        latitude: Number(data.latitude.toFixed(3)),
        longitude: Number(data.longitude.toFixed(3)),
        altitudeKm: Number(data.altitude.toFixed(1)),
        velocityKmh: Math.round(data.velocity),
        visibility: data.visibility || 'daylight',
        isLive: true,
        sourceName: 'Live ISS Telemetry + NASA Orbital Reference',
      });
    } catch {
      setIssData(VERIFIED_ISS_FALLBACK);
    } finally {
      window.clearTimeout(timeoutId);
      setIssLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveIssData();
  }, []);

  const handleSubmitQuiz = () => {
    if (quizSubmitted) return;
    let correct = 0;
    lesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) correct += 1;
    });
    const pct = Math.round((correct / lesson.quiz.length) * 100);
    setQuizSubmitted(true);
    if (pct >= 50) {
      soundEngine.playOutcome('success');
    } else if (pct > 0) {
      soundEngine.playOutcome('failure');
    } else {
      soundEngine.playOutcome('critical_error');
    }
    onSaveQuizResult(lesson.id, pct, lesson.quiz.length, correct);
  };

  const allQuizAnswered = lesson.quiz.every((_, idx) => quizAnswers[idx] !== undefined);

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Illustrated Space Science Academy Header */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="flex flex-col justify-between p-5 sm:p-6 md:col-span-8">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/12 text-cyan-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-cyan-300 tabular-nums">
                  Verified NASA Science · {profile.academy.completedLessons.length}/
                  {SCIENCE_LESSONS.length} Completed
                </div>
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Space Science Academy
                </h1>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <span>Interactive Physics Labs, Live Orbital Data &amp; Readiness Quizzes</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://science.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-300 hover:underline whitespace-nowrap"
                >
                  <span>NASA Science</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span aria-hidden="true" className="text-slate-700">
                  |
                </span>
                <a
                  href="https://data.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-300 hover:underline whitespace-nowrap"
                >
                  <span>NASA Open Data</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="relative hidden overflow-hidden border-l border-slate-800 bg-[#080D1A] md:col-span-4 md:block">
            <img
              src={artExpedition}
              alt="Solar System Research Outpost"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center opacity-85"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C1222] via-[#0C1222]/30 to-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Split: Left Lesson Selector, Right Interactive Lesson & Quiz */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Lesson Navigation */}
        <aside className="lg:col-span-4 space-y-2">
          {SCIENCE_LESSONS.map((item, idx) => {
            const active = item.id === activeLessonId;
            const done = profile.academy.completedLessons.includes(item.id);
            const score = profile.academy.quizScores[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveLessonId(item.id);
                }}
                className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-cyan-400 bg-cyan-500/12 text-white'
                    : 'border-slate-800 bg-[#0C1222] text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-400">Lesson 0{idx + 1}</div>
                  <div className="truncate font-display text-sm font-bold">{item.title}</div>
                </div>
                {done ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400 shrink-0 tabular-nums">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{score}%</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 shrink-0">Explore</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Active Lesson Content */}
        <section className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-300">
                Source: {lesson.sourceName}
              </span>
              <a
                href={lesson.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300"
              >
                <span>Open NASA Reference</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <h2 className="mt-2 font-display text-2xl font-bold text-white">{lesson.title}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-200 sm:text-base">
              {lesson.summary}
            </p>

            {/* Interactive Simulation Lab inside the Lesson */}
            <div className="mt-5 rounded-xl border border-slate-800 bg-[#080D1A] p-4 sm:p-5">
              {lesson.interactiveType === 'gravity' && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Interactive Gravity & Weight Lab
                      </h3>
                      <p className="text-xs text-slate-400">
                        Slide your Earth weight and launch a 10-meter drop test across 3 worlds!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={runGravityDrop}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{dropActive ? 'Dropping...' : 'Run Drop Test'}</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="weight-slider"
                      className="flex items-center justify-between text-xs font-medium text-slate-300"
                    >
                      <span>Your Mass on Earth</span>
                      <span className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
                        {earthWeightKg} kg
                      </span>
                    </label>
                    <input
                      id="weight-slider"
                      type="range"
                      min={20}
                      max={90}
                      value={earthWeightKg}
                      onChange={(e) => setEarthWeightKg(Number(e.target.value))}
                      className="mt-2 w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {PLANETARY_BODIES.map((body) => {
                      const prog = dropProgress[body.id];
                      const apparentKg = (earthWeightKg * body.relativeGravity).toFixed(1);
                      return (
                        <div
                          key={body.id}
                          className="rounded-xl border border-slate-800 bg-[#0D1428] p-3 text-center"
                        >
                          <div className="text-xs font-bold text-white">{body.name}</div>
                          <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                            {body.gravityMs2} m/s²
                          </div>
                          {/* Drop Tube */}
                          <div className="relative mx-auto my-3 h-28 w-10 rounded-lg border border-slate-700 bg-[#070B19] overflow-hidden">
                            <div
                              style={{
                                transform: `translateY(${prog * 82}px)`,
                                backgroundColor: body.color,
                              }}
                              className="mx-auto mt-1 h-6 w-6 rounded-full transition-none"
                            />
                          </div>
                          <div className="text-[11px] text-slate-400">Scale Weight</div>
                          <div className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
                            {apparentKg} kg
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {lesson.interactiveType === 'worlds' && (
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    NASA Planetary Comparison (Earth · Moon · Mars)
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-3">World</th>
                          <th className="py-2 pr-3">Diameter</th>
                          <th className="py-2 pr-3">Day Length</th>
                          <th className="py-2 pr-3">Avg Temp</th>
                          <th className="py-2">Atmosphere</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                        {PLANETARY_BODIES.map((b) => (
                          <tr key={b.id} className="text-slate-200">
                            <td className="py-2.5 pr-3 font-sans font-bold text-white">{b.name}</td>
                            <td className="py-2.5 pr-3">{b.diameterKm.toLocaleString()} km</td>
                            <td className="py-2.5 pr-3">{b.dayLengthHours} hrs</td>
                            <td className="py-2.5 pr-3">{b.avgTempC}</td>
                            <td className="py-2.5 font-sans text-slate-300">{b.atmosphere}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {lesson.interactiveType === 'environment' && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-white">
                      Orbital Sunlight vs. Shadow Simulator
                    </h3>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1">
                      <button
                        type="button"
                        onClick={() => setSunlightMode('sun')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                          sunlightMode === 'sun'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        <span>Direct Sunlight</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSunlightMode('shadow')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                          sunlightMode === 'shadow'
                            ? 'bg-cyan-400 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>Earth Shadow</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono tabular-nums">
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-xs text-slate-400">Outside Suit Temp</div>
                      <div
                        className={`mt-1 text-xl font-bold ${
                          sunlightMode === 'sun' ? 'text-amber-300' : 'text-cyan-300'
                        }`}
                      >
                        {sunlightMode === 'sun' ? '+121 °C' : '-157 °C'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-xs text-slate-400">Inside Spacesuit</div>
                      <div className="mt-1 text-xl font-bold text-emerald-400">21.5 °C</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-xs text-slate-400">Air Pressure</div>
                      <div className="mt-1 text-xl font-bold text-white">29.6 kPa O₂</div>
                    </div>
                  </div>
                </div>
              )}

              {lesson.interactiveType === 'station' && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-cyan-300" />
                      <h3 className="font-display text-base font-bold text-white">
                        Space Station Live Orbital Telemetry
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={fetchLiveIssData}
                      disabled={issLoading}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-cyan-300 hover:border-cyan-400"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${issLoading ? 'animate-spin' : ''}`} />
                      <span>{issLoading ? 'Updating...' : 'Refresh Telemetry'}</span>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{issData.sourceName}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono tabular-nums">
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-[11px] text-slate-400">Latitude</div>
                      <div className="mt-1 text-base font-bold text-white">{issData.latitude}°</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-[11px] text-slate-400">Longitude</div>
                      <div className="mt-1 text-base font-bold text-white">{issData.longitude}°</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-[11px] text-slate-400">Altitude</div>
                      <div className="mt-1 text-base font-bold text-cyan-300">{issData.altitudeKm} km</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0D1428] p-3">
                      <div className="text-[11px] text-slate-400">Orbital Speed</div>
                      <div className="mt-1 text-base font-bold text-emerald-400">
                        {issData.velocityKmh.toLocaleString()} km/h
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(lesson.interactiveType === 'astronauts' || lesson.interactiveType === 'robotics') && (
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {lesson.interactiveType === 'astronauts'
                      ? 'Crew Responsibilities Breakdown'
                      : 'Space Robotics Architecture'}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {lesson.keyPoints.map((pt, i) => (
                      <div key={i} className="rounded-xl border border-slate-800 bg-[#0D1428] p-3 text-xs leading-relaxed text-slate-200">
                        {pt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Facts */}
            <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
              {lesson.keyPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs leading-relaxed text-cyan-100">
              <strong>NASA Spotlight: </strong>
              {lesson.nasaFact}
            </div>
          </div>

          {/* Interactive Lesson Quiz */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Mini Science Quiz</h3>
              <span className="text-xs font-mono text-slate-400">
                {lesson.quiz.length} Question{lesson.quiz.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {lesson.quiz.map((q, qIdx) => (
                <div key={q.question} className="space-y-2.5">
                  <p className="text-sm font-semibold text-white">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const chosen = quizAnswers[qIdx] === optIdx;
                      const isRight = optIdx === q.correctIndex;
                      let cls = 'border-slate-800 bg-[#070B19] hover:border-cyan-400/50';
                      if (quizSubmitted && isRight) {
                        cls = 'border-emerald-400 bg-emerald-500/15';
                      } else if (quizSubmitted && chosen && !isRight) {
                        cls = 'border-rose-400 bg-rose-500/15';
                      } else if (chosen) {
                        cls = 'border-cyan-400 bg-cyan-500/15';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => {
                            soundEngine.playClick();
                            setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                          }}
                          className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm text-slate-100 transition-colors ${cls}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && isRight && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          )}
                          {quizSubmitted && chosen && !isRight && (
                            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <p className="text-xs leading-relaxed text-slate-300">
                      <strong className="text-cyan-300">Explanation: </strong>
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3">
              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={!allQuizAnswered}
                  onClick={handleSubmitQuiz}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
                >
                  <span>Check Quiz Answers</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:border-cyan-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry Quiz</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
