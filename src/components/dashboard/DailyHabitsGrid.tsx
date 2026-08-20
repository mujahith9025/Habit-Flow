import React, { useRef, useEffect } from 'react';
import { Habit } from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { DailyGridCell } from './DailyGridCell';
import { Button } from '../ui/Button';

interface DayColumnHeader {
  dayNum: number;
  dayOfWeek: string;
  isToday: boolean;
  dateKey: string;
  isWeekend?: boolean;
}

interface DailyHabitsGridProps {
  currentDate?: Date;
  dailyHabits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  daysInMonth: DayColumnHeader[];
  isCompleted: (habitId: string, dateKey: string) => boolean;
  onToggleEntry: (habitId: string, dateKey: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onSeedHabits?: () => void;
  formattedMonthTitle: string;
}

export const DailyHabitsGrid: React.FC<DailyHabitsGridProps> = ({
  dailyHabits,
  habitMetricsMap,
  daysInMonth,
  isCompleted,
  onToggleEntry,
  onEditHabit,
  onSeedHabits,
  formattedMonthTitle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledMonthRef = useRef<string | null>(null);

  // Auto-scroll horizontally to today's column on initial load or month change only (not on entry toggle)
  useEffect(() => {
    if (formattedMonthTitle && hasScrolledMonthRef.current !== formattedMonthTitle) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const todayEl = scrollContainerRef.current.querySelector('[data-is-today="true"]');
          if (todayEl) {
            todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            hasScrolledMonthRef.current = formattedMonthTitle;
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formattedMonthTitle, dailyHabits.length]);

  if (dailyHabits.length === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary-container/30 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">calendar_today</span>
        </div>
        <h3 className="font-section-header text-base font-semibold text-on-surface">
          No Daily Habits in This Board
        </h3>
        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
          Start building consistency by adding your first daily habit to this tracker board.
        </p>
        {onSeedHabits && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onSeedHabits}
              leftIcon={<span className="material-symbols-outlined text-[16px]">auto_fix_high</span>}
            >
              Seed Daily Habits
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-section-header text-base sm:text-lg font-semibold text-on-surface">
            Daily Habits Grid
          </h3>
          <span className="text-xs font-stat-label text-primary font-medium">
            {formattedMonthTitle}
          </span>
        </div>
        <span className="text-[11px] font-stat-label text-on-surface-variant uppercase hidden sm:inline">
          Scroll horizontally for all 31 days
        </span>
      </div>

      {/* Grid Table Container */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/20 overflow-hidden">
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse min-w-[780px] lg:min-w-[1020px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-surface-container-low dark:bg-surface-container-high/60 border-b border-outline-variant/30">
                {/* Sticky Habit Header Column (Compact on mobile to maximize dates space) */}
                <th className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-2 sm:p-4 text-left min-w-[100px] max-w-[110px] sm:min-w-[190px] sm:max-w-none shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/25">
                  <span className="font-stat-label text-[10px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Habit
                  </span>
                </th>

                {/* Days of Month Header Columns (1..31) */}
                {daysInMonth.map((day) => (
                  <th
                    key={day.dateKey}
                    data-is-today={day.isToday}
                    className={`p-1 sm:p-1.5 text-center min-w-[36px] sm:min-w-[40px] transition-colors border-r ${
                      day.isToday
                        ? 'bg-primary text-on-primary border-x-2 border-primary shadow-md z-10'
                        : 'border-outline-variant/20 hover:bg-surface-container-high/40'
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center py-1 rounded-lg transition-all ${
                        day.isToday
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-lowest/60 dark:bg-surface-container/60 border border-outline-variant/20'
                      }`}
                    >
                      {/* Day of Week (M, T, W, etc.) */}
                      <span
                        className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-tight ${
                          day.isToday
                            ? 'text-on-primary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {day.dayOfWeek}
                      </span>

                      {/* Day Number (01, 02, ..., 31) */}
                      <span
                        className={`font-stat-label text-xs sm:text-sm font-extrabold ${
                          day.isToday
                            ? 'text-on-primary'
                            : 'text-on-surface'
                        }`}
                      >
                        {String(day.dayNum).padStart(2, '0')}
                      </span>

                      {/* Today Micro Indicator */}
                      {day.isToday && (
                        <span className="text-[8px] uppercase tracking-widest font-black text-on-primary/90 mt-0.5 leading-none">
                          TODAY
                        </span>
                      )}
                    </div>
                  </th>
                ))}

                {/* Progress % Header (Stable / Sticky on Right) */}
                <th className="sticky right-0 z-20 bg-surface-container-low dark:bg-surface-container-high/90 p-3 sm:p-4 text-right min-w-[64px] sm:min-w-[72px] border-l border-outline-variant/30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                  <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    %
                  </span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-outline-variant/15 text-on-surface">
              {dailyHabits.map((habit) => {
                const metrics = habitMetricsMap[habit.id] || {
                  completedDaysCount: 0,
                  monthProgressPercent: 0,
                  streakCount: 0,
                  targetCount: habit.goalCount || 1,
                };

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-surface-container-low/40 dark:hover:bg-surface-container-high/20 transition-colors"
                  >
                    {/* Sticky Left Column: Habit Info (Compact on mobile with multi-line wrap) */}
                    <td
                      onClick={() => onEditHabit?.(habit)}
                      title="Click to edit habit"
                      className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-2 sm:p-4 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/20 cursor-pointer group min-w-[100px] max-w-[110px] sm:min-w-[190px] sm:max-w-none"
                    >
                      <div className="flex flex-col min-w-0">
                        {/* Habit Title (Multi-line wrap on mobile) */}
                        <div className="flex items-center">
                          <span className="font-habit-name text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors break-words whitespace-normal leading-snug">
                            {habit.name}
                          </span>
                        </div>

                        {/* Goal & Streak Subtitle */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-1">
                          <span className="text-[9px] sm:text-[10px] font-stat-label text-on-surface-variant leading-none">
                            {metrics.targetCount}/d
                          </span>
                          <div className="flex items-center gap-0.5 text-tertiary">
                            <span
                              className="material-symbols-outlined text-[12px] sm:text-[13px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              local_fire_department
                            </span>
                            <span className="font-stat-label text-[9px] sm:text-[10px] font-bold">
                              {metrics.streakCount}d
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells (1..31) */}
                    {daysInMonth.map((day) => {
                      const completed = isCompleted(habit.id, day.dateKey);

                      return (
                        <DailyGridCell
                          key={`${habit.id}-${day.dateKey}`}
                          habitId={habit.id}
                          dateKey={day.dateKey}
                          isCompleted={completed}
                          isToday={day.isToday}
                          onToggle={() => onToggleEntry(habit.id, day.dateKey)}
                        />
                      );
                    })}

                    {/* Month % Complete Column (Stable / Sticky on Right) */}
                    <td className="sticky right-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 text-right border-l border-outline-variant/20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                      <span className="font-stat-label text-xs sm:text-sm font-bold text-primary dark:text-primary-fixed-dim">
                        {metrics.monthProgressPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
