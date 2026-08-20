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

export interface MonthlyHabitMetrics {
  habit: Habit;
  isCompleted: boolean;
  progressPercent: number;
  streakCount: number;
}

export interface UseMonthlyHabitsDataResult {
  monthlyHabits: Habit[];
  habitMetricsMap: Record<string, MonthlyHabitMetrics>;
  loading: boolean;
  isCompleted: (habitId: string) => boolean;
  toggleMonthlyEntry: (habitId: string) => Promise<void>;
  seedHabits: () => Promise<Habit[]>;
}

export function useMonthlyHabitsData(selectedDate: Date, selectedCategory: string = 'all'): UseMonthlyHabitsDataResult {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, seedHabits } = useHabits('monthly');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const activeMonthlyHabits = habits.filter((h) => !h.archived);
  const monthlyHabits = selectedCategory === 'all'
    ? activeMonthlyHabits
    : activeMonthlyHabits.filter(
        (h) => (h.category || 'General').toLowerCase() === selectedCategory.toLowerCase()
      );

  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, HabitEntryMap>>({});
  const [entriesLoading, setEntriesLoading] = useState(true);

  const entriesRef = useRef(entriesByHabit);
  entriesRef.current = entriesByHabit;

  useEffect(() => {
    if (!user?.uid || monthlyHabits.length === 0) {
      setEntriesByHabit({});
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribes: Array<() => void> = [];

    monthlyHabits.forEach((habit) => {
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
          console.warn(`Error listening to monthly habit ${habit.id}:`, err);
        }
      );

      unsubscribes.push(unsub);
    });

    setEntriesLoading(false);
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid, monthlyHabits.map((h) => h.id).join(','), monthKey]);

  // Compute metrics per habit
  const habitMetricsMap: Record<string, MonthlyHabitMetrics> = {};

  monthlyHabits.forEach((habit) => {
    const isDone = Boolean(entriesByHabit[habit.id]?.[monthKey]?.completed);
    habitMetricsMap[habit.id] = {
      habit,
      isCompleted: isDone,
      progressPercent: isDone ? 100 : 0,
      streakCount: isDone ? 1 : 0,
    };
  });

  const isCompleted = useCallback(
    (habitId: string): boolean => {
      return Boolean(entriesByHabit[habitId]?.[monthKey]?.completed);
    },
    [entriesByHabit, monthKey]
  );

  const toggleMonthlyEntry = useCallback(
    async (habitId: string): Promise<void> => {
      if (!user?.uid) return;

      const prevEntry = entriesRef.current[habitId]?.[monthKey];
      const nextCompleted = !prevEntry?.completed;

      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [monthKey]: {
            date: monthKey,
            completed: nextCompleted,
            weekOfMonth: 1,
            monthKey,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      try {
        await toggleEntryService(user.uid, habitId, monthKey, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle monthly entry. Rolling back:', err);
        setEntriesByHabit((prev) => {
          const habitMap = { ...(prev[habitId] || {}) };
          if (prevEntry) {
            habitMap[monthKey] = prevEntry;
          } else {
            delete habitMap[monthKey];
          }
          return { ...prev, [habitId]: habitMap };
        });
      }
    },
    [user?.uid, monthKey]
  );

  return {
    monthlyHabits,
    habitMetricsMap,
    loading: habitsLoading || entriesLoading,
    isCompleted,
    toggleMonthlyEntry,
    seedHabits,
  };
}
