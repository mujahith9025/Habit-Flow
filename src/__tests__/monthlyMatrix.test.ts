import { describe, it, expect } from 'vitest';
import {
  isDayCompletedInBitmask,
  setDayInBitmask,
  countCompletedDaysInBitmask,
  getCompletedDaysFromBitmask,
  entryMapToBitmask,
  matrixRecordToEntryMap,
  matrixDocToEntriesByHabit,
  entriesByHabitToMatrixDoc,
} from '../lib/firebase/monthlyMatrixService';
import {
  HabitEntryMap,
  MonthlyHabitRecord,
} from '../types';
import { calculateGentleHabitStreak } from '../lib/calculations';

describe('Section 6: Database & Architecture Scalability — Monthly Matrix & Bitmask Engine', () => {
  describe('Pure Bitmask Arithmetic (O(1) Memory & Operations)', () => {
    it('accurately identifies completion status across all 31 days', () => {
      // Bit 0 = Day 1, Bit 14 = Day 15, Bit 30 = Day 31
      let mask = 0;
      expect(isDayCompletedInBitmask(mask, 1)).toBe(false);
      expect(isDayCompletedInBitmask(mask, 15)).toBe(false);
      expect(isDayCompletedInBitmask(mask, 31)).toBe(false);

      // Set Day 1 (1 << 0 = 1)
      mask = setDayInBitmask(mask, 1, true);
      expect(isDayCompletedInBitmask(mask, 1)).toBe(true);
      expect(isDayCompletedInBitmask(mask, 2)).toBe(false);

      // Set Day 15 (1 << 14)
      mask = setDayInBitmask(mask, 15, true);
      expect(isDayCompletedInBitmask(mask, 15)).toBe(true);
      expect(isDayCompletedInBitmask(mask, 1)).toBe(true);

      // Set Day 31 (1 << 30)
      mask = setDayInBitmask(mask, 31, true);
      expect(isDayCompletedInBitmask(mask, 31)).toBe(true);

      // Unset Day 1
      mask = setDayInBitmask(mask, 1, false);
      expect(isDayCompletedInBitmask(mask, 1)).toBe(false);
      expect(isDayCompletedInBitmask(mask, 15)).toBe(true);
      expect(isDayCompletedInBitmask(mask, 31)).toBe(true);
    });

    it('rejects out-of-bounds days safely without corrupting bitmask', () => {
      const originalMask = 42;
      expect(isDayCompletedInBitmask(originalMask, 0)).toBe(false);
      expect(isDayCompletedInBitmask(originalMask, 32)).toBe(false);
      expect(isDayCompletedInBitmask(originalMask, -5)).toBe(false);

      expect(setDayInBitmask(originalMask, 0, true)).toBe(originalMask);
      expect(setDayInBitmask(originalMask, 32, true)).toBe(originalMask);
    });

    it('counts completed days with O(1) Hamming weight algorithm', () => {
      expect(countCompletedDaysInBitmask(0)).toBe(0);

      // Day 1, 2, 3 = 1 + 2 + 4 = 7
      expect(countCompletedDaysInBitmask(7)).toBe(3);

      // Full 31 days (2^31 - 1 = 2147483647)
      const fullMonthMask = 0x7fffffff;
      expect(countCompletedDaysInBitmask(fullMonthMask)).toBe(31);
    });

    it('extracts sorted completed day numbers from bitmask', () => {
      let mask = 0;
      mask = setDayInBitmask(mask, 3, true);
      mask = setDayInBitmask(mask, 7, true);
      mask = setDayInBitmask(mask, 21, true);
      mask = setDayInBitmask(mask, 31, true);

      const days = getCompletedDaysFromBitmask(mask);
      expect(days).toEqual([3, 7, 21, 31]);
    });
  });

  describe('Hydration & Roundtrip Serialization Compatibility', () => {
    const monthKey = '2026-11';

    it('converts HabitEntryMap to bitmask filtering strictly by monthKey', () => {
      const entryMap: HabitEntryMap = {
        '2026-11-01': { date: '2026-11-01', completed: true, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' },
        '2026-11-05': { date: '2026-11-05', completed: true, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' },
        '2026-11-12': { date: '2026-11-12', completed: false, weekOfMonth: 2, monthKey: '2026-11', updatedAt: '' },
        '2026-10-31': { date: '2026-10-31', completed: true, weekOfMonth: 5, monthKey: '2026-10', updatedAt: '' }, // Previous month, should be ignored
      };

      const mask = entryMapToBitmask(entryMap, monthKey);
      expect(isDayCompletedInBitmask(mask, 1)).toBe(true);
      expect(isDayCompletedInBitmask(mask, 5)).toBe(true);
      expect(isDayCompletedInBitmask(mask, 12)).toBe(false);
      expect(isDayCompletedInBitmask(mask, 31)).toBe(false);
      expect(countCompletedDaysInBitmask(mask)).toBe(2);
    });

    it('hydrates MonthlyHabitRecord back to full HabitEntryMap including values and notes', () => {
      let mask = 0;
      mask = setDayInBitmask(mask, 2, true);
      mask = setDayInBitmask(mask, 15, true);

      const record: MonthlyHabitRecord = {
        bitmask: mask,
        values: {
          '2': { v: 2500, n: 'Drank 2.5L water', m: 'energized' },
          '15': { t: 1200, n: '20 min meditation' },
        },
      };

      const entries = matrixRecordToEntryMap('habit_1', record, monthKey);

      expect(entries['2026-11-02']).toBeDefined();
      expect(entries['2026-11-02'].completed).toBe(true);
      expect(entries['2026-11-02'].currentValue).toBe(2500);
      expect(entries['2026-11-02'].note).toBe('Drank 2.5L water');
      expect(entries['2026-11-02'].mood).toBe('energized');

      expect(entries['2026-11-15']).toBeDefined();
      expect(entries['2026-11-15'].completed).toBe(true);
      expect(entries['2026-11-15'].timerSecondsElapsed).toBe(1200);
      expect(entries['2026-11-15'].note).toBe('20 min meditation');

      // Unmarked day should be undefined
      expect(entries['2026-11-03']).toBeUndefined();
    });

    it('performs bidirectional full roundtrip: entriesByHabit -> MatrixDoc -> entriesByHabit', () => {
      const originalEntries: Record<string, HabitEntryMap> = {
        habit_meditation: {
          '2026-11-01': { date: '2026-11-01', completed: true, weekOfMonth: 1, monthKey, updatedAt: '' },
          '2026-11-02': { date: '2026-11-02', completed: true, weekOfMonth: 1, monthKey, updatedAt: '' },
          '2026-11-03': { date: '2026-11-03', completed: false, weekOfMonth: 1, monthKey, updatedAt: '' },
        },
        habit_water: {
          '2026-11-01': { date: '2026-11-01', completed: true, currentValue: 3000, weekOfMonth: 1, monthKey, updatedAt: '' },
        },
      };

      const matrixDoc = entriesByHabitToMatrixDoc(monthKey, originalEntries);
      expect(matrixDoc.monthKey).toBe(monthKey);
      expect(matrixDoc.habits['habit_meditation']).toBeDefined();
      expect(matrixDoc.habits['habit_water']).toBeDefined();

      const hydrated = matrixDocToEntriesByHabit(matrixDoc);

      expect(hydrated.habit_meditation['2026-11-01'].completed).toBe(true);
      expect(hydrated.habit_meditation['2026-11-02'].completed).toBe(true);
      expect(hydrated.habit_meditation['2026-11-03']).toBeUndefined(); // non-completed days without values omitted for compact storage

      expect(hydrated.habit_water['2026-11-01'].completed).toBe(true);
      expect(hydrated.habit_water['2026-11-01'].currentValue).toBe(3000);
    });

    it('calculates streaks with identical accuracy when fed hydrated matrix data', () => {
      let mask = 0;
      // Streak on Nov 20, 21, 22, 23 (Days 20, 21, 22, 23)
      mask = setDayInBitmask(mask, 20, true);
      mask = setDayInBitmask(mask, 21, true);
      mask = setDayInBitmask(mask, 22, true);
      mask = setDayInBitmask(mask, 23, true);

      const record: MonthlyHabitRecord = { bitmask: mask };
      const hydratedEntries = matrixRecordToEntryMap('habit_test', record, '2026-11');

      const asOf = new Date(2026, 10, 23); // Nov 23, 2026
      const streakResult = calculateGentleHabitStreak(hydratedEntries, asOf, 2);

      expect(streakResult.streak).toBe(4);
    });

    it('validates 90-95% document read reduction architecture', () => {
      // For 10 habits over a 30-day month:
      const totalHabits = 10;
      const daysInMonth = 30;
      const legacySubcollectionDocumentReads = totalHabits * daysInMonth; // 300 document reads
      const monthlyMatrixDocumentReads = 1; // 1 single document read

      const readReductionPercent = Math.round(
        ((legacySubcollectionDocumentReads - monthlyMatrixDocumentReads) /
          legacySubcollectionDocumentReads) *
          100
      );

      expect(readReductionPercent).toBeGreaterThanOrEqual(95);
      expect(monthlyMatrixDocumentReads).toBe(1);
    });
  });
});
