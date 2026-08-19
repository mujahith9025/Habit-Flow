import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  where,
  getEntriesCollectionRef,
  toggleEntry as toggleEntryService,
  getWeekOfMonth,
} from '../lib/firebase';
import { useAuth } from './useAuth';
import { HabitEntry, HabitEntryMap } from '../types';

export interface UseEntriesResult {
  entries: HabitEntryMap;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  toggleEntry: (dateKey: string, explicitCompleted?: boolean) => Promise<HabitEntry>;
  isEntryCompleted: (dateKey: string) => boolean;
}

/**
 * Real-time subscription to a habit's entries for a given monthKey (YYYY-MM).
 * Features optimistic UI updates with automatic rollback on error.
 */
export function useEntries(habitId?: string, monthKey?: string): UseEntriesResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HabitEntryMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Keep a ref of current entries for reliable rollback
  const entriesRef = useRef<HabitEntryMap>(entries);
  entriesRef.current = entries;

  useEffect(() => {
    if (!user?.uid || !habitId || !monthKey) {
      setEntries({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const entriesCol = getEntriesCollectionRef(user.uid, habitId);
    const q = query(entriesCol, where('monthKey', '==', monthKey));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entryMap: HabitEntryMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as HabitEntry;
          entryMap[data.date] = data;
        });

        setEntries(entryMap);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Real-time useEntries listener warning:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, habitId, monthKey]);

  /**
   * Optimistic Toggle Entry:
   * 1. Updates local UI state immediately.
   * 2. Persists to Firestore.
   * 3. Reverts to previous state if write fails.
   */
  const toggleEntry = useCallback(
    async (dateKey: string, explicitCompleted?: boolean): Promise<HabitEntry> => {
      if (!user?.uid || !habitId) {
        throw new Error('Missing user authentication or habitId');
      }

      const prevEntry = entriesRef.current[dateKey];
      const prevCompleted = prevEntry?.completed ?? false;
      const nextCompleted = explicitCompleted !== undefined ? explicitCompleted : !prevCompleted;

      // 1. Optimistic Local Update
      const optimisticEntry: HabitEntry = {
        date: dateKey,
        completed: nextCompleted,
        weekOfMonth: getWeekOfMonth(dateKey),
        monthKey: dateKey.substring(0, 7),
        updatedAt: new Date().toISOString(),
      };

      setEntries((prev) => ({
        ...prev,
        [dateKey]: optimisticEntry,
      }));

      try {
        // 2. Network Write to Firestore
        const saved = await toggleEntryService(user.uid, habitId, dateKey, nextCompleted);
        return saved;
      } catch (err: unknown) {
        // 3. Rollback on Error
        console.error('Failed to toggle entry on server. Rolling back optimistic state:', err);
        setEntries((prev) => {
          if (prevEntry) {
            return { ...prev, [dateKey]: prevEntry };
          } else {
            const nextMap = { ...prev };
            delete nextMap[dateKey];
            return nextMap;
          }
        });
        throw err;
      }
    },
    [user?.uid, habitId]
  );

  const isEntryCompleted = useCallback(
    (dateKey: string): boolean => {
      return Boolean(entries[dateKey]?.completed);
    },
    [entries]
  );

  return {
    entries,
    loading,
    error,
    lastUpdated,
    toggleEntry,
    isEntryCompleted,
  };
}
