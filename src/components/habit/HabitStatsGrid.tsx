import React, { useMemo } from 'react';
import { HabitHistoryMetrics } from '../../hooks/useSingleHabitHistory';
import { useSmoothSparkline } from '../../hooks/useAnalyticsWorker';
import { BotanicalGrowthRankBadge } from './BotanicalGrowthRankBadge';

interface HabitStatsGridProps {
  metrics: HabitHistoryMetrics;
  selectedMonthTitle?: string;
  habitColor?: string;
  isCompleted?: (dateKey: string) => boolean;
  selectedDate?: Date;
}

export const HabitStatsGrid: React.FC<HabitStatsGridProps> = ({
  metrics,
  selectedMonthTitle,
  habitColor = '#2D5A34',
  isCompleted,
  selectedDate,
}) => {
  const {
    currentStreak,
    longestStreak,
    totalLifetimeCompletions,
    totalTrackedDays,
    monthCompletionPercent,
    monthCompletedDays,
    daysInMonth,
    allTimeRatePercent,
    daysSinceCreation,
  } = metrics;

  const trackedDaysTotal = totalTrackedDays || daysSinceCreation || 1;

  // Compute 30-Day base days list
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  const baseDateKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

  const daysList = useMemo(() => {
    const list: { dateKey: string; label: string; completed: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const completed = isCompleted ? isCompleted(dateKey) : false;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({ dateKey, label, completed });
    }
    return list;
  }, [baseDateKey, isCompleted]);

  // Compute smooth Catmull-Rom cubic bezier sparkline via cached worker pipeline
  const trendData = useSmoothSparkline(habitColor, daysList, baseDateKey, 300, 44);

  const svgWidth = 300;
  const svgHeight = 44;
  const linePath = trendData.smoothLinePath;
  const areaPath = trendData.smoothAreaPath;

  return (
    <div className="space-y-3.5">
      {/* 1. Primary Metrics Grid (Balanced 3x2 KPI Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 1. Current Streak */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
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
            <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-on-surface">
              {currentStreak}
              <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
            </div>
            <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
              Active streak
            </p>
          </div>
        </div>

        {/* 2. Longest Streak Ever */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
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
            <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-on-surface">
              {longestStreak}
              <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
            </div>
            <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
              All-time record
            </p>
          </div>
        </div>

        {/* 3. Selected Month Completion % */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
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
              <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-on-surface">
                {monthCompletionPercent}
                <span className="text-xs font-normal text-on-surface-variant ml-0.5">%</span>
              </div>
              {daysInMonth > 0 && (
                <span className="text-[10px] font-stat-label font-tnum text-on-surface-variant">
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
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
              All-Time Done
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                task_alt
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-on-surface">
              {totalLifetimeCompletions}
              <span className="text-xs font-normal text-on-surface-variant ml-1 font-tnum">/ {trackedDaysTotal}d</span>
            </div>
            <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
              {totalLifetimeCompletions} of {trackedDaysTotal} days done
            </p>
          </div>
        </div>

        {/* 5. All-Time Consistency Rate */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
              All-Time Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                percent
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-primary dark:text-primary-fixed-dim">
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

        {/* 6. Total Days Tracked */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 shadow-soft border border-outline-variant/15 flex flex-col justify-between min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">
              Days Tracked
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_month
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="font-app-title font-tnum text-xl sm:text-2xl font-bold text-on-surface">
              {trackedDaysTotal}
              <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
            </div>
            <p className="font-body-text text-[10px] text-on-surface-variant mt-0.5">
              Since habit creation
            </p>
          </div>
        </div>
      </div>

      {/* 2. 30-Day Completion Trendline & Momentum Sparkline Banner */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-4.5 shadow-soft border border-outline-variant/15 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              show_chart
            </span>
            <div>
              <h3 className="font-section-header text-xs sm:text-sm font-bold text-on-surface leading-tight">
                30-Day Completion Momentum Trendline
              </h3>
              <p className="font-body-text text-[11px] text-on-surface-variant">
                {trendData.completedCount} of last 30 days completed • {trendData.ratePercent}% consistency
              </p>
            </div>
          </div>

          {/* Momentum & Botanical Growth Rank Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <BotanicalGrowthRankBadge
              days={longestStreak || currentStreak}
              size="sm"
              showProgress={false}
            />
            {trendData.momentum === 'rising' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Momentum Rising (+{trendData.delta > 0 ? trendData.delta : 2})</span>
              </span>
            )}
            {trendData.momentum === 'slowing' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-error-container/30 text-error border border-error/25 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                <span>Momentum Slowing ({trendData.delta})</span>
              </span>
            )}
            {trendData.momentum === 'steady' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_flat</span>
                <span>Steady Consistency</span>
              </span>
            )}
          </div>
        </div>

        {/* SVG Sparkline Curve */}
        <div className="relative w-full overflow-hidden pt-1">
          <svg
            className="w-full h-11 overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={habitColor || '#2D5A34'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={habitColor || '#2D5A34'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area under curve */}
            <path d={areaPath} fill="url(#sparklineGrad)" />

            {/* Smooth trendline */}
            <path
              d={linePath}
              fill="none"
              stroke={habitColor || '#2D5A34'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* 30 Daily Node Pills along bottom */}
          <div
            className="gap-0.5 sm:gap-1 pt-1.5"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}
          >
            {daysList.map((day) => (
              <div
                key={day.dateKey}
                title={`${day.label}: ${day.completed ? 'Completed' : 'Pending'}`}
                className={`h-2 sm:h-2.5 rounded-full transition-all cursor-pointer hover:scale-125 ${
                  day.completed
                    ? 'shadow-2xs'
                    : 'bg-surface-container-high/60 dark:bg-surface-container-highest/40'
                }`}
                style={{
                  backgroundColor: day.completed ? habitColor || '#2D5A34' : undefined,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[9.5px] font-stat-label text-on-surface-variant pt-1 px-0.5">
            <span>30 days ago</span>
            <span>15 days ago</span>
            <span className="font-bold text-on-surface">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};
