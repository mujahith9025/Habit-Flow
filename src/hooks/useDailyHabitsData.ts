import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  where,
  getEntriesCollectionRef,
  toggleEntry as toggleEntryService,
} from '../lib/firebase';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { Habit, HabitEntryMap } from '../types';
import { formatDateKey } from './useDashboardMetrics';

export interface MonthDayInfo {
  dayNum: number;
  dateKey: string;
  dayOfWeek: string; // 'S' | 'M' | 'T' | 'W' | 'T' | 'F' | 'S'
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface HabitGridMetrics {
  habit: Habit;
  completedCount: number;
  monthProgressPercent: number;
  streakCount: number;
  targetCount: number;
  rank?: number;
}

export interface UseDailyHabitsDataResult {
  dailyHabits: Habit[];
  daysInMonth: MonthDayInfo[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  topHabits: HabitGridMetrics[];
  loading: boolean;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  toggleHabitEntry: (habitId: string, dateKey: string) => Promise<void>;
  seedHabits: () => Promise<Habit[]>;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Hook to manage real-time entries and metrics for daily habits in a selected month, optionally filtered by category
 */
export function useDailyHabitsData(selectedDate: Date, selectedCategory: string = 'all'): UseDailyHabitsDataResult {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, seedHabits } = useHabits('daily');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const today = new Date();
  const todayDateKey = formatDateKey(today);

  // Generate days array for selected month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysInMonth: MonthDayInfo[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = DAY_LETTERS[dayDate.getDay()];
    const isToday = dateKey === todayDateKey;
    const isPast = dateKey < todayDateKey;
    const isFuture = dateKey > todayDateKey;

    daysInMonth.push({
      dayNum: d,
      dateKey,
      dayOfWeek,
      isToday,
      isPast,
      isFuture,
    });
  }

  // Real-time entries state: { [habitId]: { [dateKey]: HabitEntry } }
  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, HabitEntryMap>>({});
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Ref to hold current entries for optimistic rollback
  const entriesRef = useRef(entriesByHabit);
  entriesRef.current = entriesByHabit;

  // Filter daily habits that are not archived, optionally filtered by category
  const activeDailyHabits = habits.filter((h) => !h.archived);
  const dailyHabits = selectedCategory === 'all'
    ? activeDailyHabits
    : activeDailyHabits.filter(
        (h) => (h.category || 'General').toLowerCase() === selectedCategory.toLowerCase()
      );

  useEffect(() => {
    if (!user?.uid || dailyHabits.length === 0) {
      setEntriesByHabit({});
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribes: Array<() => void> = [];

    dailyHabits.forEach((habit) => {
      const colRef = getEntriesCollectionRef(user.uid, habit.id);
      const q = query(colRef, where('monthKey', '==', monthKey));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const habitMap: HabitEntryMap = {};
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            habitMap[data.date] = data;
          });

          setEntriesByHabit((prev) => ({
            ...prev,
            [habit.id]: habitMap,
          }));
        },
        (err) => {
          console.warn(`Error listening to habit ${habit.id} entries:`, err);
        }
      );

      unsubscribes.push(unsub);
    });

    setEntriesLoading(false);
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid, dailyHabits.map((h) => h.id).join(','), monthKey]);

  // Compute metrics per habit
  const habitMetricsMap: Record<string, HabitGridMetrics> = {};

  dailyHabits.forEach((habit) => {
    const habitEntries = entriesByHabit[habit.id] || {};
    let completedCount = 0;

    daysInMonth.forEach((day) => {
      if (habitEntries[day.dateKey]?.completed) {
        completedCount++;
      }
    });

    // Compute streak for this individual habit
    let streakCount = 0;
    const isCompletedToday = habitEntries[todayDateKey]?.completed === true;

    if (isCompletedToday) {
      streakCount = 1;
    }

    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 30; i++) {
      const pastKey = formatDateKey(checkDate);
      if (habitEntries[pastKey]?.completed === true) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const targetCount = habit.goalCount > 1 ? habit.goalCount : totalDays;
    const monthProgressPercent =
      totalDays > 0 ? Math.min(100, Math.round((completedCount / targetCount) * 100)) : 0;

    habitMetricsMap[habit.id] = {
      habit,
      completedCount,
      monthProgressPercent,
      streakCount,
      targetCount,
    };
  });

  // Top Habits ranked by monthProgressPercent (descending), then streakCount (descending)
  const topHabits = Object.values(habitMetricsMap)
    .sort((a, b) => {
      if (b.monthProgressPercent !== a.monthProgressPercent) {
        return b.monthProgressPercent - a.monthProgressPercent;
      }
      return b.streakCount - a.streakCount;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const isCompleted = useCallback(
    (habitId: string, dateKey: string): boolean => {
      return Boolean(entriesByHabit[habitId]?.[dateKey]?.completed);
    },
    [entriesByHabit]
  );

  // Optimistic Toggle with Rollback
  const toggleHabitEntry = useCallback(
    async (habitId: string, dateKey: string): Promise<void> => {
      if (!user?.uid) return;

      const prevHabitEntries = entriesRef.current[habitId] || {};
      const prevEntry = prevHabitEntries[dateKey];
      const prevCompleted = prevEntry?.completed ?? false;
      const nextCompleted = !prevCompleted;

      // 1. Optimistic UI update
      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [dateKey]: {
            date: dateKey,
            completed: nextCompleted,
            weekOfMonth: Math.ceil(Number(dateKey.split('-')[2]) / 7),
            monthKey: dateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      try {
        // 2. Persist to Firestore
        await toggleEntryService(user.uid, habitId, dateKey, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle habit entry. Rolling back:', err);
        // 3. Rollback on error
        setEntriesByHabit((prev) => {
          const habitMap = { ...(prev[habitId] || {}) };
          if (prevEntry) {
            habitMap[dateKey] = prevEntry;
          } else {
            delete habitMap[dateKey];
          }
          return {
            ...prev,
            [habitId]: habitMap,
          };
        });
      }
    },
    [user?.uid]
  );

  return {
    dailyHabits,
    daysInMonth,
    habitMetricsMap,
    topHabits,
    loading: habitsLoading || entriesLoading,
    isCompleted,
    toggleHabitEntry,
    seedHabits,
  };
}
