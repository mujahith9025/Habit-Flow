import {
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  db,
  getEntryDocRef,
  getMonthlyMatrixDocRef,
  getEntriesCollectionRef,
} from './firestore';
import {
  Habit,
  HabitEntry,
  HabitEntryMap,
  MonthlyMatrixDocument,
  MonthlyHabitRecord,
  MonthlyHabitDayValue,
  HabitMood,
} from '../../types';
import { getWeekOfMonth, getMonthKey } from './habitService';

/**
 * -----------------------------------------------------------------------------------
 * Pure Bitmask Utility Functions (O(1) Memory & Operations)
 * -----------------------------------------------------------------------------------
 * In HabitFlow's denormalized monthly matrix, days 1 to 31 of any calendar month
 * are mapped to individual bits in a 32-bit unsigned integer:
 * - Day 1  = bit 0 (1 << 0)
 * - Day 2  = bit 1 (1 << 1)
 * - ...
 * - Day 31 = bit 30 (1 << 30)
 */

/**
 * Tests whether a specific calendar day (1-31) is marked completed in a 32-bit bitmask
 */
export function isDayCompletedInBitmask(bitmask: number, day: number): boolean {
  if (day < 1 || day > 31) return false;
  return (bitmask & (1 << (day - 1))) !== 0;
}

/**
 * Sets or unsets a specific calendar day (1-31) in a 32-bit bitmask and returns the new mask
 */
export function setDayInBitmask(bitmask: number, day: number, completed: boolean): number {
  if (day < 1 || day > 31) return bitmask;
  if (completed) {
    return (bitmask | (1 << (day - 1))) >>> 0;
  } else {
    return (bitmask & ~(1 << (day - 1))) >>> 0;
  }
}

/**
 * Counts the total number of completed days in a month from a 32-bit bitmask
 */
export function countCompletedDaysInBitmask(bitmask: number): number {
  let count = 0;
  let n = bitmask >>> 0;
  while (n > 0) {
    count += n & 1;
    n = n >>> 1;
  }
  return count;
}

/**
 * Returns an array of day numbers (1-31) that are completed in a bitmask
 */
export function getCompletedDaysFromBitmask(bitmask: number): number[] {
  const days: number[] = [];
  for (let day = 1; day <= 31; day++) {
    if ((bitmask & (1 << (day - 1))) !== 0) {
      days.push(day);
    }
  }
  return days;
}

/**
 * Converts a HabitEntryMap into a 32-bit completion bitmask for a given monthKey
 */
export function entryMapToBitmask(entries: HabitEntryMap, monthKey: string): number {
  let mask = 0;
  for (const [dateKey, entry] of Object.entries(entries)) {
    if (dateKey.startsWith(monthKey) && entry.completed) {
      const day = parseInt(dateKey.substring(8, 10), 10);
      if (day >= 1 && day <= 31) {
        mask = (mask | (1 << (day - 1))) >>> 0;
      }
    }
  }
  return mask;
}

/**
 * Hydrates a MonthlyHabitRecord back into a standard HabitEntryMap for complete backward compatibility
 */
export function matrixRecordToEntryMap(
  _habitId: string,
  record: MonthlyHabitRecord,
  monthKey: string
): HabitEntryMap {
  const entries: HabitEntryMap = {};
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const isDone = isDayCompletedInBitmask(record.bitmask, day);
    const dayVal = record.values?.[String(day)];
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;

    if (isDone || dayVal) {
      const entry: HabitEntry = {
        date: dateKey,
        completed: isDone,
        weekOfMonth: getWeekOfMonth(dateKey),
        monthKey,
        updatedAt: '',
      };
      if (dayVal?.v !== undefined) entry.currentValue = dayVal.v;
      if (dayVal?.t !== undefined) entry.timerSecondsElapsed = dayVal.t;
      if (dayVal?.n) entry.note = dayVal.n;
      if (dayVal?.m) entry.mood = dayVal.m;
      entries[dateKey] = entry;
    }
  }

  return entries;
}

/**
 * Converts an entire MonthlyMatrixDocument into an entriesByHabit dictionary: { [habitId]: HabitEntryMap }
 */
export function matrixDocToEntriesByHabit(
  docData: MonthlyMatrixDocument
): Record<string, HabitEntryMap> {
  const result: Record<string, HabitEntryMap> = {};
  for (const [habitId, record] of Object.entries(docData.habits || {})) {
    result[habitId] = matrixRecordToEntryMap(habitId, record, docData.monthKey);
  }
  return result;
}

/**
 * Converts an entriesByHabit dictionary into a compact MonthlyMatrixDocument
 */
export function entriesByHabitToMatrixDoc(
  monthKey: string,
  entriesByHabit: Record<string, HabitEntryMap>
): MonthlyMatrixDocument {
  const habitsRecord: Record<string, MonthlyHabitRecord> = {};

  for (const [habitId, entryMap] of Object.entries(entriesByHabit)) {
    const bitmask = entryMapToBitmask(entryMap, monthKey);
    const values: Record<string, MonthlyHabitDayValue> = {};

    for (const [dateKey, entry] of Object.entries(entryMap)) {
      if (dateKey.startsWith(monthKey)) {
        const day = String(parseInt(dateKey.substring(8, 10), 10));
        const hasValue =
          entry.currentValue !== undefined ||
          entry.timerSecondsElapsed !== undefined ||
          Boolean(entry.note) ||
          Boolean(entry.mood);

        if (hasValue) {
          values[day] = {};
          if (entry.currentValue !== undefined) values[day].v = entry.currentValue;
          if (entry.timerSecondsElapsed !== undefined) values[day].t = entry.timerSecondsElapsed;
          if (entry.note) values[day].n = entry.note;
          if (entry.mood) values[day].m = entry.mood;
        }
      }
    }

    habitsRecord[habitId] = {
      bitmask,
      ...(Object.keys(values).length > 0 ? { values } : {}),
    };
  }

  return {
    monthKey,
    version: 1,
    updatedAt: new Date().toISOString(),
    habits: habitsRecord,
  };
}

/**
 * -----------------------------------------------------------------------------------
 * Firestore Read & Subscription Layer (Single Document Streaming)
 * -----------------------------------------------------------------------------------
 */

/**
 * Fetches the denormalized monthly matrix document for a user
 * users/{uid}/monthlyMatrices/{monthKey}
 */
export async function getMonthlyMatrix(
  uid: string,
  monthKey: string
): Promise<MonthlyMatrixDocument | null> {
  const matrixRef = getMonthlyMatrixDocRef(uid, monthKey);
  const snap = await getDoc(matrixRef);
  if (!snap.exists()) return null;
  return snap.data() as MonthlyMatrixDocument;
}

/**
 * Subscribes to the single denormalized monthly matrix document in real time.
 * Replaces N individual subcollection listeners with 1 single live stream!
 */
export function subscribeToMonthlyMatrix(
  uid: string,
  monthKey: string,
  onUpdate: (matrix: MonthlyMatrixDocument | null) => void,
  onError?: (err: Error) => void
): () => void {
  const matrixRef = getMonthlyMatrixDocRef(uid, monthKey);
  return onSnapshot(
    matrixRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as MonthlyMatrixDocument);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn(`[MonthlyMatrixService] Error subscribing to monthly matrix ${monthKey}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Backfills a monthly matrix document from subcollection entries when first accessed
 */
export async function backfillMonthlyMatrixFromEntries(
  uid: string,
  monthKey: string,
  habits: Habit[]
): Promise<MonthlyMatrixDocument> {
  const matrixRef = getMonthlyMatrixDocRef(uid, monthKey);
  const entriesByHabit: Record<string, HabitEntryMap> = {};

  // Fetch entries for active habits in parallel
  await Promise.all(
    habits.map(async (habit) => {
      const colRef = getEntriesCollectionRef(uid, habit.id);
      const snap = await getDocs(colRef);
      const habitEntries: HabitEntryMap = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.date && data.date.startsWith(monthKey)) {
          habitEntries[data.date] = data;
        }
      });
      entriesByHabit[habit.id] = habitEntries;
    })
  );

  const matrixDoc = entriesByHabitToMatrixDoc(monthKey, entriesByHabit);
  await setDoc(matrixRef, matrixDoc, { merge: true });
  return matrixDoc;
}

/**
 * -----------------------------------------------------------------------------------
 * Atomic Batch Writes (All-or-Nothing Multi-Habit Commits)
 * -----------------------------------------------------------------------------------
 */

export interface HabitBatchUpdateItem {
  habitId: string;
  completed: boolean;
  currentValue?: number;
  timerSecondsElapsed?: number;
  note?: string;
  mood?: HabitMood;
  tags?: string[];
}

/**
 * Groups multi-habit check-ins into a single atomic Firestore commit.
 * Updates both individual granular subcollection entries (for audit/queries)
 * and the denormalized monthly matrix document in a single network roundtrip.
 */
export async function atomicBatchUpdateHabits(
  uid: string,
  dateKey: string,
  updates: HabitBatchUpdateItem[]
): Promise<void> {
  if (updates.length === 0) return;

  const monthKey = getMonthKey(dateKey);
  const day = parseInt(dateKey.substring(8, 10), 10);
  const weekOfMonth = getWeekOfMonth(dateKey);
  const now = new Date().toISOString();

  const matrixRef = getMonthlyMatrixDocRef(uid, monthKey);

  // Read current matrix state (from local offline cache in <1ms)
  let currentHabits: Record<string, MonthlyHabitRecord> = {};
  try {
    const matrixSnap = await getDoc(matrixRef);
    if (matrixSnap.exists()) {
      currentHabits = (matrixSnap.data() as MonthlyMatrixDocument).habits || {};
    }
  } catch (err) {
    console.warn('[MonthlyMatrixService] Cache getDoc notice (will initialize new matrix):', err);
  }

  const batch = writeBatch(db);

  // 1. Stage all individual entry document updates in the atomic batch
  updates.forEach((item) => {
    const entryRef = getEntryDocRef(uid, item.habitId, dateKey);
    const entryData: HabitEntry = {
      date: dateKey,
      completed: item.completed,
      weekOfMonth,
      monthKey,
      updatedAt: now,
    };
    if (item.currentValue !== undefined) entryData.currentValue = item.currentValue;
    if (item.timerSecondsElapsed !== undefined) entryData.timerSecondsElapsed = item.timerSecondsElapsed;
    if (item.note) entryData.note = item.note;
    if (item.mood) entryData.mood = item.mood;
    if (item.tags) entryData.tags = item.tags;

    batch.set(entryRef, entryData, { merge: true });

    // 2. Compute updated bitmask & values in memory for matrix
    const existingRecord = currentHabits[item.habitId] || { bitmask: 0 };
    const updatedBitmask = setDayInBitmask(existingRecord.bitmask, day, item.completed);
    const updatedValues = { ...(existingRecord.values || {}) };

    const dayKey = String(day);
    if (
      item.currentValue !== undefined ||
      item.timerSecondsElapsed !== undefined ||
      item.note ||
      item.mood
    ) {
      updatedValues[dayKey] = {
        ...(updatedValues[dayKey] || {}),
        ...(item.currentValue !== undefined ? { v: item.currentValue } : {}),
        ...(item.timerSecondsElapsed !== undefined ? { t: item.timerSecondsElapsed } : {}),
        ...(item.note ? { n: item.note } : {}),
        ...(item.mood ? { m: item.mood } : {}),
      };
    } else if (!item.completed) {
      delete updatedValues[dayKey];
    }

    currentHabits[item.habitId] = {
      bitmask: updatedBitmask,
      ...(Object.keys(updatedValues).length > 0 ? { values: updatedValues } : {}),
    };
  });

  // 3. Stage the denormalized monthly matrix document update in the same batch
  const matrixPayload: MonthlyMatrixDocument = {
    monthKey,
    version: 1,
    updatedAt: now,
    habits: currentHabits,
  };

  batch.set(matrixRef, matrixPayload, { merge: true });

  // 4. Commit all writes simultaneously with atomic guarantees
  await batch.commit();
}

/**
 * Toggles a single habit entry atomically using the batch commit pipeline
 */
export async function atomicToggleEntry(
  uid: string,
  habitId: string,
  dateKey: string,
  completed: boolean,
  extra?: {
    currentValue?: number;
    timerSecondsElapsed?: number;
    note?: string;
    mood?: HabitMood;
    tags?: string[];
  }
): Promise<HabitEntry> {
  await atomicBatchUpdateHabits(uid, dateKey, [
    {
      habitId,
      completed,
      currentValue: extra?.currentValue,
      timerSecondsElapsed: extra?.timerSecondsElapsed,
      note: extra?.note,
      mood: extra?.mood,
      tags: extra?.tags,
    },
  ]);

  return {
    date: dateKey,
    completed,
    currentValue: extra?.currentValue,
    timerSecondsElapsed: extra?.timerSecondsElapsed,
    note: extra?.note,
    mood: extra?.mood,
    tags: extra?.tags,
    weekOfMonth: getWeekOfMonth(dateKey),
    monthKey: getMonthKey(dateKey),
    updatedAt: new Date().toISOString(),
  };
}
