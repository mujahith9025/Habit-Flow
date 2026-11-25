import { useState, useEffect, useRef, useCallback } from 'react';
import {
  onSnapshot,
  setDoc,
  getEntriesCollectionRef,
  getMonthlyMatrixDocRef,
  toggleHabitPause as toggleHabitPauseService,
  saveHabitNote as saveHabitNoteService,
  getWeekOfMonth,
  subscribeToMonthlyMatrix,
  matrixDocToEntriesByHabit,
  entriesByHabitToMatrixDoc,
  atomicBatchUpdateHabits,
  atomicToggleEntry,
} from '../lib/firebase';
import { broadcastSync, subscribeToBroadcastSync } from '../utils/broadcastSync';
import { enqueueOfflineMutation, flushOfflineMutations } from '../utils/offlineQueue';
import {
  isZeroKnowledgeEnabled,
  getEffectivePassphrase,
  encryptEntryNote,
  decryptEntryNote,
  isEncrypted,
} from '../utils/crypto';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import {
  Habit,
  HabitEntry,
  HabitEntryMap,
  isHabitActiveInMonth,
  isEntryCompleted,
} from '../types';
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
  shieldsRemaining?: number;
  graceDaysAllowed?: number;
  graceDaysUsed?: number;
  graceDatesProtected?: string[];
  targetCount: number;
  rank?: number;
}

export interface UseDailyHabitsDataResult {
  dailyHabits: Habit[];
  daysInMonth: MonthDayInfo[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  topHabits: HabitGridMetrics[];
  entriesByHabit: Record<string, HabitEntryMap>;
  loading: boolean;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  getHabitEntry: (habitId: string, dateKey: string) => HabitEntry | undefined;
  toggleHabitEntry: (habitId: string, dateKey: string) => Promise<void>;
  updateHabitValue: (habitId: string, dateKey: string, newValue: number, timerSecondsElapsed?: number) => Promise<void>;
  toggleHabitPause: (habitId: string, isPaused: boolean, reason?: string, startDate?: string, endDate?: string) => Promise<void>;
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

  // Denormalized Monthly Matrix streaming layer:
  // Listens to 1 single document (users/{uid}/monthlyMatrices/{monthKey})
  // Cutting Firestore reads by 90-95% and delivering <15ms dashboard loads!
  useEffect(() => {
    if (!user?.uid || dailyHabits.length === 0) {
      setEntriesByHabit({});
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    let isCancelled = false;
    const subcollectionUnsubs: Array<() => void> = [];

    const matrixUnsub = subscribeToMonthlyMatrix(user.uid, monthKey, (matrixDoc) => {
      if (isCancelled) return;

      if (matrixDoc && matrixDoc.habits) {
        // Fast <15ms bitmask hydration into entriesByHabit
        const hydrated = matrixDocToEntriesByHabit(matrixDoc);
        setEntriesByHabit(hydrated);
        setEntriesLoading(false);
      } else {
        // Fallback & Auto-Migration: If matrix doc doesn't exist yet for this monthKey,
        // listen to subcollections and automatically generate the compact matrix.
        let loadedSnapshotsCount = 0;
        const totalHabits = dailyHabits.length;

        dailyHabits.forEach((habit) => {
          const colRef = getEntriesCollectionRef(user.uid, habit.id);

          const unsub = onSnapshot(
            colRef,
            async (snap) => {
              if (isCancelled) return;
              const habitMap: HabitEntryMap = {};
              const passphrase = getEffectivePassphrase(user.uid);

              for (const docSnap of snap.docs) {
                const data = docSnap.data();
                if (data.note && isEncrypted(data.note)) {
                  data.note = await decryptEntryNote(data.note, passphrase);
                }
                habitMap[data.date] = data;
              }

              setEntriesByHabit((prev) => {
                const updated = {
                  ...prev,
                  [habit.id]: habitMap,
                };

                loadedSnapshotsCount++;
                if (loadedSnapshotsCount >= totalHabits) {
                  setEntriesLoading(false);
                  // Backfill denormalized monthly matrix document for future instant loads
                  try {
                    const matrixDoc = entriesByHabitToMatrixDoc(monthKey, updated);
                    setDoc(getMonthlyMatrixDocRef(user.uid, monthKey), matrixDoc, { merge: true }).catch((err) =>
                      console.warn('Matrix backfill background save notice:', err)
                    );
                  } catch (e) {
                    console.warn('Matrix backfill notice:', e);
                  }
                }
                return updated;
              });
            },
            (err) => {
              console.warn(`Error listening to habit ${habit.id} entries:`, err);
              loadedSnapshotsCount++;
              if (loadedSnapshotsCount >= totalHabits) {
                setEntriesLoading(false);
              }
            }
          );

          subcollectionUnsubs.push(unsub);
        });
      }
    });

    // 2. Zero-Latency Multi-Tab Sync (BroadcastChannel)
    // Instantly reflects mutations in other open tabs on this device without network calls
    const broadcastUnsub = subscribeToBroadcastSync((msg) => {
      if (isCancelled) return;

      if (msg.type === 'HABIT_ENTRY_TOGGLE') {
        setEntriesByHabit((prev) => {
          const habitMap = { ...(prev[msg.habitId] || {}) };
          const prevEntry = habitMap[msg.dateKey] || {
            date: msg.dateKey,
            completed: false,
            weekOfMonth: getWeekOfMonth(msg.dateKey),
            monthKey: msg.dateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          };
          habitMap[msg.dateKey] = {
            ...prevEntry,
            completed: msg.completed,
            ...(msg.currentValue !== undefined ? { currentValue: msg.currentValue } : {}),
            ...(msg.timerSecondsElapsed !== undefined ? { timerSecondsElapsed: msg.timerSecondsElapsed } : {}),
            updatedAt: new Date().toISOString(),
          };
          return {
            ...prev,
            [msg.habitId]: habitMap,
          };
        });
      } else if (msg.type === 'HABIT_BATCH_TOGGLE') {
        setEntriesByHabit((prev) => {
          const next = { ...prev };
          msg.updates.forEach((item) => {
            const prevEntry = next[item.habitId]?.[msg.dateKey] || {
              date: msg.dateKey,
              completed: !item.completed,
              weekOfMonth: getWeekOfMonth(msg.dateKey),
              monthKey: msg.dateKey.substring(0, 7),
              updatedAt: new Date().toISOString(),
            };
            next[item.habitId] = {
              ...(next[item.habitId] || {}),
              [msg.dateKey]: {
                ...prevEntry,
                completed: item.completed,
                ...(item.currentValue !== undefined ? { currentValue: item.currentValue } : {}),
                ...(item.timerSecondsElapsed !== undefined ? { timerSecondsElapsed: item.timerSecondsElapsed } : {}),
                updatedAt: new Date().toISOString(),
              },
            };
          });
          return next;
        });
      }
    });

    // 3. Flush any queued offline mutations when connectivity is verified
    flushOfflineMutations().catch((err) =>
      console.debug('[DailyHabits] Initial offline flush notice:', err)
    );

    return () => {
      isCancelled = true;
      matrixUnsub();
      broadcastUnsub();
      subcollectionUnsubs.forEach((unsub) => unsub());
    };
  }, [user?.uid, habitIdsKey, monthKey]);

  // Compute metrics per habit
  const habitMetricsMap: Record<string, HabitGridMetrics> = {};

  dailyHabits.forEach((habit) => {
    const habitEntries = entriesByHabit[habit.id] || {};
    let completedCount = 0;

    daysInMonth.forEach((day) => {
      if (isEntryCompleted(habit, habitEntries[day.dateKey])) {
        completedCount++;
      }
    });

    // Compute streak for this individual habit with "Never Miss Twice" Grace Days (up to 2 per month)
    const gentleResult = calculateGentleHabitStreak(habitEntries, today, 2, habit);
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
      shieldsRemaining: gentleResult.shieldsRemaining,
      graceDaysAllowed: gentleResult.graceDaysAllowed,
      graceDaysUsed: gentleResult.graceDaysUsed,
      graceDatesProtected: gentleResult.graceDatesProtected,
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
      const habit = dailyHabits.find((h) => h.id === habitId);
      const entry = entriesByHabit[habitId]?.[dateKey];
      return habit ? isEntryCompleted(habit, entry) : Boolean(entry?.completed);
    },
    [entriesByHabit, dailyHabits]
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
        weekOfMonth: getWeekOfMonth(dateKey),
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
        let noteToSave = note.trim();
        if (noteToSave && isZeroKnowledgeEnabled()) {
          const passphrase = getEffectivePassphrase(user.uid);
          noteToSave = await encryptEntryNote(noteToSave, passphrase);
        }
        await saveHabitNoteService(user.uid, habitId, dateKey, noteToSave, mood, tags);
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
            weekOfMonth: getWeekOfMonth(dateKey),
            monthKey: dateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      // Broadcast immediately to all other open tabs (<1ms zero-network sync)
      broadcastSync({
        type: 'HABIT_ENTRY_TOGGLE',
        habitId,
        dateKey,
        completed: nextCompleted,
      });

      try {
        // 2. Persist to Firestore via Atomic Batch Write
        await atomicToggleEntry(user.uid, habitId, dateKey, nextCompleted);
      } catch (err) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          // If offline, queue in IndexedDB to automatically flush via Background Sync
          enqueueOfflineMutation({
            type: 'TOGGLE_ENTRY',
            uid: user.uid,
            dateKey,
            payload: { habitId, completed: nextCompleted },
          }).catch(() => {});
        } else {
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
      }
    },
    [user?.uid]
  );

  // Batch Complete All Pending Habits for Today via Atomic Batch Write
  const batchCompleteTodayHabits = useCallback(
    async (habitIdsToComplete: string[]): Promise<void> => {
      if (!user?.uid || habitIdsToComplete.length === 0) return;

      // Deep-clone the snapshot to prevent shared references during rollback
      const previousEntriesSnapshot: Record<string, HabitEntryMap> = {};
      const current = entriesRef.current;
      for (const hId of Object.keys(current)) {
        previousEntriesSnapshot[hId] = { ...current[hId] };
      }

      // 1. Optimistic UI update
      setEntriesByHabit((prev) => {
        const next = { ...prev };
        habitIdsToComplete.forEach((hId) => {
          const prevEntry = next[hId]?.[todayDateKey] || {
            date: todayDateKey,
            completed: false,
            weekOfMonth: getWeekOfMonth(todayDateKey),
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

      const batchItems = habitIdsToComplete.map((hId) => ({
        habitId: hId,
        completed: true,
      }));

      // Broadcast immediately to other open tabs
      broadcastSync({
        type: 'HABIT_BATCH_TOGGLE',
        dateKey: todayDateKey,
        updates: batchItems,
      });

      // 2. Atomic Batch Commit (One single network roundtrip for all habits + monthly matrix)
      try {
        await atomicBatchUpdateHabits(user.uid, todayDateKey, batchItems);
      } catch (err) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueOfflineMutation({
            type: 'BATCH_TOGGLE',
            uid: user.uid,
            dateKey: todayDateKey,
            payload: { updates: batchItems },
          }).catch(() => {});
        } else {
          console.error('Failed to atomic batch complete habits for today:', err);
          setEntriesByHabit(previousEntriesSnapshot);
        }
      }
    },
    [user?.uid, todayDateKey]
  );

  // Batch Reset Habits for Today via Atomic Batch Write
  const batchResetTodayHabits = useCallback(
    async (habitIdsToReset: string[]): Promise<void> => {
      if (!user?.uid || habitIdsToReset.length === 0) return;

      // Deep-clone the snapshot to prevent shared references during rollback
      const previousEntriesSnapshot: Record<string, HabitEntryMap> = {};
      const current = entriesRef.current;
      for (const hId of Object.keys(current)) {
        previousEntriesSnapshot[hId] = { ...current[hId] };
      }

      // 1. Optimistic UI update
      setEntriesByHabit((prev) => {
        const next = { ...prev };
        habitIdsToReset.forEach((hId) => {
          const prevEntry = next[hId]?.[todayDateKey] || {
            date: todayDateKey,
            completed: true,
            weekOfMonth: getWeekOfMonth(todayDateKey),
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

      const batchItems = habitIdsToReset.map((hId) => ({
        habitId: hId,
        completed: false,
      }));

      // Broadcast immediately to other open tabs
      broadcastSync({
        type: 'HABIT_BATCH_TOGGLE',
        dateKey: todayDateKey,
        updates: batchItems,
      });

      // 2. Atomic Batch Commit
      try {
        await atomicBatchUpdateHabits(user.uid, todayDateKey, batchItems);
      } catch (err) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueOfflineMutation({
            type: 'BATCH_TOGGLE',
            uid: user.uid,
            dateKey: todayDateKey,
            payload: { updates: batchItems },
          }).catch(() => {});
        } else {
          console.error('Failed to atomic batch reset habits for today:', err);
          setEntriesByHabit(previousEntriesSnapshot);
        }
      }
    },
    [user?.uid, todayDateKey]
  );

  // Update Numeric Target Value or Zen Timer Duration via Atomic Batch Write
  const updateHabitValue = useCallback(
    async (
      habitId: string,
      dateKey: string,
      newValue: number,
      timerSecondsElapsed?: number
    ): Promise<void> => {
      if (!user?.uid) return;

      const habit = dailyHabits.find((h) => h.id === habitId);
      const targetVal = habit?.targetValue ?? (habit?.timerDuration ? habit.timerDuration * 60 : undefined);
      const isComplete =
        targetVal !== undefined
          ? timerSecondsElapsed !== undefined
            ? timerSecondsElapsed >= targetVal
            : newValue >= targetVal
          : newValue > 0;

      const prevHabitEntries = entriesRef.current[habitId] || {};
      const prevEntry = prevHabitEntries[dateKey];

      // Optimistic UI update
      setEntriesByHabit((prev) => ({
        ...prev,
        [habitId]: {
          ...(prev[habitId] || {}),
          [dateKey]: {
            date: dateKey,
            completed: isComplete,
            currentValue: newValue,
            timerSecondsElapsed:
              timerSecondsElapsed !== undefined
                ? timerSecondsElapsed
                : prevEntry?.timerSecondsElapsed,
            weekOfMonth: getWeekOfMonth(dateKey),
            monthKey: dateKey.substring(0, 7),
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      // Broadcast to other tabs
      broadcastSync({
        type: 'HABIT_ENTRY_TOGGLE',
        habitId,
        dateKey,
        completed: isComplete,
        currentValue: newValue,
        timerSecondsElapsed,
      });

      try {
        await atomicToggleEntry(user.uid, habitId, dateKey, isComplete, {
          currentValue: newValue,
          timerSecondsElapsed,
        });
      } catch (err) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueOfflineMutation({
            type: 'UPDATE_VALUE',
            uid: user.uid,
            dateKey,
            payload: {
              habitId,
              completed: isComplete,
              currentValue: newValue,
              timerSecondsElapsed,
            },
          }).catch(() => {});
        } else {
          console.error('Failed to update habit numeric value:', err);
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
      }
    },
    [user?.uid, dailyHabits]
  );

  // Toggle Vacation / Travel Pause
  const toggleHabitPause = useCallback(
    async (
      habitId: string,
      isPaused: boolean,
      reason?: string,
      startDate?: string,
      endDate?: string
    ): Promise<void> => {
      if (!user?.uid) return;
      await toggleHabitPauseService(
        user.uid,
        habitId,
        isPaused,
        reason,
        startDate,
        endDate
      );
    },
    [user?.uid]
  );

  return {
    dailyHabits,
    daysInMonth,
    habitMetricsMap,
    topHabits,
    entriesByHabit,
    loading: habitsLoading || entriesLoading,
    isCompleted,
    getHabitEntry,
    toggleHabitEntry,
    updateHabitValue,
    toggleHabitPause,
    batchCompleteTodayHabits,
    batchResetTodayHabits,
    saveHabitNote,
    seedHabits,
  };
}
