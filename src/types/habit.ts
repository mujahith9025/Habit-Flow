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
