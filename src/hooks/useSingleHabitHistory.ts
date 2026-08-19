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

export interface HabitHistoryMetrics {
  currentStreak: number;
  longestStreak: number;
  totalLifetimeCompletions: number;
  monthCompletionPercent: number;
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

  // 3. Compute Lifetime & Streak Metrics
  let totalLifetimeCompletions = 0;
  let monthCompletedCount = 0;

  const daysInActiveMonth = new Date(activeYear, activeMonth + 1, 0).getDate();

  Object.values(entries).forEach((entry) => {
    if (entry.completed) {
      totalLifetimeCompletions++;
      if (entry.date.startsWith(activeMonthKey)) {
        monthCompletedCount++;
      }
    }
  });

  const monthCompletionPercent =
    daysInActiveMonth > 0
      ? Math.min(100, Math.round((monthCompletedCount / daysInActiveMonth) * 100))
      : 0;

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
    .filter((k) => entries[k].completed && k.length === 10) // YYYY-MM-DD format
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
    },
    loading,
    error,
    isCompleted,
    toggleEntry,
    updateHabit,
    archiveHabit,
  };
}
