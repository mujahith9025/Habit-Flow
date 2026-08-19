import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  query,
  getHabitsCollectionRef,
  createHabit as createHabitService,
  updateHabit as updateHabitService,
  archiveHabit as archiveHabitService,
  deleteHabit as deleteHabitService,
  seedSampleHabits as seedSampleHabitsService,
} from '../lib/firebase';
import { useAuth } from './useAuth';
import { Habit, HabitFrequency } from '../types';

export interface UseHabitsResult {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  createHabit: (data: {
    name: string;
    icon?: string;
    color?: string;
    frequency?: HabitFrequency;
    goalCount?: number;
    sortOrder?: number;
  }) => Promise<Habit>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  archiveHabit: (habitId: string, archived: boolean) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  seedHabits: () => Promise<Habit[]>;
}

/**
 * Real-time subscription to the user's habits collection
 * users/{uid}/habits (ordered by sortOrder, optionally filtered by frequency)
 */
export function useHabits(
  frequencyFilter?: HabitFrequency | 'all',
  includeArchived: boolean = false
): UseHabitsResult {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const habitsCol = getHabitsCollectionRef(user.uid);
    const q = query(habitsCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const habitList: Habit[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Habit;
          const matchesFrequency =
            !frequencyFilter || frequencyFilter === 'all' || data.frequency === frequencyFilter;

          if (matchesFrequency && (includeArchived || !data.archived)) {
            habitList.push({
              ...data,
              id: docSnap.id,
            });
          }
        });

        // Client-side sort by sortOrder
        habitList.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        setHabits(habitList);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Real-time useHabits listener note:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, frequencyFilter, includeArchived]);

  // Wrapped mutation handlers bound to active user uid
  const createHabit = useCallback(
    async (data: Parameters<typeof createHabitService>[1]) => {
      if (!user?.uid) throw new Error('User is not authenticated');
      return await createHabitService(user.uid, data);
    },
    [user?.uid]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Parameters<typeof updateHabitService>[2]) => {
      if (!user?.uid) throw new Error('User is not authenticated');
      return await updateHabitService(user.uid, habitId, updates);
    },
    [user?.uid]
  );

  const archiveHabit = useCallback(
    async (habitId: string, archived: boolean) => {
      if (!user?.uid) throw new Error('User is not authenticated');
      return await archiveHabitService(user.uid, habitId, archived);
    },
    [user?.uid]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user?.uid) throw new Error('User is not authenticated');
      return await deleteHabitService(user.uid, habitId);
    },
    [user?.uid]
  );

  const seedHabits = useCallback(async () => {
    if (!user?.uid) throw new Error('User is not authenticated');
    return await seedSampleHabitsService(user.uid);
  }, [user?.uid]);

  return {
    habits,
    loading,
    error,
    lastUpdated,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    seedHabits,
  };
}
