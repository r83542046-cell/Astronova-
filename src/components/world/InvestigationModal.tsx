import { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FlaskConical,
  X,
  XCircle,
} from 'lucide-react';
import {
  SCIENTIFIC_INVESTIGATIONS,
  WORLD_NODES,
  isInvestigationReady,
} from '../../data/openWorldMissions';
import { DifficultyTier, TraineeProfile } from '../../types/game';
import { soundEngine } from '../../utils/sound';

interface AdaptiveFollowUp {
  nextTier: DifficultyTier;
  evaluationFeedback: string;
  followUpQuestion: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  nasaFactRef: string;
}

interface InvestigationModalProps {
  investigationId: string;
  profile: TraineeProfile;
  onClose: () => void;
  onSolveInvestigation: (
    investigationId: string,
    score: number,
    xpGain: number,
    nextTier: DifficultyTier
  ) => void;
  onCompleteFollowUp: (passed: boolean, xpGain: number) => void;
  onOpenAiHelp: (wrongReason?: string) => void;
}

export function InvestigationModal({
  investigationId,
  profile,
  onClose,
  onSolveInvestigation,
  onCompleteFollowUp,
  onOpenAiHelp,
}: InvestigationModalProps) {
  const inv = SCIENTIFIC_INVESTIGATIONS.find((i) => i.id === investigationId);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [solvedNow, setSolvedNow] = useState(false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [followUp, setFollowUp] = useState<AdaptiveFollowUp | null>(null);
  const [followUpChoice, setFollowUpChoice] = useState<number | null>(null);

  if (!inv) return null;

  const discovered = profile.openWorld.discoveredNodes;
  const ready = isInvestigationReady(inv, discovered);
  const alreadySolved = profile.openWorld.solvedInvestigations.includes(inv.id);
  const requiredNodes = WORLD_NODES.filter((n) => inv.requiredNodeIds.includes(n.id));
  const selectedOpt = inv.options.find((o) => o.id === selectedOptId) || null;

  const handleChooseOption = async (optId: string) => {
    if (solvedNow) return;
    const opt = inv.options.find((o) => o.id === optId);
    if (!opt) return;
    setSelectedOptId(optId);

    if (!opt.isCorrect) {
      if (wrongAttempts >= 1) {
        soundEngine.playCriticalError();
      } else {
        soundEngine.playFailure();
      }
      setWrongAttempts((w) => w + 1);
      return;
    }

    soundEngine.playOutcome('success');
    setSolvedNow(true);
    const score = Math.max(55, 100 - wrongAttempts * 15);
    const xpGain = alreadySolved ? 25 : 110 - wrongAttempts * 15;

    setAdaptiveLoading(true);
    try {
      const res = await fetch('/api/ai/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: inv.id,
          missionTitle: inv.title,
          wasCorrect: wrongAttempts === 0,
          attemptsUsed: wrongAttempts + 1,
          hintsUsed: profile.openWorld.hintsUsedTotal,
          currentTier: profile.openWorld.difficultyTier,
          accuracyAvg: score,
          chosenReasoning: opt.label,
        }),
      });
      const data = (await res.json()) as AdaptiveFollowUp;
      setFollowUp(data);
      onSolveInvestigation(inv.id, score, xpGain, data.nextTier || profile.openWorld.difficultyTier);
    } catch {
      onSolveInvestigation(inv.id, score, xpGain, profile.openWorld.difficultyTier);
    } finally {
      setAdaptiveLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/85 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1222] p-5 text-slate-100 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 shrink-0">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-300">
                {inv.category} · Tier: {profile.openWorld.difficultyTier.toUpperCase()}
              </div>
              <h2 className="font-display text-xl font-bold text-white">{inv.title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close investigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Problem & Real NASA vs Fiction clarity */}
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-slate-200">{inv.problemStatement}</p>

          <div className="rounded-xl border border-slate-800 bg-[#070B19] p-3 text-xs leading-relaxed text-slate-300">
            <strong className="text-cyan-300">Science Fact Check: </strong>
            {inv.fictionalVsRealNote}{' '}
            <a
              href={inv.nasaSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:underline ml-1"
            >
              <span>{inv.nasaSourceLabel}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Step 2-3: Field Data Collected in 3D */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-300">
            3D Field Data Collected ({inv.id === 'solar-storm' ? 'Scan 1 Sensor' : `${requiredNodes.filter((n) => discovered.includes(n.id)).length}/${requiredNodes.length} Sensors`}):
          </div>
          <div className="mt-2 space-y-2">
            {requiredNodes.map((n) => {
              const scanned = discovered.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 text-xs ${
                    scanned
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-100'
                      : 'border-amber-500/30 bg-amber-950/15 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span>{n.title}</span>
                    <span className="font-mono">{scanned ? 'SCANNED' : 'NOT SCANNED YET'}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-300">
                    {scanned
                      ? n.scientificDataReading
                      : `Explore the 3D world to locate and scan this equipment (${n.worldId.toUpperCase()}).`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commander Adaptive Clue */}
        {profile.openWorld.difficultyTier === 'commander' && (
          <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-950/20 p-3 text-xs text-violet-200">
            {inv.commanderExtraClue}
          </div>
        )}

        {/* Step 4-6: Hypothesis & Decision (unlocked once data is collected) */}
        {!ready ? (
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#070B19] p-4 text-center">
            <p className="text-sm text-slate-300">
              Walk near the missing sensor(s) in the 3D world and press <strong>E</strong> (or click{' '}
              <strong>Scan</strong>) to collect scientific measurements before making your decision!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 min-h-[42px] rounded-xl bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              Return to 3D Exploration
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-white">{inv.questionPrompt}</h3>
              <button
                type="button"
                onClick={() =>
                  onOpenAiHelp(
                    selectedOpt && !selectedOpt.isCorrect ? selectedOpt.reasoningFeedback : undefined
                  )
                }
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/25"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Ask ARIA AI</span>
              </button>
            </div>

            <div className="space-y-2">
              {inv.options.map((opt) => {
                const chosen = selectedOptId === opt.id;
                let cls = 'border-slate-800 bg-[#070B19] hover:border-cyan-400/60';
                if (chosen && opt.isCorrect) cls = 'border-emerald-400 bg-emerald-500/15';
                else if (chosen && !opt.isCorrect) cls = 'border-rose-400 bg-rose-500/15';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={solvedNow}
                    onClick={() => handleChooseOption(opt.id)}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${cls}`}
                  >
                    <span className="text-slate-100">{opt.label}</span>
                    {chosen && opt.isCorrect && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    {chosen && !opt.isCorrect && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOpt && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  selectedOpt.isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-100'
                    : 'border-rose-500/50 bg-rose-950/30 text-rose-100'
                }`}
              >
                <div className="font-bold">
                  {selectedOpt.isCorrect
                    ? `3D Outcome: ${inv.worldEffectLabel}`
                    : 'Telemetry Mismatch — Re-examine Your Evidence'}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-200">
                  {selectedOpt.reasoningFeedback}
                </p>
              </div>
            )}

            {/* Step 8: Adaptive AI Evaluation & Follow-up Challenge */}
            {adaptiveLoading && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 text-xs text-violet-200">
                Adaptive AI is analyzing your reasoning and generating a tailored follow-up check...
              </div>
            )}

            {followUp && (
              <div className="space-y-3 rounded-xl border border-cyan-400/35 bg-[#080D1A] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-cyan-300">
                    <Cpu className="h-4 w-4" />
                    <span>Adaptive Evaluation · Next Tier: {followUp.nextTier.toUpperCase()}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">{followUp.evaluationFeedback}</p>

                <div className="border-t border-slate-800 pt-3">
                  <div className="text-xs font-mono text-cyan-300">Bonus Follow-Up Challenge (+40 XP)</div>
                  <p className="mt-1 text-sm font-semibold text-white">{followUp.followUpQuestion}</p>
                  <div className="mt-2.5 space-y-2">
                    {followUp.options.map((fOpt, idx) => {
                      const answered = followUpChoice !== null;
                      const picked = followUpChoice === idx;
                      const right = idx === followUp.correctIndex;
                      let fCls = 'border-slate-700 bg-[#070B19] hover:border-violet-400';
                      if (answered && right) fCls = 'border-emerald-400 bg-emerald-500/15';
                      else if (answered && picked && !right) fCls = 'border-rose-400 bg-rose-500/15';

                      return (
                        <button
                          key={fOpt}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setFollowUpChoice(idx);
                            const ok = idx === followUp.correctIndex;
                            if (ok) soundEngine.playBeacon();
                            else soundEngine.playFailure();
                            onCompleteFollowUp(ok, ok ? 40 : 10);
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs text-slate-100 transition-colors ${fCls}`}
                        >
                          {fOpt}
                        </button>
                      );
                    })}
                  </div>
                  {followUpChoice !== null && (
                    <div className="mt-2.5 text-xs text-slate-300 space-y-1">
                      <p>
                        <strong className="text-cyan-300">Science Note: </strong>
                        {followUp.explanation}
                      </p>
                      <p className="text-slate-400">{followUp.nasaFactRef}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {solvedNow && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] rounded-xl bg-emerald-400 px-6 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                >
                  Continue 3D Exploration
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
