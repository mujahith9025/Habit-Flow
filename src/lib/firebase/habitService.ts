import {
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getHabitDocRef,
  getHabitsCollectionRef,
  getEntryDocRef,
} from './firestore';
import { Habit, HabitEntry, HabitFrequency } from '../../types';

/**
 * Calculates the week of the month (1-5) for a given YYYY-MM-DD date string
 */
export function getWeekOfMonth(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  return Math.ceil((day + firstDay) / 7);
}

/**
 * Extracts monthKey (YYYY-MM) from a given YYYY-MM-DD date string
 */
export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

/**
 * Toggles or writes a habit entry in Firestore
 * users/{uid}/habits/{habitId}/entries/{dateKey}
 */
export async function toggleEntry(
  uid: string,
  habitId: string,
  dateKey: string,
  completed: boolean
): Promise<HabitEntry> {
  const entryRef = getEntryDocRef(uid, habitId, dateKey);
  const monthKey = getMonthKey(dateKey);
  const weekOfMonth = getWeekOfMonth(dateKey);
  const updatedAt = new Date().toISOString();

  const entryData: HabitEntry = {
    date: dateKey,
    completed,
    weekOfMonth,
    monthKey,
    updatedAt,
  };

  await setDoc(entryRef, entryData, { merge: true });
  return entryData;
}

/**
 * Saves a quick 1-tap note and reflection for a habit entry
 */
export async function saveHabitNote(
  uid: string,
  habitId: string,
  dateKey: string,
  note: string,
  mood?: string,
  tags?: string[]
): Promise<void> {
  const entryRef = getEntryDocRef(uid, habitId, dateKey);
  const monthKey = getMonthKey(dateKey);
  const weekOfMonth = getWeekOfMonth(dateKey);
  const updatedAt = new Date().toISOString();

  const dataToSet: Record<string, unknown> = {
    date: dateKey,
    monthKey,
    weekOfMonth,
    note: note.trim(),
    tags: tags || [],
    updatedAt,
  };
  if (mood) {
    dataToSet.mood = mood;
  }

  await setDoc(entryRef, dataToSet, { merge: true });
}

/**
 * Creates a new habit document in users/{uid}/habits/{habitId}
 */
export async function createHabit(
  uid: string,
  data: {
    name: string;
    category?: string;
    icon?: string;
    color?: string;
    frequency?: HabitFrequency;
    goalCount?: number;
    sortOrder?: number;
  }
): Promise<Habit> {
  const habitsCol = getHabitsCollectionRef(uid);
  const newHabitRef = doc(habitsCol);
  const createdAt = new Date().toISOString();

  const newHabit: Habit = {
    id: newHabitRef.id,
    name: data.name.trim(),
    category: data.category?.trim() || 'General',
    icon: data.icon || 'energy_savings_leaf',
    color: data.color || '#006398',
    frequency: data.frequency || 'daily',
    goalCount: data.goalCount || 1,
    createdAt,
    archived: false,
    sortOrder: data.sortOrder ?? 0,
  };

  await setDoc(newHabitRef, newHabit);
  return newHabit;
}

/**
 * Updates a habit document
 */
export async function updateHabit(
  uid: string,
  habitId: string,
  updates: Partial<Omit<Habit, 'id' | 'createdAt'>>
): Promise<void> {
  const habitRef = getHabitDocRef(uid, habitId);
  await updateDoc(habitRef, updates);
}

/**
 * Archives or unarchives a habit
 */
export async function archiveHabit(
  uid: string,
  habitId: string,
  archived: boolean
): Promise<void> {
  const habitRef = getHabitDocRef(uid, habitId);
  await updateDoc(habitRef, { archived });
}

/**
 * Deletes a habit document
 */
export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  const habitRef = getHabitDocRef(uid, habitId);
  await deleteDoc(habitRef);
}

/**
 * Seeds sample habits matching the Stitch design system
 */
export async function seedSampleHabits(uid: string): Promise<Habit[]> {
  const samples: Array<Parameters<typeof createHabit>[1]> = [
    {
      name: 'Morning Meditation',
      category: 'Mindfulness',
      icon: 'self_improvement',
      color: '#006398', // Primary Teal/Blue
      frequency: 'daily',
      goalCount: 1,
      sortOrder: 0,
    },
    {
      name: 'Cold Shower Challenge',
      category: 'Self Challenges',
      icon: 'water_drop',
      color: '#a03e40', // Muted Coral
      frequency: 'daily',
      goalCount: 1,
      sortOrder: 1,
    },
    {
      name: 'No Sugar Diet',
      category: 'Diet & Nutrition',
      icon: 'favorite',
      color: '#286b33', // Success Green
      frequency: 'daily',
      goalCount: 1,
      sortOrder: 2,
    },
    {
      name: 'Physical Workout',
      category: 'Fitness',
      icon: 'fitness_center',
      color: '#286b33', // Success Green
      frequency: 'weekly',
      goalCount: 4,
      sortOrder: 3,
    },
  ];

  const created: Habit[] = [];
  for (const sample of samples) {
    const h = await createHabit(uid, sample);
    created.push(h);
  }
  return created;
}
