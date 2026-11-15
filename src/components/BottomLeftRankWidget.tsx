import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { TraineeProfile } from '../types/game';
import { calculateLevelFromXp } from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface BottomLeftRankWidgetProps {
  profile: TraineeProfile;
  onOpenRanks: () => void;
}

export function BottomLeftRankWidget({ profile, onOpenRanks }: BottomLeftRankWidgetProps) {
  const xp = profile.openWorld?.xp ?? 0;
  const rankInfo = calculateLevelFromXp(xp);

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-30 sm:bottom-4 sm:right-4">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => soundEngine.playHover()}
        onClick={() => {
          soundEngine.playRankSelect();
          onOpenRanks();
        }}
        title={`Level ${rankInfo.level} · ${rankInfo.title} (${xp} / ${rankInfo.nextLevelXp} XP)`}
        className="group flex items-center gap-3 rounded-2xl border border-indigo-400/35 bg-[#0A0E27]/92 p-3 shadow-[0_10px_30px_rgba(5,7,22,0.7)] backdrop-blur-md transition-colors hover:border-yellow-400/60"
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-700 text-slate-950 shadow-[0_0_15px_rgba(250,204,21,0.45)]">
          <Trophy className="h-5 w-5 fill-slate-950 text-slate-950" />
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-950 px-1 font-mono text-[10px] font-bold text-yellow-300 ring-1 ring-yellow-400/60 tabular-nums">
            {rankInfo.level}
          </span>
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-bold text-white group-hover:text-yellow-300 transition-colors">
              Level {rankInfo.level}
            </span>
            <span className="font-mono text-[10px] text-yellow-300/90 font-semibold uppercase tracking-wider">
              · {rankInfo.title}
            </span>
          </div>

          {/* Mini Progress Bar */}
          <div className="mt-1 flex items-center gap-2">
            <div
              role="progressbar"
              aria-label="Level XP progress"
              aria-valuemin={rankInfo.currentLevelXp}
              aria-valuemax={rankInfo.nextLevelXp}
              aria-valuenow={xp}
              className="relative h-1.5 w-24 overflow-hidden rounded-full bg-slate-800"
            >
              <div
                style={{ width: `${Math.max(4, rankInfo.progressPct)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-yellow-300 transition-all duration-300"
              />
            </div>
            <span className="font-mono text-[10px] text-slate-300 tabular-nums">
              {xp}
              {!rankInfo.isMaxLevel ? `/${rankInfo.nextLevelXp}` : ''} XP
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
