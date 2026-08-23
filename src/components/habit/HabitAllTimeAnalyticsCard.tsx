import React from 'react';
import { HabitHistoryMetrics } from '../../hooks/useSingleHabitHistory';

interface HabitAllTimeAnalyticsCardProps {
  habitName: string;
  habitColor?: string;
  metrics: HabitHistoryMetrics;
}

export const HabitAllTimeAnalyticsCard: React.FC<HabitAllTimeAnalyticsCardProps> = ({
  habitName,
  habitColor = '#006398',
  metrics,
}) => {
  const {
    totalLifetimeCompletions,
    totalTrackedDays,
    longestStreak,
    allTimeRatePercent,
    daysSinceCreation,
    totalNotesCount,
    bestMonth,
    dayOfWeekStats,
    monthlyHistory,
  } = metrics;

  // Find day with maximum completions
  const maxDayCount = Math.max(...dayOfWeekStats.map((d) => d.count), 1);
  const bestDay = dayOfWeekStats.reduce(
    (max, d) => (d.count > max.count ? d : max),
    dayOfWeekStats[0]
  );

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              all_inclusive
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              All-Time Habit Analytics & Intelligence
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
            Lifetime records, consistency patterns, and historical milestones for <span className="font-semibold text-on-surface">{habitName}</span>.
          </p>
        </div>

        {/* Lifetime Momentum Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-fixed-dim text-xs font-bold font-stat-label">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>
            {allTimeRatePercent >= 75
              ? '🌟 Champion Momentum'
              : allTimeRatePercent >= 50
              ? '⚡ Solid Consistency'
              : '🌱 Building Foundation'}
          </span>
        </div>
      </div>

      {/* 4 Lifetime Performance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. All-Time Check-ins */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Days Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[17px]">task_alt</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface">
              {totalLifetimeCompletions}
              <span className="text-xs font-normal text-on-surface-variant ml-1">/ {totalTrackedDays || daysSinceCreation}d</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              {totalLifetimeCompletions} of {totalTrackedDays || daysSinceCreation} days done • Best: <span className="font-bold text-tertiary">{longestStreak}d</span>
            </p>
          </div>
        </div>

        {/* 2. All-Time Consistency Rate */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              All-Time Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[17px]">percent</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-primary dark:text-primary-fixed-dim">
              {allTimeRatePercent}%
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest dark:bg-surface-container rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all duration-500 bg-primary"
                style={{ width: `${allTimeRatePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Best Month Ever */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Best Month Ever
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[17px]">military_tech</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-xl sm:text-2xl font-bold text-on-surface truncate">
              {bestMonth ? bestMonth.monthTitle : 'N/A'}
            </div>
            <p className="text-[10px] font-stat-label text-amber-600 dark:text-amber-400 font-bold mt-0.5">
              {bestMonth ? `${bestMonth.percent}% completion (${bestMonth.completedCount}d)` : 'Start tracking'}
            </p>
          </div>
        </div>

        {/* 4. Total Reflections Logged */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Reflections Logged
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[17px]">edit_note</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface">
              {totalNotesCount}
              <span className="text-xs font-normal text-on-surface-variant ml-1">notes</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Moods & daily reflections
            </p>
          </div>
        </div>
      </div>

      {/* Day-of-Week Breakdown + Month-by-Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Left 5 Cols: Day-of-Week Consistency Pattern */}
        <div className="lg:col-span-5 bg-surface-container-low/50 dark:bg-surface-container-high/20 rounded-2xl p-4 sm:p-5 border border-outline-variant/15 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-section-header text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
                Day-of-Week Consistency
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {bestDay && bestDay.count > 0 ? (
                  <>
                    Strongest on <span className="font-bold text-primary">{bestDay.day}s</span> ({bestDay.count} times)
                  </>
                ) : (
                  'Track entries to reveal peak days'
                )}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_view_week</span>
          </div>

          {/* Vertical Bars for Days of Week */}
          <div className="h-32 flex items-end justify-between gap-2 pt-3 pb-1 border-b border-outline-variant/15">
            {dayOfWeekStats.map((d) => {
              const heightPct = maxDayCount > 0 ? Math.max(12, Math.round((d.count / maxDayCount) * 100)) : 12;
              const isPeak = bestDay && d.day === bestDay.day && d.count > 0;

              return (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface text-[9px] font-bold px-1.5 py-0.5 rounded shadow-soft whitespace-nowrap">
                    {d.count} checks ({d.percent}%)
                  </div>

                  <div
                    className={`w-full max-w-[20px] rounded-t-md transition-all duration-500 ${
                      isPeak
                        ? 'bg-primary shadow-xs ring-1 ring-primary/40'
                        : d.count > 0
                        ? 'bg-primary/60'
                        : 'bg-outline-variant/20'
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: d.count > 0 ? habitColor : undefined,
                    }}
                  />

                  <span
                    className={`text-[10px] uppercase font-bold mt-1.5 ${
                      isPeak ? 'text-primary font-black' : 'text-on-surface-variant'
                    }`}
                  >
                    {d.shortLabel}
                  </span>
                  <span className="text-[9px] font-stat-label text-on-surface-variant leading-none">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Month-by-Month All-Time Performance Timeline */}
        <div className="lg:col-span-7 bg-surface-container-low/50 dark:bg-surface-container-high/20 rounded-2xl p-4 sm:p-5 border border-outline-variant/15 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-section-header text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
                All-Time Monthly Performance Timeline
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Historical monthly completion rate and days logged.
              </p>
            </div>
            <span className="material-symbols-outlined text-secondary text-[20px]">trending_up</span>
          </div>

          <div className="space-y-2.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
            {monthlyHistory.map((m) => (
              <div
                key={m.monthKey}
                className="bg-surface-container-lowest dark:bg-surface-container p-2.5 rounded-xl border border-outline-variant/15 flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-stat-label font-bold text-on-surface min-w-[70px]">
                  {m.monthTitle}
                </span>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-surface-container-highest dark:bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.percent}%`,
                        backgroundColor: habitColor,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-stat-label text-on-surface-variant min-w-[45px] text-right">
                    {m.completedCount}/{m.daysInMonth}d
                  </span>
                </div>

                <span className="font-stat-label font-black text-primary dark:text-primary-fixed-dim min-w-[35px] text-right">
                  {m.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
