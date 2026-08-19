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

export interface WeeklyHabitMetrics {
  habit: Habit;
  completedWeeksCount: number;
  progressPercent: number;
  streakCount: number;
  goalCount: number;
}

export interface UseWeeklyHabitsDataResult {
  weeklyHabits: Habit[];
  habitMetricsMap: Record<string, WeeklyHabitMetrics>;
  loading: boolean;
  isCompleted: (habitId: string, weekNumber: number) => boolean;
  toggleWeeklyEntry: (habitId: string, weekNumber: number) => Promise<void>;
  seedHabits: () => Promise<Habit[]>;
}

export function useWeeklyHabitsData(selectedDate: Date): UseWeeklyHabitsDataResult {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, seedHabits } = useHabits('weekly');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const weeklyHabits = habits.filter((h) => !h.archived);
  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, HabitEntryMap>>({});
  const [entriesLoading, setEntriesLoading] = useState(true);

  const entriesRef = useRef(entriesByHabit);
  entriesRef.current = entriesByHabit;

  useEffect(() => {
    if (!user?.uid || weeklyHabits.length === 0) {
      setEntriesByHabit({});
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribes: Array<() => void> = [];

    weeklyHabits.forEach((habit) => {
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
          console.warn(`Error listening to weekly habit ${habit.id} entries:`, err);
        }
      );

      unsubscribes.push(unsub);
    });

    setEntriesLoading(false);
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid, weeklyHabits.map((h) => h.id).join(','), monthKey]);

  // Compute metrics per weekly habit
  const habitMetricsMap: Record<string, WeeklyHabitMetrics> = {};

  weeklyHabits.forEach((habit) => {
    const habitEntries = entriesByHabit[habit.id] || {};
    let completedWeeksCount = 0;

    for (let w = 1; w <= 5; w++) {
      const weekKey = `${monthKey}-W${w}`;
      if (habitEntries[weekKey]?.completed) {
        completedWeeksCount++;
      }
    }

    const goalCount = habit.goalCount > 0 ? habit.goalCount : 4;
    const progressPercent = Math.min(100, Math.round((completedWeeksCount / goalCount) * 100));

    // Approximate weekly streak based on completed weeks count
    const streakCount = completedWeeksCount > 0 ? completedWeeksCount * 7 : 0;

    habitMetricsMap[habit.id] = {
      habit,
      completedWeeksCount,
      progressPercent,
      streakCount,
      goalCount,
    };
  });

  const isCompleted = useCallback(
    (habitId: string, weekNumber: number): boolean => {
      const weekKey = `${monthKey}-W${weekNumber}`;
      return Boolean(entriesByHabit[habitId]?.[weekKey]?.completed);
    },
    [entriesByHabit, monthKey]
  );

  const toggleWeeklyEntry = useCallback(
    async (habitId: string, weekNumber: number): Promise<void> => {
      if (!user?.uid) return;

      const weekKey = `${monthKey}-W${weekNumber}`;
      const prevHabitEntries = entriesRef.current[habitId] || {};
      const prevEntry = prevHabitEntries[weekKey];
      const prevCompleted = prevEntry?.completed ?? false;
      const nextCompleted = !prevCompleted;

      // 1. Optimistic Update
      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [weekKey]: {
            date: weekKey,
            completed: nextCompleted,
            weekOfMonth: weekNumber,
            monthKey,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      try {
        // 2. Network Write
        await toggleEntryService(user.uid, habitId, weekKey, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle weekly entry. Rolling back:', err);
        // 3. Rollback
        setEntriesByHabit((prev) => {
          const habitMap = { ...(prev[habitId] || {}) };
          if (prevEntry) {
            habitMap[weekKey] = prevEntry;
          } else {
            delete habitMap[weekKey];
          }
          return {
            ...prev,
            [habitId]: habitMap,
          };
        });
      }
    },
    [user?.uid, monthKey]
  );

  return {
    weeklyHabits,
    habitMetricsMap,
    loading: habitsLoading || entriesLoading,
    isCompleted,
    toggleWeeklyEntry,
    seedHabits,
  };
}
