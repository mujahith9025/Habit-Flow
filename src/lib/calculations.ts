import { Habit, HabitEntryMap } from '../types';

/**
 * Formats a Date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface GentleStreakResult {
  streak: number;
  isShieldActive: boolean;
  shieldsRemaining: number;
  protectedDaysCount: number;
}

/**
 * Calculates current streak for a SINGLE habit with "Gentle Persistence" Streak Shields:
 * Allows 1 Grace/Rest day per 7 days of unbroken progress.
 * If 1 day is missed, a shield protects the streak from resetting to 0.
 * If 2 consecutive days are missed, the streak breaks.
 */
export function calculateGentleHabitStreak(
  entries: HabitEntryMap,
  asOfDate: Date = new Date(),
  maxShields: number = 1
): GentleStreakResult {
  const todayKey = formatDateKey(asOfDate);
  const isTodayDone = Boolean(entries[todayKey]?.completed);

  let streak = isTodayDone ? 1 : 0;
  let shieldsUsed = 0;
  let protectedDays = 0;
  let consecutiveMissed = 0;

  const checkDate = new Date(asOfDate);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const pastKey = formatDateKey(checkDate);
    const isDone = Boolean(entries[pastKey]?.completed);

    if (isDone) {
      streak++;
      consecutiveMissed = 0;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      consecutiveMissed++;
      // If only 1 day missed and we have a shield available, absorb the rest day!
      if (consecutiveMissed === 1 && shieldsUsed < maxShields && streak > 0) {
        shieldsUsed++;
        protectedDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // 2 consecutive days missed or out of shields -> streak breaks
      }
    }
  }

  return {
    streak,
    isShieldActive: protectedDays > 0,
    shieldsRemaining: Math.max(0, maxShields - shieldsUsed),
    protectedDaysCount: protectedDays,
  };
}

/**
 * Calculates current streak for a SINGLE habit
 */
export function calculateSingleHabitStreak(
  entries: HabitEntryMap,
  asOfDate: Date = new Date(),
  useShield: boolean = true
): number {
  if (useShield) {
    return calculateGentleHabitStreak(entries, asOfDate, 1).streak;
  }

  const todayKey = formatDateKey(asOfDate);
  const isTodayDone = Boolean(entries[todayKey]?.completed);

  let streak = isTodayDone ? 1 : 0;

  const checkDate = new Date(asOfDate);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const pastKey = formatDateKey(checkDate);
    if (entries[pastKey]?.completed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates current consecutive streak across ALL daily habits with Streak Shield support
 */
export function calculateGentleOverallStreak(
  entriesByHabit: Record<string, HabitEntryMap>,
  dailyHabits: Habit[],
  asOfDate: Date = new Date(),
  maxShields: number = 1
): GentleStreakResult {
  const activeHabits = dailyHabits.filter((h) => !h.archived);
  if (activeHabits.length === 0) {
    return {
      streak: 0,
      isShieldActive: false,
      shieldsRemaining: maxShields,
      protectedDaysCount: 0,
    };
  }

  const todayKey = formatDateKey(asOfDate);
  const isTodayAllDone = activeHabits.every(
    (h) => entriesByHabit[h.id]?.[todayKey]?.completed === true
  );

  let streak = isTodayAllDone ? 1 : 0;
  let shieldsUsed = 0;
  let protectedDays = 0;
  let consecutiveMissed = 0;

  const checkDate = new Date(asOfDate);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const pastKey = formatDateKey(checkDate);
    const allDone = activeHabits.every(
      (h) => entriesByHabit[h.id]?.[pastKey]?.completed === true
    );

    if (allDone) {
      streak++;
      consecutiveMissed = 0;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      consecutiveMissed++;
      if (consecutiveMissed === 1 && shieldsUsed < maxShields && streak > 0) {
        shieldsUsed++;
        protectedDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    streak,
    isShieldActive: protectedDays > 0,
    shieldsRemaining: Math.max(0, maxShields - shieldsUsed),
    protectedDaysCount: protectedDays,
  };
}

/**
 * Calculates current consecutive streak across ALL daily habits
 */
export function calculateOverallDailyStreak(
  entriesByHabit: Record<string, HabitEntryMap>,
  dailyHabits: Habit[],
  asOfDate: Date = new Date(),
  useShield: boolean = true
): number {
  if (useShield) {
    return calculateGentleOverallStreak(entriesByHabit, dailyHabits, asOfDate, 1).streak;
  }

  const activeHabits = dailyHabits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return 0;

  const todayKey = formatDateKey(asOfDate);
  const isTodayAllDone = activeHabits.every(
    (h) => entriesByHabit[h.id]?.[todayKey]?.completed === true
  );

  let streak = isTodayAllDone ? 1 : 0;

  const checkDate = new Date(asOfDate);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const pastKey = formatDateKey(checkDate);
    const allDone = activeHabits.every(
      (h) => entriesByHabit[h.id]?.[pastKey]?.completed === true
    );

    if (allDone) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the longest historic streak ever for a single habit
 */
export function calculateLongestStreak(entries: HabitEntryMap): number {
  const sortedDates = Object.keys(entries)
    .filter((k) => entries[k]?.completed && k.length === 10)
    .sort();

  if (sortedDates.length === 0) return 0;

  let longest = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  sortedDates.forEach((dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    const curDate = new Date(y, m - 1, d);

    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 3600 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    lastDate = curDate;
    if (tempStreak > longest) {
      longest = tempStreak;
    }
  });

  return longest;
}

/**
 * Calculates monthly completion rate percentage for a habit
 */
export function calculateMonthProgressPercent(
  completedCount: number,
  daysInMonth: number,
  goalCount?: number
): number {
  const target = goalCount && goalCount > 1 ? goalCount : daysInMonth;
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedCount / target) * 100)));
}

/**
 * Calculates weekly completion percentage
 */
export function calculateWeeklyProgressPercent(
  completedWeeksCount: number,
  goalCount: number = 4
): number {
  const target = goalCount > 0 ? goalCount : 4;
  return Math.min(100, Math.max(0, Math.round((completedWeeksCount / target) * 100)));
}

/**
 * Calculates the exact total calendar days a habit has been active/tracked
 * based on its individual creation date, startMonth, endMonth, excludedMonths, and entry history.
 */
export function calculateHabitTotalTrackedDays(
  habit: Habit,
  entries: HabitEntryMap,
  today: Date = new Date()
): number {
  const completedCount = Object.values(entries).filter((e) => e?.completed).length;

  // 1. Find earliest date for THIS specific habit
  let earliestDate: Date = today;

  if (habit.createdAt) {
    const cDate = new Date(habit.createdAt);
    if (!isNaN(cDate.getTime()) && cDate < earliestDate) {
      earliestDate = cDate;
    }
  }

  if (habit.startMonth) {
    const [sy, sm] = habit.startMonth.split('-').map(Number);
    if (sy && sm) {
      const sDate = new Date(sy, sm - 1, 1);
      earliestDate = sDate;
    }
  }

  // Check earliest recorded entry date for this habit
  Object.keys(entries).forEach((dateKey) => {
    if (dateKey.length === 10) {
      const [y, m, d] = dateKey.split('-').map(Number);
      if (y && m && d) {
        const eDate = new Date(y, m - 1, d);
        if (!habit.startMonth && eDate < earliestDate) {
          earliestDate = eDate;
        }
      }
    }
  });

  // End boundary for habit (endMonth or today)
  let endDate: Date = today;
  if (habit.endMonth) {
    const [ey, em] = habit.endMonth.split('-').map(Number);
    if (ey && em) {
      const lastDayOfEndMonth = new Date(ey, em, 0);
      if (lastDayOfEndMonth < today) {
        endDate = lastDayOfEndMonth;
      }
    }
  }

  // Calculate gross days between earliestDate and endDate
  const rawDiffDays = Math.ceil((endDate.getTime() - earliestDate.getTime()) / (1000 * 3600 * 24)) + 1;
  let totalDays = Math.max(1, rawDiffDays);

  // Subtract days from excluded months if any
  if (habit.excludedMonths && habit.excludedMonths.length > 0) {
    habit.excludedMonths.forEach((mKey) => {
      const [y, m] = mKey.split('-').map(Number);
      if (y && m) {
        const daysInExcluded = new Date(y, m, 0).getDate();
        totalDays = Math.max(1, totalDays - daysInExcluded);
      }
    });
  }

  // Ensure total days is at least the number of completed checks
  return Math.max(1, Math.max(completedCount, totalDays));
}

