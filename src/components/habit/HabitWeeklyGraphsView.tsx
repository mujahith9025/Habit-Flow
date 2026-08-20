import React from 'react';
import { DateNavigator, formatMonthYear } from '../dashboard/DateNavigator';
import { formatDateKey } from '../../hooks/useDashboardMetrics';

interface HabitWeeklyGraphsViewProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  isCompleted: (dateKey: string) => boolean;
  onToggleDate: (dateKey: string) => void;
  habitName: string;
  habitFrequency?: string;
  goalCount?: number;
}

interface WeekData {
  weekNum: number;
  label: string;
  color: string;
  ringBg: string;
  days: Array<{
    dayNum: number;
    dateKey: string;
    dayOfWeek: string;
    isCompleted: boolean;
    isToday: boolean;
  }>;
  completedCount: number;
  totalDays: number;
  completionPercent: number;
}

const WEEK_THEMES = [
  { color: '#64b5f6', ringBg: 'rgba(100, 181, 246, 0.2)', name: 'week 1' },
  { color: '#f06292', ringBg: 'rgba(240, 98, 146, 0.2)', name: 'week 2' },
  { color: '#4db6ac', ringBg: 'rgba(77, 182, 172, 0.2)', name: 'week 3' },
  { color: '#ffb74d', ringBg: 'rgba(255, 183, 77, 0.2)', name: 'week 4' },
  { color: '#7986cb', ringBg: 'rgba(121, 134, 203, 0.2)', name: 'week 5' },
];

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const HabitWeeklyGraphsView: React.FC<HabitWeeklyGraphsViewProps> = ({
  currentDate,
  onChangeMonth,
  isCompleted,
  onToggleDate,
  habitName,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { formattedTitle } = formatMonthYear(currentDate);
  const todayKey = formatDateKey(new Date());

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Divide the month into 5 week buckets:
  // Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end
  const weekRanges = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
    { start: 29, end: daysInCurrentMonth },
  ].filter((r) => r.start <= daysInCurrentMonth);

  let totalMonthCompleted = 0;

  const weeksData: WeekData[] = weekRanges.map((range, idx) => {
    const theme = WEEK_THEMES[idx % WEEK_THEMES.length];
    const days: WeekData['days'] = [];
    let completedCount = 0;

    for (let d = range.start; d <= Math.min(range.end, daysInCurrentMonth); d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const dayOfWeek = WEEKDAY_SHORT[dayDate.getDay()];
      const done = isCompleted(dateKey);
      if (done) completedCount++;

      days.push({
        dayNum: d,
        dateKey,
        dayOfWeek,
        isCompleted: done,
        isToday: dateKey === todayKey,
      });
    }

    totalMonthCompleted += completedCount;
    const totalDays = days.length;
    const completionPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 1000) / 10 : 0;

    return {
      weekNum: idx + 1,
      label: theme.name,
      color: theme.color,
      ringBg: theme.ringBg,
      days,
      completedCount,
      totalDays,
      completionPercent,
    };
  });

  const monthPercent =
    daysInCurrentMonth > 0
      ? Math.round((totalMonthCompleted / daysInCurrentMonth) * 1000) / 10
      : 0;

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-6 shadow-soft border border-outline-variant/15 space-y-6">
      {/* 1. Header with Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bar_chart
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Weekly Performance & Velocity Graphs
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
            Daily consistency bars and weekly completion gauges for <span className="font-semibold text-on-surface">{habitName}</span> ({formattedTitle}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
            <span className="text-[11px] font-stat-label text-on-surface-variant uppercase">
              Month Average:
            </span>
            <span className="text-xs font-stat-label font-bold text-primary dark:text-primary-fixed-dim">
              {monthPercent}%
            </span>
          </div>

          <DateNavigator
            currentDate={currentDate}
            onChangeMonth={onChangeMonth}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* 2. Week-by-Week Segmented Bar Charts & Doughnut Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-3 overflow-x-auto pb-2">
        {weeksData.map((week) => {
          const radius = 34;
          const circumference = 2 * Math.PI * radius; // ~213.6
          const strokeDashoffset =
            circumference - (circumference * Math.min(100, Math.max(0, week.completionPercent))) / 100;

          return (
            <div
              key={week.weekNum}
              className="bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-2xl p-3.5 sm:p-4 border border-outline-variant/15 flex flex-col justify-between space-y-4 hover:border-outline-variant/40 transition-all shadow-sm"
            >
              {/* Week Title (Italicized Serif style matching reference sheet) */}
              <div className="text-center">
                <h4
                  className="font-serif italic text-base sm:text-lg font-medium tracking-wide capitalize"
                  style={{ color: week.color }}
                >
                  {week.label}
                </h4>
                <span className="text-[10px] font-stat-label text-on-surface-variant block mt-0.5">
                  {week.completedCount} of {week.totalDays} Days Done
                </span>
              </div>

              {/* Vertical Daily Histogram Bars */}
              <div className="h-36 sm:h-40 flex items-end justify-center gap-1 sm:gap-1.5 pt-2 px-1 border-b border-outline-variant/15 pb-2">
                {week.days.map((day) => {
                  const done = day.isCompleted;

                  return (
                    <div
                      key={day.dateKey}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer select-none"
                      onClick={() => onToggleDate(day.dateKey)}
                      title={`Day ${day.dayNum} (${day.dateKey}): ${done ? 'Completed (Tap to uncheck)' : 'Incomplete (Tap to check)'}`}
                    >
                      {/* Interactive Tooltip on Hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface text-[9px] font-bold px-1.5 py-0.5 rounded shadow-soft whitespace-nowrap">
                        {done ? '100%' : '0%'}
                      </div>

                      {/* Bar Fill */}
                      <div
                        className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                          done
                            ? 'shadow-sm group-hover:brightness-110'
                            : 'bg-outline-variant/20 group-hover:bg-outline-variant/40'
                        } ${day.isToday ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-surface-container' : ''}`}
                        style={{
                          height: done ? '100%' : '14%',
                          backgroundColor: done ? week.color : undefined,
                        }}
                      />

                      {/* Day of Week Label */}
                      <span
                        className={`text-[9px] sm:text-[10px] uppercase font-bold mt-1.5 transition-colors ${
                          day.isToday
                            ? 'text-primary dark:text-primary-fixed-dim font-black'
                            : done
                            ? 'text-on-surface'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {day.dayOfWeek}
                      </span>

                      {/* Day Number Label */}
                      <span
                        className={`text-[8px] sm:text-[9px] font-stat-label leading-none ${
                          day.isToday
                            ? 'text-primary font-bold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Completion Circular Ring Gauge (matching reference sheet) */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    {/* Background Track */}
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="transparent"
                      stroke={week.ringBg}
                      strokeWidth="6"
                    />
                    {/* Active Progress Arc */}
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

                  {/* Percentage in Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-app-title text-sm sm:text-base font-bold text-on-surface">
                      {week.completionPercent}%
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

      {/* 3. Footer Legend & Interactive Helper */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant pt-3 border-t border-outline-variant/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary" />
            <span>Completed (Full Bar)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-outline-variant/30" />
            <span>Missed / Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-primary" />
            <span>Today</span>
          </div>
        </div>

        <span className="text-[11px] font-stat-label text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
          Tap any bar to check-in or toggle date
        </span>
      </div>
    </div>
  );
};
