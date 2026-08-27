import { useState, useEffect, useMemo, useCallback } from 'react';
import { onSnapshot, getExpenseEntriesCollectionRef, getExpenseSettingsDocRef } from '../lib/firebase';
import { useAuth } from './useAuth';
import {
  DailyMoneyEntry,
  DailyLedgerRow,
  ExpenseTrackerSettings,
  ExpenseItem,
  MonthExpenseSummary,
} from '../types/expense';
import {
  calculateCumulativeLedgerRows,
  groupLedgerByMonth,
  generateMonthTemplateEntries,
  generateMissingDaysUpToToday,
} from '../lib/expenseCalculations';
import {
  DEFAULT_EXPENSE_SETTINGS,
  saveDailyMoneyEntry as saveDailyMoneyEntryService,
  batchSaveDailyMoneyEntries as batchSaveDailyMoneyEntriesService,
  addExpenseItemToDate as addExpenseItemToDateService,
  deleteExpenseItemFromDate as deleteExpenseItemFromDateService,
  deleteDailyMoneyEntry as deleteDailyMoneyEntryService,
  deleteAllExpenseEntries as deleteAllExpenseEntriesService,
  updateExpenseTrackerSettings as updateExpenseTrackerSettingsService,
  seedGoogleNotesSampleData as seedGoogleNotesSampleDataService,
} from '../lib/firebase/expenseService';
import { formatDateKey } from './useDashboardMetrics';

export interface UseExpenseTrackerResult {
  entriesMap: Record<string, DailyMoneyEntry>;
  allLedgerRows: DailyLedgerRow[];
  monthSummaries: MonthExpenseSummary[];
  activeSummary: MonthExpenseSummary | null;
  activeRows: DailyLedgerRow[];
  selectedMonthKey: string;
  setSelectedMonthKey: (mKey: string) => void;
  settings: ExpenseTrackerSettings;
  loading: boolean;
  totalCurrentBalance: number;
  totalAllTimeSavings: number;
  totalAllTimeExpenses: number;
  netAllTimeGrowth: number;
  saveDailyEntry: (dateKey: string, data: Partial<DailyMoneyEntry>) => Promise<DailyMoneyEntry | void>;
  addExpenseItem: (dateKey: string, item: Omit<ExpenseItem, 'id' | 'createdAt'>) => Promise<DailyMoneyEntry | void>;
  deleteExpenseItem: (dateKey: string, expenseItemId: string) => Promise<DailyMoneyEntry | void>;
  deleteDayEntry: (dateKey: string) => Promise<void>;
  deleteAllEntries: () => Promise<void>;
  updateSettings: (updates: Partial<ExpenseTrackerSettings>) => Promise<void>;
  autoFillMonth: (
    year: number,
    month: number,
    defaultSavings?: number,
    upToDay?: number
  ) => Promise<void>;
  seedSampleData: () => Promise<void>;
}

export function useExpenseTracker(initialMonthKey?: string): UseExpenseTrackerResult {
  const { user } = useAuth();
  const today = new Date();
  const todayKey = formatDateKey(today);

  const [entriesMap, setEntriesMap] = useState<Record<string, DailyMoneyEntry>>({});
  const [settings, setSettings] = useState<ExpenseTrackerSettings>(DEFAULT_EXPENSE_SETTINGS);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(initialMonthKey || 'all');
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Subscribe to Firestore Settings Document
  useEffect(() => {
    if (!user?.uid) {
      setSettings(DEFAULT_EXPENSE_SETTINGS);
      return;
    }

    const settingsRef = getExpenseSettingsDocRef(user.uid);
    const unsubSettings = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings({ ...DEFAULT_EXPENSE_SETTINGS, ...docSnap.data() });
        }
      },
      (err) => {
        console.warn('Expense settings listener error:', err);
      }
    );

    return () => unsubSettings();
  }, [user?.uid]);

  // 2. Subscribe to Firestore Expense Entries Collection
  useEffect(() => {
    if (!user?.uid) {
      setEntriesMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = getExpenseEntriesCollectionRef(user.uid);

    const unsubEntries = onSnapshot(
      colRef,
      (snapshot) => {
        const map: Record<string, DailyMoneyEntry> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DailyMoneyEntry;
          map[data.dateKey] = data;
        });

        setEntriesMap(map);
        setLoading(false);
      },
      (err) => {
        console.error('Expense entries snapshot listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubEntries();
  }, [user?.uid]);

  // 3. Auto-Progress Daily Savings up to Current Date/Time & at Midnight (12:00 AM)
  useEffect(() => {
    if (!user?.uid || loading) return;

    const existingKeys = Object.keys(entriesMap);
    if (existingKeys.length === 0) return; // Don't auto-create if ledger is empty/cleared

    const checkAndSyncDays = async () => {
      const now = new Date();
      const missingEntries = generateMissingDaysUpToToday(
        Object.keys(entriesMap),
        settings.defaultDailySavings,
        now
      );

      const missingKeys = Object.keys(missingEntries);
      if (missingKeys.length > 0) {
        try {
          await batchSaveDailyMoneyEntriesService(user.uid, missingEntries);
        } catch (err) {
          console.warn('[ExpenseTracker] Auto-progression save error:', err);
        }
      }
    };

    // Initial check when entries are loaded
    checkAndSyncDays();

    // Schedule trigger for the next midnight (12:00:01 AM)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

    const midnightTimer = setTimeout(() => {
      checkAndSyncDays();
    }, msUntilMidnight);

    // Also run check when user switches back to tab or device wakes up
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkAndSyncDays();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [user?.uid, loading, entriesMap, settings.defaultDailySavings]);

  // 4. Continuous Cumulative Ledger Calculation
  const allLedgerRows = useMemo(() => {
    return calculateCumulativeLedgerRows(entriesMap, settings.startingBalance, todayKey);
  }, [entriesMap, settings.startingBalance, todayKey]);

  // 5. Monthly Summaries Grouping
  const monthSummaries = useMemo(() => {
    return groupLedgerByMonth(allLedgerRows, settings.startingBalance);
  }, [allLedgerRows, settings.startingBalance]);

  // 5. Total Balance, Total Savings, Total Expenses
  const { totalAllTimeSavings, totalAllTimeExpenses, totalCurrentBalance, netAllTimeGrowth } = useMemo(() => {
    let savings = 0;
    let expenses = 0;

    allLedgerRows.forEach((r) => {
      savings += r.savingsAmount;
      expenses += r.totalExpenses;
    });

    const currentBal =
      allLedgerRows.length > 0
        ? allLedgerRows[allLedgerRows.length - 1].cumulativeBalance
        : settings.startingBalance;

    const netGrowth = savings - expenses;

    return {
      totalAllTimeSavings: savings,
      totalAllTimeExpenses: expenses,
      totalCurrentBalance: currentBal,
      netAllTimeGrowth: netGrowth,
    };
  }, [allLedgerRows, settings.startingBalance]);

  // 6. Active Filtered Rows based on selectedMonthKey ('all' or 'YYYY-MM')
  const { activeRows, activeSummary } = useMemo(() => {
    if (selectedMonthKey === 'all') {
      return {
        activeRows: allLedgerRows,
        activeSummary: null,
      };
    }

    const summary = monthSummaries.find((s) => s.monthKey === selectedMonthKey) || null;
    const filteredRows = allLedgerRows.filter((r) => r.monthKey === selectedMonthKey);

    return {
      activeRows: filteredRows,
      activeSummary: summary,
    };
  }, [allLedgerRows, monthSummaries, selectedMonthKey]);

  // 7. Actions with Optimistic Updates
  const saveDailyEntry = useCallback(
    async (dateKey: string, data: Partial<DailyMoneyEntry>) => {
      if (!user?.uid) return;
      return await saveDailyMoneyEntryService(user.uid, dateKey, data);
    },
    [user?.uid]
  );

  const addExpenseItem = useCallback(
    async (dateKey: string, item: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
      if (!user?.uid) return;
      return await addExpenseItemToDateService(user.uid, dateKey, item);
    },
    [user?.uid]
  );

  const deleteExpenseItem = useCallback(
    async (dateKey: string, expenseItemId: string) => {
      if (!user?.uid) return;
      return await deleteExpenseItemFromDateService(user.uid, dateKey, expenseItemId);
    },
    [user?.uid]
  );

  const deleteDayEntry = useCallback(
    async (dateKey: string) => {
      if (!user?.uid) return;
      await deleteDailyMoneyEntryService(user.uid, dateKey);
    },
    [user?.uid]
  );

  const deleteAllEntries = useCallback(
    async () => {
      if (!user?.uid) return;
      await deleteAllExpenseEntriesService(user.uid);
    },
    [user?.uid]
  );

  const updateSettings = useCallback(
    async (updates: Partial<ExpenseTrackerSettings>) => {
      if (!user?.uid) return;
      const updated = await updateExpenseTrackerSettingsService(user.uid, updates);
      setSettings(updated);
    },
    [user?.uid]
  );

  const autoFillMonth = useCallback(
    async (
      year: number,
      month: number,
      defaultSavings: number = settings.defaultDailySavings,
      upToDay?: number
    ) => {
      if (!user?.uid) return;
      const now = new Date();
      // If filling current month and upToDay is not explicitly passed, automatically stop at today!
      const targetUpToDay =
        upToDay !== undefined
          ? upToDay
          : year === now.getFullYear() && month === now.getMonth()
          ? now.getDate()
          : undefined;

      const template = generateMonthTemplateEntries(year, month, defaultSavings, targetUpToDay);
      await batchSaveDailyMoneyEntriesService(user.uid, template);
    },
    [user?.uid, settings.defaultDailySavings]
  );

  const seedSampleData = useCallback(async () => {
    if (!user?.uid) return;
    await seedGoogleNotesSampleDataService(user.uid);
  }, [user?.uid]);

  return {
    entriesMap,
    allLedgerRows,
    monthSummaries,
    activeSummary,
    activeRows,
    selectedMonthKey,
    setSelectedMonthKey,
    settings,
    loading,
    totalCurrentBalance,
    totalAllTimeSavings,
    totalAllTimeExpenses,
    netAllTimeGrowth,
    saveDailyEntry,
    addExpenseItem,
    deleteExpenseItem,
    deleteDayEntry,
    deleteAllEntries,
    updateSettings,
    autoFillMonth,
    seedSampleData,
  };
}
