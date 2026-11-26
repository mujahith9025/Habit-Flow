import { describe, it, expect } from 'vitest';
import { calculateFlowForecast } from '../utils/flowForecast';
import { Habit, HabitEntry } from '../types/habit';
import { MonthDayInfo } from '../hooks/useDailyHabitsData';

describe('Flow Forecast & Pacing Intelligence Engine', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Morning Meditation',
      category: 'Mindfulness',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-01-01',
      archived: false,
      sortOrder: 1,
      icon: 'self_improvement',
      color: '#2D5A34',
    },
    {
      id: 'h2',
      name: 'Deep Work Session',
      category: 'Productivity',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-01-01',
      archived: false,
      sortOrder: 2,
      icon: 'work',
      color: '#4A6B82',
    },
  ];

  const mockDays: MonthDayInfo[] = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateKey = `2026-11-${String(dayNum).padStart(2, '0')}`;
    return {
      dayNum,
      dateKey,
      dayOfWeek: 'M',
      isToday: dayNum === 20,
      isPast: dayNum < 20,
      isFuture: dayNum > 20,
    };
  });

  it('correctly calculates projected completion rate and pacing for current month', () => {
    const entriesByHabit: Record<string, Record<string, HabitEntry>> = {
      h1: {},
      h2: {},
    };

    // Simulate 18 days completed out of 20 elapsed days
    for (let d = 1; d <= 20; d++) {
      const dateKey = `2026-11-${String(d).padStart(2, '0')}`;
      if (d <= 18) {
        entriesByHabit.h1[dateKey] = {
          date: dateKey,
          completed: true,
          weekOfMonth: 1,
          monthKey: '2026-11',
          updatedAt: '',
        };
        entriesByHabit.h2[dateKey] = {
          date: dateKey,
          completed: true,
          weekOfMonth: 1,
          monthKey: '2026-11',
          updatedAt: '',
        };
      }
    }

    const forecast = calculateFlowForecast(
      mockHabits,
      entriesByHabit,
      mockDays,
      new Date(2026, 10, 20)
    );

    expect(forecast).toBeDefined();
    expect(forecast.isCurrentMonth).toBe(true);
    expect(forecast.completedToDate).toBe(36); // 18 * 2
    expect(forecast.projectedRatePercent).toBeGreaterThan(0);
    expect(forecast.naturalLanguageInsight).toBeDefined();
  });

  it('correctly handles a past month as locked historical data', () => {
    const entriesByHabit: Record<string, Record<string, HabitEntry>> = { h1: {}, h2: {} };
    // Complete all 30 days
    mockDays.forEach((d) => {
      entriesByHabit.h1[d.dateKey] = {
        date: d.dateKey,
        completed: true,
        weekOfMonth: 1,
        monthKey: '2025-10',
        updatedAt: '',
      };
      entriesByHabit.h2[d.dateKey] = {
        date: d.dateKey,
        completed: true,
        weekOfMonth: 1,
        monthKey: '2025-10',
        updatedAt: '',
      };
    });

    const pastDate = new Date(2025, 9, 1);
    const forecast = calculateFlowForecast(mockHabits, entriesByHabit, mockDays, pastDate);

    expect(forecast.isPastMonth).toBe(true);
    expect(forecast.projectedRatePercent).toBe(100);
    expect(forecast.is80TargetSecured).toBe(true);
    expect(forecast.daysRemaining).toBe(0);
  });
});
