import { describe, it, expect } from 'vitest';
import {
  calculateOverallDailyStreak,
  calculateSingleHabitStreak,
  calculateGentleHabitStreak,
  calculateLongestStreak,
  calculateMonthProgressPercent,
  calculateWeeklyProgressPercent,
  calculateHabitTotalTrackedDays,
  calculateHabitDayOfWeekStats,
} from '../lib/calculations';
import {
  Habit,
  HabitEntryMap,
  isHabitActiveInMonth,
  isEntryCompleted,
  isHabitPausedOnDate,
  isHabitScheduledForDate,
} from '../types';

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

  describe('calculateHabitTotalTrackedDays (Individualized habit tracking window)', () => {
    const today = new Date(2026, 7, 23); // 2026-08-23

    it('calculates exact days for a habit created 10 days ago', () => {
      const recentHabit: Habit = {
        id: 'h-recent',
        name: 'New Habit',
        icon: 'star',
        color: '#006398',
        frequency: 'daily',
        goalCount: 1,
        createdAt: '2026-08-14T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      const days = calculateHabitTotalTrackedDays(recentHabit, {}, today);
      expect(days).toBe(10); // Aug 14 to Aug 23 = 10 days
    });

    it('calculates exact days for a habit created in Feb (204 days ago)', () => {
      const olderHabit: Habit = {
        id: 'h-old',
        name: 'Older Habit',
        icon: 'star',
        color: '#006398',
        frequency: 'daily',
        goalCount: 1,
        createdAt: '2026-02-01T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      const days = calculateHabitTotalTrackedDays(olderHabit, {}, today);
      expect(days).toBe(204); // Feb 1 to Aug 23 = 204 days
    });

    it('respects startMonth lower bound', () => {
      const julyHabit: Habit = {
        id: 'h-july',
        name: 'July Habit',
        icon: 'star',
        color: '#006398',
        frequency: 'daily',
        goalCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        startMonth: '2026-07',
        archived: false,
        sortOrder: 0,
      };

      const days = calculateHabitTotalTrackedDays(julyHabit, {}, today);
      expect(days).toBe(54); // July 1 (31d) + Aug 23 (23d) = 54 days
    });

    it('subtracts days in excludedMonths', () => {
      const habitWithExclusion: Habit = {
        id: 'h-excluded',
        name: 'Habit Excluded July',
        icon: 'star',
        color: '#006398',
        frequency: 'daily',
        goalCount: 1,
        createdAt: '2026-06-01T00:00:00.000Z',
        excludedMonths: ['2026-07'],
        archived: false,
        sortOrder: 0,
      };

      // June 1 to Aug 23 is 30 + 31 + 23 = 84 days.
      // Excluding July (31 days) -> 84 - 31 = 53 days.
      const days = calculateHabitTotalTrackedDays(habitWithExclusion, {}, today);
      expect(days).toBe(53);
    });
  });

  describe('calculateHabitDayOfWeekStats (Total days per day of week & true percentages)', () => {
    const today = new Date(2026, 7, 23); // Sunday, Aug 23, 2026

    it('calculates total occurrences for each day and identifies peak day', () => {
      const habit: Habit = {
        id: 'h-dow',
        name: 'Gym Workout',
        icon: 'fitness_center',
        color: '#006398',
        frequency: 'daily',
        goalCount: 1,
        createdAt: '2026-08-01T00:00:00.000Z', // 23 days (Aug 1 - Aug 23)
        archived: false,
        sortOrder: 0,
      };

      // In Aug 1 (Sat) to Aug 23 (Sun):
      // Mondays: Aug 3, Aug 10, Aug 17 (3 Mondays)
      // Fridays: Aug 7, Aug 14, Aug 21 (3 Fridays)
      const entries: HabitEntryMap = {
        '2026-08-07': { date: '2026-08-07', completed: true, weekOfMonth: 1, monthKey: '2026-08', updatedAt: '' },
        '2026-08-14': { date: '2026-08-14', completed: true, weekOfMonth: 2, monthKey: '2026-08', updatedAt: '' },
        '2026-08-21': { date: '2026-08-21', completed: true, weekOfMonth: 3, monthKey: '2026-08', updatedAt: '' },
        '2026-08-03': { date: '2026-08-03', completed: true, weekOfMonth: 1, monthKey: '2026-08', updatedAt: '' },
      };

      const result = calculateHabitDayOfWeekStats(habit, entries, today);

      const fridayStat = result.dayStats.find((d) => d.day === 'Friday');
      expect(fridayStat?.totalDays).toBe(3);
      expect(fridayStat?.completedCount).toBe(3);
      expect(fridayStat?.percentage).toBe(100);

      const mondayStat = result.dayStats.find((d) => d.day === 'Monday');
      expect(mondayStat?.totalDays).toBe(3);
      expect(mondayStat?.completedCount).toBe(1);
      expect(mondayStat?.percentage).toBe(33);

      expect(result.peakDay?.day).toBe('Friday');
      expect(result.peakDay?.percentage).toBe(100);
    });
  });

  describe('Edge-case & NaN safety safeguards', () => {
    it('handles NaN, undefined, and non-numeric inputs in calculateMonthProgressPercent', () => {
      expect(calculateMonthProgressPercent(NaN as any, 31)).toBe(0);
      expect(calculateMonthProgressPercent(undefined as any, 31)).toBe(0);
      expect(calculateMonthProgressPercent(-5, 31)).toBe(0);
      expect(calculateMonthProgressPercent(10, 0)).toBe(0);
    });

    it('handles NaN, undefined, and non-numeric inputs in calculateWeeklyProgressPercent', () => {
      expect(calculateWeeklyProgressPercent(NaN as any, 4)).toBe(0);
      expect(calculateWeeklyProgressPercent(undefined as any, 4)).toBe(0);
      expect(calculateWeeklyProgressPercent(-2, 4)).toBe(0);
      expect(calculateWeeklyProgressPercent(2, 0)).toBe(50); // defaults goalCount to 4
    });

    it('correctly shifts months on 31st day dates without skipping months', () => {
      // Starting on August 31st:
      const aug31 = new Date(2026, 7, 31);
      // Safe navigation construct:
      const sep = new Date(aug31.getFullYear(), aug31.getMonth() + 1, 1);
      expect(sep.getMonth()).toBe(8); // September (month index 8)
      expect(sep.getDate()).toBe(1);

      // Starting on March 31st moving backwards to February:
      const mar31 = new Date(2026, 2, 31);
      const feb = new Date(mar31.getFullYear(), mar31.getMonth() - 1, 1);
      expect(feb.getMonth()).toBe(1); // February (month index 1)
      expect(feb.getDate()).toBe(1);
    });
  });

  describe('Section 4: Advanced Functionality & Habit Types', () => {
    describe('Numeric Target Habits', () => {
      const waterHabit: Habit = {
        id: 'water_1',
        name: 'Daily Hydration',
        icon: 'water_drop',
        color: '#2D5A34',
        frequency: 'daily',
        habitType: 'numeric',
        targetValue: 2500,
        unit: 'ml',
        stepValue: 250,
        goalCount: 1,
        createdAt: '2026-11-01T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      it('evaluates isEntryCompleted based on targetValue threshold', () => {
        expect(
          isEntryCompleted(waterHabit, {
            date: '2026-11-20',
            completed: false,
            currentValue: 1500,
            weekOfMonth: 3,
            monthKey: '2026-11',
            updatedAt: '',
          })
        ).toBe(false);

        expect(
          isEntryCompleted(waterHabit, {
            date: '2026-11-20',
            completed: false,
            currentValue: 2500,
            weekOfMonth: 3,
            monthKey: '2026-11',
            updatedAt: '',
          })
        ).toBe(true);

        expect(
          isEntryCompleted(waterHabit, {
            date: '2026-11-20',
            completed: false,
            currentValue: 3000,
            weekOfMonth: 3,
            monthKey: '2026-11',
            updatedAt: '',
          })
        ).toBe(true);
      });

      it('computes streaks correctly for numeric habits reaching target', () => {
        const asOf = new Date(2026, 10, 23); // Nov 23, 2026
        const entries: HabitEntryMap = {
          '2026-11-21': { date: '2026-11-21', completed: false, currentValue: 2500, weekOfMonth: 4, monthKey: '2026-11', updatedAt: '' },
          '2026-11-22': { date: '2026-11-22', completed: false, currentValue: 2800, weekOfMonth: 4, monthKey: '2026-11', updatedAt: '' },
          '2026-11-23': { date: '2026-11-23', completed: false, currentValue: 2500, weekOfMonth: 4, monthKey: '2026-11', updatedAt: '' },
        };

        const result = calculateGentleHabitStreak(entries, asOf, 2, waterHabit);
        expect(result.streak).toBe(3);
      });
    });

    describe('Zen Timers & Pomodoro Habits', () => {
      const meditationHabit: Habit = {
        id: 'meditation_1',
        name: 'Zen Meditation',
        icon: 'self_improvement',
        color: '#2D5A34',
        frequency: 'daily',
        habitType: 'timer',
        timerDuration: 15, // 15 minutes = 900 seconds
        goalCount: 1,
        createdAt: '2026-11-01T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      it('recognizes completion when timer seconds reach target duration', () => {
        expect(
          isEntryCompleted(meditationHabit, {
            date: '2026-11-23',
            completed: false,
            timerSecondsElapsed: 600, // 10 mins (less than 15m)
            weekOfMonth: 4,
            monthKey: '2026-11',
            updatedAt: '',
          })
        ).toBe(false);

        expect(
          isEntryCompleted(meditationHabit, {
            date: '2026-11-23',
            completed: false,
            timerSecondsElapsed: 900, // exact 15 mins
            weekOfMonth: 4,
            monthKey: '2026-11',
            updatedAt: '',
          })
        ).toBe(true);
      });
    });

    describe('Flexible Schedules (Days of Week)', () => {
      // Workout on Mon (1), Wed (3), Fri (5) only
      const workoutHabit: Habit = {
        id: 'workout_1',
        name: 'Strength Training',
        icon: 'fitness_center',
        color: '#A65A42',
        frequency: 'daily',
        scheduleType: 'days_of_week',
        daysOfWeek: [1, 3, 5],
        goalCount: 1,
        createdAt: '2026-11-01T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      it('detects scheduled days vs rest days correctly', () => {
        const monday = new Date(2026, 10, 16); // Monday
        const tuesday = new Date(2026, 10, 17); // Tuesday
        const wednesday = new Date(2026, 10, 18); // Wednesday

        expect(isHabitScheduledForDate(workoutHabit, monday)).toBe(true);
        expect(isHabitScheduledForDate(workoutHabit, tuesday)).toBe(false); // Rest Day
        expect(isHabitScheduledForDate(workoutHabit, wednesday)).toBe(true);
      });

      it('preserves streaks through scheduled rest days without penalizing', () => {
        // Monday Nov 16 done, Tue Nov 17 is rest day (not logged), Wed Nov 18 done, Thu Nov 19 is rest day (not logged), Fri Nov 20 done
        const fridayAsOf = new Date(2026, 10, 20);
        const entries: HabitEntryMap = {
          '2026-11-16': { date: '2026-11-16', completed: true, weekOfMonth: 3, monthKey: '2026-11', updatedAt: '' },
          '2026-11-18': { date: '2026-11-18', completed: true, weekOfMonth: 3, monthKey: '2026-11', updatedAt: '' },
          '2026-11-20': { date: '2026-11-20', completed: true, weekOfMonth: 3, monthKey: '2026-11', updatedAt: '' },
        };

        const result = calculateGentleHabitStreak(entries, fridayAsOf, 0, workoutHabit);
        // All 3 scheduled workout days completed, Tuesday & Thursday were rest days -> streak is 3!
        expect(result.streak).toBe(3);
      });
    });

    describe('Vacation & Travel Pause Streak Freezing', () => {
      const runningHabit: Habit = {
        id: 'run_1',
        name: 'Morning Run',
        icon: 'directions_run',
        color: '#52995D',
        frequency: 'daily',
        isPaused: true,
        pauseStartDate: '2026-11-10',
        pauseEndDate: '2026-11-16',
        pauseReason: 'Vacation',
        goalCount: 1,
        createdAt: '2026-10-01T00:00:00.000Z',
        archived: false,
        sortOrder: 0,
      };

      it('correctly detects paused dates during travel window', () => {
        expect(isHabitPausedOnDate(runningHabit, '2026-11-09')).toBe(false);
        expect(isHabitPausedOnDate(runningHabit, '2026-11-12')).toBe(true);
        expect(isHabitPausedOnDate(runningHabit, '2026-11-16')).toBe(true);
        expect(isHabitPausedOnDate(runningHabit, '2026-11-17')).toBe(false);
      });

      it('freezes streak through vacation days so trip does not break historical streak', () => {
        // Active Nov 7, 8, 9 (3 days streak)
        // Nov 10-16 is vacation (no entries logged)
        // Nov 17 returns from vacation and completes habit
        const asOfNov17 = new Date(2026, 10, 17);
        const entries: HabitEntryMap = {
          '2026-11-07': { date: '2026-11-07', completed: true, weekOfMonth: 2, monthKey: '2026-11', updatedAt: '' },
          '2026-11-08': { date: '2026-11-08', completed: true, weekOfMonth: 2, monthKey: '2026-11', updatedAt: '' },
          '2026-11-09': { date: '2026-11-09', completed: true, weekOfMonth: 2, monthKey: '2026-11', updatedAt: '' },
          '2026-11-17': { date: '2026-11-17', completed: true, weekOfMonth: 3, monthKey: '2026-11', updatedAt: '' },
        };

        const result = calculateGentleHabitStreak(entries, asOfNov17, 0, runningHabit);
        // 4 completed days preserved across 7-day vacation pause!
        expect(result.streak).toBe(4);
      });
    });
  });
});
