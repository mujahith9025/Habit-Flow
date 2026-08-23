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
  habitColor = '#006398',
}) => {
  const {
    currentStreak,
    longestStreak,
    totalLifetimeCompletions,
    monthCompletionPercent,
    monthCompletedDays,
    daysInMonth,
    allTimeRatePercent,
    totalNotesCount,
  } = metrics;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
      {/* 1. Current Streak */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            Current Streak
          </span>
          <div className="w-7 h-7 rounded-full bg-tertiary-container/30 text-tertiary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
            {currentStreak}
            <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            Active streak
          </p>
        </div>
      </div>

      {/* 2. Longest Streak Ever */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            Best Streak
          </span>
          <div className="w-7 h-7 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
            {longestStreak}
            <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            All-time record
          </p>
        </div>
      </div>

      {/* 3. Selected Month Completion % */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            {selectedMonthTitle ? `${selectedMonthTitle}` : 'Month Rate'}
          </span>
          <div className="w-7 h-7 rounded-full bg-secondary-fixed/30 text-secondary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              donut_large
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
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
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            All-Time Total
          </span>
          <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              task_alt
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
            {totalLifetimeCompletions}
            <span className="text-xs font-normal text-on-surface-variant ml-1">times</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            Lifetime check-ins
          </p>
        </div>
      </div>

      {/* 5. All-Time Consistency Rate */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            All-Time Rate
          </span>
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              percent
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="font-app-title text-xl sm:text-2xl font-bold text-primary dark:text-primary-fixed-dim">
            {allTimeRatePercent ?? 0}
            <span className="text-xs font-normal text-on-surface-variant ml-0.5">%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${allTimeRatePercent ?? 0}%`,
                backgroundColor: habitColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* 6. Reflections Logged */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 sm:p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
            Reflections
          </span>
          <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              edit_note
            </span>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
            {totalNotesCount ?? 0}
            <span className="text-xs font-normal text-on-surface-variant ml-1">notes</span>
          </div>
          <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
            Logged insights
          </p>
        </div>
      </div>
    </div>
  );
};
