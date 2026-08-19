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

/**
 * Calculates current consecutive streak across ALL daily habits
 * A day is counted if ALL non-archived daily habits due were completed on that day.
 */
export function calculateOverallDailyStreak(
  entriesByHabit: Record<string, HabitEntryMap>,
  dailyHabits: Habit[],
  asOfDate: Date = new Date()
): number {
  const activeHabits = dailyHabits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return 0;

  const todayKey = formatDateKey(asOfDate);
  const isTodayAllDone = activeHabits.every(
    (h) => entriesByHabit[h.id]?.[todayKey]?.completed === true
  );

  let streak = isTodayAllDone ? 1 : 0;

  // Check backward from yesterday up to 365 days
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
      break; // Streak broken by a missed day
    }
  }

  return streak;
}

/**
 * Calculates current streak for a SINGLE habit
 */
export function calculateSingleHabitStreak(
  entries: HabitEntryMap,
  asOfDate: Date = new Date()
): number {
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
 * @param completedCount Number of completed entries in the month
 * @param daysInMonth Total number of days in the month (28..31)
 * @param goalCount Optional goal count target
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
 * @param completedWeeksCount Number of completed weeks (0..5)
 * @param goalCount Weekly target (e.g. 4)
 */
export function calculateWeeklyProgressPercent(
  completedWeeksCount: number,
  goalCount: number = 4
): number {
  const target = goalCount > 0 ? goalCount : 4;
  return Math.min(100, Math.max(0, Math.round((completedWeeksCount / target) * 100)));
}
