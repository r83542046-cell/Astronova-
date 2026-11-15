import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe,
  Lock,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { GameScreen, StarRankId, TraineeProfile } from '../types/game';
import {
  calculateStarBreakdown,
  calculateStarRankProgress,
  STAR_RANK_TIERS,
  StarRankTier,
} from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface RanksAndRewardsScreenProps {
  profile: TraineeProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onClaimReward: (rewardId: string) => void;
  onCelebrateRank?: (rank: StarRankTier) => void;
  onNavigate: (screen: GameScreen) => void;
}

interface ColumnVisualStyle {
  cardGradient: string;
  glowShadow: string;
  activeRing: string;
  heightClass: string;
  textColor: string;
  subTextColor: string;
  badgeBg: string;
  accentHex: string;
}

const COLUMN_STYLES: Record<StarRankTier['colorTheme'], ColumnVisualStyle> = {
  blue: {
    cardGradient: 'from-sky-400 via-blue-500 to-blue-700',
    glowShadow: 'shadow-[0_18px_45px_rgba(37,99,235,0.45)]',
    activeRing: 'ring-2 ring-sky-200 ring-offset-2 ring-offset-[#120F33]',
    heightClass: 'min-h-[210px] lg:h-[235px]',
    textColor: 'text-white',
    subTextColor: 'text-sky-100',
    badgeBg: 'bg-slate-950/35 text-white border-white/25',
    accentHex: '#38BDF8',
  },
  turquoise: {
    cardGradient: 'from-teal-300 via-emerald-400 to-teal-700',
    glowShadow: 'shadow-[0_18px_45px_rgba(16,185,129,0.45)]',
    activeRing: 'ring-2 ring-teal-200 ring-offset-2 ring-offset-[#120F33]',
    heightClass: 'min-h-[240px] lg:h-[295px]',
    textColor: 'text-slate-950',
    subTextColor: 'text-slate-900/90',
    badgeBg: 'bg-slate-950/20 text-slate-950 border-slate-950/20',
    accentHex: '#2DD4BF',
  },
  gold: {
    cardGradient: 'from-yellow-300 via-amber-400 to-amber-600',
    glowShadow: 'shadow-[0_18px_50px_rgba(250,204,21,0.45)]',
    activeRing: 'ring-2 ring-yellow-100 ring-offset-2 ring-offset-[#120F33]',
    heightClass: 'min-h-[270px] lg:h-[355px]',
    textColor: 'text-slate-950',
    subTextColor: 'text-slate-900/90',
    badgeBg: 'bg-slate-950/20 text-slate-950 border-slate-950/20',
    accentHex: '#FACC15',
  },
  orange: {
    cardGradient: 'from-orange-400 via-orange-500 to-red-600',
    glowShadow: 'shadow-[0_20px_55px_rgba(249,115,22,0.5)]',
    activeRing: 'ring-2 ring-orange-200 ring-offset-2 ring-offset-[#120F33]',
    heightClass: 'min-h-[300px] lg:h-[415px]',
    textColor: 'text-white',
    subTextColor: 'text-orange-50',
    badgeBg: 'bg-slate-950/35 text-white border-white/25',
    accentHex: '#FB923C',
  },
};

const SPACE_PARTICLES = [
  { left: '6%', top: '12%', size: 3, dur: 4.5, delay: 0.1 },
  { left: '14%', top: '34%', size: 2, dur: 5.2, delay: 0.8 },
  { left: '22%', top: '18%', size: 4, dur: 6.0, delay: 0.4 },
  { left: '31%', top: '74%', size: 2, dur: 4.8, delay: 1.2 },
  { left: '42%', top: '10%', size: 3, dur: 5.5, delay: 0.3 },
  { left: '53%', top: '26%', size: 2, dur: 4.2, delay: 1.6 },
  { left: '64%', top: '14%', size: 4, dur: 5.8, delay: 0.6 },
  { left: '74%', top: '38%', size: 2, dur: 4.9, delay: 1.1 },
  { left: '84%', top: '19%', size: 3, dur: 5.3, delay: 0.2 },
  { left: '92%', top: '44%', size: 3, dur: 6.1, delay: 0.9 },
  { left: '11%', top: '82%', size: 3, dur: 5.0, delay: 0.5 },
  { left: '88%', top: '79%', size: 2, dur: 4.6, delay: 1.4 },
];

export function RanksAndRewardsScreen({
  profile,
  isMuted,
  onToggleMute,
  onClaimReward,
  onCelebrateRank,
  onNavigate,
}: RanksAndRewardsScreenProps) {
  const starBreakdown = calculateStarBreakdown(profile);
  const rankProgress = calculateStarRankProgress(starBreakdown.totalStars);
  const claimedIds = profile.openWorld.claimedRewardIds || [];

  const [selectedRankId, setSelectedRankId] = useState<StarRankId>(rankProgress.currentRank.id);

  useEffect(() => {
    setSelectedRankId(rankProgress.currentRank.id);
  }, [rankProgress.currentRank.id]);

  const selectedTier =
    STAR_RANK_TIERS.find((tier) => tier.id === selectedRankId) || rankProgress.currentRank;
  const selectedUnlocked = starBreakdown.totalStars >= selectedTier.minStars;
  const selectedClaimed = claimedIds.includes(selectedTier.rewardId);

  const overallCapStars = STAR_RANK_TIERS[STAR_RANK_TIERS.length - 1].minStars;
  const overallMeterPct = Math.min(
    100,
    Math.round((starBreakdown.totalStars / overallCapStars) * 100)
  );

  return (
    <div className="relative min-h-[calc(100vh-44px)] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#22195B_0%,_#11153A_48%,_#060919_100%)] text-slate-100">
      {/* Subtle Cosmic Glow Orbs & Twinkling Space Particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />

        {SPACE_PARTICLES.map((pt, idx) => (
          <motion.span
            key={idx}
            style={{
              left: pt.left,
              top: pt.top,
              width: pt.size,
              height: pt.size,
            }}
            animate={{
              opacity: [0.25, 0.95, 0.3],
              y: [0, -8, 0],
              scale: [0.9, 1.25, 0.9],
            }}
            transition={{
              duration: pt.dur,
              delay: pt.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          />
        ))}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Utility Strip: Star Balance + Sound On/Off Setting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-xs text-slate-200 tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-bold text-yellow-300">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              <span>{starBreakdown.totalStars} Stars Earned</span>
            </span>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span>
              Active Rank: <strong className="text-white">{rankProgress.currentRank.title}</strong>
            </span>
          </div>

          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={onToggleMute}
            aria-label={isMuted ? 'Turn sound effects on' : 'Turn sound effects off'}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              isMuted
                ? 'border-slate-700 bg-[#0D102A]/90 text-slate-300 hover:border-slate-500 hover:text-white'
                : 'border-indigo-400/50 bg-indigo-500/20 text-indigo-100 hover:border-indigo-300'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-slate-400" />
                <span>Sound Off</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-yellow-300" />
                <span>Sound On</span>
              </>
            )}
          </button>
        </div>

        {/* Centered Hero Title & Subtitle */}
        <header className="mt-5 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            Ranks and Rewards
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-sm text-indigo-100/85 sm:text-base">
            Finish missions, collect stars and climb the ranks.
          </p>
        </header>

        {/* Next-Rank Progress Tracker Bar */}
        <section className="mx-auto mt-6 max-w-4xl rounded-2xl border border-indigo-400/25 bg-[#0D1130]/85 p-4 shadow-[0_12px_40px_rgba(5,7,22,0.55)] backdrop-blur-md sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-xs text-indigo-200">
                  Current Rank: <strong className="text-white">{rankProgress.currentRank.title}</strong>
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {rankProgress.isMaxRank
                    ? 'Maximum Rank Unlocked — You are a Mission Hero!'
                    : `${rankProgress.starsToNext} more star${
                        rankProgress.starsToNext === 1 ? '' : 's'
                      } to unlock ${rankProgress.nextRank?.title}`}
                </div>
              </div>
            </div>

            <div className="text-right font-mono tabular-nums">
              <div className="text-lg font-bold text-yellow-300">
                {starBreakdown.totalStars}
                <span className="text-xs font-normal text-indigo-200/80">
                  {rankProgress.nextRank ? ` / ${rankProgress.nextRank.minStars} ★` : ' ★ MAX'}
                </span>
              </div>
              <div className="text-[11px] text-indigo-200/75">
                {rankProgress.progressPct}% to{' '}
                {rankProgress.nextRank ? rankProgress.nextRank.title : 'Hero Cap'}
              </div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-3.5">
            <div
              role="progressbar"
              aria-label="Progress toward next star rank"
              aria-valuemin={0}
              aria-valuemax={overallCapStars}
              aria-valuenow={Math.min(overallCapStars, starBreakdown.totalStars)}
              className="relative h-3.5 w-full overflow-hidden rounded-full bg-[#06091B] ring-1 ring-indigo-300/20"
            >
              <motion.div
                initial={false}
                animate={{ width: `${Math.max(4, overallMeterPct)}%` }}
                transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-teal-400 via-60% to-orange-400 shadow-[0_0_16px_rgba(56,189,248,0.65)]"
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-indigo-200/75 tabular-nums">
              {STAR_RANK_TIERS.map((tier) => {
                const reached = starBreakdown.totalStars >= tier.minStars;
                return (
                  <span key={tier.id} className={reached ? 'font-bold text-yellow-300' : ''}>
                    {tier.minStars}★ {tier.title}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* Four Ascending Vertical Columns (Reference Layout Centerpiece) */}
        <section aria-label="Rank Progression Columns" className="mt-8 sm:mt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            {STAR_RANK_TIERS.map((tier, index) => {
              const style = COLUMN_STYLES[tier.colorTheme];
              const isUnlocked = starBreakdown.totalStars >= tier.minStars;
              const isCurrent = rankProgress.currentRank.id === tier.id;
              const isSelected = selectedRankId === tier.id;
              const isClaimed = claimedIds.includes(tier.rewardId);
              const starsMissing = Math.max(0, tier.minStars - starBreakdown.totalStars);

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.07 }}
                  className="flex flex-col items-center"
                >
                  {/* Golden Star Icons Placed Above Each Rank Card */}
                  <div
                    aria-label={`${tier.starIcons} golden ${
                      tier.starIcons === 1 ? 'star' : 'stars'
                    }`}
                    className="mb-3 flex items-center justify-center gap-1.5"
                  >
                    {Array.from({ length: tier.starIcons }).map((_, starIdx) => (
                      <motion.div
                        key={starIdx}
                        whileHover={{ scale: 1.18, rotate: 8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                      >
                        <Star
                          className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${
                            isUnlocked
                              ? 'fill-yellow-300 text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)]'
                              : 'fill-slate-800/80 text-slate-600'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Ascending Rounded Colorful Column Card */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -6, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => {
                      soundEngine.playRankSelect();
                      setSelectedRankId(tier.id);
                    }}
                    className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b p-5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300 ${
                      style.cardGradient
                    } ${style.heightClass} ${
                      isUnlocked ? style.glowShadow : 'shadow-[0_14px_32px_rgba(5,7,22,0.65)]'
                    } ${isCurrent ? style.activeRing : ''} ${
                      isSelected && !isCurrent ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[#120F33]' : ''
                    }`}
                  >
                    {/* Subtle Gloss Highlight */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/25 to-transparent"
                    />

                    {/* Frosted Lock Veil if Locked */}
                    {!isUnlocked && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-slate-950/55"
                      />
                    )}

                    {/* Top Status Badge */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${
                          isUnlocked
                            ? style.badgeBg
                            : 'border-slate-500/50 bg-slate-950/75 text-slate-200'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Current Rank</span>
                          </>
                        ) : isUnlocked ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>Locked</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Rank Title, Star Requirement & Reward Summary */}
                    <div className="relative z-10 mt-auto pt-4">
                      <div
                        className={`font-mono text-xs font-bold uppercase tracking-wider tabular-nums ${
                          isUnlocked ? style.subTextColor : 'text-slate-200'
                        }`}
                      >
                        {tier.minStars}+ stars
                      </div>
                      <h2
                        className={`mt-1 font-display text-2xl font-bold leading-tight ${
                          isUnlocked ? style.textColor : 'text-white'
                        }`}
                      >
                        {tier.title}
                      </h2>

                      <div
                        className={`mt-3 rounded-2xl border p-3 text-xs ${
                          isUnlocked
                            ? 'border-black/15 bg-slate-950/20'
                            : 'border-slate-600/40 bg-slate-950/70 text-slate-200'
                        }`}
                      >
                        <div
                          className={`font-semibold ${
                            isUnlocked ? style.textColor : 'text-white'
                          }`}
                        >
                          {tier.rewardTitle}
                        </div>
                        <div
                          className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                            isUnlocked ? style.subTextColor : 'text-slate-300'
                          }`}
                        >
                          {isUnlocked
                            ? isClaimed
                              ? 'Reward Claimed'
                              : 'Unlocked — Tap to Claim'
                            : `Need ${starsMissing} more star${starsMissing === 1 ? '' : 's'}`}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Bottom Split: Selected Rank Reward Details + Live Star Earning Sources */}
        <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Selected Rank & Reward Panel */}
          <div className="flex flex-col justify-between rounded-2xl border border-indigo-400/25 bg-[#0D1130]/90 p-5 backdrop-blur-md lg:col-span-6 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-yellow-300">
                  <Award className="h-4 w-4" />
                  <span>Rank Reward Showcase · {selectedTier.minStars}+ Stars</span>
                </div>
                <span
                  className={`font-mono text-xs font-bold ${
                    selectedUnlocked ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {selectedUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>

              <h3 className="mt-2 font-display text-2xl font-bold text-white">
                {selectedTier.title} — {selectedTier.rewardTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {selectedTier.rewardDescription}
              </p>

              <ul className="mt-4 space-y-2">
                {selectedTier.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-xs font-medium text-indigo-100"
                  >
                    <Star
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selectedUnlocked
                          ? 'fill-yellow-300 text-yellow-300'
                          : 'text-slate-500'
                      }`}
                    />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-indigo-400/20 pt-4">
              {selectedUnlocked ? (
                <>
                  <button
                    type="button"
                    disabled={selectedClaimed}
                    onMouseEnter={() => soundEngine.playHover()}
                    onClick={() => {
                      soundEngine.playRankUnlock();
                      onClaimReward(selectedTier.rewardId);
                      onCelebrateRank?.(selectedTier);
                    }}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors whitespace-nowrap ${
                      selectedClaimed
                        ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 cursor-default'
                        : 'bg-yellow-400 text-slate-950 hover:bg-yellow-300'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{selectedClaimed ? 'Reward Claimed' : 'Claim Reward'}</span>
                  </button>

                  {onCelebrateRank && selectedClaimed && (
                    <button
                      type="button"
                      onMouseEnter={() => soundEngine.playHover()}
                      onClick={() => {
                        soundEngine.playRankUnlock();
                        onCelebrateRank(selectedTier);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-4 py-2.5 text-xs font-semibold text-indigo-100 transition-colors hover:border-indigo-300 whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                      <span>Replay Rank Celebration</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playClick();
                    onNavigate('DASHBOARD');
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-300 whitespace-nowrap"
                >
                  <Compass className="h-4 w-4" />
                  <span>
                    Earn {Math.max(0, selectedTier.minStars - starBreakdown.totalStars)} More Stars
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Live Star Sources & Quick Launch */}
          <div className="flex flex-col justify-between rounded-2xl border border-indigo-400/25 bg-[#0D1130]/90 p-5 backdrop-blur-md lg:col-span-6 sm:p-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-sky-300">
                Star Earnings Ledger
              </div>
              <h3 className="mt-1 font-display text-xl font-bold text-white">
                How to Collect More Stars
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-400/20 bg-[#080B22] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-white">Training Simulators (Up to 5★ each)</div>
                    <div className="text-xs text-slate-400">
                      Complete Navigation, Robotic Arm, Emergency &amp; Flight Exam
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-yellow-300 tabular-nums shrink-0">
                    {starBreakdown.simulatorStars} / 20 ★
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-400/20 bg-[#080B22] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-white">3D Planetary Investigations (3★ each)</div>
                    <div className="text-xs text-slate-400">
                      Explore Solar System worlds and solve field mysteries
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-yellow-300 tabular-nums shrink-0">
                    {starBreakdown.investigationStars} ★
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-400/20 bg-[#080B22] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-white">Science Academy Quizzes (2–3★ each)</div>
                    <div className="text-xs text-slate-400">
                      Score 80%+ on NASA Science lessons for bonus stars
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-yellow-300 tabular-nums shrink-0">
                    {starBreakdown.academyStars} ★
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-400/20 bg-[#080B22] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-white">Scans, Samples &amp; Bonus Checks</div>
                    <div className="text-xs text-slate-400">
                      Scan equipment nodes, collect pickups, and pass follow-ups
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-yellow-300 tabular-nums shrink-0">
                    {starBreakdown.discoveryStars} ★
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 border-t border-indigo-400/20 pt-4">
              <button
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick();
                  onNavigate('DASHBOARD');
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-400 whitespace-nowrap"
              >
                <Compass className="h-4 w-4" />
                <span>Play Simulators</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick();
                  onNavigate('WORLD_EXPLORE');
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-sky-400/50 bg-sky-400/15 px-4 py-2 text-xs font-bold text-sky-200 transition-colors hover:bg-sky-400 hover:text-slate-950 whitespace-nowrap"
              >
                <Globe className="h-4 w-4" />
                <span>Explore 3D Worlds</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick();
                  onNavigate('SCIENCE_ACADEMY');
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-indigo-400/40 bg-[#080B22] px-4 py-2 text-xs font-bold text-indigo-200 transition-colors hover:border-indigo-300 hover:text-white whitespace-nowrap"
              >
                <BookOpen className="h-4 w-4" />
                <span>Science Academy</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
