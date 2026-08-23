import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  where,
  getEntriesCollectionRef,
  toggleEntry as toggleEntryService,
  saveHabitNote as saveHabitNoteService,
} from '../lib/firebase';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { Habit, HabitEntry, HabitEntryMap, isHabitActiveInMonth } from '../types';
import { calculateGentleHabitStreak, formatDateKey } from '../lib/calculations';

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
  isShieldActive?: boolean;
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
  getHabitEntry: (habitId: string, dateKey: string) => HabitEntry | undefined;
  toggleHabitEntry: (habitId: string, dateKey: string) => Promise<void>;
  batchCompleteTodayHabits: (habitIdsToComplete: string[]) => Promise<void>;
  batchResetTodayHabits: (habitIdsToReset: string[]) => Promise<void>;
  saveHabitNote: (habitId: string, dateKey: string, note: string, mood?: string, tags?: string[]) => Promise<void>;
  seedHabits: () => Promise<Habit[]>;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Hook to manage real-time entries and metrics for all habits in a selected month, optionally filtered by category
 */
export function useDailyHabitsData(selectedDate: Date, selectedCategory: string = 'all'): UseDailyHabitsDataResult {
  const { user } = useAuth();
  // Fetch all active habits (not just 'daily') so all habits in the category board are included
  const { habits, loading: habitsLoading, seedHabits } = useHabits('all');

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

  // Filter habits active in the selected month (respecting month lifecycle, exclusions, startMonth, endMonth)
  const activeHabits = habits.filter((h) => isHabitActiveInMonth(h, monthKey));
  const normalizedCategory = selectedCategory.trim().toLowerCase();

  const dailyHabits =
    normalizedCategory === 'all'
      ? activeHabits
      : activeHabits.filter(
          (h) => (h.category || 'General').trim().toLowerCase() === normalizedCategory
        );

  const habitIdsKey = dailyHabits.map((h) => h.id).sort().join(',');

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
  }, [user?.uid, habitIdsKey, monthKey]);

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

    // Compute streak for this individual habit with Gentle Streak Shield
    const gentleResult = calculateGentleHabitStreak(habitEntries, today, 1);
    const streakCount = gentleResult.streak;
    const isShieldActive = gentleResult.isShieldActive;

    const targetCount = habit.goalCount && habit.goalCount > 1 ? habit.goalCount : totalDays;
    const monthProgressPercent =
      totalDays > 0 ? Math.min(100, Math.round((completedCount / targetCount) * 100)) : 0;

    habitMetricsMap[habit.id] = {
      habit,
      completedCount,
      monthProgressPercent,
      streakCount,
      isShieldActive,
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

  const getHabitEntry = useCallback(
    (habitId: string, dateKey: string): HabitEntry | undefined => {
      return entriesByHabit[habitId]?.[dateKey];
    },
    [entriesByHabit]
  );

  // Save 1-Tap Daily Habit Note & Reflection
  const saveHabitNote = useCallback(
    async (
      habitId: string,
      dateKey: string,
      note: string,
      mood?: string,
      tags?: string[]
    ): Promise<void> => {
      if (!user?.uid) return;

      const prevHabitEntries = entriesRef.current[habitId] || {};
      const existing = prevHabitEntries[dateKey] || {
        date: dateKey,
        completed: false,
        weekOfMonth: Math.ceil(Number(dateKey.split('-')[2]) / 7),
        monthKey: dateKey.substring(0, 7),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic UI update
      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [dateKey]: {
            ...existing,
            note: note.trim(),
            mood: (mood as any) || undefined,
            tags: tags || [],
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      try {
        await saveHabitNoteService(user.uid, habitId, dateKey, note, mood, tags);
      } catch (err) {
        console.error('Failed to save habit note:', err);
      }
    },
    [user?.uid]
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

  // Batch Complete All Pending Habits for Today
  const batchCompleteTodayHabits = useCallback(
    async (habitIdsToComplete: string[]): Promise<void> => {
      if (!user?.uid || habitIdsToComplete.length === 0) return;

      const previousEntriesSnapshot = { ...entriesRef.current };

      // 1. Optimistic UI update
      setEntriesByHabit((prev) => {
        const next = { ...prev };
        habitIdsToComplete.forEach((hId) => {
          const prevEntry = next[hId]?.[todayDateKey] || {
            date: todayDateKey,
            completed: false,
            weekOfMonth: Math.ceil(Number(todayDateKey.split('-')[2] || 1) / 7),
            monthKey: todayDateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          };
          next[hId] = {
            ...(next[hId] || {}),
            [todayDateKey]: {
              ...prevEntry,
              completed: true,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return next;
      });

      // 2. Persist in parallel
      try {
        await Promise.all(
          habitIdsToComplete.map((hId) =>
            toggleEntryService(user.uid, hId, todayDateKey, true)
          )
        );
      } catch (err) {
        console.error('Failed to batch complete habits for today:', err);
        setEntriesByHabit(previousEntriesSnapshot);
      }
    },
    [user?.uid, todayDateKey]
  );

  // Batch Reset Habits for Today
  const batchResetTodayHabits = useCallback(
    async (habitIdsToReset: string[]): Promise<void> => {
      if (!user?.uid || habitIdsToReset.length === 0) return;

      const previousEntriesSnapshot = { ...entriesRef.current };

      // 1. Optimistic UI update
      setEntriesByHabit((prev) => {
        const next = { ...prev };
        habitIdsToReset.forEach((hId) => {
          const prevEntry = next[hId]?.[todayDateKey] || {
            date: todayDateKey,
            completed: true,
            weekOfMonth: Math.ceil(Number(todayDateKey.split('-')[2] || 1) / 7),
            monthKey: todayDateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          };
          next[hId] = {
            ...(next[hId] || {}),
            [todayDateKey]: {
              ...prevEntry,
              completed: false,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return next;
      });

      // 2. Persist in parallel
      try {
        await Promise.all(
          habitIdsToReset.map((hId) =>
            toggleEntryService(user.uid, hId, todayDateKey, false)
          )
        );
      } catch (err) {
        console.error('Failed to batch reset habits for today:', err);
        setEntriesByHabit(previousEntriesSnapshot);
      }
    },
    [user?.uid, todayDateKey]
  );

  return {
    dailyHabits,
    daysInMonth,
    habitMetricsMap,
    topHabits,
    loading: habitsLoading || entriesLoading,
    isCompleted,
    getHabitEntry,
    toggleHabitEntry,
    batchCompleteTodayHabits,
    batchResetTodayHabits,
    saveHabitNote,
    seedHabits,
  };
}
