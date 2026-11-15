import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Globe, Milestone, Rocket, Star, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, animate, motion } from 'motion/react';
import { GameScreen, TraineeProfile } from '../types/game';
import { ASTRONAUT_AVATARS } from '../data/nasaScienceData';
import {
  calculatePerformance,
  calculateLevelFromXp,
  calculateStarBreakdown,
  calculateStarRankProgress,
} from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface TopHudBarProps {
  profile: TraineeProfile;
  currentScreen: GameScreen;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigate: (screen: GameScreen) => void;
}

export function TopHudBar({
  profile,
  currentScreen,
  isMuted,
  onToggleMute,
  onNavigate,
}: TopHudBarProps) {
  const avatar = ASTRONAUT_AVATARS.find((a) => a.id === profile.avatarId) || ASTRONAUT_AVATARS[0];
  const perf = calculatePerformance(profile);
  const currentXp = profile.openWorld?.xp ?? 0;
  const rank = calculateLevelFromXp(currentXp);
  const starBreakdown = calculateStarBreakdown(profile);
  const starRank = calculateStarRankProgress(starBreakdown.totalStars);

  const [displayXp, setDisplayXp] = useState(currentXp);
  const [recentGain, setRecentGain] = useState<{
    amount: number;
    key: number;
    leveledUp: boolean;
  } | null>(null);

  const prevXpRef = useRef(currentXp);
  const prevLevelRef = useRef(rank.level);

  useEffect(() => {
    const prevXp = prevXpRef.current;
    const prevLevel = prevLevelRef.current;
    prevXpRef.current = currentXp;
    prevLevelRef.current = rank.level;

    if (currentXp === prevXp) {
      setDisplayXp(currentXp);
      return;
    }

    const delta = currentXp - prevXp;
    if (delta > 0) {
      setRecentGain({
        amount: delta,
        key: Date.now(),
        leveledUp: rank.level > prevLevel,
      });
    }

    const controls = animate(prevXp, currentXp, {
      duration: 0.85,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayXp(Math.round(latest)),
    });

    const clearTimer = window.setTimeout(() => {
      setRecentGain(null);
    }, 2800);

    return () => {
      controls.stop();
      window.clearTimeout(clearTimer);
    };
  }, [currentXp, rank.level]);

  const isInMission =
    currentScreen === 'MISSION_NAVIGATION' ||
    currentScreen === 'MISSION_ROBOTIC_ARM' ||
    currentScreen === 'MISSION_EMERGENCY' ||
    currentScreen === 'MISSION_EVALUATION';

  return (
    <header className="relative z-20 flex h-11 w-full items-center justify-between gap-3 border-b border-slate-800/90 bg-[#060913]/95 px-3 sm:px-5">
      {/* Left Zone: Identity or Back Action */}
      <div className="flex min-w-0 items-center gap-2.5">
        {currentScreen !== 'DASHBOARD' ? (
          <button
            type="button"
            onClick={() => onNavigate('DASHBOARD')}
            className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0C1222] px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-white whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
            <span>Training Hub</span>
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={avatar.imageUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-7 w-7 shrink-0 rounded-md border border-cyan-400/60 bg-slate-900 object-cover"
            />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-xs font-bold text-white">
                {profile.name}
              </div>
              <div className="truncate font-mono text-[10px] text-cyan-300/90">
                Lv.{rank.level} · {rank.title}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center Zone: Clean Underline Text Navigation */}
      {!isInMission && (
        <nav className="hidden sm:flex h-full items-center gap-3.5 lg:gap-5" aria-label="Academy sections">
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('DASHBOARD')}
            className={`inline-flex h-full items-center border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'DASHBOARD'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <span>Training Hub</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('RANKS_REWARDS')}
            className={`inline-flex h-full items-center gap-1.5 border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'RANKS_REWARDS'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
            <span>Ranks &amp; Rewards</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('NEARBY_EXOPLANETS')}
            className={`inline-flex h-full items-center gap-1.5 border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'NEARBY_EXOPLANETS'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-cyan-300" />
            <span>Nearby Exoplanets</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('SPACE_TRAVEL_HISTORY')}
            className={`inline-flex h-full items-center gap-1.5 border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'SPACE_TRAVEL_HISTORY'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Milestone className="h-3.5 w-3.5 text-cyan-300" />
            <span>Space Travel History</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('SCIENCE_ACADEMY')}
            className={`inline-flex h-full items-center gap-1.5 border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'SCIENCE_ACADEMY'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
            <span>Science Academy</span>
          </button>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('RESULTS')}
            className={`inline-flex h-full items-center gap-1.5 border-b-2 px-1 text-[11px] lg:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentScreen === 'RESULTS'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-amber-300" />
            <span>Score &amp; Certificate</span>
          </button>
        </nav>
      )}

      {/* Right Zone: Star Rank Link + Animated XP Bar + Score + 3D CTA + Audio */}
      <div className="flex shrink-0 items-center gap-2">
        {!isInMission && (
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => {
              soundEngine.playRankSelect();
              onNavigate('RANKS_REWARDS');
            }}
            title={`${starRank.currentRank.title} · ${starBreakdown.totalStars} Stars Earned`}
            className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] font-bold transition-colors tabular-nums whitespace-nowrap shrink-0 ${
              currentScreen === 'RANKS_REWARDS'
                ? 'border-yellow-400/80 bg-yellow-400/15 text-yellow-200'
                : 'border-slate-800 bg-[#0C1222] text-yellow-300 hover:border-yellow-400/60'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
            <span>{starBreakdown.totalStars}</span>
            <span className="hidden lg:inline text-slate-300 font-medium">
              · {starRank.currentRank.title}
            </span>
          </button>
        )}

        {/* Framer Motion XP Progress Bar */}
        <div
          title={
            rank.isMaxLevel
              ? `${rank.title} (Level ${rank.level} Max Level) · ${currentXp} XP`
              : `${rank.title} (Level ${rank.level}) · ${currentXp}/${rank.nextLevelXp} XP to Level ${rank.level + 1}`
          }
          className={`relative ${isInMission ? 'flex' : 'hidden md:flex'} items-center gap-2 rounded-lg border px-2 py-1 transition-colors ${
            recentGain
              ? 'border-cyan-400/80 bg-cyan-950/40'
              : 'border-slate-800 bg-[#0C1222]'
          }`}
        >
          <span className="font-mono text-[10px] font-bold text-cyan-300 tabular-nums whitespace-nowrap">
            Lv.{rank.level}
            <span className={isInMission ? 'inline' : 'hidden xl:inline'}> · {rank.title}</span>
          </span>

          <div
            role="progressbar"
            aria-label="Astronaut rank XP progress"
            aria-valuemin={rank.currentLevelXp}
            aria-valuemax={rank.nextLevelXp}
            aria-valuenow={currentXp}
            className="relative h-1.5 w-16 overflow-hidden rounded-full bg-slate-800/90 lg:w-20"
          >
            <motion.div
              initial={false}
              animate={{ width: `${Math.max(4, rank.progressPct)}%` }}
              transition={{ type: 'spring', stiffness: 115, damping: 18, mass: 0.8 }}
              className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400"
            >
              <AnimatePresence>
                {recentGain && (
                  <motion.span
                    key={`sweep-${recentGain.key}`}
                    aria-hidden="true"
                    initial={{ x: '-100%', opacity: 0.9 }}
                    animate={{ x: '220%', opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-white/80"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <span className="font-mono text-[10px] text-slate-300 tabular-nums whitespace-nowrap">
            <strong className="text-white">{displayXp}</strong>
            {!rank.isMaxLevel && (
              <span className="hidden xl:inline text-slate-400">/{rank.nextLevelXp}</span>
            )}{' '}
            XP
          </span>

          {/* Animated +XP Gain Popover */}
          <AnimatePresence>
            {recentGain && (
              <motion.span
                key={recentGain.key}
                initial={{ opacity: 0, y: 6, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`pointer-events-none absolute -bottom-6 right-1 z-30 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-lg whitespace-nowrap ${
                  recentGain.leveledUp
                    ? 'border-amber-400/70 bg-[#0C1222] text-amber-300'
                    : 'border-emerald-400/70 bg-[#0C1222] text-emerald-300'
                }`}
              >
                {recentGain.leveledUp
                  ? `RANK UP: ${rank.title}! +${recentGain.amount} XP`
                  : `+${recentGain.amount} XP`}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
          <span>
            Score <strong className="text-white">{perf.totalScore}</strong>/400
          </span>
        </div>

        {!isInMission && (
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => onNavigate('SCIENCE_ACADEMY')}
              aria-label="Science Academy"
              className={`inline-flex min-h-[30px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap ${
                currentScreen === 'SCIENCE_ACADEMY'
                  ? 'bg-cyan-500/15 text-cyan-200'
                  : 'text-slate-300'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => onNavigate('RESULTS')}
              aria-label="Score and Certificate"
              className={`inline-flex min-h-[30px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap ${
                currentScreen === 'RESULTS' ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!isInMission && (
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => onNavigate('WORLD_EXPLORE')}
            className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg bg-cyan-400 px-2.5 py-1 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>3D Space World</span>
          </button>
        )}

        <button
          type="button"
          onMouseEnter={() => soundEngine.playHover()}
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          title={isMuted ? 'Sound Off' : 'Sound On'}
          className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-lg border border-slate-800 bg-[#0C1222] px-2 text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-white shrink-0"
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
          )}
        </button>
      </div>
    </header>
  );
}
