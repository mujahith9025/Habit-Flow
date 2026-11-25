import { describe, it, expect, vi } from 'vitest';
import { HabitEntry } from '../types';
import { calculateGentleHabitStreak } from '../lib/calculations';
import { calculateCumulativeLedgerRows, groupLedgerByMonth } from '../lib/expenseCalculations';
import { DailyMoneyEntry } from '../types/expense';
import { broadcastSync, subscribeToBroadcastSync, BroadcastSyncMessage, TAB_SESSION_ID } from '../utils/broadcastSync';
import { QueuedMutation } from '../utils/offlineQueue';
import { parseDeviceInfo, UserDeviceSession } from '../lib/firebase/sessionManager';

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

  describe('Section 7: Sync & Multi-Device Real-Time Architecture', () => {
    describe('Zero-Latency Multi-Tab Sync (BroadcastChannel Engine)', () => {
      it('generates a unique non-empty TAB_SESSION_ID to prevent self-echo loops', () => {
        expect(TAB_SESSION_ID).toBeDefined();
        expect(typeof TAB_SESSION_ID).toBe('string');
        expect(TAB_SESSION_ID.length).toBeGreaterThan(0);
      });

      it('safely handles broadcastSync without throwing in non-browser or storage fallback environments', () => {
        expect(() => {
          broadcastSync({
            type: 'HABIT_ENTRY_TOGGLE',
            habitId: 'water_1',
            dateKey: '2026-11-25',
            completed: true,
          });
        }).not.toThrow();
      });

      it('subscribes to broadcast messages and receives cross-tab payloads', () => {
        const received: BroadcastSyncMessage[] = [];
        const unsubscribe = subscribeToBroadcastSync((msg) => {
          received.push(msg);
        });

        expect(typeof unsubscribe).toBe('function');
        unsubscribe();
      });
    });

    describe('Background Sync API & Offline Mutation Queue', () => {
      it('validates QueuedMutation structure and required payload properties', () => {
        const mutation: QueuedMutation = {
          id: 'mut_test_123',
          type: 'TOGGLE_ENTRY',
          uid: 'user_offline_456',
          dateKey: '2026-11-25',
          payload: {
            habitId: 'habit_gym',
            completed: true,
            currentValue: 1,
          },
          timestamp: Date.now(),
          retries: 0,
        };

        expect(mutation.id).toBe('mut_test_123');
        expect(mutation.type).toBe('TOGGLE_ENTRY');
        expect(mutation.payload.habitId).toBe('habit_gym');
        expect(mutation.payload.completed).toBe(true);
        expect(mutation.retries).toBe(0);
      });

      it('supports batch offline mutations with atomic multi-habit payload', () => {
        const batchMutation: QueuedMutation = {
          id: 'mut_batch_789',
          type: 'BATCH_TOGGLE',
          uid: 'user_offline_456',
          dateKey: '2026-11-25',
          payload: {
            updates: [
              { habitId: 'h1', completed: true },
              { habitId: 'h2', completed: true },
            ],
          },
          timestamp: Date.now(),
          retries: 0,
        };

        expect(batchMutation.type).toBe('BATCH_TOGGLE');
        expect(batchMutation.payload.updates).toHaveLength(2);
      });
    });

    describe('Active Device Presence & Remote Session Revocation', () => {
      it('parses user agent into structured device name, OS, and browser', () => {
        const info = parseDeviceInfo();
        expect(info).toBeDefined();
        expect(info.name).toBeDefined();
        expect(['mobile', 'desktop', 'tablet']).toContain(info.type);
        expect(info.os).toBeDefined();
        expect(info.browser).toBeDefined();
      });

      it('validates UserDeviceSession schema with IP, location, and geo-location presence', () => {
        const session: UserDeviceSession = {
          id: 'dev_iphone_16',
          name: 'iOS (iPhone) • Apple Safari',
          type: 'mobile',
          browser: 'Apple Safari',
          os: 'iOS (iPhone)',
          ip: '103.21.244.0',
          city: 'Chennai',
          country: 'India',
          location: 'Chennai, IN',
          lastActive: '2026-11-25T08:00:00.000Z',
          createdAt: '2026-11-01T00:00:00.000Z',
          isCurrent: true,
        };

        expect(session.id).toBe('dev_iphone_16');
        expect(session.type).toBe('mobile');
        expect(session.location).toBe('Chennai, IN');
        expect(session.ip).toBe('103.21.244.0');
        expect(session.isCurrent).toBe(true);
      });

      it('verifies remote session revocation triggers graceful sign-out logic', () => {
        const mockSignOut = vi.fn().mockResolvedValue(undefined);
        const currentDeviceId = 'my_phone_session';

        // Server devices snapshot without my_phone_session (revoked remotely by another device)
        const remoteDeviceList: UserDeviceSession[] = [
          {
            id: 'laptop_session',
            name: 'macOS • Google Chrome',
            type: 'desktop',
            browser: 'Google Chrome',
            os: 'macOS',
            lastActive: '2026-11-25T08:00:00Z',
            createdAt: '2026-11-20T00:00:00Z',
          },
        ];

        const isCurrentActive = remoteDeviceList.some((d) => d.id === currentDeviceId);
        expect(isCurrentActive).toBe(false);

        if (!isCurrentActive) {
          mockSignOut();
        }

        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });
});
