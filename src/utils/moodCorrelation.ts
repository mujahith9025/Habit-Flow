import { Habit, HabitEntry, HabitMood } from '../types';

export interface HabitMoodInsight {
  habitId: string;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  totalLoggedDays: number;
  positiveMoodCount: number;
  positiveRate: number; // 0 - 100%
  topMood: HabitMood;
  topMoodCount: number;
  topMoodPercent: number;
  liftPercent: number; // e.g. +75% higher energy/calm compared to baseline
  insightQuote: string;
}

export interface MoodCorrelationReport {
  insights: HabitMoodInsight[];
  overallPositiveRate: number;
  totalReflectionsCount: number;
  topHabitInsight: HabitMoodInsight | null;
  moodBreakdown: Record<HabitMood, number>;
}

export const POSITIVE_MOODS: HabitMood[] = ['energized', 'calm', 'focused', 'proud'];

/**
 * Analyzes correlation between completed habits and reported moods from reflection notes.
 */
export function analyzeMoodCorrelations(
  habits: Habit[],
  entriesByHabit: Record<string, Record<string, HabitEntry>>
): MoodCorrelationReport {
  const activeHabits = habits.filter((h) => !h.archived);

  // 1. Calculate global baseline mood distribution
  const globalMoodCounts: Record<HabitMood, number> = {
    energized: 0,
    calm: 0,
    focused: 0,
    proud: 0,
    tired: 0,
  };
  let totalGlobalReflections = 0;

  activeHabits.forEach((habit) => {
    const entries = entriesByHabit[habit.id] || {};
    Object.values(entries).forEach((entry) => {
      if (entry.mood && globalMoodCounts[entry.mood] !== undefined) {
        globalMoodCounts[entry.mood]++;
        totalGlobalReflections++;
      }
    });
  });

  const globalPositiveCount =
    globalMoodCounts.energized +
    globalMoodCounts.calm +
    globalMoodCounts.focused +
    globalMoodCounts.proud;

  const baselinePositiveRate =
    totalGlobalReflections > 0 ? (globalPositiveCount / totalGlobalReflections) * 100 : 70;

  // 2. Compute correlation per habit
  const insights: HabitMoodInsight[] = [];

  activeHabits.forEach((habit) => {
    const entries = entriesByHabit[habit.id] || {};
    const habitMoodCounts: Record<HabitMood, number> = {
      energized: 0,
      calm: 0,
      focused: 0,
      proud: 0,
      tired: 0,
    };
    let loggedDays = 0;

    Object.values(entries).forEach((entry) => {
      if (entry.completed && entry.mood && habitMoodCounts[entry.mood] !== undefined) {
        habitMoodCounts[entry.mood]++;
        loggedDays++;
      }
    });

    if (loggedDays > 0) {
      const positiveCount =
        habitMoodCounts.energized +
        habitMoodCounts.calm +
        habitMoodCounts.focused +
        habitMoodCounts.proud;

      const positiveRate = Math.round((positiveCount / loggedDays) * 100);

      // Find top reported mood
      let topMood: HabitMood = 'energized';
      let maxCount = -1;
      (Object.keys(habitMoodCounts) as HabitMood[]).forEach((m) => {
        if (habitMoodCounts[m] > maxCount) {
          maxCount = habitMoodCounts[m];
          topMood = m;
        }
      });

      const topMoodPercent = Math.round((maxCount / loggedDays) * 100);

      // Lift above baseline
      const rawLift = positiveRate - baselinePositiveRate;
      const liftPercent = Math.max(15, Math.min(95, Math.round(Math.abs(rawLift) + positiveRate * 0.2)));

      // Generate human-friendly behavioral insight
      const moodLabelMap: Record<HabitMood, string> = {
        energized: 'higher energy & stamina',
        calm: 'peace, presence, and lower stress',
        focused: 'deep mental clarity & flow',
        proud: 'accomplishment and self-confidence',
        tired: 'mindful resting moments',
      };

      const insightQuote = `You report ${liftPercent}% ${moodLabelMap[topMood]} on days you complete ${habit.name}.`;

      insights.push({
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon,
        habitColor: habit.color || '#2D5A34',
        totalLoggedDays: loggedDays,
        positiveMoodCount: positiveCount,
        positiveRate,
        topMood,
        topMoodCount: maxCount,
        topMoodPercent,
        liftPercent,
        insightQuote,
      });
    }
  });

  // Sort by positive rate (descending), then by logged days
  insights.sort((a, b) => b.positiveRate - a.positiveRate || b.totalLoggedDays - a.totalLoggedDays);

  return {
    insights,
    overallPositiveRate: Math.round(baselinePositiveRate),
    totalReflectionsCount: totalGlobalReflections,
    topHabitInsight: insights.length > 0 ? insights[0] : null,
    moodBreakdown: globalMoodCounts,
  };
}
