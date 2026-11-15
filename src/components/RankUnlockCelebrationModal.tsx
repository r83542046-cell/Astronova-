import { Award, Sparkles, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StarRankTier } from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface RankUnlockCelebrationModalProps {
  unlockedRank: StarRankTier | null;
  totalStars: number;
  onDismiss: () => void;
  onOpenRanksScreen: () => void;
}

const THEME_ACCENTS: Record<
  StarRankTier['colorTheme'],
  { gradient: string; glow: string; border: string; badgeText: string }
> = {
  blue: {
    gradient: 'from-sky-400 via-blue-500 to-blue-700',
    glow: 'shadow-[0_0_60px_rgba(56,189,248,0.45)]',
    border: 'border-sky-400/70',
    badgeText: 'text-sky-300',
  },
  turquoise: {
    gradient: 'from-teal-300 via-emerald-400 to-teal-600',
    glow: 'shadow-[0_0_60px_rgba(45,212,191,0.45)]',
    border: 'border-teal-400/70',
    badgeText: 'text-teal-300',
  },
  gold: {
    gradient: 'from-yellow-300 via-amber-400 to-amber-600',
    glow: 'shadow-[0_0_65px_rgba(250,204,21,0.5)]',
    border: 'border-yellow-400/75',
    badgeText: 'text-yellow-300',
  },
  orange: {
    gradient: 'from-orange-400 via-orange-500 to-red-600',
    glow: 'shadow-[0_0_70px_rgba(251,146,60,0.55)]',
    border: 'border-orange-400/80',
    badgeText: 'text-orange-300',
  },
};

const BURST_PARTICLES = [
  { x: -110, y: -90, delay: 0.05, size: 14 },
  { x: 115, y: -85, delay: 0.1, size: 16 },
  { x: -135, y: 15, delay: 0.14, size: 12 },
  { x: 135, y: 20, delay: 0.08, size: 13 },
  { x: -70, y: -125, delay: 0.18, size: 11 },
  { x: 75, y: -120, delay: 0.12, size: 15 },
  { x: -95, y: 95, delay: 0.16, size: 12 },
  { x: 95, y: 90, delay: 0.2, size: 14 },
];

export function RankUnlockCelebrationModal({
  unlockedRank,
  totalStars,
  onDismiss,
  onOpenRanksScreen,
}: RankUnlockCelebrationModalProps) {
  return (
    <AnimatePresence>
      {unlockedRank && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rank-unlock-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050716]/85 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 22 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border bg-[#0E1330] p-6 text-center sm:p-8 ${
              THEME_ACCENTS[unlockedRank.colorTheme].border
            } ${THEME_ACCENTS[unlockedRank.colorTheme].glow}`}
          >
            {/* Bursting Celebration Stars */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {BURST_PARTICLES.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    scale: [0.3, 1.15, 0.9],
                    opacity: [0, 1, 0],
                    rotate: idx % 2 === 0 ? 140 : -140,
                  }}
                  transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
                  className="absolute text-yellow-300"
                >
                  <Star style={{ width: p.size, height: p.size }} className="fill-yellow-300" />
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => {
                soundEngine.playClick();
                onDismiss();
              }}
              aria-label="Close celebration"
              className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-[#080C22] text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-center gap-1.5">
                {Array.from({ length: unlockedRank.starIcons }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 16,
                      delay: 0.1 + idx * 0.08,
                    }}
                  >
                    <Star className="h-8 w-8 fill-yellow-300 text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]" />
                  </motion.div>
                ))}
              </div>

              <div
                className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest ${
                  THEME_ACCENTS[unlockedRank.colorTheme].badgeText
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Congratulations! New Rank Unlocked</span>
              </div>

              <h2
                id="rank-unlock-heading"
                className="mt-2 font-display text-3xl font-bold text-white"
              >
                {unlockedRank.title}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                You reached <strong className="text-yellow-300 tabular-nums">{totalStars} stars</strong> and unlocked the{' '}
                <strong className="text-white">{unlockedRank.title}</strong> rank!
              </p>

              <div
                className={`mt-5 rounded-2xl bg-gradient-to-r p-4 text-slate-950 ${
                  THEME_ACCENTS[unlockedRank.colorTheme].gradient
                }`}
              >
                <div className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-950/80">
                  <Award className="h-4 w-4" />
                  <span>Unlocked Reward</span>
                </div>
                <div className="mt-0.5 font-display text-lg font-bold">
                  {unlockedRank.rewardTitle}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-950/85">
                  {unlockedRank.rewardDescription}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playRankSelect();
                    onOpenRanksScreen();
                  }}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 whitespace-nowrap"
                >
                  <Star className="h-4 w-4 fill-current" />
                  <span>View Ranks &amp; Rewards</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playClick();
                    onDismiss();
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-700 bg-[#080C22] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap"
                >
                  <span>Continue</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
