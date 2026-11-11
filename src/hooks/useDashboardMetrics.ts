import { useState, useEffect } from 'react';
import { onSnapshot, getEntriesCollectionRef } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { DashboardMetrics, HabitEntryMap, isHabitActiveInMonth } from '../types';
import { calculateGentleOverallStreak, formatDateKey } from '../lib/calculations';

// Re-export formatDateKey from the canonical source so existing imports don't break
export { formatDateKey } from '../lib/calculations';

/**
 * Calculates live dashboard completion metrics and overall consecutive streak, optionally filtered by category
 */
export function useDashboardMetrics(selectedMonthKey?: string, selectedCategory: string = 'all'): DashboardMetrics {
  const { user } = useAuth();
  const { habits, loading: habitsLoading } = useHabits('daily');

  const today = new Date();
  const todayDateKey = formatDateKey(today);
  const activeMonthKey = selectedMonthKey || todayDateKey.substring(0, 7);

  // Filter daily habits active in the selected month
  const activeDailyHabits = habits.filter((h) => isHabitActiveInMonth(h, activeMonthKey));
  const dailyHabits = selectedCategory === 'all'
    ? activeDailyHabits
    : activeDailyHabits.filter(
        (h) => (h.category || 'General').toLowerCase() === selectedCategory.toLowerCase()
      );

  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, HabitEntryMap>>({});
  const [entriesLoading, setEntriesLoading] = useState(false);

  const habitIdsKey = dailyHabits.map((h) => h.id).join(',');

  // Subscribe to entries for all daily habits in the active month
  useEffect(() => {
    if (!user?.uid || dailyHabits.length === 0) {
      setEntriesByHabit({});
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribes: Array<() => void> = [];
    let loadedSnapshotsCount = 0;
    const totalHabits = dailyHabits.length;

    dailyHabits.forEach((habit) => {
      const colRef = getEntriesCollectionRef(user.uid, habit.id);

      const unsub = onSnapshot(
        colRef,
        (snap) => {
          const habitEntries: HabitEntryMap = {};
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            habitEntries[data.date] = data;
          });

          setEntriesByHabit((prev) => ({
            ...prev,
            [habit.id]: habitEntries,
          }));

          loadedSnapshotsCount++;
          if (loadedSnapshotsCount >= totalHabits) {
            setEntriesLoading(false);
          }
        },
        (err) => {
          console.warn(`Error listening to entries for habit ${habit.id}:`, err);
          loadedSnapshotsCount++;
          if (loadedSnapshotsCount >= totalHabits) {
            setEntriesLoading(false);
          }
        }
      );

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid, habitIdsKey]);

  // Compute completed count today
  const totalDailyHabits = dailyHabits.length;

  let completedTodayCount = 0;
  dailyHabits.forEach((h) => {
    if (entriesByHabit[h.id]?.[todayDateKey]?.completed) {
      completedTodayCount++;
    }
  });

  const completionPercentage =
    totalDailyHabits > 0 ? Math.round((completedTodayCount / totalDailyHabits) * 100) : 0;

  // Compute consecutive days streak with Gentle Persistence Streak Shield
  const gentleOverall = calculateGentleOverallStreak(entriesByHabit, dailyHabits, today, 1);
  const streakCount = gentleOverall.streak;
  const isShieldActive = gentleOverall.isShieldActive;
  const shieldsRemaining = gentleOverall.shieldsRemaining;

  return {
    totalDailyHabits,
    completedTodayCount,
    completionPercentage,
    streakCount,
    isShieldActive,
    shieldsRemaining,
    todayDateKey,
    loading: (habitsLoading && dailyHabits.length === 0) || entriesLoading,
  };
}
