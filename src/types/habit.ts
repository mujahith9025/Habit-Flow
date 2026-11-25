export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type HabitType = 'boolean' | 'numeric' | 'timer';
export type HabitScheduleType = 'daily' | 'days_of_week' | 'times_per_week';

export interface Habit {
  id: string;
  name: string;
  category?: string; // e.g. "Self Challenges", "Diet", "Fitness", "Mindfulness", "General"
  icon: string;
  color: string;
  frequency: HabitFrequency;
  timeOfDay?: HabitTimeOfDay; // Time-aware ritual bundle: 'morning' | 'afternoon' | 'evening' | 'anytime'
  goalCount: number;
  createdAt: string;
  archived: boolean;
  sortOrder: number;

  // Habit Type & Quantitative Target Specifications
  habitType?: HabitType; // 'boolean' | 'numeric' | 'timer' (default: 'boolean')
  targetValue?: number; // Quantitative target (e.g. 2500 for ml water, 50 for pushups, 20 for pages)
  unit?: string; // Unit string (e.g. 'ml', 'pushups', 'pages', 'steps', 'min', 'km')
  stepValue?: number; // Increment/decrement step (e.g. 250 for ml, 5 for pushups, default 1)

  // Zen Timer & Pomodoro Specifications
  timerDuration?: number; // Target timer duration in minutes (e.g. 15 for meditation, 25 for pomodoro, 45 for deep work)

  // Flexible Schedules
  scheduleType?: HabitScheduleType; // 'daily' | 'days_of_week' | 'times_per_week'
  daysOfWeek?: number[]; // [0..6] (0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat)
  targetDaysPerWeek?: number; // e.g. 3 for "3x per week"

  // Custom Tags & Categorization
  tags?: string[]; // Custom hashtags e.g. ['#morning', '#health', '#mindset']

  // Vacation / Travel Pause & Streak Freeze
  isPaused?: boolean; // When true, habit is on vacation/break without breaking streak
  pauseStartDate?: string; // e.g. "2026-11-20"
  pauseEndDate?: string; // e.g. "2026-11-28"
  pauseReason?: string; // e.g. "Vacation", "Illness", "Travel", "Rest"

  // Month-Specific Lifecycle & Scoping fields
  startMonth?: string; // e.g. "2026-08" (habit only active from this month onwards)
  endMonth?: string; // e.g. "2026-08" (habit only active up to this month)
  excludedMonths?: string[]; // e.g. ["2026-08"] (months where this habit was removed/hidden without deleting from other months)
}

export interface WeeklyReviewRecord {
  weekKey: string; // e.g. "2026-W46"
  createdAt: string;
  totalCompletions: number;
  totalPossible: number;
  completionRate: number;
  reflection: string;
  highlightHabit?: string;
  peakDay?: string;
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

/**
 * Checks if a habit is paused for vacation/recovery on a given date (Date or YYYY-MM-DD string)
 */
export function isHabitPausedOnDate(habit: Habit, date: Date | string): boolean {
  if (!habit.isPaused) return false;
  let dateKey: string;
  if (typeof date === 'string') {
    dateKey = date;
  } else {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    dateKey = `${y}-${m}-${d}`;
  }
  if (habit.pauseStartDate && habit.pauseEndDate) {
    return dateKey >= habit.pauseStartDate && dateKey <= habit.pauseEndDate;
  }
  if (habit.pauseStartDate) {
    return dateKey >= habit.pauseStartDate;
  }
  return true;
}

/**
 * Checks if a habit is scheduled to be completed on a specific day of the week
 */
export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  if (isHabitPausedOnDate(habit, date)) {
    return false;
  }
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (!isHabitActiveInMonth(habit, monthKey)) {
    return false;
  }
  if (habit.scheduleType === 'days_of_week' && habit.daysOfWeek && habit.daysOfWeek.length > 0) {
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return habit.daysOfWeek.includes(dayOfWeek);
  }
  return true;
}

export type HabitMood = 'energized' | 'calm' | 'focused' | 'proud' | 'tired';

export interface HabitEntry {
  date: string; // e.g. "2026-08-19"
  completed: boolean;
  currentValue?: number; // Quantitative progress (e.g. 1500 for ml water, 30 for pushups)
  timerSecondsElapsed?: number; // Total seconds logged with Zen Timer
  note?: string; // 1-Tap Daily Habit Note or Reflection
  mood?: HabitMood; // Quick mood reflection
  tags?: string[]; // Quick reflection tags
  weekOfMonth: number; // 1-5 (for weekly habits)
  monthKey: string; // e.g. "2026-08" (for monthly query filtering)
  updatedAt: string;
}

/**
 * Determines whether an entry counts as completed based on habit type & targets
 */
export function isEntryCompleted(habit: Habit, entry?: HabitEntry): boolean {
  if (!entry) return false;
  if (entry.completed) return true;
  if (habit.habitType === 'numeric' && habit.targetValue && habit.targetValue > 0) {
    return (entry.currentValue ?? 0) >= habit.targetValue;
  }
  if (habit.habitType === 'timer' && habit.timerDuration && habit.timerDuration > 0) {
    const targetSeconds = habit.timerDuration * 60;
    return (entry.timerSecondsElapsed ?? (entry.currentValue ? entry.currentValue * 60 : 0)) >= targetSeconds;
  }
  return false;
}

export type HabitEntryMap = Record<string, HabitEntry>;

/**
 * Quantitative and qualitative value for a single day in a monthly matrix
 */
export interface MonthlyHabitDayValue {
  v?: number; // currentValue (e.g. 2500 ml water)
  t?: number; // timerSecondsElapsed (e.g. 900s)
  n?: string; // quick note preview
  m?: HabitMood; // mood reflection
}

/**
 * Denormalized Monthly Habit Record
 * Contains a 32-bit bitmask for daily completion (days 1-31)
 * and optional day-specific values.
 */
export interface MonthlyHabitRecord {
  bitmask: number;
  values?: Record<string, MonthlyHabitDayValue>;
}

/**
 * Denormalized Monthly Matrix Document
 * Stored at: users/{uid}/monthlyMatrices/{monthKey}
 * Replaces hundreds of individual subcollection document reads with 1 single document read.
 */
export interface MonthlyMatrixDocument {
  monthKey: string; // "YYYY-MM"
  version: number;
  updatedAt: string;
  habits: Record<string, MonthlyHabitRecord>;
}

