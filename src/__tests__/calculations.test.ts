import { describe, it, expect } from 'vitest';
import {
  calculateOverallDailyStreak,
  calculateSingleHabitStreak,
  calculateLongestStreak,
  calculateMonthProgressPercent,
  calculateWeeklyProgressPercent,
} from '../lib/calculations';
import { Habit, HabitEntryMap, isHabitActiveInMonth } from '../types';

describe('HabitFlow Calculations Unit Test Suite', () => {
  const sampleDailyHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Meditation',
      icon: 'self_improvement',
      color: '#006398',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      archived: false,
      sortOrder: 0,
    },
    {
      id: 'h2',
      name: 'Reading',
      icon: 'menu_book',
      color: '#286b33',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      archived: false,
      sortOrder: 1,
    },
  ];

  describe('calculateMonthProgressPercent', () => {
    it('returns 0 when 0 completions exist', () => {
      expect(calculateMonthProgressPercent(0, 31)).toBe(0);
    });

    it('returns 100% when all days in month are completed', () => {
      expect(calculateMonthProgressPercent(31, 31)).toBe(100);
    });

    it('calculates correct partial percentage rounded', () => {
      // 15 / 31 = 48.38% -> 48%
      expect(calculateMonthProgressPercent(15, 31)).toBe(48);
      // 20 / 31 = 64.51% -> 65%
      expect(calculateMonthProgressPercent(20, 31)).toBe(65);
    });

    it('handles custom goalCount targets', () => {
      // 10 / 20 = 50%
      expect(calculateMonthProgressPercent(10, 31, 20)).toBe(50);
      // 25 / 20 = capped at 100%
      expect(calculateMonthProgressPercent(25, 31, 20)).toBe(100);
    });

    it('handles habit created mid-month with days elapsed target', () => {
      // Habit created on 15th, 5 completed out of 10 days elapsed
      expect(calculateMonthProgressPercent(5, 10)).toBe(50);
    });
  });

  describe('calculateWeeklyProgressPercent', () => {
    it('computes 0% for 0 completed weeks', () => {
      expect(calculateWeeklyProgressPercent(0, 4)).toBe(0);
    });

    it('computes 50% for 2 out of 4 weeks', () => {
      expect(calculateWeeklyProgressPercent(2, 4)).toBe(50);
    });

    it('computes 100% for 4 out of 4 weeks', () => {
      expect(calculateWeeklyProgressPercent(4, 4)).toBe(100);
    });

    it('caps at 100% if 5 weeks completed on a 4-week goal', () => {
      expect(calculateWeeklyProgressPercent(5, 4)).toBe(100);
    });
  });

  describe('calculateSingleHabitStreak', () => {
    const asOfDate = new Date(2026, 7, 19); // 2026-08-19

    it('returns 0 when entries are empty', () => {
      expect(calculateSingleHabitStreak({}, asOfDate)).toBe(0);
    });

    it('returns 1 if only today is completed', () => {
      const entries: HabitEntryMap = {
        '2026-08-19': {
          date: '2026-08-19',
          completed: true,
          weekOfMonth: 3,
          monthKey: '2026-08',
          updatedAt: 'now',
        },
      };
      expect(calculateSingleHabitStreak(entries, asOfDate)).toBe(1);
    });

    it('counts consecutive days backwards (e.g. 5 days)', () => {
      const entries: HabitEntryMap = {
        '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-17': { date: '2026-08-17', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-16': { date: '2026-08-16', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-15': { date: '2026-08-15', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
      };
      expect(calculateSingleHabitStreak(entries, asOfDate)).toBe(5);
    });

    it('protects a single missed day with Gentle Persistence Streak Shield', () => {
      const entries: HabitEntryMap = {
        '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        // 2026-08-17 missed! (Protected by Shield)
        '2026-08-16': { date: '2026-08-16', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-15': { date: '2026-08-15', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
      };
      // With Gentle Shield enabled, streak is 4
      expect(calculateSingleHabitStreak(entries, asOfDate, true)).toBe(4);
      // In strict mode without shield, streak is 2
      expect(calculateSingleHabitStreak(entries, asOfDate, false)).toBe(2);
    });

    it('breaks streak when 2 consecutive days are missed even with shield', () => {
      const entries: HabitEntryMap = {
        '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        // 2026-08-17 missed!
        // 2026-08-16 missed!
        '2026-08-15': { date: '2026-08-15', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
      };
      expect(calculateSingleHabitStreak(entries, asOfDate, true)).toBe(2);
    });

    it('seamlessly traverses month boundaries (e.g. July 31 -> August 1)', () => {
      const asOfAug2 = new Date(2026, 7, 2); // 2026-08-02
      const entries: HabitEntryMap = {
        '2026-08-02': { date: '2026-08-02', completed: true, weekOfMonth: 1, monthKey: '2026-08', updatedAt: '' },
        '2026-08-01': { date: '2026-08-01', completed: true, weekOfMonth: 1, monthKey: '2026-08', updatedAt: '' },
        '2026-07-31': { date: '2026-07-31', completed: true, weekOfMonth: 5, monthKey: '2026-07', updatedAt: '' },
        '2026-07-30': { date: '2026-07-30', completed: true, weekOfMonth: 5, monthKey: '2026-07', updatedAt: '' },
      };
      expect(calculateSingleHabitStreak(entries, asOfAug2)).toBe(4);
    });
  });

  describe('calculateLongestStreak', () => {
    it('returns 0 for empty entries', () => {
      expect(calculateLongestStreak({})).toBe(0);
    });

    it('finds the maximum historic consecutive run even if current streak is broken', () => {
      const entries: HabitEntryMap = {
        // Run 1: 5 days (Longest)
        '2026-07-10': { date: '2026-07-10', completed: true, weekOfMonth: 2, monthKey: '2026-07', updatedAt: '' },
        '2026-07-11': { date: '2026-07-11', completed: true, weekOfMonth: 2, monthKey: '2026-07', updatedAt: '' },
        '2026-07-12': { date: '2026-07-12', completed: true, weekOfMonth: 2, monthKey: '2026-07', updatedAt: '' },
        '2026-07-13': { date: '2026-07-13', completed: true, weekOfMonth: 2, monthKey: '2026-07', updatedAt: '' },
        '2026-07-14': { date: '2026-07-14', completed: true, weekOfMonth: 2, monthKey: '2026-07', updatedAt: '' },
        // Missed gap
        // Run 2: 2 days (Current)
        '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
      };

      expect(calculateLongestStreak(entries)).toBe(5);
    });
  });

  describe('calculateOverallDailyStreak', () => {
    const asOfDate = new Date(2026, 7, 19);

    it('returns 0 if one daily habit is missed on a day', () => {
      const entriesByHabit: Record<string, HabitEntryMap> = {
        h1: {
          '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        },
        h2: {
          // h2 missed today!
        },
      };

      expect(calculateOverallDailyStreak(entriesByHabit, sampleDailyHabits, asOfDate)).toBe(0);
    });

    it('increments streak when ALL active daily habits are completed', () => {
      const entriesByHabit: Record<string, HabitEntryMap> = {
        h1: {
          '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
          '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
          '2026-08-17': { date: '2026-08-17', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        },
        h2: {
          '2026-08-19': { date: '2026-08-19', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
          '2026-08-18': { date: '2026-08-18', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
          '2026-08-17': { date: '2026-08-17', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        },
      };

      expect(calculateOverallDailyStreak(entriesByHabit, sampleDailyHabits, asOfDate)).toBe(3);
    });
  });

  describe('isHabitActiveInMonth (Month-Specific Habit Lifecycle & Scoping)', () => {
    const baseHabit: Habit = {
      id: 'h-test',
      name: 'Morning Workout',
      icon: 'fitness_center',
      color: '#006398',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      archived: false,
      sortOrder: 0,
    };

    it('defaults to active across all months when no month scoping is defined', () => {
      expect(isHabitActiveInMonth(baseHabit, '2026-07')).toBe(true);
      expect(isHabitActiveInMonth(baseHabit, '2026-08')).toBe(true);
      expect(isHabitActiveInMonth(baseHabit, '2026-09')).toBe(true);
      expect(isHabitActiveInMonth(baseHabit, '2027-01')).toBe(true);
    });

    it('returns false when habit is archived', () => {
      const archivedHabit = { ...baseHabit, archived: true };
      expect(isHabitActiveInMonth(archivedHabit, '2026-08')).toBe(false);
    });

    it('excludes habit only from specified excluded months while keeping it active in all others', () => {
      const habitWithExclusion: Habit = {
        ...baseHabit,
        excludedMonths: ['2026-08'],
      };

      // Excluded in August 2026
      expect(isHabitActiveInMonth(habitWithExclusion, '2026-08')).toBe(false);
      // Fully active in July 2026, September 2026, October 2026
      expect(isHabitActiveInMonth(habitWithExclusion, '2026-07')).toBe(true);
      expect(isHabitActiveInMonth(habitWithExclusion, '2026-09')).toBe(true);
      expect(isHabitActiveInMonth(habitWithExclusion, '2026-10')).toBe(true);
    });

    it('respects startMonth (only active on or after startMonth)', () => {
      const habitStartingAug: Habit = {
        ...baseHabit,
        startMonth: '2026-08',
      };

      expect(isHabitActiveInMonth(habitStartingAug, '2026-07')).toBe(false);
      expect(isHabitActiveInMonth(habitStartingAug, '2026-08')).toBe(true);
      expect(isHabitActiveInMonth(habitStartingAug, '2026-09')).toBe(true);
    });

    it('respects endMonth (only active on or before endMonth)', () => {
      const habitThisMonthOnly: Habit = {
        ...baseHabit,
        startMonth: '2026-08',
        endMonth: '2026-08',
      };

      expect(isHabitActiveInMonth(habitThisMonthOnly, '2026-07')).toBe(false);
      expect(isHabitActiveInMonth(habitThisMonthOnly, '2026-08')).toBe(true);
      expect(isHabitActiveInMonth(habitThisMonthOnly, '2026-09')).toBe(false);
    });
  });
});
