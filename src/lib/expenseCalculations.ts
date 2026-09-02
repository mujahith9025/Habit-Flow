import { DailyMoneyEntry, DailyLedgerRow, MonthExpenseSummary } from '../types/expense';

const MONTH_NAMES_FULL = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface ExpenseCategoryDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: '#F59E0B', bgLight: 'rgba(245, 158, 11, 0.15)' },
  { id: 'shopping', label: 'Shopping & Apparel', icon: 'shopping_bag', color: '#EC4899', bgLight: 'rgba(236, 72, 153, 0.15)' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'bolt', color: '#3B82F6', bgLight: 'rgba(59, 130, 246, 0.15)' },
  { id: 'travel', label: 'Travel & Transport', icon: 'directions_car', color: '#10B981', bgLight: 'rgba(16, 185, 129, 0.15)' },
  { id: 'education', label: 'Education & Career', icon: 'school', color: '#8B5CF6', bgLight: 'rgba(139, 92, 246, 0.15)' },
  { id: 'charity', label: 'Charity & Sadaqah', icon: 'volunteer_activism', color: '#14B8A6', bgLight: 'rgba(20, 184, 166, 0.15)' },
  { id: 'health', label: 'Health & Medical', icon: 'favorite', color: '#EF4444', bgLight: 'rgba(239, 68, 68, 0.15)' },
  { id: 'other', label: 'General & Other', icon: 'category', color: '#6B7280', bgLight: 'rgba(107, 114, 128, 0.15)' },
];

/**
 * Smart Category Inferer: Matches keywords or explicit category IDs
 */
export function inferExpenseCategory(description: string, explicitCategory?: string): ExpenseCategoryDef {
  if (explicitCategory) {
    const found = EXPENSE_CATEGORIES.find(
      (c) => c.id === explicitCategory || c.label.toLowerCase() === explicitCategory.toLowerCase()
    );
    if (found) return found;
  }

  const d = (description || '').toLowerCase();
  if (
    d.includes('food') ||
    d.includes('canteen') ||
    d.includes('grocer') ||
    d.includes('snack') ||
    d.includes('dinner') ||
    d.includes('lunch') ||
    d.includes('tea') ||
    d.includes('coffee') ||
    d.includes('breakfast') ||
    d.includes('hotel')
  ) {
    return EXPENSE_CATEGORIES[0]; // Food & Dining
  }
  if (
    d.includes('cloth') ||
    d.includes('alter') ||
    d.includes('dress') ||
    d.includes('shop') ||
    d.includes('shoe') ||
    d.includes('shirt') ||
    d.includes('pant') ||
    d.includes('wear')
  ) {
    return EXPENSE_CATEGORIES[1]; // Shopping & Apparel
  }
  if (
    d.includes('bill') ||
    d.includes('elect') ||
    d.includes('recharge') ||
    d.includes('mobile') ||
    d.includes('wifi') ||
    d.includes('certif') ||
    d.includes('tax') ||
    d.includes('income')
  ) {
    return EXPENSE_CATEGORIES[2]; // Bills & Utilities
  }
  if (
    d.includes('travel') ||
    d.includes('petrol') ||
    d.includes('fuel') ||
    d.includes('bus') ||
    d.includes('train') ||
    d.includes('auto') ||
    d.includes('cab') ||
    d.includes('uber') ||
    d.includes('bike')
  ) {
    return EXPENSE_CATEGORIES[3]; // Travel & Transport
  }
  if (
    d.includes('interview') ||
    d.includes('course') ||
    d.includes('book') ||
    d.includes('study') ||
    d.includes('exam') ||
    d.includes('class') ||
    d.includes('college') ||
    d.includes('school')
  ) {
    return EXPENSE_CATEGORIES[4]; // Education & Career
  }
  if (
    d.includes('sadaqah') ||
    d.includes('charity') ||
    d.includes('donation') ||
    d.includes('zakat') ||
    d.includes('help') ||
    d.includes('poor')
  ) {
    return EXPENSE_CATEGORIES[5]; // Charity & Sadaqah
  }
  if (
    d.includes('medic') ||
    d.includes('doctor') ||
    d.includes('pharma') ||
    d.includes('hospital') ||
    d.includes('tablet') ||
    d.includes('health')
  ) {
    return EXPENSE_CATEGORIES[6]; // Health & Medical
  }
  return EXPENSE_CATEGORIES[7]; // General & Other
}

export interface CategoryExpenseBreakdown {
  category: ExpenseCategoryDef;
  totalAmount: number;
  count: number;
  percentage: number;
}

/**
 * Aggregates all expenses into categorized groups with totals, item counts, and percentage share
 */
export function aggregateExpensesByCategory(rows: DailyLedgerRow[]): CategoryExpenseBreakdown[] {
  const categoryMap: Record<string, { totalAmount: number; count: number; category: ExpenseCategoryDef }> = {};

  EXPENSE_CATEGORIES.forEach((c) => {
    categoryMap[c.id] = { totalAmount: 0, count: 0, category: c };
  });

  let grandTotal = 0;

  rows.forEach((r) => {
    (r.expenses || []).forEach((e) => {
      const cat = inferExpenseCategory(e.description, e.category);
      const amt = Number(e.amount) || 0;
      categoryMap[cat.id].totalAmount += amt;
      categoryMap[cat.id].count += 1;
      grandTotal += amt;
    });
  });

  return Object.values(categoryMap)
    .filter((item) => item.totalAmount > 0 || item.count > 0)
    .map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? Math.round((item.totalAmount / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Format a YYYY-MM-DD date key into DD/MM (e.g., '2026-08-01' -> '01/08')
 */
export function formatDayMonth(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length === 3) {
    const [, mm, dd] = parts;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}`;
  }
  return dateKey;
}

/**
 * Format an amount with currency symbol (e.g. 25 -> '₹25', 1250 -> '₹1,250')
 */
export function formatMoney(amount: number | null | undefined, symbol: string = '₹'): string {
  const num = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const formattedNumber = Math.abs(num).toLocaleString('en-IN');
  const sign = num < 0 ? '-' : '';
  return `${sign}${symbol}${formattedNumber}`;
}

/**
 * Format expenses note string for daily ledger display
 * e.g., "( ₹ 100 - Cloth Alter & Other )" or "( ₹ 100 - Canteen , ₹ 100 - income Certificate , ₹ 100 - Sadaqah Amount )"
 */
export function formatExpensesSummary(
  expenses: { amount: number; description: string; category?: string }[],
  symbol: string = '₹'
): string {
  if (!expenses || expenses.length === 0) return '';
  
  const itemsStr = expenses
    .map((e) => `${symbol} ${e.amount.toLocaleString('en-IN')} - ${e.description.trim()}`)
    .join(' , ');

  return `( ${itemsStr} )`;
}

/**
 * Calculates continuous running cumulative balance for all entries chronologically.
 * Formula: Cumulative_i = Cumulative_(i-1) + Savings_i - Expenses_i
 */
export function calculateCumulativeLedgerRows(
  entriesMap: Record<string, DailyMoneyEntry>,
  startingBalance: number = 0,
  todayKey?: string
): DailyLedgerRow[] {
  const sortedDateKeys = Object.keys(entriesMap).sort(); // chronological: '2026-07-01' -> '2026-08-31'
  
  let currentCumulative = startingBalance;
  const ledgerRows: DailyLedgerRow[] = [];

  for (const dateKey of sortedDateKeys) {
    const entry = entriesMap[dateKey];
    const totalExpenses = (entry.expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const savingsAmount = Number(entry.savingsAmount) || 0;

    // Update running cumulative balance
    currentCumulative = currentCumulative + savingsAmount - totalExpenses;

    const parts = dateKey.split('-');
    const monthKey = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : dateKey.substring(0, 7);

    ledgerRows.push({
      ...entry,
      savingsAmount,
      totalExpenses,
      cumulativeBalance: currentCumulative,
      monthKey,
      isToday: Boolean(todayKey && dateKey === todayKey),
    });
  }

  return ledgerRows;
}

/**
 * Groups ledger rows into chronological monthly summaries with clean monthly titles
 * (e.g. 'AUGUST 2026', 'JULY MONTH')
 */
export function groupLedgerByMonth(
  rows: DailyLedgerRow[],
  initialStartingBalance: number = 0
): MonthExpenseSummary[] {
  const monthMap: Record<string, DailyLedgerRow[]> = {};

  rows.forEach((row) => {
    if (!monthMap[row.monthKey]) {
      monthMap[row.monthKey] = [];
    }
    monthMap[row.monthKey].push(row);
  });

  const sortedMonthKeys = Object.keys(monthMap).sort().reverse(); // newest month first
  let runningStart = initialStartingBalance;

  const summaries: MonthExpenseSummary[] = [];

  // Sort ascending first to get accurate starting & ending balance per month
  const ascMonthKeys = Object.keys(monthMap).sort();
  const monthStartingBalances: Record<string, number> = {};

  ascMonthKeys.forEach((mKey) => {
    monthStartingBalances[mKey] = runningStart;
    const mRows = monthMap[mKey];
    const mSavings = mRows.reduce((sum, r) => sum + r.savingsAmount, 0);
    const mExpenses = mRows.reduce((sum, r) => sum + r.totalExpenses, 0);
    runningStart = runningStart + mSavings - mExpenses;
  });

  sortedMonthKeys.forEach((mKey) => {
    const mRows = monthMap[mKey];
    const [yearStr, monthStr] = mKey.split('-');
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;

    const monthFullName = MONTH_NAMES_FULL[monthIdx] || 'MONTH';
    const monthShortName = MONTH_NAMES_SHORT[monthIdx] || 'Mon';

    const monthTitle = `${monthFullName} ${year}`;
    const monthShortTitle = `${monthShortName} ${year}`;

    const totalSavings = mRows.reduce((sum, r) => sum + r.savingsAmount, 0);
    const totalExpenses = mRows.reduce((sum, r) => sum + r.totalExpenses, 0);
    const netSavings = totalSavings - totalExpenses;
    const startBal = monthStartingBalances[mKey] ?? 0;
    const endingBalance = startBal + netSavings;

    summaries.push({
      monthKey: mKey,
      monthTitle,
      monthShortTitle,
      totalSavings,
      totalExpenses,
      netSavings,
      startingBalance: startBal,
      endingBalance,
      rows: mRows,
    });
  });

  return summaries;
}

/**
 * Generates initial boilerplate days for a given month with default daily savings.
 * If upToDay is provided, it generates days from 1 up to upToDay (inclusive).
 * For the current month, it automatically stops at today's day (e.g. Day 1 to Day 27).
 */
export function generateMonthTemplateEntries(
  year: number,
  month: number, // 0-indexed: 0 = Jan, 7 = Aug
  defaultDailySavings: number = 25,
  upToDay?: number
): Record<string, DailyMoneyEntry> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const maxDay = upToDay !== undefined ? Math.min(Math.max(1, upToDay), daysInMonth) : daysInMonth;
  const entries: Record<string, DailyMoneyEntry> = {};
  const monthStr = String(month + 1).padStart(2, '0');

  const nowIso = new Date().toISOString();

  for (let d = 1; d <= maxDay; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const displayDate = `${dayStr}/${monthStr}`;

    entries[dateKey] = {
      id: dateKey,
      dateKey,
      displayDate,
      savingsAmount: defaultDailySavings,
      expenses: [],
      totalExpenses: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  return entries;
}

/**
 * Generates missing entries between the earliest recorded date and today.
 * Ensures the ledger continuously progresses each day at midnight and seamlessly transitions across months.
 */
export function generateMissingDaysUpToToday(
  existingDateKeys: string[],
  defaultDailySavings: number = 25,
  today: Date = new Date()
): Record<string, DailyMoneyEntry> {
  if (existingDateKeys.length === 0) {
    return {};
  }

  const sortedKeys = [...existingDateKeys].sort();
  const earliestDateKey = sortedKeys[0]; // e.g. '2026-08-01'
  const [startYear, startMonth, startDay] = earliestDateKey.split('-').map(Number);
  const startDate = new Date(startYear, startMonth - 1, startDay);

  const entriesToCreate: Record<string, DailyMoneyEntry> = {};
  const existingSet = new Set(existingDateKeys);
  const nowIso = new Date().toISOString();

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  while (cursor <= todayMidnight) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    if (!existingSet.has(dateKey)) {
      entriesToCreate[dateKey] = {
        id: dateKey,
        dateKey,
        displayDate: `${d}/${m}`,
        savingsAmount: defaultDailySavings,
        expenses: [],
        totalExpenses: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return entriesToCreate;
}
