import React, { useState } from 'react';
import { Habit } from '../../types';
import { HabitGridMetrics, MonthDayInfo } from '../../hooks/useDailyHabitsData';
import { useCategoryAllTimeData } from '../../hooks/useCategoryAllTimeData';
import { Button } from '../ui/Button';
import { triggerHaptic } from '../../utils/haptics';

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
  const [graphMode, setGraphMode] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');
  const allTimeData = useCategoryAllTimeData(habits);

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

          <button
            onClick={() => setGraphMode('alltime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              graphMode === 'alltime'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">all_inclusive</span>
            <span>All-Time</span>
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

      {/* MODE C: MONTHLY GRAPH (Overall Month Circular Donut Gauge + Individual Habit Meters) */}
      {graphMode === 'monthly' && (() => {
        const monthRadius = 40;
        const monthCircumference = 2 * Math.PI * monthRadius; // ~251.32
        const monthStrokeDashoffset =
          monthCircumference - (monthCircumference * Math.min(100, Math.max(0, monthAveragePercent))) / 100;

        return (
          <div className="space-y-5">
            {/* 1. Overall Month Circular Progress Hero Banner */}
            <div className="bg-surface-container-low/80 dark:bg-surface-container-high/40 rounded-2xl p-4 sm:p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Background Ambient Glow */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Left: Text Details & Statistics */}
              <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim text-xs font-bold font-stat-label">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    pie_chart
                  </span>
                  <span>Overall Monthly Consistency</span>
                </div>

                <h4 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
                  {categoryName} • {selectedMonthTitle} Performance
                </h4>

                <p className="font-body-text text-xs text-on-surface-variant max-w-md">
                  Cumulative consistency score across all {totalHabits} habit{totalHabits === 1 ? '' : 's'} tracked in {categoryName} over {totalDaysInMonth} calendar days.
                </p>

                {/* Stat Chips */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                    <span className="text-on-surface-variant">Checks Completed: </span>
                    <span className="font-bold text-primary dark:text-primary-fixed-dim">
                      {totalCompletionsAcrossMonth} / {totalPossibleChecks}
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                    <span className="text-on-surface-variant">Habits Tracked: </span>
                    <span className="font-bold text-on-surface">{totalHabits}</span>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                    <span className="text-on-surface-variant">Days in Month: </span>
                    <span className="font-bold text-on-surface">{totalDaysInMonth}</span>
                  </div>
                </div>
              </div>

              {/* Right: Large Circular Donut Gauge (matching Week circular design) */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r={monthRadius}
                      fill="transparent"
                      stroke="rgba(0, 99, 152, 0.15)"
                      strokeWidth="7"
                    />
                    {/* Active Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r={monthRadius}
                      fill="transparent"
                      stroke="#006398"
                      strokeWidth="7"
                      strokeDasharray={monthCircumference}
                      strokeDashoffset={monthStrokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Inner Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-app-title text-xl sm:text-2xl font-black text-on-surface">
                      {monthAveragePercent}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-stat-label font-bold">
                      MONTH AVG
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Individual Habit Cards with Circular Donut Rings */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold">
                  Individual Habit Progress Breakdown ({selectedMonthTitle})
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

                  const habitRadius = 22;
                  const habitCircumference = 2 * Math.PI * habitRadius; // ~138.23
                  const habitStrokeDashoffset =
                    habitCircumference -
                    (habitCircumference * Math.min(100, Math.max(0, metrics.monthProgressPercent))) / 100;
                  const habitColor = h.color || '#006398';

                  return (
                    <div
                      key={h.id}
                      className="bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/15 flex items-center justify-between gap-4 hover:border-primary/40 transition-all shadow-sm"
                    >
                      {/* Left: Habit Details & Streak */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-stat-label text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface">
                            #{idx + 1}
                          </span>
                          <h4 className="font-habit-name text-sm font-semibold text-on-surface truncate">
                            {h.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                          <span>
                            {metrics.completedCount} of {totalDaysInMonth} days done
                          </span>
                          <div className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              local_fire_department
                            </span>
                            <span className="font-stat-label text-xs font-bold">
                              {metrics.streakCount}d streak
                            </span>
                          </div>
                        </div>

                        {/* Linear Mini Bar */}
                        <div className="h-1.5 w-full bg-surface-container-highest dark:bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${metrics.monthProgressPercent}%`,
                              backgroundColor: habitColor,
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Circular Gauge for this Habit */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 54 54">
                          <circle
                            cx="27"
                            cy="27"
                            r={habitRadius}
                            fill="transparent"
                            stroke="rgba(0,0,0,0.06)"
                            className="dark:stroke-white/10"
                            strokeWidth="4.5"
                          />
                          <circle
                            cx="27"
                            cy="27"
                            r={habitRadius}
                            fill="transparent"
                            stroke={habitColor}
                            strokeWidth="4.5"
                            strokeDasharray={habitCircumference}
                            strokeDashoffset={habitStrokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="font-stat-label text-[11px] sm:text-xs font-extrabold text-on-surface">
                            {metrics.monthProgressPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODE D: ALL-TIME CATEGORY & HABIT ANALYTICS */}
      {graphMode === 'alltime' && (
        <div className="space-y-6">
          {/* 1. Category All-Time Hero Banner */}
          <div className="bg-gradient-to-br from-surface-container-low to-surface-container/70 dark:from-surface-container-high/40 dark:to-surface-container-high/20 rounded-2xl p-5 sm:p-6 border border-outline-variant/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider font-stat-label">
                  🌐 Category Lifetime Intelligence
                </span>
                {allTimeData.topHabit && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-extrabold font-stat-label flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-[16px]">military_tech</span>
                    <span>Top #1 Habit: {allTimeData.topHabit.habit.name} ({allTimeData.topHabit.allTimeRate}% • {allTimeData.topHabit.totalCompletions}/{allTimeData.topHabit.totalTrackedDays}d)</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
                  {categoryName} • All-Time Records
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                  Lifetime consistency calculated across all {allTimeData.totalCategoryDays} days tracked for {categoryName}.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                  <span className="text-on-surface-variant">Lifetime Checks: </span>
                  <span className="font-bold text-primary dark:text-primary-fixed-dim">
                    {allTimeData.totalCategoryCompletions} / {allTimeData.totalCategoryPossibleChecks}
                  </span>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                  <span className="text-on-surface-variant">Days Tracked: </span>
                  <span className="font-bold text-on-surface">{allTimeData.totalCategoryDays} days</span>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                  <span className="text-on-surface-variant">Habits: </span>
                  <span className="font-bold text-on-surface">{habits.length}</span>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/15 text-xs font-stat-label">
                  <span className="text-on-surface-variant">Reflections: </span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{allTimeData.totalNotesInBoard} notes</span>
                </div>
              </div>
            </div>

            {/* Right: Circular Gauge */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0, 99, 152, 0.15)" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#006398"
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 - (2 * Math.PI * 40 * Math.min(100, Math.max(0, allTimeData.overallConsistencyPercent))) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-app-title text-xl sm:text-2xl font-black text-on-surface">
                    {allTimeData.overallConsistencyPercent}%
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-stat-label font-bold">
                    ALL-TIME AVG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. All-Time Habit Comparison Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold">
                All-Time Leaderboard & Habit Performance in {categoryName}
              </span>
              <span className="text-xs font-stat-label font-bold text-primary">
                Ranked by Lifetime Checks & Days Done
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {allTimeData.habitStatsList.map((stat, idx) => {
                const habitColor = stat.habit.color || '#006398';
                const isTop1 = idx === 0;

                return (
                  <div
                    key={stat.habit.id}
                    className={`rounded-2xl p-4 border transition-all shadow-sm space-y-3 ${
                      isTop1
                        ? 'bg-gradient-to-br from-amber-500/10 via-surface-container-low to-surface-container-lowest dark:from-amber-500/15 dark:to-surface-container-high/40 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-surface-container-low/60 dark:bg-surface-container-high/30 border-outline-variant/15 hover:border-primary/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-stat-label text-xs font-black px-2 py-0.5 rounded-full ${
                            isTop1
                              ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-black shadow-xs font-extrabold flex items-center gap-0.5'
                              : idx === 1
                              ? 'bg-slate-300/60 text-slate-800 dark:text-slate-200'
                              : idx === 2
                              ? 'bg-amber-700/30 text-amber-900 dark:text-amber-300'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {isTop1 && <span className="material-symbols-outlined text-[13px]">emoji_events</span>}
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-habit-name text-sm font-bold text-on-surface truncate">
                              {stat.habit.name}
                            </h4>
                            {isTop1 && (
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                Top 1
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-stat-label text-on-surface-variant">
                            {stat.totalCompletions} of {stat.totalTrackedDays} days done
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-app-title text-xl font-extrabold text-primary dark:text-primary-fixed-dim">
                          {stat.allTimeRate}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-surface-container-highest dark:bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stat.allTimeRate}%`,
                          backgroundColor: habitColor,
                        }}
                      />
                    </div>

                    {/* Badges Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-stat-label">
                      <div className="bg-surface-container-lowest dark:bg-surface-container p-2 rounded-xl border border-outline-variant/15">
                        <div className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                          Completed Days
                        </div>
                        <div className="font-bold text-on-surface mt-0.5">
                          {stat.totalCompletions} / {stat.totalTrackedDays}d
                        </div>
                      </div>

                      <div className="bg-surface-container-lowest dark:bg-surface-container p-2 rounded-xl border border-outline-variant/15">
                        <div className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                          Best Streak
                        </div>
                        <div className="font-bold text-tertiary mt-0.5">{stat.longestStreak} days</div>
                      </div>

                      <div className="bg-surface-container-lowest dark:bg-surface-container p-2 rounded-xl border border-outline-variant/15">
                        <div className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">
                          Best Month
                        </div>
                        <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                          {stat.bestMonthTitle ? `${stat.bestMonthTitle}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Category Day of Week Activity Pattern & Intelligence */}
          <div className="bg-surface-container-low/40 dark:bg-surface-container-high/20 rounded-2xl p-5 sm:p-6 border border-outline-variant/15 space-y-5 shadow-sm">
            {/* Header & Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    calendar_view_week
                  </span>
                  <h4 className="font-section-header text-sm sm:text-base font-bold text-on-surface uppercase tracking-wider">
                    {categoryName} • Day-of-Week Activity Pattern
                  </h4>
                </div>
                <p className="text-xs font-body-text text-on-surface-variant mt-0.5">
                  Lifetime check-in volume, consistency peaks, and momentum trends across Monday through Sunday.
                </p>
              </div>

              {/* Peak & Lowest Day Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {allTimeData.peakDay && allTimeData.peakDay.count > 0 && (
                  <div className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold font-stat-label flex items-center gap-1.5 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">emoji_events</span>
                    <span>Peak of the Day: <strong className="font-black">{allTimeData.peakDay.day}</strong> ({allTimeData.peakDay.percent}% • {allTimeData.peakDay.count}/{allTimeData.peakDay.totalDays} checks)</span>
                  </div>
                )}

                {allTimeData.lowestDay && allTimeData.lowestDay.count >= 0 && (
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim border border-primary/20 text-xs font-bold font-stat-label flex items-center gap-1.5 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">flag</span>
                    <span>Growth Day: <strong className="font-black">{allTimeData.lowestDay.day}</strong> ({allTimeData.lowestDay.percent}% • {allTimeData.lowestDay.count}/{allTimeData.lowestDay.totalDays} checks)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weekday vs Weekend Split Overview Bar */}
            {allTimeData.totalCategoryCompletions > 0 && (
              <div className="bg-surface-container-lowest dark:bg-surface-container p-4 rounded-xl border border-outline-variant/15 space-y-2">
                <div className="flex items-center justify-between text-xs font-stat-label font-bold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                    Weekdays (Mon–Fri): {allTimeData.weekdayChecks} checks ({allTimeData.weekdayPercent}% consistency)
                  </span>
                  <span className="flex items-center gap-1.5 text-tertiary">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block"></span>
                    Weekends (Sat–Sun): {allTimeData.weekendChecks} checks ({allTimeData.weekendPercent}% consistency)
                  </span>
                </div>
                {/* Segmented Bar */}
                <div className="h-2.5 w-full bg-surface-container-highest dark:bg-surface-container-high rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary transition-all duration-700 rounded-l-full"
                    style={{ width: `${allTimeData.weekdayPercent}%` }}
                    title={`Weekdays: ${allTimeData.weekdayPercent}%`}
                  />
                  <div
                    className="h-full bg-tertiary transition-all duration-700 rounded-r-full"
                    style={{ width: `${allTimeData.weekendPercent}%` }}
                    title={`Weekends: ${allTimeData.weekendPercent}%`}
                  />
                </div>
              </div>
            )}

            {/* Vertical Bar Chart with Peak Highlighting */}
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-4 pb-2 border-b border-outline-variant/15 px-2">
              {allTimeData.categoryDayOfWeekStats.map((d) => {
                const heightPct = Math.max(14, d.percent);
                const isPeak = allTimeData.peakDay && d.day === allTimeData.peakDay.day && d.count > 0;
                const isLowest = allTimeData.lowestDay && d.day === allTimeData.lowestDay.day && d.count > 0 && d.percent < 100;

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface text-[10px] font-bold px-2 py-1 rounded-lg shadow-soft whitespace-nowrap border border-outline-variant/20">
                      <span className="font-extrabold">{d.day}:</span> {d.count} of {d.totalDays} checks completed ({d.percent}%)
                    </div>

                    {/* Top Peak Badge on Bar */}
                    {isPeak && (
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">emoji_events</span>
                        <span className="hidden sm:inline">Peak</span>
                      </span>
                    )}

                    {/* Consistency percentage on top of bar */}
                    <span className="text-[11px] font-stat-label font-black text-on-surface mb-0.5">
                      {d.percent}%
                    </span>
                    <span className="text-[9px] font-stat-label text-on-surface-variant mb-1">
                      {d.count}/{d.totalDays}
                    </span>

                    {/* Bar Pill */}
                    <div
                      className={`w-full max-w-[32px] sm:max-w-[40px] rounded-t-xl transition-all duration-500 relative ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md ring-2 ring-amber-500/40'
                          : isLowest
                          ? 'bg-gradient-to-t from-primary/50 to-primary/70 group-hover:from-primary group-hover:to-primary-focus'
                          : d.count > 0
                          ? 'bg-gradient-to-t from-primary/80 to-primary group-hover:brightness-110'
                          : 'bg-outline-variant/20'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />

                    {/* Day short label */}
                    <span
                      className={`text-[11px] uppercase font-bold mt-2 tracking-wider ${
                        isPeak ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-on-surface-variant'
                      }`}
                    >
                      {d.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 7-Day Performance Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
              {allTimeData.categoryDayOfWeekStats.map((d) => {
                const isPeak = allTimeData.peakDay && d.day === allTimeData.peakDay.day && d.count > 0;
                return (
                  <div
                    key={d.day}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isPeak
                        ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                        : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/15'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bold text-on-surface">{d.shortLabel}</span>
                      {isPeak && (
                        <span className="material-symbols-outlined text-amber-500 text-[13px]">
                          emoji_events
                        </span>
                      )}
                    </div>
                    <div className="font-app-title text-base sm:text-lg font-black text-primary dark:text-primary-fixed-dim mt-1">
                      {d.percent}%
                    </div>
                    <div className="text-[10px] font-stat-label text-on-surface-variant mt-0.5">
                      {d.count} of {d.totalDays} done
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Daily Habit Matrix (Quick 1-Tap Toggle for all habits in title) - Hidden in All-Time Analytics */}
      {graphMode !== 'alltime' && (
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
                              onClick={() => {
                                triggerHaptic(done ? 'medium' : 'light');
                                onToggleEntry(h.id, day.dateKey);
                              }}
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
      )}
    </div>
  );
};
