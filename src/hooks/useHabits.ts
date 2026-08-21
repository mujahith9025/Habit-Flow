import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  query,
  getHabitsCollectionRef,
  createHabit as createHabitService,
  updateHabit as updateHabitService,
  removeHabitFromMonth as removeHabitFromMonthService,
  restoreHabitToMonth as restoreHabitToMonthService,
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
    category?: string;
    icon?: string;
    color?: string;
    frequency?: HabitFrequency;
    goalCount?: number;
    sortOrder?: number;
    startMonth?: string;
    endMonth?: string;
    excludedMonths?: string[];
  }) => Promise<Habit>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  removeHabitFromMonth: (habitId: string, monthKey: string) => Promise<void>;
  restoreHabitToMonth: (habitId: string, monthKey: string) => Promise<void>;
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
          habitList.push(docSnap.data());
        });

        // Client-side filtering & sorting
        let filtered = habitList;
        if (!includeArchived) {
          filtered = filtered.filter((h) => !h.archived);
        }
        if (frequencyFilter && frequencyFilter !== 'all') {
          filtered = filtered.filter((h) => h.frequency === frequencyFilter);
        }

        filtered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        setHabits(filtered);
        setLoading(false);
        setLastUpdated(new Date());
        setError(null);
      },
      (err) => {
        console.error('Error listening to habits:', err);
        setError(err.message || 'Failed to load habits.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, frequencyFilter, includeArchived]);

  const createHabit = useCallback(
    async (data: {
      name: string;
      category?: string;
      icon?: string;
      color?: string;
      frequency?: HabitFrequency;
      goalCount?: number;
      sortOrder?: number;
    }): Promise<Habit> => {
      if (!user?.uid) throw new Error('User must be logged in to create a habit');
      return await createHabitService(user.uid, data);
    },
    [user?.uid]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> => {
      if (!user?.uid) throw new Error('User must be logged in to update a habit');
      await updateHabitService(user.uid, habitId, updates);
    },
    [user?.uid]
  );

  const removeHabitFromMonth = useCallback(
    async (habitId: string, monthKey: string): Promise<void> => {
      if (!user?.uid) throw new Error('User must be logged in to remove a habit from a month');
      await removeHabitFromMonthService(user.uid, habitId, monthKey);
    },
    [user?.uid]
  );

  const restoreHabitToMonth = useCallback(
    async (habitId: string, monthKey: string): Promise<void> => {
      if (!user?.uid) throw new Error('User must be logged in to restore a habit to a month');
      await restoreHabitToMonthService(user.uid, habitId, monthKey);
    },
    [user?.uid]
  );

  const archiveHabit = useCallback(
    async (habitId: string, archived: boolean): Promise<void> => {
      if (!user?.uid) throw new Error('User must be logged in to archive a habit');
      await archiveHabitService(user.uid, habitId, archived);
    },
    [user?.uid]
  );

  const deleteHabit = useCallback(
    async (habitId: string): Promise<void> => {
      if (!user?.uid) throw new Error('User must be logged in to delete a habit');
      await deleteHabitService(user.uid, habitId);
    },
    [user?.uid]
  );

  const seedHabits = useCallback(async (): Promise<Habit[]> => {
    if (!user?.uid) throw new Error('User must be logged in to seed habits');
    return await seedSampleHabitsService(user.uid);
  }, [user?.uid]);

  return {
    habits,
    loading,
    error,
    lastUpdated,
    createHabit,
    updateHabit,
    removeHabitFromMonth,
    restoreHabitToMonth,
    archiveHabit,
    deleteHabit,
    seedHabits,
  };
}
