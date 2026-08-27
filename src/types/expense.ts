export interface ExpenseItem {
  id: string;
  amount: number;
  description: string;
  category?: string; // e.g., 'Cloth Alter & Other', 'Interview', 'Canteen', 'Sadaqah', 'General'
  createdAt?: string;
}

export interface DailyMoneyEntry {
  id: string; // dateKey: 'YYYY-MM-DD'
  dateKey: string; // 'YYYY-MM-DD'
  displayDate: string; // '01/08'
  savingsAmount: number; // e.g. 25
  expenses: ExpenseItem[];
  totalExpenses: number; // sum of expenses on this day
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLedgerRow extends DailyMoneyEntry {
  cumulativeBalance: number; // Running balance after this day's savings and expenses
  monthKey: string; // 'YYYY-MM'
  isToday?: boolean;
}

export type NoteThemeType = 'night_sky' | 'deep_blue' | 'charcoal_dark' | 'emerald_oasis' | 'warm_sand';

export interface ExpenseTrackerSettings {
  currencySymbol: string; // '₹' default
  defaultDailySavings: number; // 25 default
  startingBalance: number; // initial starting amount
  noteTheme: NoteThemeType;
  title: string; // 'MONEY SAVINGS' default
}

export interface MonthExpenseSummary {
  monthKey: string; // '2026-08'
  monthTitle: string; // 'AUGUST 2026' or 'JULY MONTH'
  monthShortTitle: string; // 'Aug 2026'
  totalSavings: number;
  totalExpenses: number;
  netSavings: number; // totalSavings - totalExpenses
  startingBalance: number;
  endingBalance: number;
  rows: DailyLedgerRow[];
}
