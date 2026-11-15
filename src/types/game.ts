export type GameScreen =
  | 'WELCOME'
  | 'REGISTER'
  | 'WORLD_EXPLORE'
  | 'DASHBOARD'
  | 'MISSION_NAVIGATION'
  | 'MISSION_ROBOTIC_ARM'
  | 'MISSION_EMERGENCY'
  | 'MISSION_EVALUATION'
  | 'SCIENCE_ACADEMY'
  | 'RANKS_REWARDS'
  | 'NEARBY_EXOPLANETS'
  | 'SPACE_TRAVEL_HISTORY'
  | 'RESULTS';

export type StarRankId = 'space-cadet' | 'pilot' | 'commander' | 'mission-hero';

export type AvatarId = 'nova' | 'orion' | 'vega' | 'atlas';

export type WorldId =
  | 'station'
  | 'mars'
  | 'moon'
  | 'venus'
  | 'mercury'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'earth';

export type DifficultyTier = 'cadet' | 'specialist' | 'commander';

export type SpacecraftId = 'orion-explorer' | 'falcon-voyager' | 'cloud-skimmer';

export interface AstronautAvatar {
  id: AvatarId;
  name: string;
  specialty: string;
  accentColor: string;
  imageUrl: string;
}

export interface MissionMetric {
  completed: boolean;
  score: number; // 0 to 100
  accuracy: number; // 0 to 100
  attempts: number;
  bestDetails: string;
}

export interface AcademyProgress {
  completedLessons: string[];
  quizScores: Record<string, number>; // lessonId -> 0..100
  totalQuizQuestionsAnswered: number;
  totalQuizCorrect: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  worldId: WorldId;
  category: 'sample' | 'telemetry' | 'equipment';
  reading: string;
  collectedAt: string;
}

export interface OpenWorldProgress {
  xp: number;
  currentWorld: WorldId;
  selectedSpacecraft: SpacecraftId;
  difficultyTier: DifficultyTier;
  inventory: InventoryItem[];
  discoveredNodes: string[];
  solvedInvestigations: string[];
  investigationScores: Record<string, number>;
  earnedBadges: string[];
  collectedPickups: string[];
  sandboxUnlocked: boolean;
  hintsUsedTotal: number;
  followUpsPassed: number;
  claimedRewardIds?: string[];
  celebratedStarRankId?: StarRankId;
}

export interface TraineeProfile {
  name: string;
  avatarId: AvatarId;
  createdAt: string;
  missions: {
    navigation: MissionMetric;
    roboticArm: MissionMetric;
    emergency: MissionMetric;
    evaluation: MissionMetric;
  };
  academy: AcademyProgress;
  openWorld: OpenWorldProgress;
}

export interface PerformanceBreakdown {
  totalScore: number; // 0..400
  averageAccuracy: number; // 0..100
  missionsCompletedCount: number;
  navigationScore: number;
  roboticArmScore: number;
  decisionMakingScore: number;
  scientificKnowledgeScore: number;
  rankTitle: string;
  allMissionsComplete: boolean;
  encouragement: string;
  recommendations: string[];
}
