import React, { useRef, useEffect } from 'react';
import { Habit } from '../../types';
import { MonthDayInfo, HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { DailyGridCell } from './DailyGridCell';
import { Button } from '../ui/Button';

interface DailyHabitsGridProps {
  dailyHabits: Habit[];
  daysInMonth: MonthDayInfo[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  onToggleEntry: (habitId: string, dateKey: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onSeedHabits?: () => void;
  formattedMonthTitle: string;
}

export const DailyHabitsGrid: React.FC<DailyHabitsGridProps> = ({
  dailyHabits,
  daysInMonth,
  habitMetricsMap,
  isCompleted,
  onToggleEntry,
  onEditHabit,
  onSeedHabits,
  formattedMonthTitle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll mobile view to today's column on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayElement = scrollContainerRef.current.querySelector('[data-is-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [daysInMonth]);

  if (dailyHabits.length === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary-fixed/30 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">task_alt</span>
        </div>
        <h3 className="font-section-header text-base font-semibold text-on-surface">
          No Daily Habits Found
        </h3>
        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
          Start building consistency by adding your first daily habit or seeding our starter habits.
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
          Scroll horizontally for full month
        </span>
      </div>

      {/* Grid Table Container */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 overflow-hidden">
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse min-w-[760px] lg:min-w-[1000px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-surface-container-low/70 dark:bg-surface-container-high/40 border-b border-outline-variant/20">
                {/* Sticky Habit Header Column */}
                <th className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 text-left min-w-[170px] sm:min-w-[210px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/15">
                  <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Habit
                  </span>
                </th>

                {/* Days of Month Header Columns (1..31) */}
                {daysInMonth.map((day) => (
                  <th
                    key={day.dateKey}
                    data-is-today={day.isToday}
                    className={`p-1 sm:p-1.5 text-center min-w-[34px] sm:min-w-[38px] transition-colors border-r border-outline-variant/10 ${
                      day.isToday
                        ? 'bg-primary-container/25 dark:bg-primary-container/15 rounded-t-lg'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center py-0.5">
                      <span
                        className={`text-[10px] uppercase font-semibold ${
                          day.isToday
                            ? 'text-primary dark:text-primary-fixed-dim font-bold'
                            : 'text-outline dark:text-outline-variant'
                        }`}
                      >
                        {day.dayOfWeek}
                      </span>
                      <span
                        className={`font-stat-label text-xs ${
                          day.isToday
                            ? 'text-primary dark:text-primary-fixed-dim font-bold'
                            : 'text-on-surface'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Progress % Header */}
                <th className="p-3 sm:p-4 text-right min-w-[64px] sm:min-w-[72px]">
                  <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    %
                  </span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-on-surface divide-y divide-outline-variant/10">
              {dailyHabits.map((habit) => {
                const metrics = habitMetricsMap[habit.id] || {
                  completedCount: 0,
                  monthProgressPercent: 0,
                  streakCount: 0,
                  targetCount: daysInMonth.length,
                };

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-surface-container-low/40 dark:hover:bg-surface-container-high/20 transition-colors"
                  >
                    {/* Sticky Left Column: Habit Info (Clickable for editing) */}
                    <td
                      onClick={() => onEditHabit?.(habit)}
                      title="Click to edit habit"
                      className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/15 cursor-pointer group"
                    >
                      <div className="flex flex-col min-w-0">
                        {/* Habit Title + Icon */}
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[18px] shrink-0"
                            style={{
                              color: habit.color || '#006398',
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            {habit.icon || 'energy_savings_leaf'}
                          </span>
                          <span className="font-habit-name text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                            {habit.name}
                          </span>
                        </div>

                        {/* Goal & Streak Subtitle */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-stat-label text-on-surface-variant">
                            Target: {metrics.targetCount}
                          </span>
                          <span className="text-outline-variant text-[10px]">•</span>
                          <div className="flex items-center gap-0.5 text-tertiary">
                            <span
                              className="material-symbols-outlined text-[13px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              local_fire_department
                            </span>
                            <span className="font-stat-label text-[10px] font-bold">
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
                          habitColor={habit.color || '#006398'}
                          onToggle={() => onToggleEntry(habit.id, day.dateKey)}
                        />
                      );
                    })}

                    {/* Month % Complete Column */}
                    <td className="p-3 sm:p-4 text-right">
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
