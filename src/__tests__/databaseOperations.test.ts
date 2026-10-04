import { describe, it, expect } from 'vitest';
import { Habit, HabitEntry, UserProfile } from '../types';
import { DailyMoneyEntry, ExpenseTrackerSettings } from '../types/expense';
import { getMonthKey, getWeekOfMonth } from '../lib/firebase/habitService';
import { DEFAULT_EXPENSE_SETTINGS } from '../lib/firebase/expenseService';
import { calculateCumulativeLedgerRows, groupLedgerByMonth, generateMissingDaysUpToToday } from '../lib/expenseCalculations';

describe('Comprehensive Firestore Database Layer & Schema Validation', () => {
  const mockUid = 'test-user-firebase-777';

  it('verifies User Profile data structure and fields', () => {
    const userProfile: UserProfile = {
      uid: mockUid,
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      photoURL: 'https://example.com/avatar.jpg',
      createdAt: '2026-08-01T00:00:00.000Z',
      lastLoginAt: '2026-08-20T10:00:00.000Z',
      authProvider: 'google',
      themePreference: 'light',
    };

    expect(userProfile.uid).toBe(mockUid);
    expect(userProfile.email).toBe('sarah@example.com');
    expect(userProfile.authProvider).toBe('google');
    expect(userProfile.createdAt).toBeDefined();
  });

  it('verifies Habit schema integrity, exclusions, and date helpers', () => {
    const habit: Habit = {
      id: 'habit_abc123',
      name: 'Hydration 2L Daily',
      category: 'Health',
      icon: 'water_drop',
      color: '#006398',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      archived: false,
      sortOrder: 0,
      startMonth: '2026-08',
      excludedMonths: ['2026-06'],
    };

    expect(habit.id).toBe('habit_abc123');
    expect(habit.frequency).toBe('daily');
    expect(habit.archived).toBe(false);
    expect(habit.excludedMonths).toContain('2026-06');

    // Date helper checks
    expect(getMonthKey('2026-08-19')).toBe('2026-08');
    expect(getWeekOfMonth('2026-08-01')).toBeGreaterThanOrEqual(1);
    expect(getWeekOfMonth('2026-08-20')).toBeGreaterThanOrEqual(3);
  });

  it('verifies Habit Entry check-in, reflection notes, mood, and tag schema', () => {
    const entry: HabitEntry = {
      date: '2026-08-20',
      completed: true,
      weekOfMonth: 3,
      monthKey: '2026-08',
      updatedAt: '2026-08-20T08:30:00.000Z',
      note: 'Felt calm and present.',
      mood: 'calm',
      tags: ['morning', 'mindfulness'],
    };

    expect(entry.date).toBe('2026-08-20');
    expect(entry.completed).toBe(true);
    expect(entry.note).toBe('Felt calm and present.');
    expect(entry.mood).toBe('calm');
    expect(entry.tags).toHaveLength(2);
  });

  it('verifies Expense Tracker & Daily Money entries schema and calculations', () => {
    const dateKey = '2026-08-20';
    const entry: DailyMoneyEntry = {
      id: dateKey,
      dateKey,
      displayDate: '20/08',
      savingsAmount: 25,
      expenses: [
        { id: 'exp_1', amount: 15, description: 'Green Tea', category: 'Food & Dining', createdAt: '2026-08-20T10:00:00Z' },
        { id: 'exp_2', amount: 35, description: 'Notebook', category: 'Education & Books', createdAt: '2026-08-20T14:00:00Z' },
      ],
      totalExpenses: 50,
      notes: 'Study day',
      createdAt: '2026-08-20T00:00:00Z',
      updatedAt: '2026-08-20T15:00:00Z',
    };

    expect(entry.savingsAmount).toBe(25);
    expect(entry.expenses).toHaveLength(2);
    expect(entry.totalExpenses).toBe(50);

    // Ledger calculation
    const ledgerMap: Record<string, DailyMoneyEntry> = { [dateKey]: entry };
    const startingBalance = 100;
    const rows = calculateCumulativeLedgerRows(ledgerMap, startingBalance, dateKey);

    expect(rows).toHaveLength(1);
    // 100 + 25 - 50 = 75
    expect(rows[0].cumulativeBalance).toBe(75);
    expect(rows[0].savingsAmount - rows[0].totalExpenses).toBe(-25);

    const summaries = groupLedgerByMonth(rows, startingBalance);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].totalSavings).toBe(25);
    expect(summaries[0].totalExpenses).toBe(50);
    expect(summaries[0].endingBalance).toBe(75);
  });

  it('verifies Expense Settings default configuration', () => {
    const settings: ExpenseTrackerSettings = DEFAULT_EXPENSE_SETTINGS;
    expect(settings.currencySymbol).toBe('₹');
    expect(settings.defaultDailySavings).toBe(25);
    expect(settings.startingBalance).toBe(0);
    expect(settings.noteTheme).toBe('night_sky');
    expect(settings.title).toBe('MONEY SAVINGS');
  });

  it('verifies Auto-Progression of missing days generator up to current date', () => {
    const existingDateKeys = ['2026-08-01', '2026-08-02'];
    const mockToday = new Date('2026-08-05T12:00:00Z');
    const missingDays = generateMissingDaysUpToToday(existingDateKeys, 25, mockToday);

    const missingKeys = Object.keys(missingDays);
    expect(missingKeys).toContain('2026-08-03');
    expect(missingKeys).toContain('2026-08-04');
    expect(missingKeys).toContain('2026-08-05');
    expect(missingKeys).not.toContain('2026-08-01');
    expect(missingDays['2026-08-03'].savingsAmount).toBe(25);
  });
});
