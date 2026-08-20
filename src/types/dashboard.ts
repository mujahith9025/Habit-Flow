export type DashboardViewTab = 'daily' | 'weekly' | 'monthly';

export interface MonthYearState {
  year: number;
  month: number; // 1-12
  monthKey: string; // "YYYY-MM"
  formattedTitle: string; // e.g. "August 2026"
}

export interface DashboardMetrics {
  totalDailyHabits: number;
  completedTodayCount: number;
  completionPercentage: number;
  streakCount: number;
  isShieldActive?: boolean;
  shieldsRemaining?: number;
  todayDateKey: string;
  loading: boolean;
}
