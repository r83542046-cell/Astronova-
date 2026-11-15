import { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { EVALUATION_QUESTIONS } from '../../data/nasaScienceData';
import { GameScreen } from '../../types/game';
import { soundEngine } from '../../utils/sound';
import artFlightExam from '../../assets/images/mission_flight_exam_1794737396677.jpg';

interface MissionEvaluationProps {
  onComplete: (score: number, accuracy: number, details: string) => void;
  onNavigate: (screen: GameScreen) => void;
}

export function MissionEvaluation({ onComplete, onNavigate }: MissionEvaluationProps) {
  const [phase, setPhase] = useState<'BRIEFING' | 'EXAM' | 'DONE'>('BRIEFING');
  const [qIdx, setQIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = EVALUATION_QUESTIONS[qIdx];
  const answered = selectedIdx !== null;

  const startExam = () => {
    soundEngine.playClick();
    setQIdx(0);
    setSelectedIdx(null);
    setCorrectCount(0);
    setPhase('EXAM');
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    if (idx === q.correctIndex) {
      soundEngine.playBeacon();
      setCorrectCount((c) => c + 1);
    } else {
      soundEngine.playFailure();
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (qIdx < EVALUATION_QUESTIONS.length - 1) {
      setQIdx((i) => i + 1);
      setSelectedIdx(null);
    } else {
      const score = Math.round((correctCount / EVALUATION_QUESTIONS.length) * 100);
      if (score === 0) {
        soundEngine.playOutcome('critical_error');
      } else if (score < 60) {
        soundEngine.playOutcome('failure');
      } else {
        soundEngine.playOutcome('success');
      }
      setPhase('DONE');
      onComplete(score, score, `${correctCount}/${EVALUATION_QUESTIONS.length} flight check questions passed`);
    }
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0C1222] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-300">
              Mission 04 · Final Readiness Check
            </div>
            <h1 className="font-display text-lg font-bold text-white">
              Astronaut Score &amp; Flight Evaluation
            </h1>
          </div>
        </div>

        <div className="font-mono text-xs text-slate-300 tabular-nums">
          Question <strong className="text-violet-300">{qIdx + 1}</strong> /{' '}
          {EVALUATION_QUESTIONS.length}
        </div>
      </div>

      {phase === 'BRIEFING' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="p-6 sm:p-8 md:col-span-7">
              <div className="font-mono text-xs uppercase tracking-wider text-violet-300">
                Final Evaluation Mission
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Astronaut Flight Readiness Exam
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Before receiving your full Astronaut Evaluation Report and Graduation Certificate,
                complete this 5-question Flight Check covering navigation coordinates, robotic arm
                safety, emergency logic, and NASA space science.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startExam}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold text-white hover:bg-violet-400 whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Flight Check</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('RESULTS')}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-700 bg-[#080D1A] px-5 py-3 text-sm font-semibold text-slate-200 hover:border-violet-400 hover:text-white whitespace-nowrap"
                >
                  <span>View Current Scoreboard</span>
                </button>
              </div>
            </div>
            <div className="relative min-h-[200px] overflow-hidden border-t border-slate-800 bg-[#080D1A] md:col-span-5 md:border-t-0 md:border-l">
              <img
                src={artFlightExam}
                alt="Orbital Spaceplane Flight Readiness"
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

      {phase === 'EXAM' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-[#0D1428]/95 p-6">
            <div className="text-xs font-mono text-violet-300">{q.categoryLabel}</div>
            <h2 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
              {q.question}
            </h2>

            <div className="mt-5 space-y-3">
              {q.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isRight = idx === q.correctIndex;
                let cls = 'border-slate-800 bg-[#070B19] hover:border-violet-400/60';
                if (answered && isRight) {
                  cls = 'border-emerald-400 bg-emerald-500/15';
                } else if (answered && isSelected && !isRight) {
                  cls = 'border-rose-400 bg-rose-500/15';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={answered}
                    onClick={() => handleAnswer(idx)}
                    className={`flex min-h-[52px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${cls}`}
                  >
                    <span className="text-sm font-medium text-white sm:text-base">{opt}</span>
                    {answered && isRight && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    {answered && isSelected && !isRight && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {answered && (
            <section
              className={`rounded-2xl border p-5 ${
                selectedIdx === q.correctIndex
                  ? 'border-emerald-500/50 bg-emerald-950/30'
                  : 'border-amber-500/50 bg-amber-950/30'
              }`}
            >
              <div className="font-display text-base font-bold text-white">
                {selectedIdx === q.correctIndex ? 'Correct!' : 'Good Try — Here Is Why:'}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">{q.explanation}</p>
              <button
                type="button"
                onClick={handleNext}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-violet-500 px-5 py-2 text-sm font-bold text-white hover:bg-violet-400"
              >
                <span>
                  {qIdx < EVALUATION_QUESTIONS.length - 1 ? 'Next Question' : 'See Evaluation Report'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}
        </div>
      )}

      {phase === 'DONE' && (
        <div className="rounded-2xl border border-violet-400/50 bg-[#0D1428]/95 p-8 text-center">
          <Award className="mx-auto h-12 w-12 text-violet-300" />
          <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            {correctCount >= 3
              ? 'Flight Readiness Exam Passed!'
              : 'Flight Readiness Needs Review'}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            You answered {correctCount} out of {EVALUATION_QUESTIONS.length} flight check questions
            correctly.{' '}
            {correctCount >= 3
              ? 'Open your Results Dashboard to inspect your full performance breakdown and Astronaut Certificate!'
              : 'Review the explanations and retake the Flight Check to boost your readiness score!'}
          </p>
          <div className="mt-4 font-mono text-4xl font-bold text-violet-300 tabular-nums">
            {Math.round((correctCount / EVALUATION_QUESTIONS.length) * 100)} / 100
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startExam}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white hover:border-violet-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Exam</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('RESULTS')}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-400"
            >
              <Award className="h-4 w-4" />
              <span>Open Full Results & Certificate</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
