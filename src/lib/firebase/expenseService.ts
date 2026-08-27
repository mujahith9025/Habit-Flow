import {
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  getExpenseEntryDocRef,
  getExpenseEntriesCollectionRef,
  getExpenseSettingsDocRef,
} from './firestore';
import { DailyMoneyEntry, ExpenseItem, ExpenseTrackerSettings } from '../../types/expense';
import { formatDayMonth } from '../expenseCalculations';

export const DEFAULT_EXPENSE_SETTINGS: ExpenseTrackerSettings = {
  currencySymbol: '₹',
  defaultDailySavings: 25,
  startingBalance: 0,
  noteTheme: 'night_sky',
  title: 'MONEY SAVINGS',
};

/**
 * Saves or updates a daily money entry in users/{uid}/expense_entries/{dateKey}
 */
export async function saveDailyMoneyEntry(
  uid: string,
  dateKey: string,
  data: Partial<DailyMoneyEntry>
): Promise<DailyMoneyEntry> {
  const docRef = getExpenseEntryDocRef(uid, dateKey);
  const nowIso = new Date().toISOString();
  const displayDate = data.displayDate || formatDayMonth(dateKey);

  const expenses = data.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const savingsAmount = data.savingsAmount !== undefined ? Number(data.savingsAmount) : 25;

  const entry: DailyMoneyEntry = {
    id: dateKey,
    dateKey,
    displayDate,
    savingsAmount,
    expenses,
    totalExpenses,
    notes: data.notes || '',
    createdAt: data.createdAt || nowIso,
    updatedAt: nowIso,
  };

  await setDoc(docRef, entry, { merge: true });
  return entry;
}

/**
 * Batch saves multiple daily money entries (e.g. for month auto-fill or restore)
 */
export async function batchSaveDailyMoneyEntries(
  uid: string,
  entries: Record<string, DailyMoneyEntry>
): Promise<void> {
  const promises = Object.entries(entries).map(([dateKey, entry]) => {
    const docRef = getExpenseEntryDocRef(uid, dateKey);
    return setDoc(docRef, entry, { merge: true });
  });

  await Promise.all(promises);
}

/**
 * Adds an expense item to a specific date entry
 */
export async function addExpenseItemToDate(
  uid: string,
  dateKey: string,
  item: Omit<ExpenseItem, 'id' | 'createdAt'>
): Promise<DailyMoneyEntry> {
  const docRef = getExpenseEntryDocRef(uid, dateKey);
  const snap = await getDoc(docRef);
  const existing = snap.data() || {
    id: dateKey,
    dateKey,
    displayDate: formatDayMonth(dateKey),
    savingsAmount: 25,
    expenses: [],
    totalExpenses: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newExpenseItem: ExpenseItem = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    amount: Number(item.amount),
    description: item.description.trim(),
    category: item.category?.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedExpenses = [...(existing.expenses || []), newExpenseItem];
  const totalExpenses = updatedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const updatedEntry: DailyMoneyEntry = {
    ...existing,
    expenses: updatedExpenses,
    totalExpenses,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, updatedEntry, { merge: true });
  return updatedEntry;
}

/**
 * Deletes an expense item from a date entry
 */
export async function deleteExpenseItemFromDate(
  uid: string,
  dateKey: string,
  expenseItemId: string
): Promise<DailyMoneyEntry> {
  const docRef = getExpenseEntryDocRef(uid, dateKey);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Entry not found');
  }

  const existing = snap.data() as DailyMoneyEntry;
  const updatedExpenses = (existing.expenses || []).filter((e) => e.id !== expenseItemId);
  const totalExpenses = updatedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const updatedEntry: DailyMoneyEntry = {
    ...existing,
    expenses: updatedExpenses,
    totalExpenses,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, updatedEntry, { merge: true });
  return updatedEntry;
}

/**
 * Deletes a full date entry
 */
export async function deleteDailyMoneyEntry(uid: string, dateKey: string): Promise<void> {
  const docRef = getExpenseEntryDocRef(uid, dateKey);
  await deleteDoc(docRef);
}

/**
 * Deletes all money savings and expense entries for a user
 */
export async function deleteAllExpenseEntries(uid: string): Promise<void> {
  const colRef = getExpenseEntriesCollectionRef(uid);
  const snap = await getDocs(colRef);
  const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);
}

/**
 * Loads user expense settings
 */
export async function getExpenseTrackerSettings(uid: string): Promise<ExpenseTrackerSettings> {
  const docRef = getExpenseSettingsDocRef(uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...DEFAULT_EXPENSE_SETTINGS, ...snap.data() };
  }
  return DEFAULT_EXPENSE_SETTINGS;
}

/**
 * Updates user expense settings
 */
export async function updateExpenseTrackerSettings(
  uid: string,
  settings: Partial<ExpenseTrackerSettings>
): Promise<ExpenseTrackerSettings> {
  const docRef = getExpenseSettingsDocRef(uid);
  const existing = await getExpenseTrackerSettings(uid);
  const merged: ExpenseTrackerSettings = {
    ...existing,
    ...settings,
  };
  await setDoc(docRef, merged, { merge: true });
  return merged;
}

/**
 * Seeds sample reference data matching the Google Notes screenshot
 * (e.g. August 01/08 to 26/08 with ₹25/day and expenses on 09/08, 12/08, 17/08)
 */
export async function seedGoogleNotesSampleData(uid: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const sampleEntries: Record<string, DailyMoneyEntry> = {};

  // Starting balance setup
  await updateExpenseTrackerSettings(uid, {
    startingBalance: 75, // July carryover of 75
    currencySymbol: '₹',
    defaultDailySavings: 25,
    title: 'MONEY SAVINGS',
    noteTheme: 'night_sky',
  });

  // August entries: 01 to 26
  for (let d = 1; d <= 26; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `2026-08-${dayStr}`;
    const displayDate = `${dayStr}/08`;

    let expenses: ExpenseItem[] = [];

    if (d === 9) {
      expenses = [{ id: 'exp_09_1', amount: 100, description: 'Cloth Alter & Other' }];
    } else if (d === 12) {
      expenses = [{ id: 'exp_12_1', amount: 100, description: 'Interview' }];
    } else if (d === 17) {
      expenses = [
        { id: 'exp_17_1', amount: 100, description: 'Canteen' },
        { id: 'exp_17_2', amount: 100, description: 'income Certificate' },
        { id: 'exp_17_3', amount: 100, description: 'Sadaqah Amount' },
      ];
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    sampleEntries[dateKey] = {
      id: dateKey,
      dateKey,
      displayDate,
      savingsAmount: 25,
      expenses,
      totalExpenses,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  // July entries: 01 to 02
  sampleEntries['2026-07-01'] = {
    id: '2026-07-01',
    dateKey: '2026-07-01',
    displayDate: '01/07',
    savingsAmount: 25,
    expenses: [],
    totalExpenses: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  sampleEntries['2026-07-02'] = {
    id: '2026-07-02',
    dateKey: '2026-07-02',
    displayDate: '02/07',
    savingsAmount: 25,
    expenses: [],
    totalExpenses: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await batchSaveDailyMoneyEntries(uid, sampleEntries);
}
