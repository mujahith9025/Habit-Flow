import { describe, it, expect } from 'vitest';
import { analyzeHabitSynergy } from '../utils/habitSynergy';
import { Habit, HabitEntry } from '../types/habit';
import { MonthDayInfo } from '../hooks/useDailyHabitsData';

describe('Habit Synergy & Habit-Stacking Engine', () => {
  const habitA: Habit = {
    id: 'hA',
    name: 'Morning Hydration',
    category: 'Health',
    frequency: 'daily',
    goalCount: 1,
    createdAt: '2026-01-01',
    archived: false,
    sortOrder: 1,
    icon: 'water_drop',
    color: '#4A6B82',
  };

  const habitB: Habit = {
    id: 'hB',
    name: 'Daily 20m Yoga',
    category: 'Health',
    frequency: 'daily',
    goalCount: 1,
    createdAt: '2026-01-01',
    archived: false,
    sortOrder: 2,
    icon: 'fitness_center',
    color: '#2D5A34',
  };

  const mockDays: MonthDayInfo[] = Array.from({ length: 10 }, (_, i) => {
    const dayNum = i + 1;
    const dateKey = `2026-11-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateKey,
      dayOfWeek: 'M',
      isToday: dayNum === 10,
      isPast: dayNum < 10,
      isFuture: false,
    };
  });

  it('detects strong co-occurrence and positive synergy lift between habit pairs', () => {
    const entriesByHabit: Record<string, Record<string, HabitEntry>> = {
      hA: {},
      hB: {},
    };

    // Days 1-6: Both completed
    for (let d = 1; d <= 6; d++) {
      const key = `2026-11-${String(d).padStart(2, '0')}`;
      entriesByHabit.hA[key] = { date: key, completed: true, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' };
      entriesByHabit.hB[key] = { date: key, completed: true, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' };
    }

    // Days 7-10: Habit A missed, Habit B missed
    for (let d = 7; d <= 10; d++) {
      const key = `2026-11-${String(d).padStart(2, '0')}`;
      entriesByHabit.hA[key] = { date: key, completed: false, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' };
      entriesByHabit.hB[key] = { date: key, completed: false, weekOfMonth: 1, monthKey: '2026-11', updatedAt: '' };
    }

    const report = analyzeHabitSynergy([habitA, habitB], entriesByHabit, mockDays);

    expect(report.hasSufficientData).toBe(true);
    expect(report.topPairs.length).toBeGreaterThan(0);
    const topPair = report.topPairs[0];
    expect(topPair.synergyLiftPercent).toBeGreaterThan(0);
    expect(topPair.stackingBlueprint).toContain('After I');
  });

  it('handles empty or single habit boards gracefully', () => {
    const emptyReport = analyzeHabitSynergy([habitA], {}, mockDays);
    expect(emptyReport.hasSufficientData).toBe(false);
    expect(emptyReport.topPairs.length).toBe(0);
  });
});
