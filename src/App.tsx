import { useState } from 'react';
import { AvatarId, DifficultyTier, GameScreen, SpacecraftId, TraineeProfile, WorldId } from './types/game';
import { SCIENTIFIC_INVESTIGATIONS, WORLDS, WorldInteractiveNode, WorldPickup } from './data/openWorldMissions';
import {
  calculateStarBreakdown,
  calculateStarRankProgress,
  clearProfile,
  createDefaultProfile,
  loadProfile,
  saveProfile,
  STAR_RANK_TIERS,
  StarRankTier,
} from './utils/storage';
import { soundEngine } from './utils/sound';
import { StarfieldBackground } from './components/StarfieldBackground';
import { TopHudBar } from './components/TopHudBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegistrationScreen } from './components/RegistrationScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SpaceWorld3D } from './components/world/SpaceWorld3D';
import { MissionNavigation } from './components/missions/MissionNavigation';
import { MissionRoboticArm } from './components/missions/MissionRoboticArm';
import { MissionEmergency } from './components/missions/MissionEmergency';
import { MissionEvaluation } from './components/missions/MissionEvaluation';
import { SpaceScienceAcademy } from './components/academy/SpaceScienceAcademy';
import { RanksAndRewardsScreen } from './components/RanksAndRewardsScreen';
import { RankUnlockCelebrationModal } from './components/RankUnlockCelebrationModal';
import { ResultsScreen } from './components/ResultsScreen';
import { NearbyExoplanetsScreen } from './components/NearbyExoplanetsScreen';
import { SpaceTravelHistoryScreen } from './components/history/SpaceTravelHistoryScreen';
import { BottomLeftRankWidget } from './components/BottomLeftRankWidget';

export default function App() {
  const [profile, setProfile] = useState<TraineeProfile | null>(() => loadProfile());
  const [screen, setScreen] = useState<GameScreen>('WELCOME');
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false);
  const [unlockedRankModal, setUnlockedRankModal] = useState<StarRankTier | null>(null);

  const finalizeProfileUpdate = (prev: TraineeProfile, candidate: TraineeProfile): TraineeProfile => {
    const newStars = calculateStarBreakdown(candidate).totalStars;
    const nextRank = calculateStarRankProgress(newStars).currentRank;
    const prevCelebratedId = prev.openWorld.celebratedStarRankId || 'space-cadet';
    const prevIdx = STAR_RANK_TIERS.findIndex((t) => t.id === prevCelebratedId);
    const nextIdx = STAR_RANK_TIERS.findIndex((t) => t.id === nextRank.id);

    let finalProfile = candidate;
    if (nextIdx > prevIdx) {
      finalProfile = {
        ...candidate,
        openWorld: {
          ...candidate.openWorld,
          celebratedStarRankId: nextRank.id,
        },
      };
      window.setTimeout(() => {
        soundEngine.playRankUnlock();
        setUnlockedRankModal(nextRank);
      }, 250);
    }

    saveProfile(finalProfile);
    return finalProfile;
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleNavigate = (next: GameScreen) => {
    soundEngine.playClick();
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterComplete = (name: string, avatarId: AvatarId) => {
    soundEngine.playSuccess();
    const fresh = createDefaultProfile(name, avatarId);
    saveProfile(fresh);
    setProfile(fresh);
    setScreen('WORLD_EXPLORE');
  };

  const handleMissionComplete = (
    missionKey: keyof TraineeProfile['missions'],
    score: number,
    accuracy: number,
    details: string
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const existing = prev.missions[missionKey];
      const updated: TraineeProfile = {
        ...prev,
        missions: {
          ...prev.missions,
          [missionKey]: {
            completed: true,
            score: Math.max(existing.score, score),
            accuracy: existing.attempts === 0 ? accuracy : Math.max(existing.accuracy, accuracy),
            attempts: existing.attempts + 1,
            bestDetails: score >= existing.score ? details : existing.bestDetails,
          },
        },
        openWorld: {
          ...prev.openWorld,
          xp: prev.openWorld.xp + (existing.completed ? 25 : 80),
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleSaveQuizResult = (
    lessonId: string,
    scorePct: number,
    answered: number,
    correct: number
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const completedSet = new Set(prev.academy.completedLessons);
      const firstTime = !completedSet.has(lessonId);
      completedSet.add(lessonId);
      const prevBest = prev.academy.quizScores[lessonId] ?? 0;
      const updated: TraineeProfile = {
        ...prev,
        academy: {
          completedLessons: Array.from(completedSet),
          quizScores: {
            ...prev.academy.quizScores,
            [lessonId]: Math.max(prevBest, scorePct),
          },
          totalQuizQuestionsAnswered: prev.academy.totalQuizQuestionsAnswered + answered,
          totalQuizCorrect: prev.academy.totalQuizCorrect + correct,
        },
        openWorld: {
          ...prev.openWorld,
          xp: prev.openWorld.xp + (firstTime ? 30 : 10),
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleChangeWorld = (worldId: WorldId) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          currentWorld: worldId,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const handleSelectSpacecraft = (craftId: SpacecraftId) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          selectedSpacecraft: craftId,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const handleToggleSandboxUnlock = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          sandboxUnlocked: !prev.openWorld.sandboxUnlocked,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const handleCollectPickup = (pickup: WorldPickup) => {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.openWorld.collectedPickups.includes(pickup.id)) return prev;
      const nextInventory = [...prev.openWorld.inventory];
      if (!nextInventory.some((it) => it.id === pickup.id)) {
        nextInventory.push({
          id: pickup.id,
          name: pickup.title,
          worldId: pickup.worldId,
          category: 'sample',
          reading: pickup.reading,
          collectedAt: new Date().toISOString(),
        });
      }
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          collectedPickups: [...prev.openWorld.collectedPickups, pickup.id],
          inventory: nextInventory,
          xp: prev.openWorld.xp + 20,
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleDiscoverNode = (node: WorldInteractiveNode) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const already = prev.openWorld.discoveredNodes.includes(node.id);
      const nextNodes = already
        ? prev.openWorld.discoveredNodes
        : [...prev.openWorld.discoveredNodes, node.id];

      const nextInventory = [...prev.openWorld.inventory];
      if (node.rewardItem && !nextInventory.some((it) => it.id === node.rewardItem!.id)) {
        nextInventory.push({
          ...node.rewardItem,
          collectedAt: new Date().toISOString(),
        });
      }

      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          discoveredNodes: nextNodes,
          inventory: nextInventory,
          xp: prev.openWorld.xp + (already ? 0 : 35),
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleSolveInvestigation = (
    investigationId: string,
    score: number,
    xpGain: number,
    nextTier: DifficultyTier
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const solvedSet = new Set(prev.openWorld.solvedInvestigations);
      solvedSet.add(investigationId);
      const prevScore = prev.openWorld.investigationScores[investigationId] ?? 0;

      const invMeta = SCIENTIFIC_INVESTIGATIONS.find((i) => i.id === investigationId);
      const badgeSet = new Set(prev.openWorld.earnedBadges || []);
      if (invMeta) {
        badgeSet.add(WORLDS[invMeta.worldId].badgeTitle);
      }

      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          solvedInvestigations: Array.from(solvedSet),
          investigationScores: {
            ...prev.openWorld.investigationScores,
            [investigationId]: Math.max(prevScore, score),
          },
          earnedBadges: Array.from(badgeSet),
          difficultyTier: nextTier,
          xp: prev.openWorld.xp + xpGain,
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleCompleteFollowUp = (passed: boolean, xpGain: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          followUpsPassed: prev.openWorld.followUpsPassed + (passed ? 1 : 0),
          xp: prev.openWorld.xp + xpGain,
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleClaimRankReward = (rewardId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const existing = prev.openWorld.claimedRewardIds || [];
      if (existing.includes(rewardId)) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          claimedRewardIds: [...existing, rewardId],
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const handleCompleteExoMission = (missionId: string, xpGain: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const claimed = prev.openWorld.claimedRewardIds || [];
      if (claimed.includes(missionId)) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          claimedRewardIds: [...claimed, missionId],
          xp: prev.openWorld.xp + xpGain,
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleCompleteHistoryStudy = (studyId: string, xpGain: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const claimed = prev.openWorld.claimedRewardIds || [];
      const studyKey = `history-study-${studyId}`;
      if (claimed.includes(studyKey)) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          claimedRewardIds: [...claimed, studyKey],
          xp: prev.openWorld.xp + xpGain,
        },
      };
      return finalizeProfileUpdate(prev, updated);
    });
  };

  const handleHintUsed = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated: TraineeProfile = {
        ...prev,
        openWorld: {
          ...prev.openWorld,
          hintsUsedTotal: prev.openWorld.hintsUsedTotal + 1,
        },
      };
      saveProfile(updated);
      return updated;
    });
  };

  const handleConfirmSwitchCadet = () => {
    soundEngine.playClick();
    clearProfile();
    setProfile(null);
    setConfirmSwitchOpen(false);
    setScreen('REGISTER');
  };

  if (screen === 'WELCOME') {
    return (
      <WelcomeScreen
        existingProfile={profile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStartNew={() => {
          soundEngine.playClick();
          setScreen('REGISTER');
        }}
        onResume={() => {
          soundEngine.playClick();
          setScreen('WORLD_EXPLORE');
        }}
      />
    );
  }

  if (screen === 'WORLD_EXPLORE' && profile) {
    return (
      <SpaceWorld3D
        profile={profile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNavigateScreen={handleNavigate}
        onChangeWorld={handleChangeWorld}
        onSelectSpacecraft={handleSelectSpacecraft}
        onToggleSandboxUnlock={handleToggleSandboxUnlock}
        onCollectPickup={handleCollectPickup}
        onDiscoverNode={handleDiscoverNode}
        onSolveInvestigation={handleSolveInvestigation}
        onCompleteFollowUp={handleCompleteFollowUp}
        onHintUsed={handleHintUsed}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#060913] astro-grid-surface text-slate-100">
      <StarfieldBackground />

      {screen === 'REGISTER' && (
        <RegistrationScreen
          onBack={() => {
            soundEngine.playClick();
            setScreen('WELCOME');
          }}
          onComplete={handleRegisterComplete}
        />
      )}

      {screen !== 'REGISTER' && profile && (
        <>
          <TopHudBar
            profile={profile}
            currentScreen={screen}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onNavigate={handleNavigate}
          />

          {screen === 'DASHBOARD' && (
            <DashboardScreen
              profile={profile}
              onNavigate={handleNavigate}
              onResetProfile={() => {
                soundEngine.playClick();
                setConfirmSwitchOpen(true);
              }}
            />
          )}

          {screen === 'MISSION_NAVIGATION' && (
            <MissionNavigation
              onComplete={(score, acc, details) =>
                handleMissionComplete('navigation', score, acc, details)
              }
              onExit={() => handleNavigate('DASHBOARD')}
            />
          )}

          {screen === 'MISSION_ROBOTIC_ARM' && (
            <MissionRoboticArm
              onComplete={(score, acc, details) =>
                handleMissionComplete('roboticArm', score, acc, details)
              }
              onExit={() => handleNavigate('DASHBOARD')}
            />
          )}

          {screen === 'MISSION_EMERGENCY' && (
            <MissionEmergency
              onComplete={(score, acc, details) =>
                handleMissionComplete('emergency', score, acc, details)
              }
              onExit={() => handleNavigate('DASHBOARD')}
            />
          )}

          {screen === 'MISSION_EVALUATION' && (
            <MissionEvaluation
              onComplete={(score, acc, details) =>
                handleMissionComplete('evaluation', score, acc, details)
              }
              onNavigate={handleNavigate}
            />
          )}

          {screen === 'SCIENCE_ACADEMY' && (
            <SpaceScienceAcademy profile={profile} onSaveQuizResult={handleSaveQuizResult} />
          )}

          {screen === 'RANKS_REWARDS' && (
            <RanksAndRewardsScreen
              profile={profile}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onClaimReward={handleClaimRankReward}
              onCelebrateRank={(rankTier) => setUnlockedRankModal(rankTier)}
              onNavigate={handleNavigate}
            />
          )}

          {screen === 'NEARBY_EXOPLANETS' && (
            <NearbyExoplanetsScreen
              profile={profile}
              onCompleteMission={handleCompleteExoMission}
            />
          )}

          {screen === 'SPACE_TRAVEL_HISTORY' && (
            <SpaceTravelHistoryScreen
              profile={profile}
              onCompleteHistoryStudy={handleCompleteHistoryStudy}
            />
          )}

          {screen === 'RESULTS' && (
            <ResultsScreen profile={profile} onNavigate={handleNavigate} />
          )}
        </>
      )}

      {profile && (
        <RankUnlockCelebrationModal
          unlockedRank={unlockedRankModal}
          totalStars={calculateStarBreakdown(profile).totalStars}
          onDismiss={() => setUnlockedRankModal(null)}
          onOpenRanksScreen={() => {
            setUnlockedRankModal(null);
            handleNavigate('RANKS_REWARDS');
          }}
        />
      )}

      {profile &&
        screen !== 'REGISTER' &&
        screen !== 'WORLD_EXPLORE' &&
        screen !== 'RANKS_REWARDS' &&
        screen !== 'MISSION_NAVIGATION' &&
        screen !== 'MISSION_ROBOTIC_ARM' &&
        screen !== 'MISSION_EMERGENCY' &&
        screen !== 'MISSION_EVALUATION' && (
          <BottomLeftRankWidget
            profile={profile}
            onOpenRanks={() => handleNavigate('RANKS_REWARDS')}
          />
        )}

      {/* Custom In-App Confirmation Modal for Switching Cadet */}
      {confirmSwitchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="switch-cadet-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060913]/85 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-2xl">
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
              Cadet Roster Reset
            </div>
            <h2 id="switch-cadet-title" className="mt-1 font-display text-xl font-bold text-white">
              Start a New Astronaut Profile?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Switching cadets will clear the current saved mission scores for{' '}
              <strong className="text-white">{profile?.name}</strong> and open registration for a
              new trainee.
            </p>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => setConfirmSwitchOpen(false)}
                className="min-h-[42px] rounded-xl border border-slate-700 bg-[#080D1A] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitchCadet}
                className="min-h-[42px] rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-400 whitespace-nowrap"
              >
                Switch Cadet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
