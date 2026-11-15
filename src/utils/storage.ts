import { AvatarId, OpenWorldProgress, PerformanceBreakdown, StarRankId, TraineeProfile } from '../types/game';
import { SCIENCE_LESSONS } from '../data/nasaScienceData';
import { SCIENTIFIC_INVESTIGATIONS } from '../data/openWorldMissions';

const STORAGE_KEY = 'junior_astronaut_academy_profile_v1';

export function createDefaultOpenWorld(): OpenWorldProgress {
  return {
    xp: 0,
    currentWorld: 'earth',
    selectedSpacecraft: 'orion-explorer',
    difficultyTier: 'cadet',
    inventory: [],
    discoveredNodes: [],
    solvedInvestigations: [],
    investigationScores: {},
    earnedBadges: [],
    collectedPickups: [],
    sandboxUnlocked: false,
    hintsUsedTotal: 0,
    followUpsPassed: 0,
    claimedRewardIds: ['reward-space-cadet'],
    celebratedStarRankId: 'space-cadet',
  };
}

export function createDefaultProfile(name: string, avatarId: AvatarId): TraineeProfile {
  return {
    name: name.trim() || 'Cadet Explorer',
    avatarId,
    createdAt: new Date().toISOString(),
    missions: {
      navigation: {
        completed: false,
        score: 0,
        accuracy: 0,
        attempts: 0,
        bestDetails: 'Not launched yet',
      },
      roboticArm: {
        completed: false,
        score: 0,
        accuracy: 0,
        attempts: 0,
        bestDetails: 'Not launched yet',
      },
      emergency: {
        completed: false,
        score: 0,
        accuracy: 0,
        attempts: 0,
        bestDetails: 'Not launched yet',
      },
      evaluation: {
        completed: false,
        score: 0,
        accuracy: 0,
        attempts: 0,
        bestDetails: 'Not launched yet',
      },
    },
    academy: {
      completedLessons: [],
      quizScores: {},
      totalQuizQuestionsAnswered: 0,
      totalQuizCorrect: 0,
    },
    openWorld: createDefaultOpenWorld(),
  };
}

export function loadProfile(): TraineeProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TraineeProfile>;
    if (!parsed || !parsed.name || !parsed.missions) return null;
    // Safely migrate pre-3D profiles without losing existing progress
    return {
      ...parsed,
      academy: parsed.academy || {
        completedLessons: [],
        quizScores: {},
        totalQuizQuestionsAnswered: 0,
        totalQuizCorrect: 0,
      },
      openWorld: {
        ...createDefaultOpenWorld(),
        ...(parsed.openWorld || {}),
        claimedRewardIds: parsed.openWorld?.claimedRewardIds || ['reward-space-cadet'],
        celebratedStarRankId: parsed.openWorld?.celebratedStarRankId || 'space-cadet',
      },
    } as TraineeProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: TraineeProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface LevelThreshold {
  level: number;
  xp: number;
  title: string;
}

export const MAX_LEVEL = 100;

export function getXpRequirementForLevel(lvl: number): number {
  if (lvl <= 1) return 0;
  // Progressive curve: each level requires increasingly more XP
  return Math.round(120 * Math.pow(lvl - 1, 1.45));
}

export function getTitleForLevel(lvl: number): string {
  if (lvl >= 76) return 'Mission Hero Commander';
  if (lvl >= 51) return 'Elite Space Commander';
  if (lvl >= 26) return 'Senior Flight Engineer';
  return 'Cadet Explorer';
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNext: number;
  isMaxLevel: boolean;
  progressPct: number;
} {
  let currentLevel = 1;
  for (let l = 1; l <= MAX_LEVEL; l++) {
    if (xp >= getXpRequirementForLevel(l)) {
      currentLevel = l;
    } else {
      break;
    }
  }

  const isMaxLevel = currentLevel >= MAX_LEVEL;
  const currentLevelXp = getXpRequirementForLevel(currentLevel);
  const nextLevelXp = isMaxLevel ? currentLevelXp : getXpRequirementForLevel(currentLevel + 1);
  const title = getTitleForLevel(currentLevel);

  const span = nextLevelXp - currentLevelXp;
  const progressPct = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, Math.round(((xp - currentLevelXp) / Math.max(1, span)) * 100)));
  const xpToNext = isMaxLevel ? 0 : Math.max(0, nextLevelXp - xp);

  return {
    level: currentLevel,
    title,
    currentLevelXp,
    nextLevelXp,
    xpToNext,
    isMaxLevel,
    progressPct,
  };
}

export interface StarRankTier {
  id: StarRankId;
  title: string;
  minStars: number;
  starIcons: number;
  colorTheme: 'blue' | 'turquoise' | 'gold' | 'orange';
  rewardId: string;
  rewardTitle: string;
  rewardDescription: string;
  perks: string[];
}

export const STAR_RANK_TIERS: StarRankTier[] = [
  {
    id: 'space-cadet',
    title: 'Space Cadet',
    minStars: 0,
    starIcons: 1,
    colorTheme: 'blue',
    rewardId: 'reward-space-cadet',
    rewardTitle: 'Cadet Flight Patch',
    rewardDescription: 'Entry academy insignia and access to Earth & Orbital Station training.',
    perks: ['Starter Orbit Badge', 'Academy Telemetry Access'],
  },
  {
    id: 'pilot',
    title: 'Pilot',
    minStars: 10,
    starIcons: 2,
    colorTheme: 'turquoise',
    rewardId: 'reward-pilot',
    rewardTitle: 'Pilot Silver Wings',
    rewardDescription: 'Awarded for mastering flight routes, robotic grabs, and planetary field scans.',
    perks: ['Turquoise Flight Wings', 'Navigator Merit Emblem'],
  },
  {
    id: 'commander',
    title: 'Commander',
    minStars: 25,
    starIcons: 3,
    colorTheme: 'gold',
    rewardId: 'reward-commander',
    rewardTitle: 'Golden Command Crest',
    rewardDescription: 'Earned by leading emergency drills, multi-world science missions, and readiness exams.',
    perks: ['Golden Command Crest', 'Senior Mission Authorization'],
  },
  {
    id: 'mission-hero',
    title: 'Mission Hero',
    minStars: 50,
    starIcons: 4,
    colorTheme: 'orange',
    rewardId: 'reward-mission-hero',
    rewardTitle: 'Astronova Hero Medal',
    rewardDescription: 'The highest Academy honor for explorers who conquer missions across the Solar System.',
    perks: ['4-Star Hero Medal', 'Solar System Legend Title'],
  },
];

export interface StarBreakdown {
  totalStars: number;
  simulatorStars: number;
  investigationStars: number;
  academyStars: number;
  discoveryStars: number;
  simulatorDetails: {
    key: keyof TraineeProfile['missions'];
    label: string;
    stars: number;
    maxStars: number;
    completed: boolean;
    score: number;
  }[];
}

export function getMissionStars(completed: boolean, score: number): number {
  if (!completed) return 0;
  let stars = 2;
  if (score >= 60) stars += 1;
  if (score >= 80) stars += 1;
  if (score >= 92) stars += 1;
  return stars;
}

export function calculateStarBreakdown(profile: TraineeProfile): StarBreakdown {
  const simulatorDefs: { key: keyof TraineeProfile['missions']; label: string }[] = [
    { key: 'navigation', label: 'Space Navigation' },
    { key: 'roboticArm', label: 'Robotic Arm' },
    { key: 'emergency', label: 'Emergency Drill' },
    { key: 'evaluation', label: 'Flight Readiness Exam' },
  ];

  const simulatorDetails = simulatorDefs.map((def) => {
    const metric = profile.missions[def.key];
    return {
      key: def.key,
      label: def.label,
      stars: getMissionStars(metric.completed, metric.score),
      maxStars: 5,
      completed: metric.completed,
      score: metric.score,
    };
  });

  const simulatorStars = simulatorDetails.reduce((sum, item) => sum + item.stars, 0);
  const investigationStars = (profile.openWorld?.solvedInvestigations?.length || 0) * 3;

  let academyStars = 0;
  (profile.academy?.completedLessons || []).forEach((lessonId) => {
    const bestScore = profile.academy?.quizScores?.[lessonId] ?? 0;
    academyStars += bestScore >= 80 ? 3 : 2;
  });

  const nodesStars = Math.floor((profile.openWorld?.discoveredNodes?.length || 0) / 2);
  const pickupStars = Math.floor((profile.openWorld?.collectedPickups?.length || 0) / 2);
  const followUpStars = profile.openWorld?.followUpsPassed || 0;
  const discoveryStars = nodesStars + pickupStars + followUpStars;

  const totalStars = simulatorStars + investigationStars + academyStars + discoveryStars;

  return {
    totalStars,
    simulatorStars,
    investigationStars,
    academyStars,
    discoveryStars,
    simulatorDetails,
  };
}

export function calculateStarRankProgress(totalStars: number): {
  totalStars: number;
  currentRank: StarRankTier;
  nextRank: StarRankTier | null;
  starsToNext: number;
  isMaxRank: boolean;
  progressPct: number;
  unlockedRanks: StarRankTier[];
} {
  let current = STAR_RANK_TIERS[0];
  let next: StarRankTier | null = STAR_RANK_TIERS[1];

  for (let i = 0; i < STAR_RANK_TIERS.length; i++) {
    if (totalStars >= STAR_RANK_TIERS[i].minStars) {
      current = STAR_RANK_TIERS[i];
      next = STAR_RANK_TIERS[i + 1] ?? null;
    }
  }

  const isMaxRank = next === null;
  const span = next ? Math.max(1, next.minStars - current.minStars) : 1;
  const progressPct = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round(((totalStars - current.minStars) / span) * 100)));
  const starsToNext = next ? Math.max(0, next.minStars - totalStars) : 0;
  const unlockedRanks = STAR_RANK_TIERS.filter((tier) => totalStars >= tier.minStars);

  return {
    totalStars,
    currentRank: current,
    nextRank: next,
    starsToNext,
    isMaxRank,
    progressPct,
    unlockedRanks,
  };
}

export function calculatePerformance(profile: TraineeProfile): PerformanceBreakdown {
  const { navigation, roboticArm, emergency, evaluation } = profile.missions;
  const completedMissions = [navigation, roboticArm, emergency, evaluation].filter((m) => m.completed);
  const missionsCompletedCount = completedMissions.length;

  const navScore = navigation.score;
  const armScore = roboticArm.score;
  const decisionScore = emergency.score;

  const lessonQuizValues = Object.values(profile.academy.quizScores);
  const academyAvg =
    lessonQuizValues.length > 0
      ? Math.round(lessonQuizValues.reduce((acc, v) => acc + v, 0) / SCIENCE_LESSONS.length)
      : 0;
  const invBonus = Math.min(20, (profile.openWorld?.solvedInvestigations?.length || 0) * 4);
  const scienceScore = Math.min(
    100,
    evaluation.completed
      ? Math.round(evaluation.score * 0.55 + academyAvg * 0.35 + invBonus * 0.5)
      : Math.min(100, academyAvg + invBonus)
  );

  const totalScore = Math.round(navScore + armScore + decisionScore + scienceScore);

  const accuracyInputs: number[] = [];
  if (navigation.attempts > 0) accuracyInputs.push(navigation.accuracy);
  if (roboticArm.attempts > 0) accuracyInputs.push(roboticArm.accuracy);
  if (emergency.attempts > 0) accuracyInputs.push(emergency.accuracy);
  if (evaluation.attempts > 0) accuracyInputs.push(evaluation.accuracy);
  if (profile.academy.totalQuizQuestionsAnswered > 0) {
    accuracyInputs.push(
      Math.round((profile.academy.totalQuizCorrect / profile.academy.totalQuizQuestionsAnswered) * 100)
    );
  }
  const invScores = Object.values(profile.openWorld?.investigationScores || {});
  if (invScores.length > 0) {
    accuracyInputs.push(Math.round(invScores.reduce((a, b) => a + b, 0) / invScores.length));
  }

  const averageAccuracy =
    accuracyInputs.length > 0
      ? Math.round(accuracyInputs.reduce((a, b) => a + b, 0) / accuracyInputs.length)
      : 0;

  const rankInfo = calculateLevelFromXp(profile.openWorld?.xp || 0);
  const rankTitle = rankInfo.title;

  const allMissionsComplete = missionsCompletedCount === 4;

  const totalInvs = SCIENTIFIC_INVESTIGATIONS.length;
  const solvedInvsCount = profile.openWorld?.solvedInvestigations?.length || 0;

  let encouragement =
    'Explore Earth, the Orbital Station, Mars, the Moon, and the Solar System in 3D to scan equipment and solve real space mysteries!';
  if (allMissionsComplete && totalScore >= 340) {
    encouragement =
      'Outstanding work, Commander! You mastered 3D field investigations, orbital navigation, robotics, and NASA space science.';
  } else if (allMissionsComplete) {
    encouragement =
      'Congratulations on completing all four Academy missions! Keep exploring the 3D worlds to solve every field investigation.';
  } else if (missionsCompletedCount > 0 || solvedInvsCount > 0) {
    encouragement = `Great progress! You have ${solvedInvsCount}/${totalInvs} field investigations solved and ${missionsCompletedCount}/4 simulator certifications.`;
  }

  const recommendations: string[] = [];
  if (solvedInvsCount < totalInvs) {
    recommendations.push(
      `Explore the 3D Solar System worlds to solve field investigations (${solvedInvsCount}/${totalInvs} completed).`
    );
  }
  if (!navigation.completed) {
    recommendations.push('Complete Mission 1 (Space Navigation) to practice X/Y coordinate routing and obstacle dodging.');
  } else if (navScore < 85) {
    recommendations.push('Replay Mission 1 and collect science beacons with fewer collisions to boost your Navigation score.');
  }

  if (!roboticArm.completed) {
    recommendations.push('Complete Mission 2 (Robotic Arm) to master wrist rotation and delicate cargo placement.');
  } else if (armScore < 85) {
    recommendations.push('Practice Mission 2 with slower, careful wrist alignment before releasing cargo.');
  }

  if (!emergency.completed) {
    recommendations.push('Complete Mission 3 (Emergency Mission) to sharpen calm decision-making using telemetry.');
  } else if (decisionScore < 85) {
    recommendations.push('Review the telemetry clues carefully in Mission 3 to solve every alert on your first try.');
  }

  if (profile.academy.completedLessons.length < SCIENCE_LESSONS.length) {
    recommendations.push(
      `Explore ${SCIENCE_LESSONS.length - profile.academy.completedLessons.length} remaining topic(s) in Space Science Academy.`
    );
  }

  if (!evaluation.completed) {
    recommendations.push('Take Mission 4 (Astronaut Readiness Exam) to unlock your official Graduation Certificate.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Every core training area is above 85%! Download your Astronaut Certificate or challenge Commander-tier AI follow-ups.');
  }

  return {
    totalScore,
    averageAccuracy,
    missionsCompletedCount,
    navigationScore: navScore,
    roboticArmScore: armScore,
    decisionMakingScore: decisionScore,
    scientificKnowledgeScore: scienceScore,
    rankTitle,
    allMissionsComplete,
    encouragement,
    recommendations,
  };
}
