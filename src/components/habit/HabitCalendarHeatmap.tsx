import React from 'react';
import { DateNavigator, formatMonthYear } from '../dashboard/DateNavigator';
import { formatDateKey } from '../../hooks/useDashboardMetrics';

interface HabitCalendarHeatmapProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  isCompleted: (dateKey: string) => boolean;
  onToggleDate: (dateKey: string) => void;
  habitColor?: string;
  habitName: string;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HabitCalendarHeatmap: React.FC<HabitCalendarHeatmapProps> = ({
  currentDate,
  onChangeMonth,
  isCompleted,
  onToggleDate,
  habitColor = '#006398',
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const { formattedTitle } = formatMonthYear(currentDate);

  const todayKey = formatDateKey(new Date());

  // First day of month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create array of days with prefix blanks
  const calendarCells: Array<{ dayNum?: number; dateKey?: string; isToday?: boolean }> = [];

  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({});
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: d,
      dateKey,
      isToday: dateKey === todayKey,
    });
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-6 shadow-soft border border-outline-variant/15 space-y-4">
      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div>
          <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
            Monthly Activity Heatmap
          </h3>
          <p className="font-body-text text-xs text-on-surface-variant">
            Tap any date to check in or view consistency for {formattedTitle}.
          </p>
        </div>

        <DateNavigator
          currentDate={currentDate}
          onChangeMonth={onChangeMonth}
          className="w-full sm:w-auto"
        />
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {/* Weekday Headers */}
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider py-1 font-bold"
          >
            {day}
          </div>
        ))}

        {/* Days Grid Cells */}
        {calendarCells.map((cell, idx) => {
          if (!cell.dayNum || !cell.dateKey) {
            return (
              <div
                key={`blank-${idx}`}
                className="aspect-square rounded-xl bg-transparent opacity-0 pointer-events-none"
              />
            );
          }

          const completed = isCompleted(cell.dateKey);
          const isToday = cell.isToday;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onToggleDate(cell.dateKey!)}
              title={`${cell.dateKey} - ${completed ? 'Completed' : 'Pending'}`}
              className={`aspect-square rounded-xl sm:rounded-2xl p-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-90 relative ${
                completed
                  ? 'text-white shadow-soft font-bold'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high/80'
              } ${
                isToday
                  ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-container font-extrabold'
                  : 'border border-outline-variant/10'
              }`}
              style={{
                backgroundColor: completed ? habitColor : undefined,
              }}
            >
              <span className="text-xs sm:text-sm">{cell.dayNum}</span>
              {completed && (
                <span
                  className="material-symbols-outlined text-[13px] sm:text-[15px] leading-none mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-md text-white flex items-center justify-center text-[10px]"
              style={{ backgroundColor: habitColor }}
            >
              ✓
            </div>
            <span>Completed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-surface-container-low border border-outline-variant/30" />
            <span>Missed / Pending</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md border-2 border-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};
