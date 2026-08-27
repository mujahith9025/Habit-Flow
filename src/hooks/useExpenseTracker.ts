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
  autoFillMonth: (year: number, month: number, defaultSavings?: number) => Promise<void>;
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

  // 3. Continuous Cumulative Ledger Calculation
  const allLedgerRows = useMemo(() => {
    return calculateCumulativeLedgerRows(entriesMap, settings.startingBalance, todayKey);
  }, [entriesMap, settings.startingBalance, todayKey]);

  // 4. Monthly Summaries Grouping
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
    async (year: number, month: number, defaultSavings: number = settings.defaultDailySavings) => {
      if (!user?.uid) return;
      const template = generateMonthTemplateEntries(year, month, defaultSavings);
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
