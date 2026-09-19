import {
  getDoc,
  getDocs,
  setDoc,
  getUserDocRef,
  getHabitsCollectionRef,
  getHabitDocRef,
  getEntriesCollectionRef,
  getEntryDocRef,
  getExpenseEntriesCollectionRef,
  getExpenseEntryDocRef,
  getExpenseSettingsDocRef,
} from './firestore';
import { Habit, HabitEntry, UserProfile, DailyMoneyEntry, ExpenseTrackerSettings } from '../../types';

export interface FullAccountBackupPayload {
  app: 'HabitFlow';
  version: '2.0.0';
  exportedAt: string;
  user: {
    uid: string;
    profile?: Partial<UserProfile>;
  };
  summary: {
    totalHabits: number;
    totalHabitEntries: number;
    totalExpenseEntries: number;
  };
  habits: Habit[];
  habitEntriesByHabit: Record<string, HabitEntry[]>;
  expenseEntries: DailyMoneyEntry[];
  expenseSettings: ExpenseTrackerSettings;
}

/**
 * Downloads a complete full-account JSON backup of all user habits, check-ins, financial records, and settings
 */
export async function exportFullAccountBackup(uid: string): Promise<FullAccountBackupPayload> {
  // 1. Fetch User Profile
  const userDocSnap = await getDoc(getUserDocRef(uid));
  const userProfile = userDocSnap.exists() ? userDocSnap.data() : undefined;

  // 2. Fetch All Habits
  const habitsSnap = await getDocs(getHabitsCollectionRef(uid));
  const habits: Habit[] = habitsSnap.docs.map((d) => d.data());

  // 3. Fetch All Habit Entries across all habits
  const habitEntriesByHabit: Record<string, HabitEntry[]> = {};
  let totalHabitEntriesCount = 0;

  for (const habit of habits) {
    const entriesSnap = await getDocs(getEntriesCollectionRef(uid, habit.id));
    const entries: HabitEntry[] = entriesSnap.docs.map((d) => d.data());
    habitEntriesByHabit[habit.id] = entries;
    totalHabitEntriesCount += entries.length;
  }

  // 4. Fetch All Expense Entries
  const expenseSnap = await getDocs(getExpenseEntriesCollectionRef(uid));
  const expenseEntries: DailyMoneyEntry[] = expenseSnap.docs.map((d) => d.data());

  // 5. Fetch Expense Settings
  const settingsSnap = await getDoc(getExpenseSettingsDocRef(uid));
  const expenseSettings: ExpenseTrackerSettings = settingsSnap.exists()
    ? settingsSnap.data()
    : {
        currencySymbol: '₹',
        defaultDailySavings: 25,
        startingBalance: 0,
        noteTheme: 'night_sky',
        title: 'MONEY SAVINGS',
      };

  const backupPayload: FullAccountBackupPayload = {
    app: 'HabitFlow',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    user: {
      uid,
      profile: userProfile,
    },
    summary: {
      totalHabits: habits.length,
      totalHabitEntries: totalHabitEntriesCount,
      totalExpenseEntries: expenseEntries.length,
    },
    habits,
    habitEntriesByHabit,
    expenseEntries,
    expenseSettings,
  };

  // Trigger file download
  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().split('T')[0];
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `habitflow_full_backup_${dateStamp}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);

  return backupPayload;
}

/**
 * Validates and restores a full-account JSON backup into Firestore
 */
export async function importFullAccountBackup(
  uid: string,
  backup: FullAccountBackupPayload,
  onProgress?: (progressText: string) => void
): Promise<{ success: boolean; importedHabits: number; importedEntries: number; importedExpenses: number }> {
  if (!backup || backup.app !== 'HabitFlow') {
    throw new Error('Invalid backup file. The uploaded file is not a valid HabitFlow backup.');
  }

  const { habits = [], habitEntriesByHabit = {}, expenseEntries = [], expenseSettings } = backup;
  let totalEntriesImported = 0;

  // 1. Restore Habits
  onProgress?.(`Restoring ${habits.length} habits...`);
  for (const habit of habits) {
    if (habit.id && habit.name) {
      const habitRef = getHabitDocRef(uid, habit.id);
      await setDoc(habitRef, habit, { merge: true });
    }
  }

  // 2. Restore Habit Entries
  onProgress?.('Restoring habit completion history...');
  for (const [habitId, entries] of Object.entries(habitEntriesByHabit)) {
    for (const entry of entries) {
      if (entry.date) {
        const entryRef = getEntryDocRef(uid, habitId, entry.date);
        await setDoc(entryRef, entry, { merge: true });
        totalEntriesImported++;
      }
    }
  }

  // 3. Restore Expense Entries
  onProgress?.(`Restoring ${expenseEntries.length} financial ledger records...`);
  for (const expEntry of expenseEntries) {
    if (expEntry.dateKey) {
      const expRef = getExpenseEntryDocRef(uid, expEntry.dateKey);
      await setDoc(expRef, expEntry, { merge: true });
    }
  }

  // 4. Restore Expense Settings
  if (expenseSettings) {
    onProgress?.('Restoring settings & preferences...');
    const settingsRef = getExpenseSettingsDocRef(uid);
    await setDoc(settingsRef, expenseSettings, { merge: true });
  }

  onProgress?.('Restore completed successfully!');
  return {
    success: true,
    importedHabits: habits.length,
    importedEntries: totalEntriesImported,
    importedExpenses: expenseEntries.length,
  };
}
