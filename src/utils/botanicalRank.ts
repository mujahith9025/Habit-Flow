export type BotanicalRankKey = 'seedling' | 'sprout' | 'evergreen' | 'ancient_oak';

export interface BotanicalRank {
  key: BotanicalRankKey;
  label: string;
  icon: string;
  days: number;
  stageTitle: string;
  stageDescription: string;
  thresholdMin: number;
  thresholdMax: number; // infinity for ancient oak
  daysToNextRank: number; // 0 for ancient oak
  progressToNext: number; // 0 - 100%
  colorClass: {
    bg: string;
    text: string;
    border: string;
    glow: string;
  };
}

/**
 * Calculates neurobiology-grounded Botanical Growth Rank based on habit automaticity thresholds.
 * - Days 1–7: Seedling (Intention setting)
 * - Days 8–21: Sprout (Neural stabilization)
 * - Days 22–65: Evergreen (Proven automaticity)
 * - Days 66+: Ancient Oak (Permanent identity habit)
 */
export function getBotanicalRank(days: number): BotanicalRank {
  const safeDays = Math.max(0, Math.floor(days));

  if (safeDays >= 66) {
    return {
      key: 'ancient_oak',
      label: 'Ancient Oak',
      icon: '🌲',
      days: safeDays,
      stageTitle: 'Permanent Identity',
      stageDescription: 'Plateau of automaticity unlocked. This habit is now deeply ingrained into your identity.',
      thresholdMin: 66,
      thresholdMax: Infinity,
      daysToNextRank: 0,
      progressToNext: 100,
      colorClass: {
        bg: 'bg-emerald-950/30 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-600/40',
        glow: 'shadow-[0_0_15px_rgba(45,90,52,0.35)]',
      },
    };
  }

  if (safeDays >= 22) {
    const range = 66 - 22; // 44 days
    const elapsed = safeDays - 22;
    const progress = Math.min(100, Math.round((elapsed / range) * 100));

    return {
      key: 'evergreen',
      label: 'Evergreen',
      icon: '🌳',
      days: safeDays,
      stageTitle: 'Proven Automaticity',
      stageDescription: 'Consistent neural pathways formed. Resistance is diminishing into effortless routine.',
      thresholdMin: 22,
      thresholdMax: 65,
      daysToNextRank: 66 - safeDays,
      progressToNext: progress,
      colorClass: {
        bg: 'bg-teal-950/25 dark:bg-teal-900/25',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-600/30',
        glow: 'shadow-[0_0_12px_rgba(20,184,166,0.25)]',
      },
    };
  }

  if (safeDays >= 8) {
    const range = 21 - 8; // 13 days
    const elapsed = safeDays - 8;
    const progress = Math.min(100, Math.round((elapsed / range) * 100));

    return {
      key: 'sprout',
      label: 'Sprout',
      icon: '🌿',
      days: safeDays,
      stageTitle: 'Neural Stabilization',
      stageDescription: 'Overcoming initial cognitive friction. Neural pathways are stabilizing with each check-in.',
      thresholdMin: 8,
      thresholdMax: 21,
      daysToNextRank: 22 - safeDays,
      progressToNext: progress,
      colorClass: {
        bg: 'bg-lime-950/20 dark:bg-lime-900/20',
        text: 'text-lime-700 dark:text-lime-300',
        border: 'border-lime-600/30',
        glow: 'shadow-[0_0_10px_rgba(132,204,22,0.2)]',
      },
    };
  }

  // Days 0 - 7
  const progress = Math.min(100, Math.round((safeDays / 7) * 100));
  return {
    key: 'seedling',
    label: 'Seedling',
    icon: '🌱',
    days: safeDays,
    stageTitle: 'Intention Setting',
    stageDescription: 'Planting initial seeds. Focus on setting an easy cue and never missing twice.',
    thresholdMin: 1,
    thresholdMax: 7,
    daysToNextRank: Math.max(1, 8 - safeDays),
    progressToNext: progress,
    colorClass: {
      bg: 'bg-amber-950/20 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-600/30',
      glow: 'shadow-[0_0_8px_rgba(217,119,6,0.2)]',
    },
  };
}
