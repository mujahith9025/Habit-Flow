import React, { useState } from 'react';
import { Habit } from '../../types';
import { HabitGridMetrics, MonthDayInfo } from '../../hooks/useDailyHabitsData';
import { Button } from '../ui/Button';

interface CategoryAggregateGraphsViewProps {
  categoryName: string;
  habits: Habit[];
  daysInMonth: MonthDayInfo[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  onToggleEntry: (habitId: string, dateKey: string) => Promise<void>;
  selectedMonthTitle: string;
  onCreateHabit?: () => void;
}

const WEEK_THEMES = [
  { color: '#64b5f6', ringBg: 'rgba(100, 181, 246, 0.2)', name: 'week 1' },
  { color: '#f06292', ringBg: 'rgba(240, 98, 146, 0.2)', name: 'week 2' },
  { color: '#4db6ac', ringBg: 'rgba(77, 182, 172, 0.2)', name: 'week 3' },
  { color: '#ffb74d', ringBg: 'rgba(255, 183, 77, 0.2)', name: 'week 4' },
  { color: '#7986cb', ringBg: 'rgba(121, 134, 203, 0.2)', name: 'week 5' },
];

export const CategoryAggregateGraphsView: React.FC<CategoryAggregateGraphsViewProps> = ({
  categoryName,
  habits,
  daysInMonth,
  habitMetricsMap,
  isCompleted,
  onToggleEntry,
  selectedMonthTitle,
  onCreateHabit,
}) => {
  const [graphMode, setGraphMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const totalHabits = habits.length;
  const totalDaysInMonth = daysInMonth.length;

  if (totalHabits === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-8 shadow-soft border border-outline-variant/15 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed/30 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">dataset</span>
        </div>
        <h3 className="font-section-header text-lg font-bold text-on-surface">
          No Habits in {categoryName}
        </h3>
        <p className="font-body-text text-xs text-on-surface-variant max-w-sm mx-auto">
          Add your first habit to {categoryName} to start viewing daily, weekly, and monthly performance graphs.
        </p>
        {onCreateHabit && (
          <Button variant="primary" size="sm" onClick={onCreateHabit}>
            <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
            Add Habit to {categoryName}
          </Button>
        )}
      </div>
    );
  }

  // Compute daily aggregate completions
  const dailyStats = daysInMonth.map((day) => {
    let completedInDay = 0;
    habits.forEach((h) => {
      if (isCompleted(h.id, day.dateKey)) {
        completedInDay++;
      }
    });

    const percent = totalHabits > 0 ? Math.round((completedInDay / totalHabits) * 100) : 0;
    return {
      ...day,
      completedInDay,
      totalHabits,
      percent,
    };
  });

  // Divide the month into 5 week groups
  const weekRanges = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
    { start: 29, end: totalDaysInMonth },
  ].filter((r) => r.start <= totalDaysInMonth);

  let totalCompletionsAcrossMonth = 0;
  const totalPossibleChecks = totalHabits * totalDaysInMonth;

  const weeksData = weekRanges.map((range, idx) => {
    const theme = WEEK_THEMES[idx % WEEK_THEMES.length];
    const daysInThisWeek = dailyStats.slice(range.start - 1, Math.min(range.end, totalDaysInMonth));

    let weekCompletedChecks = 0;
    daysInThisWeek.forEach((d) => {
      weekCompletedChecks += d.completedInDay;
    });

    totalCompletionsAcrossMonth += weekCompletedChecks;

    const totalPossibleInWeek = totalHabits * daysInThisWeek.length;
    const weekPercent =
      totalPossibleInWeek > 0
        ? Math.round((weekCompletedChecks / totalPossibleInWeek) * 1000) / 10
        : 0;

    return {
      weekNum: idx + 1,
      label: theme.name,
      color: theme.color,
      ringBg: theme.ringBg,
      days: daysInThisWeek,
      weekCompletedChecks,
      totalPossibleInWeek,
      weekPercent,
    };
  });

  const monthAveragePercent =
    totalPossibleChecks > 0
      ? Math.round((totalCompletionsAcrossMonth / totalPossibleChecks) * 1000) / 10
      : 0;

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-6 shadow-soft border border-outline-variant/15 space-y-6">
      {/* 1. Header & Graph Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              insights
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              {categoryName} • Analytics & Graphs
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
            Comprehensive daily, weekly, and monthly performance across all {totalHabits} habit
            {totalHabits === 1 ? '' : 's'} in <span className="font-semibold text-on-surface">{categoryName}</span> ({selectedMonthTitle}).
          </p>
        </div>

        {/* 3 Graph Mode Toggle Pills: Daily / Weekly / Monthly */}
        <div className="flex items-center gap-1 bg-surface-container-low dark:bg-surface-container-high/40 p-1 rounded-xl border border-outline-variant/20 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setGraphMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              graphMode === 'daily'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">calendar_view_day</span>
            <span>Day</span>
          </button>

          <button
            onClick={() => setGraphMode('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              graphMode === 'weekly'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">bar_chart</span>
            <span>Week</span>
          </button>

          <button
            onClick={() => setGraphMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              graphMode === 'monthly'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">leaderboard</span>
            <span>Month</span>
          </button>
        </div>
      </div>

      {/* 2. Graph Presentation based on selected mode */}

      {/* MODE A: WEEKLY GRAPH (Reference Spreadsheet 5-Week Histogram + Donut Gauges) */}
      {graphMode === 'weekly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold">
              Week-by-Week Performance Gauges ({selectedMonthTitle})
            </span>
            <span className="text-xs font-stat-label font-bold text-primary dark:text-primary-fixed-dim">
              Overall Board Average: {monthAveragePercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-2">
            {weeksData.map((week) => {
              const radius = 34;
              const circumference = 2 * Math.PI * radius; // ~213.6
              const strokeDashoffset =
                circumference - (circumference * Math.min(100, Math.max(0, week.weekPercent))) / 100;

              return (
                <div
                  key={week.weekNum}
                  className="bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-2xl p-3.5 sm:p-4 border border-outline-variant/15 flex flex-col justify-between space-y-4 hover:border-outline-variant/40 transition-all shadow-sm"
                >
                  {/* Week Header */}
                  <div className="text-center">
                    <h4
                      className="font-serif italic text-base sm:text-lg font-medium tracking-wide capitalize"
                      style={{ color: week.color }}
                    >
                      {week.label}
                    </h4>
                    <span className="text-[10px] font-stat-label text-on-surface-variant block mt-0.5">
                      {week.weekCompletedChecks} of {week.totalPossibleInWeek} Checks Done
                    </span>
                  </div>

                  {/* Daily Histogram Bars in this Week */}
                  <div className="h-32 sm:h-36 flex items-end justify-center gap-1 sm:gap-1.5 pt-2 px-1 border-b border-outline-variant/15 pb-2">
                    {week.days.map((day) => {
                      return (
                        <div
                          key={day.dateKey}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer select-none"
                          title={`Day ${day.dayNum} (${day.dateKey}): ${day.completedInDay}/${day.totalHabits} habits (${day.percent}%)`}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface text-[9px] font-bold px-1.5 py-0.5 rounded shadow-soft whitespace-nowrap">
                            {day.completedInDay}/{day.totalHabits} ({day.percent}%)
                          </div>

                          {/* Bar */}
                          <div
                            className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                              day.percent > 0
                                ? 'shadow-sm group-hover:brightness-110'
                                : 'bg-outline-variant/20'
                            } ${day.isToday ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-surface-container' : ''}`}
                            style={{
                              height: day.percent > 0 ? `${Math.max(16, day.percent)}%` : '10%',
                              backgroundColor: day.percent > 0 ? week.color : undefined,
                            }}
                          />

                          {/* Day of Week */}
                          <span
                            className={`text-[9px] sm:text-[10px] uppercase font-bold mt-1.5 ${
                              day.isToday
                                ? 'text-primary dark:text-primary-fixed-dim font-black'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {day.dayOfWeek}
                          </span>

                          {/* Day Number */}
                          <span className="text-[8px] sm:text-[9px] font-stat-label text-on-surface-variant leading-none">
                            {day.dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Circular Donut Gauge */}
                  <div className="flex flex-col items-center justify-center pt-1">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          fill="transparent"
                          stroke={week.ringBg}
                          strokeWidth="6"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          fill="transparent"
                          stroke={week.color}
                          strokeWidth="6"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-app-title text-sm sm:text-base font-bold text-on-surface">
                          {week.weekPercent}%
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-stat-label">
                          AVG
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE B: DAILY GRAPH (31-Day Continuous Histogram) */}
      {graphMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold">
              31-Day Aggregate Activity Velocity ({selectedMonthTitle})
            </span>
            <span className="text-xs font-stat-label text-on-surface-variant">
              Scroll horizontally for all days
            </span>
          </div>

          {/* 31-Day Bar Chart */}
          <div className="bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 overflow-x-auto scrollbar-thin">
            <div className="h-44 flex items-end justify-between gap-1.5 min-w-[700px] pt-4 pb-2 border-b border-outline-variant/15">
              {dailyStats.map((day) => {
                const isFull = day.percent === 100;

                return (
                  <div
                    key={day.dateKey}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer select-none"
                    title={`Day ${day.dayNum} (${day.dateKey}): ${day.completedInDay} of ${day.totalHabits} completed (${day.percent}%)`}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface text-[9px] font-bold px-2 py-0.5 rounded shadow-soft whitespace-nowrap">
                      {day.completedInDay}/{day.totalHabits} ({day.percent}%)
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[16px] rounded-t-md transition-all duration-300 ${
                        isFull
                          ? 'bg-secondary shadow-sm'
                          : day.percent > 0
                          ? 'bg-primary'
                          : 'bg-outline-variant/20'
                      } ${day.isToday ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-surface-container' : ''}`}
                      style={{
                        height: day.percent > 0 ? `${Math.max(14, day.percent)}%` : '8%',
                      }}
                    />

                    {/* Day Number */}
                    <span
                      className={`text-[9px] font-stat-label font-bold mt-1.5 ${
                        day.isToday ? 'text-primary font-black' : 'text-on-surface-variant'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Row */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
              <span>Day 1</span>
              <span className="font-stat-label font-bold text-primary">
                Daily Completion Percentage Over Full Month
              </span>
              <span>Day {totalDaysInMonth}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODE C: MONTHLY GRAPH (Habit-by-Habit Progress Comparison & Streaks) */}
      {graphMode === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold">
              Habits Comparison & Consistency Meters ({selectedMonthTitle})
            </span>
            <span className="text-xs font-stat-label font-bold text-primary">
              {habits.length} Habits Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {habits.map((h, idx) => {
              const metrics = habitMetricsMap[h.id] || {
                completedCount: 0,
                monthProgressPercent: 0,
                streakCount: 0,
                targetCount: totalDaysInMonth,
              };

              return (
                <div
                  key={h.id}
                  className="bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 space-y-3 hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-stat-label text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface">
                        #{idx + 1}
                      </span>
                      <h4 className="font-habit-name text-sm font-semibold text-on-surface truncate">
                        {h.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 text-tertiary">
                      <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      <span className="font-stat-label text-xs font-bold">
                        {metrics.streakCount}d streak
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-stat-label">
                      <span className="text-on-surface-variant">
                        {metrics.completedCount} of {totalDaysInMonth} days done
                      </span>
                      <span className="font-bold text-primary dark:text-primary-fixed-dim">
                        {metrics.monthProgressPercent}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-surface-container-highest dark:bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-primary"
                        style={{ width: `${metrics.monthProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Interactive Daily Habit Matrix (Quick 1-Tap Toggle for all habits in title) */}
      <div className="pt-4 border-t border-outline-variant/15 space-y-3">
        <h4 className="font-section-header text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">
            table_chart
          </span>
          Daily Habit Check-in Matrix for {categoryName}
        </h4>

        <div className="overflow-x-auto scrollbar-thin rounded-xl border border-outline-variant/20">
          <table className="w-full border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-surface-container-low dark:bg-surface-container-high/60 border-b border-outline-variant/20 text-left">
                <th className="p-2 sm:p-3 text-xs font-stat-label uppercase font-bold text-on-surface-variant sticky left-0 z-10 bg-surface-container-low dark:bg-surface-container-high min-w-[95px] max-w-[105px] sm:min-w-[150px] sm:max-w-none">
                  Habit
                </th>
                {daysInMonth.map((day) => (
                  <th
                    key={day.dateKey}
                    className={`p-1.5 text-center min-w-[32px] text-[10px] font-stat-label ${
                      day.isToday ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    <div>{day.dayOfWeek}</div>
                    <div>{day.dayNum}</div>
                  </th>
                ))}
                <th className="sticky right-0 z-20 bg-surface-container-low dark:bg-surface-container-high p-3 text-right text-xs font-stat-label uppercase font-bold text-on-surface-variant min-w-[60px] border-l border-outline-variant/20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {habits.map((h) => {
                const metrics = habitMetricsMap[h.id];
                return (
                  <tr key={h.id} className="hover:bg-surface-container-low/40">
                    <td className="p-2 sm:p-3 font-semibold text-on-surface sticky left-0 z-10 bg-surface-container-lowest dark:bg-surface-container border-r border-outline-variant/15 min-w-[95px] max-w-[105px] sm:min-w-[150px] sm:max-w-none break-words whitespace-normal leading-snug">
                      {h.name}
                    </td>
                    {daysInMonth.map((day) => {
                      const done = isCompleted(h.id, day.dateKey);
                      return (
                        <td
                          key={day.dateKey}
                          className={`p-1 text-center border-r border-outline-variant/10 ${
                            day.isToday ? 'bg-primary-fixed/20 dark:bg-primary-fixed-dim/15' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleEntry(h.id, day.dateKey)}
                            title={`${h.name} - ${day.dateKey}: ${done ? 'Completed' : 'Pending'}`}
                            className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center transition-all ${
                              done
                                ? 'bg-primary text-on-primary font-bold shadow-xs'
                                : 'border border-outline-variant/40 hover:border-primary'
                            }`}
                          >
                            {done && <span className="material-symbols-outlined text-[13px]">check</span>}
                          </button>
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 text-right font-bold text-primary border-l border-outline-variant/15 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      {metrics?.monthProgressPercent ?? 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
