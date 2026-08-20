export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  category?: string; // e.g. "Self Challenges", "Diet", "Fitness", "Mindfulness", "General"
  icon: string;
  color: string;
  frequency: HabitFrequency;
  timeOfDay?: TimeOfDay;
  goalCount: number;
  createdAt: string;
  archived: boolean;
  sortOrder: number;
}

export interface HabitEntry {
  date: string; // e.g. "2026-08-19"
  completed: boolean;
  weekOfMonth: number; // 1-5 (for weekly habits)
  monthKey: string; // e.g. "2026-08" (for monthly query filtering)
  updatedAt: string;
}

export type HabitEntryMap = Record<string, HabitEntry>;
