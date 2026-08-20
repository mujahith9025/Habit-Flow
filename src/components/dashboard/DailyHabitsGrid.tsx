import React, { useRef, useEffect } from 'react';
import { Habit, HabitEntry } from '../../types';
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
  getHabitEntry?: (habitId: string, dateKey: string) => HabitEntry | undefined;
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
  getHabitEntry,
  onToggleEntry,
  onEditHabit,
  onSeedHabits,
  formattedMonthTitle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledMonthRef = useRef<string | null>(null);

  // Auto-scroll horizontally to today's column on initial load or month change only (not on entry toggle)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (hasScrolledMonthRef.current === formattedMonthTitle) return;

    const todayTh = scrollContainerRef.current.querySelector<HTMLElement>('th[data-is-today="true"]');
    if (todayTh) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const thLeft = todayTh.offsetLeft;
      const targetScroll = Math.max(0, thLeft - containerWidth / 2 + todayTh.clientWidth / 2);
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    hasScrolledMonthRef.current = formattedMonthTitle;
  }, [formattedMonthTitle, daysInMonth]);

  // 0 Habits empty state
  if (dailyHabits.length === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/20 p-8 sm:p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">energy_savings_leaf</span>
        </div>
        <div className="space-y-1">
          <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
            No habits yet in this tracker board
          </h3>
          <p className="font-body-text text-xs text-on-surface-variant max-w-sm mx-auto">
            Add a habit to start tracking your daily progress and building calm consistency.
          </p>
        </div>
        {onSeedHabits && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSeedHabits}
            className="text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5">auto_fix_high</span>
            Seed Starter Habits
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">calendar_view_month</span>
          <h2 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
            Daily Habits Performance Grid
          </h2>
        </div>
        <span className="font-stat-label text-xs font-semibold text-on-surface-variant">
          {formattedMonthTitle}
        </span>
      </div>

      {/* Grid Table Container */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/20 overflow-hidden">
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse min-w-[780px] lg:min-w-[1020px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-surface-container-low dark:bg-surface-container-high/60 border-b border-outline-variant/30">
                {/* Sticky Habit Header Column */}
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
                      {/* Day of Month Number */}
                      <span
                        className={`font-stat-label text-xs sm:text-sm font-extrabold ${
                          day.isToday
                            ? 'text-on-primary'
                            : 'text-on-surface'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Month % Complete & Streak Column Header (Sticky on Right) */}
                <th className="sticky right-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-2 sm:p-3 text-right min-w-[64px] sm:min-w-[72px] shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] border-l border-outline-variant/25">
                  <span className="font-stat-label text-[10px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    % Done
                  </span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-outline-variant/15">
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
                    {/* Sticky Left Column: Habit Info */}
                    <td
                      onClick={() => onEditHabit?.(habit)}
                      title="Click to edit habit"
                      className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-2.5 sm:p-4 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/20 cursor-pointer group min-w-[105px] max-w-[120px] sm:min-w-[190px] sm:max-w-none"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-habit-name text-[13px] sm:text-[15px] font-bold text-on-surface group-hover:text-primary transition-colors break-words whitespace-normal leading-snug">
                          {habit.name}
                        </span>
                      </div>
                    </td>

                    {/* Day Cells (1..31) */}
                    {daysInMonth.map((day) => {
                      const completed = isCompleted(habit.id, day.dateKey);
                      const entry = getHabitEntry ? getHabitEntry(habit.id, day.dateKey) : undefined;
                      const hasNote = Boolean(entry?.note || entry?.mood || (entry?.tags && entry.tags.length > 0));

                      return (
                        <DailyGridCell
                          key={`${habit.id}-${day.dateKey}`}
                          habitId={habit.id}
                          dateKey={day.dateKey}
                          isCompleted={completed}
                          isToday={day.isToday}
                          hasNote={hasNote}
                          onToggle={() => onToggleEntry(habit.id, day.dateKey)}
                        />
                      );
                    })}

                    {/* Month % Complete & Fire Streak Column */}
                    <td className="sticky right-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-2 sm:p-3 text-right border-l border-outline-variant/20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] min-w-[64px] sm:min-w-[72px]">
                      <div className="flex flex-col items-end justify-center gap-1">
                        <span className="font-stat-label text-xs sm:text-sm font-extrabold text-primary dark:text-primary-fixed-dim leading-none">
                          {metrics.monthProgressPercent}%
                        </span>
                        <div className="flex items-center gap-0.5 text-tertiary">
                          <span
                            className="material-symbols-outlined text-[13px] sm:text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            local_fire_department
                          </span>
                          <span className="font-stat-label text-[10px] sm:text-[11px] font-bold leading-none">
                            {metrics.streakCount}d
                          </span>
                          {metrics.isShieldActive && (
                            <span
                              title="Gentle Persistence: Protected by Streak Shield"
                              className="material-symbols-outlined text-[12px] sm:text-[13px] text-secondary ml-0.5"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              shield
                            </span>
                          )}
                        </div>
                      </div>
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
