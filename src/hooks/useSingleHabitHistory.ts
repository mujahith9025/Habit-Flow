import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  getHabitDocRef,
  getEntriesCollectionRef,
  toggleEntry as toggleEntryService,
  updateHabit as updateHabitService,
  archiveHabit as archiveHabitService,
} from '../lib/firebase';
import { useAuth } from './useAuth';
import { Habit, HabitEntryMap } from '../types';
import { formatDateKey } from './useDashboardMetrics';

export interface MonthPerformance {
  monthKey: string;
  monthTitle: string;
  completedCount: number;
  daysInMonth: number;
  percent: number;
}

export interface DayOfWeekStat {
  day: string;
  shortLabel: string;
  count: number;
  percent: number;
}

export interface HabitHistoryMetrics {
  currentStreak: number;
  longestStreak: number;
  totalLifetimeCompletions: number;
  monthCompletionPercent: number;
  monthCompletedDays: number;
  daysInMonth: number;
  selectedMonthKey: string;

  // All-Time Analytics fields
  allTimeRatePercent: number;
  totalTrackedDays: number;
  daysSinceCreation: number;
  totalNotesCount: number;
  bestMonth: MonthPerformance | null;
  dayOfWeekStats: DayOfWeekStat[];
  monthlyHistory: MonthPerformance[];
}

export interface UseSingleHabitHistoryResult {
  habit: Habit | null;
  entries: HabitEntryMap;
  metrics: HabitHistoryMetrics;
  loading: boolean;
  error: string | null;
  isCompleted: (dateKey: string) => boolean;
  toggleEntry: (dateKey: string) => Promise<void>;
  updateHabit: (updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  archiveHabit: (archived: boolean) => Promise<void>;
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

export function useSingleHabitHistory(
  habitId?: string,
  selectedMonthDate?: Date
): UseSingleHabitHistoryResult {
  const { user } = useAuth();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [entries, setEntries] = useState<HabitEntryMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const today = new Date();
  const todayKey = formatDateKey(today);

  const activeDate = selectedMonthDate || today;
  const activeYear = activeDate.getFullYear();
  const activeMonth = activeDate.getMonth();
  const activeMonthKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;

  // 1. Subscribe to Habit Document
  useEffect(() => {
    if (!user?.uid || !habitId) {
      setHabit(null);
      setLoading(false);
      return;
    }

    const habitDocRef = getHabitDocRef(user.uid, habitId);
    const unsub = onSnapshot(
      habitDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHabit({
            ...docSnap.data(),
            id: docSnap.id,
          } as Habit);
        } else {
          setHabit(null);
        }
      },
      (err) => {
        console.warn('Error listening to single habit:', err);
        setError(err.message);
      }
    );

    return () => unsub();
  }, [user?.uid, habitId]);

  // 2. Subscribe to All Habit Entries
  useEffect(() => {
    if (!user?.uid || !habitId) {
      setEntries({});
      setLoading(false);
      return;
    }

    const entriesColRef = getEntriesCollectionRef(user.uid, habitId);
    const unsub = onSnapshot(
      entriesColRef,
      (snapshot) => {
        const map: HabitEntryMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          map[data.date] = data;
        });

        setEntries(map);
        setLoading(false);
      },
      (err) => {
        console.warn('Error listening to habit entries:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid, habitId]);

  // 3. Compute Lifetime & Selected Month Metrics
  let totalLifetimeCompletions = 0;
  let monthCompletedDays = 0;
  let totalNotesCount = 0;

  const dayOfWeekCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const monthCompletionsMap: Record<string, number> = {};

  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();

  Object.values(entries).forEach((entry) => {
    if (entry.note || entry.mood || (entry.tags && entry.tags.length > 0)) {
      totalNotesCount++;
    }

    if (entry.completed) {
      totalLifetimeCompletions++;

      // Selected Month
      if (entry.date.startsWith(activeMonthKey)) {
        monthCompletedDays++;
      }

      // Group by Month Key for All-Time History
      const mKey = entry.monthKey || entry.date.substring(0, 7);
      monthCompletionsMap[mKey] = (monthCompletionsMap[mKey] || 0) + 1;

      // Group by Day of Week
      const [y, m, d] = entry.date.split('-').map(Number);
      if (y && m && d) {
        const entryDate = new Date(y, m - 1, d);
        const dayOfWeekIndex = entryDate.getDay();
        dayOfWeekCounts[dayOfWeekIndex] = (dayOfWeekCounts[dayOfWeekIndex] || 0) + 1;
      }
    }
  });

  const monthCompletionPercent =
    daysInMonth > 0
      ? Math.min(100, Math.round((monthCompletedDays / daysInMonth) * 100))
      : 0;

  // Find earliest date across habit creation and all entries
  let earliestHabitDate: Date = today;
  if (habit?.createdAt) {
    const cDate = new Date(habit.createdAt);
    if (!isNaN(cDate.getTime()) && cDate < earliestHabitDate) {
      earliestHabitDate = cDate;
    }
  }

  Object.keys(entries).forEach((dateKey) => {
    if (dateKey.length === 10) {
      const [y, m, d] = dateKey.split('-').map(Number);
      if (y && m && d) {
        const eDate = new Date(y, m - 1, d);
        if (eDate < earliestHabitDate) {
          earliestHabitDate = eDate;
        }
      }
    }
  });

  const daysSinceCreation = Math.max(
    1,
    Math.ceil((today.getTime() - earliestHabitDate.getTime()) / (1000 * 3600 * 24)) + 1
  );

  const totalTrackedDays = Math.max(daysSinceCreation, Math.max(1, totalLifetimeCompletions));

  const allTimeRatePercent =
    totalTrackedDays > 0
      ? Math.min(100, Math.round((totalLifetimeCompletions / totalTrackedDays) * 100))
      : 0;

  // Day of Week Distribution Stats
  const dayOfWeekStats: DayOfWeekStat[] = DAYS_OF_WEEK.map(({ day, shortLabel, dayIndex }) => {
    const count = dayOfWeekCounts[dayIndex] || 0;
    const percent =
      totalLifetimeCompletions > 0
        ? Math.round((count / totalLifetimeCompletions) * 100)
        : 0;

    return {
      day,
      shortLabel,
      count,
      percent,
    };
  });

  // Month-by-Month All-Time History & Best Month
  const allMonthKeys = Array.from(
    new Set([...Object.keys(monthCompletionsMap), activeMonthKey])
  ).sort();

  let bestMonth: MonthPerformance | null = null;
  const monthlyHistory: MonthPerformance[] = allMonthKeys.map((mKey) => {
    const [y, m] = mKey.split('-').map(Number);
    const mDays = new Date(y, m, 0).getDate();
    const count = monthCompletionsMap[mKey] || 0;
    const pct = mDays > 0 ? Math.min(100, Math.round((count / mDays) * 100)) : 0;
    const mTitle = `${MONTH_NAMES_SHORT[m - 1]} ${y}`;

    const perf: MonthPerformance = {
      monthKey: mKey,
      monthTitle: mTitle,
      completedCount: count,
      daysInMonth: mDays,
      percent: pct,
    };

    if (!bestMonth || perf.percent > bestMonth.percent || (perf.percent === bestMonth.percent && perf.completedCount > bestMonth.completedCount)) {
      if (perf.completedCount > 0) {
        bestMonth = perf;
      }
    }

    return perf;
  });

  // Compute Current Streak
  let currentStreak = 0;
  if (entries[todayKey]?.completed) {
    currentStreak = 1;
  }

  const checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const dKey = formatDateKey(checkDate);
    if (entries[dKey]?.completed) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Compute Longest Streak Ever
  let longestStreak = currentStreak;
  const sortedDates = Object.keys(entries)
    .filter((k) => entries[k].completed && k.length === 10)
    .sort();

  let tempStreak = 0;
  let lastDate: Date | null = null;

  sortedDates.forEach((dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    const curDate = new Date(y, m - 1, d);

    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    lastDate = curDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  });

  const isCompleted = useCallback(
    (dateKey: string): boolean => {
      return Boolean(entries[dateKey]?.completed);
    },
    [entries]
  );

  // Optimistic Toggle with Rollback
  const toggleEntry = useCallback(
    async (dateKey: string): Promise<void> => {
      if (!user?.uid || !habitId) return;

      const prevEntry = entriesRef.current[dateKey];
      const prevCompleted = prevEntry?.completed ?? false;
      const nextCompleted = !prevCompleted;

      // 1. Optimistic Update
      setEntries((prev) => ({
        ...prev,
        [dateKey]: {
          date: dateKey,
          completed: nextCompleted,
          weekOfMonth: Math.ceil(Number(dateKey.split('-')[2] || 1) / 7),
          monthKey: dateKey.substring(0, 7),
          updatedAt: new Date().toISOString(),
        },
      }));

      try {
        // 2. Persist
        await toggleEntryService(user.uid, habitId, dateKey, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle entry on server. Rolling back:', err);
        // 3. Rollback
        setEntries((prev) => {
          const map = { ...prev };
          if (prevEntry) {
            map[dateKey] = prevEntry;
          } else {
            delete map[dateKey];
          }
          return map;
        });
      }
    },
    [user?.uid, habitId]
  );

  const updateHabit = useCallback(
    async (updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> => {
      if (!user?.uid || !habitId) return;
      await updateHabitService(user.uid, habitId, updates);
    },
    [user?.uid, habitId]
  );

  const archiveHabit = useCallback(
    async (archived: boolean): Promise<void> => {
      if (!user?.uid || !habitId) return;
      await archiveHabitService(user.uid, habitId, archived);
    },
    [user?.uid, habitId]
  );

  return {
    habit,
    entries,
    metrics: {
      currentStreak,
      longestStreak,
      totalLifetimeCompletions,
      monthCompletionPercent,
      monthCompletedDays,
      daysInMonth,
      selectedMonthKey: activeMonthKey,
      allTimeRatePercent,
      totalTrackedDays,
      daysSinceCreation,
      totalNotesCount,
      bestMonth,
      dayOfWeekStats,
      monthlyHistory,
    },
    loading,
    error,
    isCompleted,
    toggleEntry,
    updateHabit,
    archiveHabit,
  };
}
