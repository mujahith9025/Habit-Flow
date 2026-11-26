import { Habit, HabitEntry, isEntryCompleted } from '../types/habit';
import { MonthDayInfo } from '../hooks/useDailyHabitsData';

export interface SynergisticHabitPair {
  primaryHabit: Habit;
  secondaryHabit: Habit;
  synergyLiftPercent: number; // e.g. +38% more likely to do B when A is done
  coOccurrenceProbability: number; // P(B | A) e.g. 88%
  baselineProbability: number; // P(B | ~A) e.g. 50%
  daysBothDone: number;
  stackingBlueprint: string; // "After I [Habit A], I will [Habit B]"
}

export interface KeystoneHabitInsight {
  habit: Habit;
  catalyticScore: number; // Average lift caused across all other habits
  boostedHabitsCount: number;
  description: string;
}

export interface HabitSynergyReport {
  hasSufficientData: boolean;
  totalTrackedDays: number;
  keystoneHabit: KeystoneHabitInsight | null;
  topPairs: SynergisticHabitPair[];
  matrix: {
    habits: Habit[];
    // grid[i][j] = P(Habit j | Habit i)
    grid: number[][];
  };
}

export function analyzeHabitSynergy(
  habits: Habit[],
  entriesByHabit: Record<string, Record<string, HabitEntry>>,
  daysInMonth: MonthDayInfo[]
): HabitSynergyReport {
  if (habits.length < 2) {
    return {
      hasSufficientData: false,
      totalTrackedDays: 0,
      keystoneHabit: null,
      topPairs: [],
      matrix: { habits, grid: [] },
    };
  }

  // Filter days that have occurred (past or today)
  const evaluatedDays = daysInMonth.filter((d) => !d.isFuture);
  const totalTrackedDays = evaluatedDays.length;

  if (totalTrackedDays < 3) {
    return {
      hasSufficientData: false,
      totalTrackedDays,
      keystoneHabit: null,
      topPairs: [],
      matrix: { habits, grid: [] },
    };
  }

  // Pre-calculate completed set for each habit
  const habitCompletionSets: Record<string, Set<string>> = {};
  habits.forEach((h) => {
    const set = new Set<string>();
    evaluatedDays.forEach((d) => {
      const entry = entriesByHabit[h.id]?.[d.dateKey];
      if (isEntryCompleted(h, entry)) {
        set.add(d.dateKey);
      }
    });
    habitCompletionSets[h.id] = set;
  });

  const n = habits.length;
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const pairs: SynergisticHabitPair[] = [];

  const habitLiftSums: Record<string, { totalLift: number; count: number }> = {};
  habits.forEach((h) => {
    habitLiftSums[h.id] = { totalLift: 0, count: 0 };
  });

  for (let i = 0; i < n; i++) {
    const habitA = habits[i];
    const setA = habitCompletionSets[habitA.id];
    const countA = setA.size;
    const missedA = totalTrackedDays - countA;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        grid[i][j] = countA > 0 ? 100 : 0;
        continue;
      }

      const habitB = habits[j];
      const setB = habitCompletionSets[habitB.id];

      // Intersection: days both A and B completed
      let bothCount = 0;
      let bWhenNotACount = 0;

      evaluatedDays.forEach((d) => {
        const hasA = setA.has(d.dateKey);
        const hasB = setB.has(d.dateKey);
        if (hasA && hasB) bothCount++;
        if (!hasA && hasB) bWhenNotACount++;
      });

      const probBGivenA = countA > 0 ? bothCount / countA : 0;
      const probBGivenNotA = missedA > 0 ? bWhenNotACount / missedA : 0;
      const lift = Math.round((probBGivenA - probBGivenNotA) * 100);

      grid[i][j] = Math.round(probBGivenA * 100);

      if (countA >= 2 && missedA >= 1 && lift >= 15) {
        pairs.push({
          primaryHabit: habitA,
          secondaryHabit: habitB,
          synergyLiftPercent: lift,
          coOccurrenceProbability: Math.round(probBGivenA * 100),
          baselineProbability: Math.round(probBGivenNotA * 100),
          daysBothDone: bothCount,
          stackingBlueprint: `After I ${habitA.name}, I will immediately ${habitB.name}.`,
        });

        habitLiftSums[habitA.id].totalLift += lift;
        habitLiftSums[habitA.id].count += 1;
      }
    }
  }

  // Sort pairs by synergyLiftPercent descending
  pairs.sort((a, b) => b.synergyLiftPercent - a.synergyLiftPercent);

  // Identify Keystone Habit
  let keystoneHabit: KeystoneHabitInsight | null = null;
  let highestCatalyticScore = 0;

  habits.forEach((h) => {
    const item = habitLiftSums[h.id];
    if (item.count > 0) {
      const avgScore = Math.round(item.totalLift / item.count);
      if (avgScore > highestCatalyticScore) {
        highestCatalyticScore = avgScore;
        keystoneHabit = {
          habit: h,
          catalyticScore: avgScore,
          boostedHabitsCount: item.count,
          description: `Completing ${h.name} acts as a catalytic trigger, boosting completion probability across ${item.count} other habit${item.count === 1 ? '' : 's'} by an average of +${avgScore}%.`,
        };
      }
    }
  });

  return {
    hasSufficientData: pairs.length > 0 || totalTrackedDays >= 3,
    totalTrackedDays,
    keystoneHabit,
    topPairs: pairs.slice(0, 4),
    matrix: {
      habits,
      grid,
    },
  };
}
