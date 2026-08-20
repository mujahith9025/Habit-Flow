import React from 'react';
import { HabitHistoryMetrics } from '../../hooks/useSingleHabitHistory';

interface HabitStatsGridProps {
  metrics: HabitHistoryMetrics;
  selectedMonthTitle?: string;
  habitColor?: string;
}

export const HabitStatsGrid: React.FC<HabitStatsGridProps> = ({
  metrics,
  selectedMonthTitle,
}) => {
  const {
    currentStreak,
    longestStreak,
    totalLifetimeCompletions,
    monthCompletionPercent,
    monthCompletedDays,
    daysInMonth,
  } = metrics;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Current Streak */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
            Current Streak
          </span>
          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 text-tertiary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
            {currentStreak}
            <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            Active momentum
          </p>
        </div>
      </div>

      {/* 2. Longest Streak Ever */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
            Best Streak
          </span>
          <div className="w-8 h-8 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
            {longestStreak}
            <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            All-time record
          </p>
        </div>
      </div>

      {/* 3. Selected Month Completion % */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            {selectedMonthTitle ? `${selectedMonthTitle} Rate` : 'Monthly Rate'}
          </span>
          <div className="w-8 h-8 rounded-full bg-secondary-fixed/30 text-secondary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              donut_large
            </span>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <div className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
              {monthCompletionPercent}
              <span className="text-xs font-normal text-on-surface-variant ml-0.5">%</span>
            </div>
            {daysInMonth > 0 && (
              <span className="text-[10px] font-stat-label text-on-surface-variant">
                {monthCompletedDays}/{daysInMonth}d
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full transition-all duration-500 bg-secondary"
              style={{ width: `${monthCompletionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Total Lifetime Check-ins */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
            All-Time Total
          </span>
          <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              task_alt
            </span>
          </div>
        </div>
        <div className="mt-3">
          <div className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
            {totalLifetimeCompletions}
            <span className="text-xs font-normal text-on-surface-variant ml-1">times</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            Across all months
          </p>
        </div>
      </div>
    </div>
  );
};
