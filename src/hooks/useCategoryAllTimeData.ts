import { useState, useEffect } from 'react';
import { onSnapshot, getEntriesCollectionRef } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Habit, HabitEntryMap } from '../types';
import {
  calculateSingleHabitStreak,
  calculateLongestStreak,
  calculateHabitTotalTrackedDays,
} from '../lib/calculations';

export interface CategoryHabitAllTimeStat {
  habit: Habit;
  totalCompletions: number;
  totalTrackedDays: number;
  longestStreak: number;
  currentStreak: number;
  allTimeRate: number;
  daysSinceCreation: number;
  totalNotes: number;
  bestMonthTitle?: string;
  bestMonthPercent?: number;
}

export interface CategoryDayOfWeekStat {
  day: string;
  shortLabel: string;
  count: number;
  percent: number;
}

export interface CategoryMonthlyTrend {
  monthKey: string;
  monthTitle: string;
  totalCompletions: number;
  averagePercent: number;
}

export interface UseCategoryAllTimeDataResult {
  totalCategoryCompletions: number;
  totalCategoryPossibleChecks: number;
  overallConsistencyPercent: number;
  totalCategoryDays: number;
  topHabit: CategoryHabitAllTimeStat | null;
  habitStatsList: CategoryHabitAllTimeStat[];
  categoryDayOfWeekStats: CategoryDayOfWeekStat[];
  monthlyCategoryTrend: CategoryMonthlyTrend[];
  totalNotesInBoard: number;
  loading: boolean;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = [
  { day: 'Monday', shortLabel: 'Mon', dayIndex: 1 },
  { day: 'Tuesday', shortLabel: 'Tue', dayIndex: 2 },
  { day: 'Wednesday', shortLabel: 'Wed', dayIndex: 3 },
  { day: 'Thursday', shortLabel: 'Thu', dayIndex: 4 },
  { day: 'Friday', shortLabel: 'Fri', dayIndex: 5 },
  { day: 'Saturday', shortLabel: 'Sat', dayIndex: 6 },
  { day: 'Sunday', shortLabel: 'Sun', dayIndex: 0 },
];

export function useCategoryAllTimeData(habits: Habit[]): UseCategoryAllTimeDataResult {
  const { user } = useAuth();
  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, HabitEntryMap>>({});
  const [loading, setLoading] = useState(true);

  const habitIdsKey = habits.map((h) => h.id).sort().join(',');

  useEffect(() => {
    if (!user?.uid || habits.length === 0) {
      setEntriesByHabit({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: Array<() => void> = [];

    habits.forEach((habit) => {
      const colRef = getEntriesCollectionRef(user.uid, habit.id);
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const map: HabitEntryMap = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            map[data.date] = data;
          });

          setEntriesByHabit((prev) => ({
            ...prev,
            [habit.id]: map,
          }));
        },
        (err) => {
          console.warn(`Error loading all-time entries for habit ${habit.id}:`, err);
        }
      );

      unsubscribes.push(unsub);
    });

    setLoading(false);
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid, habitIdsKey]);

  const today = new Date();
  let totalCategoryCompletions = 0;
  let totalNotesInBoard = 0;
  const categoryDayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const monthlyCategoryCompletionsMap: Record<string, number> = {};

  // Find earliest entry date across the entire category
  let earliestCategoryDate: Date = today;

  habits.forEach((habit) => {
    const entries = entriesByHabit[habit.id] || {};
    if (habit.createdAt) {
      const cDate = new Date(habit.createdAt);
      if (!isNaN(cDate.getTime()) && cDate < earliestCategoryDate) {
        earliestCategoryDate = cDate;
      }
    }

    Object.keys(entries).forEach((dateKey) => {
      if (dateKey.length === 10) {
        const [y, m, d] = dateKey.split('-').map(Number);
        if (y && m && d) {
          const eDate = new Date(y, m - 1, d);
          if (eDate < earliestCategoryDate) {
            earliestCategoryDate = eDate;
          }
        }
      }
    });
  });

  const totalCategoryDays = Math.max(
    1,
    Math.ceil((today.getTime() - earliestCategoryDate.getTime()) / (1000 * 3600 * 24)) + 1
  );

  // Calculate statistics for each individual habit
  const habitStatsList: CategoryHabitAllTimeStat[] = habits.map((habit) => {
    const entries = entriesByHabit[habit.id] || {};
    let totalCompletions = 0;
    let totalNotes = 0;
    const monthCountsMap: Record<string, number> = {};

    Object.values(entries).forEach((entry) => {
      if (entry.note || entry.mood || (entry.tags && entry.tags.length > 0)) {
        totalNotes++;
        totalNotesInBoard++;
      }

      if (entry.completed) {
        totalCompletions++;
        totalCategoryCompletions++;

        const mKey = entry.monthKey || entry.date.substring(0, 7);
        monthCountsMap[mKey] = (monthCountsMap[mKey] || 0) + 1;
        monthlyCategoryCompletionsMap[mKey] = (monthlyCategoryCompletionsMap[mKey] || 0) + 1;

        const [y, m, d] = entry.date.split('-').map(Number);
        if (y && m && d) {
          const entryDate = new Date(y, m - 1, d);
          const dIdx = entryDate.getDay();
          categoryDayCounts[dIdx] = (categoryDayCounts[dIdx] || 0) + 1;
        }
      }
    });

    // Individual habit total tracked days (custom to this habit's creation/start)
    const totalTrackedDays = calculateHabitTotalTrackedDays(habit, entries, today);
    const allTimeRate = totalTrackedDays > 0 ? Math.min(100, Math.round((totalCompletions / totalTrackedDays) * 100)) : 0;

    const currentStreak = calculateSingleHabitStreak(entries, today, true);
    const longestStreak = calculateLongestStreak(entries);

    // Find Best Month for this habit
    let bestMonthTitle: string | undefined = undefined;
    let bestMonthPercent: number | undefined = undefined;
    let highestPct = -1;

    Object.entries(monthCountsMap).forEach(([mKey, count]) => {
      const [y, m] = mKey.split('-').map(Number);
      const daysInM = new Date(y, m, 0).getDate();
      const pct = daysInM > 0 ? Math.min(100, Math.round((count / daysInM) * 100)) : 0;
      if (pct > highestPct && count > 0) {
        highestPct = pct;
        bestMonthTitle = `${MONTH_NAMES_SHORT[m - 1]} ${y}`;
        bestMonthPercent = pct;
      }
    });

    return {
      habit,
      totalCompletions,
      totalTrackedDays,
      longestStreak,
      currentStreak,
      allTimeRate,
      daysSinceCreation: totalTrackedDays,
      totalNotes,
      bestMonthTitle,
      bestMonthPercent,
    };
  });

  // Sort habitStatsList descending by allTimeRate, then totalCompletions
  habitStatsList.sort((a, b) => {
    if (a.totalCompletions === 0 && b.totalCompletions > 0) return 1;
    if (b.totalCompletions === 0 && a.totalCompletions > 0) return -1;
    if (b.allTimeRate !== a.allTimeRate) {
      return b.allTimeRate - a.allTimeRate;
    }
    return b.totalCompletions - a.totalCompletions;
  });

  // Crown the #1 Top Habit in this category
  const topHabit = habitStatsList.length > 0 && habitStatsList[0].totalCompletions > 0 ? habitStatsList[0] : null;

  const totalCategoryPossibleChecks = habitStatsList.reduce((acc, curr) => acc + curr.totalTrackedDays, 0);

  const overallConsistencyPercent =
    habitStatsList.length > 0
      ? Math.round(
          habitStatsList.reduce((acc, curr) => acc + curr.allTimeRate, 0) / habitStatsList.length
        )
      : 0;

  // Day of week distribution for category
  const categoryDayOfWeekStats: CategoryDayOfWeekStat[] = DAYS_OF_WEEK.map(({ day, shortLabel, dayIndex }) => {
    const count = categoryDayCounts[dayIndex] || 0;
    const percent =
      totalCategoryCompletions > 0
        ? Math.round((count / totalCategoryCompletions) * 100)
        : 0;

    return {
      day,
      shortLabel,
      count,
      percent,
    };
  });

  // Monthly trend for category
  const sortedMonthKeys = Object.keys(monthlyCategoryCompletionsMap).sort();
  const monthlyCategoryTrend: CategoryMonthlyTrend[] = sortedMonthKeys.map((mKey) => {
    const [y, m] = mKey.split('-').map(Number);
    const mDays = new Date(y, m, 0).getDate();
    const count = monthlyCategoryCompletionsMap[mKey] || 0;
    const totalPossibleInMonth = habits.length * mDays;
    const avgPct =
      totalPossibleInMonth > 0
        ? Math.min(100, Math.round((count / totalPossibleInMonth) * 100))
        : 0;

    return {
      monthKey: mKey,
      monthTitle: `${MONTH_NAMES_SHORT[m - 1]} ${y}`,
      totalCompletions: count,
      averagePercent: avgPct,
    };
  });

  return {
    totalCategoryCompletions,
    totalCategoryPossibleChecks,
    overallConsistencyPercent,
    totalCategoryDays,
    topHabit,
    habitStatsList,
    categoryDayOfWeekStats,
    monthlyCategoryTrend,
    totalNotesInBoard,
    loading,
  };
}
