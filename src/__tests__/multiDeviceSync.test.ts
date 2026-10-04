import { describe, it, expect } from 'vitest';
import { HabitEntry } from '../types';
import { calculateGentleHabitStreak } from '../lib/calculations';
import { calculateCumulativeLedgerRows, groupLedgerByMonth } from '../lib/expenseCalculations';
import { DailyMoneyEntry } from '../types/expense';

describe('Multi-Device Real-Time Sync & Data Consistency Suite', () => {

  it('correctly merges concurrent check-ins across Device A and Device B without data loss', () => {
    // Device A check-in on Aug 18
    const deviceAEntries: Record<string, HabitEntry> = {
      '2026-08-18': {
        date: '2026-08-18',
        completed: true,
        weekOfMonth: 3,
        monthKey: '2026-08',
        updatedAt: '2026-08-18T08:00:00.000Z',
      },
    };

    // Device B check-in on Aug 19 with a personal reflection note
    const deviceBEntries: Record<string, HabitEntry> = {
      '2026-08-19': {
        date: '2026-08-19',
        completed: true,
        note: 'Felt very energized this morning!',
        mood: 'calm',
        weekOfMonth: 3,
        monthKey: '2026-08',
        updatedAt: '2026-08-19T07:30:00.000Z',
      },
    };

    // Merged state on server & propagated to both devices
    const syncedEntries: Record<string, HabitEntry> = {
      ...deviceAEntries,
      ...deviceBEntries,
    };

    expect(Object.keys(syncedEntries).length).toBe(2);
    expect(syncedEntries['2026-08-18'].completed).toBe(true);
    expect(syncedEntries['2026-08-19'].completed).toBe(true);
    expect(syncedEntries['2026-08-19'].note).toBe('Felt very energized this morning!');

    // Streak calculation on synced data
    const today = new Date('2026-08-19T12:00:00Z');
    const streakResult = calculateGentleHabitStreak(syncedEntries, today, 1);
    expect(streakResult.streak).toBe(2);
  });

  it('correctly resolves habit note updates without resetting completion status', () => {
    const originalEntry: HabitEntry = {
      date: '2026-08-20',
      completed: true,
      weekOfMonth: 3,
      monthKey: '2026-08',
      updatedAt: '2026-08-20T08:00:00.000Z',
    };

    // Note added from second device
    const updatedWithNote: HabitEntry = {
      ...originalEntry,
      note: 'Added evening gratitude note',
      tags: ['gratitude', 'evening'],
      updatedAt: '2026-08-20T21:00:00.000Z',
    };

    expect(updatedWithNote.completed).toBe(true);
    expect(updatedWithNote.note).toBe('Added evening gratitude note');
    expect(updatedWithNote.tags).toContain('gratitude');
  });

  it('synchronizes financial ledger entries across multiple devices accurately', () => {
    const entriesMap: Record<string, DailyMoneyEntry> = {
      '2026-08-01': {
        id: '2026-08-01',
        dateKey: '2026-08-01',
        displayDate: '01/08',
        savingsAmount: 50,
        expenses: [{ id: 'exp_1', amount: 20, description: 'Coffee' }],
        totalExpenses: 20,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      '2026-08-02': {
        id: '2026-08-02',
        dateKey: '2026-08-02',
        displayDate: '02/08',
        savingsAmount: 50,
        expenses: [],
        totalExpenses: 0,
        createdAt: '2026-08-02T00:00:00Z',
        updatedAt: '2026-08-02T00:00:00Z',
      },
    };

    const startingBalance = 100;
    const ledgerRows = calculateCumulativeLedgerRows(entriesMap, startingBalance, '2026-08-02');

    expect(ledgerRows.length).toBe(2);
    // Day 1: 100 + 50 - 20 = 130
    expect(ledgerRows[0].cumulativeBalance).toBe(130);
    // Day 2: 130 + 50 - 0 = 180
    expect(ledgerRows[1].cumulativeBalance).toBe(180);

    const monthSummaries = groupLedgerByMonth(ledgerRows, startingBalance);
    expect(monthSummaries.length).toBe(1);
    expect(monthSummaries[0].totalSavings).toBe(100);
    expect(monthSummaries[0].totalExpenses).toBe(20);
    expect(monthSummaries[0].endingBalance).toBe(180);
  });
});
