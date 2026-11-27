import { Habit, HabitEntry, HabitEntryMap } from '../types';
import { getWeekOfMonth } from '../lib/firebase';

/**
 * Rich, realistic starter habits for Demo / Guest mode
 */
export function getDemoInitialHabits(): Habit[] {
  const now = new Date();
  const year = now.getFullYear();
  const startMonth = `${year}-01`;

  return [
    {
      id: 'demo-habit-meditation',
      name: 'Morning Meditation',
      category: 'Mindfulness',
      icon: 'self_improvement',
      color: '#2D5A34', // Primary Forest Green
      frequency: 'daily',
      goalCount: 1,
      createdAt: now.toISOString(),
      archived: false,
      sortOrder: 0,
      habitType: 'timer',
      timerDuration: 15,
      timeOfDay: 'morning',
      tags: ['#mindset', '#calm'],
      startMonth,
    },
    {
      id: 'demo-habit-focus',
      name: 'Deep Work Focus (2hr)',
      category: 'Focus',
      icon: 'psychology',
      color: '#0284c7', // Ocean Blue
      frequency: 'daily',
      goalCount: 1,
      createdAt: now.toISOString(),
      archived: false,
      sortOrder: 1,
      habitType: 'boolean',
      timeOfDay: 'afternoon',
      tags: ['#productivity', '#career'],
      startMonth,
    },
    {
      id: 'demo-habit-hydration',
      name: 'Daily Hydration (2.5L)',
      category: 'Health',
      icon: 'water_drop',
      color: '#0891b2', // Teal
      frequency: 'daily',
      goalCount: 1,
      createdAt: now.toISOString(),
      archived: false,
      sortOrder: 2,
      habitType: 'numeric',
      targetValue: 2500,
      unit: 'ml',
      stepValue: 250,
      timeOfDay: 'anytime',
      tags: ['#vitality', '#health'],
      startMonth,
    },
    {
      id: 'demo-habit-reading',
      name: 'Evening Reading',
      category: 'Personal Growth',
      icon: 'menu_book',
      color: '#d97706', // Warm Amber
      frequency: 'daily',
      goalCount: 1,
      createdAt: now.toISOString(),
      archived: false,
      sortOrder: 3,
      habitType: 'numeric',
      targetValue: 20,
      unit: 'pages',
      stepValue: 5,
      timeOfDay: 'evening',
      tags: ['#learning', '#evening'],
      startMonth,
    },
    {
      id: 'demo-habit-workout',
      name: 'HIIT & Movement',
      category: 'Fitness',
      icon: 'fitness_center',
      color: '#16a34a', // Emerald
      frequency: 'weekly',
      goalCount: 4,
      createdAt: now.toISOString(),
      archived: false,
      sortOrder: 4,
      habitType: 'boolean',
      timeOfDay: 'morning',
      tags: ['#fitness', '#energy'],
      startMonth,
    },
  ];
}

/**
 * Generate realistic habit entries for demo mode for a given monthKey (YYYY-MM)
 */
export function getDemoInitialEntries(habitId: string, monthKey: string): HabitEntryMap {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const maxDay = (year === now.getFullYear() && month === now.getMonth() + 1)
    ? now.getDate()
    : daysInMonth;

  const entries: HabitEntryMap = {};

  // Deterministic seed pattern based on habitId hash
  const hash = habitId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let d = 1; d <= maxDay; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${monthKey}-${dayStr}`;

    // ~80% completion rate with predictable variation
    const dayScore = (d * 7 + hash) % 10;
    const completed = dayScore >= 2;

    const isNumeric = habitId.includes('hydration') || habitId.includes('reading');
    const targetVal = habitId.includes('hydration') ? 2500 : 20;

    const entry: HabitEntry = {
      date: dateKey,
      completed,
      currentValue: isNumeric ? (completed ? targetVal : Math.floor(targetVal * 0.4)) : (completed ? 1 : 0),
      note: completed && d % 4 === 0 ? 'Consistent and mindful flow session.' : undefined,
      weekOfMonth: getWeekOfMonth(dateKey),
      monthKey,
      updatedAt: now.toISOString(),
    };

    entries[dateKey] = entry;
  }

  return entries;
}
