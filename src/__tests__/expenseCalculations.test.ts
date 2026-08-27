import { describe, it, expect } from 'vitest';
import {
  formatDayMonth,
  formatMoney,
  formatExpensesSummary,
  calculateCumulativeLedgerRows,
  groupLedgerByMonth,
  generateMonthTemplateEntries,
} from '../lib/expenseCalculations';
import { DailyMoneyEntry } from '../types/expense';

describe('Money Savings & Expense Calculations Engine', () => {
  it('formats date key to DD/MM format correctly', () => {
    expect(formatDayMonth('2026-08-01')).toBe('01/08');
    expect(formatDayMonth('2026-08-17')).toBe('17/08');
    expect(formatDayMonth('2026-07-26')).toBe('26/07');
  });

  it('formats money with currency symbols correctly', () => {
    expect(formatMoney(25, '₹')).toBe('₹25');
    expect(formatMoney(100, '₹')).toBe('₹100');
    expect(formatMoney(2450, '₹')).toBe('₹2,450');
    expect(formatMoney(-50, '₹')).toBe('-₹50');
  });

  it('formats Google Notes expense summary string matching reference', () => {
    const singleExpense = [{ amount: 100, description: 'Cloth Alter & Other' }];
    expect(formatExpensesSummary(singleExpense, '₹')).toBe('( ₹ 100 - Cloth Alter & Other )');

    const multiExpenses = [
      { amount: 100, description: 'Canteen' },
      { amount: 100, description: 'income Certificate' },
      { amount: 100, description: 'Sadaqah Amount' },
    ];
    expect(formatExpensesSummary(multiExpenses, '₹')).toBe(
      '( ₹ 100 - Canteen , ₹ 100 - income Certificate , ₹ 100 - Sadaqah Amount )'
    );
  });

  it('calculates exact running cumulative balance matching Google Notes screenshot', () => {
    // Starting with 75 carryover:
    // 01/08: 75 + 25 = 100
    // 02/08: 100 + 25 = 125
    // ...
    // 08/08: 250 + 25 = 275
    // 09/08: 275 + 25 - 100 = 200 (or if 100 deducted: cumulative 200)
    // 10/08: 200 + 25 = 225
    const mockEntries: Record<string, DailyMoneyEntry> = {
      '2026-08-01': {
        id: '2026-08-01',
        dateKey: '2026-08-01',
        displayDate: '01/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-02': {
        id: '2026-08-02',
        dateKey: '2026-08-02',
        displayDate: '02/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-03': {
        id: '2026-08-03',
        dateKey: '2026-08-03',
        displayDate: '03/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-04': {
        id: '2026-08-04',
        dateKey: '2026-08-04',
        displayDate: '04/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-05': {
        id: '2026-08-05',
        dateKey: '2026-08-05',
        displayDate: '05/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-06': {
        id: '2026-08-06',
        dateKey: '2026-08-06',
        displayDate: '06/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-07': {
        id: '2026-08-07',
        dateKey: '2026-08-07',
        displayDate: '07/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-08': {
        id: '2026-08-08',
        dateKey: '2026-08-08',
        displayDate: '08/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-09': {
        id: '2026-08-09',
        dateKey: '2026-08-09',
        displayDate: '09/08',
        savingsAmount: 25,
        expenses: [{ id: 'e1', amount: 100, description: 'Cloth Alter & Other' }],
        totalExpenses: 100,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-10': {
        id: '2026-08-10',
        dateKey: '2026-08-10',
        displayDate: '10/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
    };

    const startingBalance = 75; // Initial carryover
    const rows = calculateCumulativeLedgerRows(mockEntries, startingBalance);

    expect(rows[0].cumulativeBalance).toBe(100); // 75 + 25
    expect(rows[1].cumulativeBalance).toBe(125); // 100 + 25
    expect(rows[7].cumulativeBalance).toBe(275); // Day 8: 275
    expect(rows[8].cumulativeBalance).toBe(200); // Day 9: 275 + 25 - 100 = 200
    expect(rows[9].cumulativeBalance).toBe(225); // Day 10: 200 + 25 = 225
  });

  it('handles multi-item expense deduction on a single date', () => {
    const mockEntries: Record<string, DailyMoneyEntry> = {
      '2026-08-16': {
        id: '2026-08-16',
        dateKey: '2026-08-16',
        displayDate: '16/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-17': {
        id: '2026-08-17',
        dateKey: '2026-08-17',
        displayDate: '17/08',
        savingsAmount: 25,
        expenses: [
          { id: '1', amount: 100, description: 'Canteen' },
          { id: '2', amount: 100, description: 'income Certificate' },
          { id: '3', amount: 100, description: 'Sadaqah Amount' },
        ],
        totalExpenses: 300,
        createdAt: '',
        updatedAt: '',
      },
      '2026-08-18': {
        id: '2026-08-18',
        dateKey: '2026-08-18',
        displayDate: '18/08',
        savingsAmount: 25,
        expenses: [],
        totalExpenses: 0,
        createdAt: '',
        updatedAt: '',
      },
    };

    const startingBalance = 275; // Balance going into 16/08
    const rows = calculateCumulativeLedgerRows(mockEntries, startingBalance);

    // 16/08: 275 + 25 = 300
    expect(rows[0].cumulativeBalance).toBe(300);
    // 17/08: 300 + 25 - 300 = 25
    expect(rows[1].cumulativeBalance).toBe(25);
    // 18/08: 25 + 25 = 50
    expect(rows[2].cumulativeBalance).toBe(50);
  });

  it('generates 31 days template for August with default ₹25 savings', () => {
    const template = generateMonthTemplateEntries(2026, 7, 25); // August 2026
    const keys = Object.keys(template);
    expect(keys.length).toBe(31);
    expect(template['2026-08-01'].savingsAmount).toBe(25);
    expect(template['2026-08-31'].savingsAmount).toBe(25);
    expect(template['2026-08-01'].displayDate).toBe('01/08');
  });

  it('groups rows into monthly summaries correctly', () => {
    const augTemplate = generateMonthTemplateEntries(2026, 7, 25);
    const rows = calculateCumulativeLedgerRows(augTemplate, 0);
    const summaries = groupLedgerByMonth(rows, 0);

    expect(summaries.length).toBe(1);
    expect(summaries[0].monthTitle).toBe('AUGUST 2026');
    expect(summaries[0].totalSavings).toBe(31 * 25); // 775
    expect(summaries[0].endingBalance).toBe(775);
  });
});
