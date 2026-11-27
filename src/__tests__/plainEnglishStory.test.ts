import { describe, it, expect } from 'vitest';
import { generatePlainEnglishStory } from '../utils/plainEnglishStory';
import { Habit, HabitEntry } from '../types';
import { HabitGridMetrics } from '../hooks/useDailyHabitsData';

describe('Plain English Story Generator (Executive TL;DR)', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Morning Meditation',
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
      name: 'Evening Reading',
      frequency: 'daily',
      goalCount: 1,
      createdAt: '2026-01-01',
      archived: false,
      sortOrder: 2,
      icon: 'menu_book',
      color: '#A65A42',
    },
  ];

  const mockMetricsMap: Record<string, HabitGridMetrics> = {
    h1: {
      habit: mockHabits[0],
      targetCount: 30,
      completedCount: 26,
      streakCount: 19,
      monthProgressPercent: 87,
    },
    h2: {
      habit: mockHabits[1],
      targetCount: 30,
      completedCount: 16,
      streakCount: 4,
      monthProgressPercent: 53,
    },
  };

  const mockEntries: Record<string, Record<string, HabitEntry>> = {
    h1: {},
    h2: {},
  };

  const mockDaysInMonth = Array.from({ length: 30 }, (_, i) => ({
    dayNum: i + 1,
    dateKey: `2026-11-${String(i + 1).padStart(2, '0')}`,
    isToday: i === 20,
  }));

  it('generates 3 conversational narrative answers for active habits', () => {
    const selectedDate = new Date(2026, 10, 1);
    const story = generatePlainEnglishStory(
      mockHabits,
      mockMetricsMap,
      mockEntries,
      mockDaysInMonth,
      selectedDate,
      'Mindfulness Board'
    );

    // 1. How did I do?
    expect(story.performanceHeadline).toBeDefined();
    expect(story.overallRate).toBe(70); // (87 + 53) / 2
    expect(story.totalChecks).toBe(42); // 26 + 16

    // 2. Where did I stumble?
    expect(story.frictionHeadline).toBeDefined();
    expect(story.frictionRemedy).toBeDefined();

    // 3. What is my next milestone?
    expect(story.milestoneHeadline).toContain('Morning Meditation');
    expect(story.daysToMilestone).toBeGreaterThan(0);
  });

  it('handles zero active habits gracefully', () => {
    const story = generatePlainEnglishStory(
      [],
      {},
      {},
      mockDaysInMonth,
      new Date(2026, 10, 1),
      'General'
    );

    expect(story.overallRate).toBe(0);
    expect(story.performanceHeadline).toBe('Starting Your Journey');
    expect(story.frictionRemedy).toContain('2 minutes');
  });
});
