import { describe, it, expect, vi, beforeAll } from 'vitest';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import { Habit } from '../types/habit';
import { UserProfile } from '../types/auth';
import { DailyLedgerRow, MonthExpenseSummary } from '../types/expense';

beforeAll(() => {
  // @ts-ignore
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  // @ts-ignore
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('Advanced Export Utils', () => {
  const mockProfile: UserProfile = {
    uid: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    photoURL: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastLoginAt: '2026-08-29T00:00:00.000Z',
    authProvider: 'google',
  };

  const mockHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Drink 3L Water',
      category: 'Diet & Nutrition',
      frequency: 'daily',
      goalCount: 3,
      color: '#006398',
      icon: 'water_drop',
      archived: false,
      sortOrder: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'h2',
      name: 'Morning Workout',
      category: 'Fitness',
      frequency: 'daily',
      goalCount: 1,
      color: '#10B981',
      icon: 'fitness_center',
      archived: false,
      sortOrder: 1,
      createdAt: '2026-08-10T00:00:00.000Z',
    },
  ];

  const mockExpenseRows: DailyLedgerRow[] = [
    {
      id: '2026-08-01',
      dateKey: '2026-08-01',
      displayDate: '01/08',
      savingsAmount: 50,
      cumulativeBalance: 100,
      expenses: [{ id: 'exp1', amount: 20, description: 'Snacks' }],
      totalExpenses: 20,
      isToday: false,
      monthKey: '2026-08',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const mockMonthSummaries: MonthExpenseSummary[] = [
    {
      monthKey: '2026-08',
      monthTitle: 'AUGUST 2026',
      monthShortTitle: 'Aug 2026',
      startingBalance: 50,
      totalSavings: 1500,
      totalExpenses: 200,
      netSavings: 1300,
      endingBalance: 1350,
      rows: mockExpenseRows,
    },
  ];

  it('runs exportToExcel with advanced multi-section dataset without crashing', () => {
    expect(() => {
      exportToExcel({
        profile: mockProfile,
        habits: mockHabits,
        habitMetricsMap: {
          h1: { streakCount: 14, longestStreak: 21, totalCompletions: 45, isShieldActive: true },
          h2: { streakCount: 5, longestStreak: 10, totalCompletions: 12, isShieldActive: false },
        },
        expenseRows: mockExpenseRows,
        monthSummaries: mockMonthSummaries,
        totalCumulativeSavings: 1350,
        expenseSettings: { currencySymbol: '₹', defaultDailySavings: 50, title: 'MONEY SAVINGS', startingBalance: 50, noteTheme: 'night_sky' },
      });
    }).not.toThrow();
  });

  it('runs exportToJSON with advanced multi-section dataset without crashing', () => {
    expect(() => {
      exportToJSON({
        profile: mockProfile,
        habits: mockHabits,
        habitMetricsMap: {
          h1: { streakCount: 14, longestStreak: 21, totalCompletions: 45, isShieldActive: true },
        },
        expenseRows: mockExpenseRows,
        monthSummaries: mockMonthSummaries,
        totalCumulativeSavings: 1350,
        expenseSettings: { currencySymbol: '₹', defaultDailySavings: 50, title: 'MONEY SAVINGS', startingBalance: 50, noteTheme: 'night_sky' },
      });
    }).not.toThrow();
  });
});
