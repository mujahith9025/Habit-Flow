export interface WhatIfInput {
  totalDays: number;
  daysElapsed: number;
  completedChecks: number;
  totalHabitCount: number;
  targetConsistencyPercent: number; // 0 - 100
  currentStreak?: number;
}

export type GradeTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface WhatIfResult {
  daysRemaining: number;
  simulatedRemainingChecks: number;
  simulatedTotalChecks: number;
  maxPossibleTotalChecks: number;
  currentRate: number;
  simulatedRate: number;
  rateDelta: number;
  grade: GradeTier;
  gradeTitle: string;
  gradeDescription: string;
  milestoneBadge: string;
  projectedStreak: number;
  isFlowBenchmarkReached: boolean; // simulatedRate >= 80
}

/**
 * Calculates dynamic "What-If" habit pacing scenario if user maintains
 * a target consistency for the remaining days of the month.
 */
export function calculateWhatIfScenario(input: WhatIfInput): WhatIfResult {
  const totalDays = Math.max(1, input.totalDays);
  const daysElapsed = Math.min(totalDays, Math.max(0, input.daysElapsed));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const habitCount = Math.max(1, input.totalHabitCount);
  const completedChecks = Math.max(0, input.completedChecks);
  const targetPct = Math.min(100, Math.max(0, input.targetConsistencyPercent));
  const currentStreak = Math.max(0, input.currentStreak || 0);

  const maxPossibleRemainingChecks = daysRemaining * habitCount;
  const simulatedRemainingChecks = Math.round((targetPct / 100) * maxPossibleRemainingChecks);
  const simulatedTotalChecks = completedChecks + simulatedRemainingChecks;
  const maxPossibleTotalChecks = totalDays * habitCount;

  const currentMaxChecksSoFar = daysElapsed * habitCount;
  const currentRate =
    currentMaxChecksSoFar > 0
      ? Math.min(100, Math.round((completedChecks / currentMaxChecksSoFar) * 100))
      : 0;

  const simulatedRate =
    maxPossibleTotalChecks > 0
      ? Math.min(100, Math.round((simulatedTotalChecks / maxPossibleTotalChecks) * 100))
      : 0;

  const rateDelta = simulatedRate - currentRate;

  // Grade classification
  let grade: GradeTier = 'D';
  let gradeTitle = 'Rebuilding Focus';
  let gradeDescription = 'Small micro-wins will restart your trajectory.';

  if (simulatedRate >= 95) {
    grade = 'S';
    gradeTitle = 'Flawless Flow Master';
    gradeDescription = 'Near-perfect consistency. Identity-level habit automaticity!';
  } else if (simulatedRate >= 80) {
    grade = 'A';
    gradeTitle = '80% Flow Benchmark';
    gradeDescription = 'Meets the optimal behavioral sweet spot for lasting habits.';
  } else if (simulatedRate >= 65) {
    grade = 'B';
    gradeTitle = 'Steady Momentum';
    gradeDescription = 'Strong resilience with built-in flexibility for recovery.';
  } else if (simulatedRate >= 50) {
    grade = 'C';
    gradeTitle = 'Developing Intention';
    gradeDescription = 'Neural pathways forming. Aim to never miss twice.';
  }

  // Milestone Badge
  let milestoneBadge = '🌱 Intention Stage';
  if (simulatedRate >= 100) {
    milestoneBadge = '🏆 Century Club (100%)';
  } else if (simulatedRate >= 80) {
    milestoneBadge = '🌟 80% Flow State Unlocked';
  } else if (simulatedRate >= 65) {
    milestoneBadge = '🌿 Steady Momentum';
  }

  // Projected streak: if target is 100%, streak extends unbroken by remaining days
  const projectedStreak = targetPct === 100 ? currentStreak + daysRemaining : currentStreak;

  return {
    daysRemaining,
    simulatedRemainingChecks,
    simulatedTotalChecks,
    maxPossibleTotalChecks,
    currentRate,
    simulatedRate,
    rateDelta,
    grade,
    gradeTitle,
    gradeDescription,
    milestoneBadge,
    projectedStreak,
    isFlowBenchmarkReached: simulatedRate >= 80,
  };
}
