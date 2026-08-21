export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  category?: string; // e.g. "Self Challenges", "Diet", "Fitness", "Mindfulness", "General"
  icon: string;
  color: string;
  frequency: HabitFrequency;
  goalCount: number;
  createdAt: string;
  archived: boolean;
  sortOrder: number;

  // Month-Specific Lifecycle & Scoping fields
  startMonth?: string; // e.g. "2026-08" (habit only active from this month onwards)
  endMonth?: string; // e.g. "2026-08" (habit only active up to this month)
  excludedMonths?: string[]; // e.g. ["2026-08"] (months where this habit was removed/hidden without deleting from other months)
}

/**
 * Checks if a habit is active and should be displayed in a given month (YYYY-MM)
 */
export function isHabitActiveInMonth(habit: Habit, monthKey: string): boolean {
  if (habit.archived) return false;
  if (habit.excludedMonths && habit.excludedMonths.includes(monthKey)) return false;
  if (habit.startMonth && monthKey < habit.startMonth) return false;
  if (habit.endMonth && monthKey > habit.endMonth) return false;
  return true;
}

export type HabitMood = 'energized' | 'calm' | 'focused' | 'proud' | 'tired';

export interface HabitEntry {
  date: string; // e.g. "2026-08-19"
  completed: boolean;
  note?: string; // 1-Tap Daily Habit Note or Reflection
  mood?: HabitMood; // Quick mood reflection
  tags?: string[]; // Quick reflection tags
  weekOfMonth: number; // 1-5 (for weekly habits)
  monthKey: string; // e.g. "2026-08" (for monthly query filtering)
  updatedAt: string;
}

export type HabitEntryMap = Record<string, HabitEntry>;
