import React from 'react';
import { Habit } from '../../types';
import { MonthlyHabitMetrics } from '../../hooks/useMonthlyHabitsData';
import { Button } from '../ui/Button';

interface MonthlyHabitsGridProps {
  monthlyHabits: Habit[];
  habitMetricsMap: Record<string, MonthlyHabitMetrics>;
  isCompleted: (habitId: string) => boolean;
  onToggleMonthlyEntry: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onSeedHabits?: () => void;
  formattedMonthTitle: string;
}

export const MonthlyHabitsGrid: React.FC<MonthlyHabitsGridProps> = ({
  monthlyHabits,
  habitMetricsMap,
  isCompleted,
  onToggleMonthlyEntry,
  onEditHabit,
  onSeedHabits,
  formattedMonthTitle,
}) => {
  if (monthlyHabits.length === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-tertiary-container/30 text-tertiary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
        </div>
        <h3 className="font-section-header text-base font-semibold text-on-surface">
          No Monthly Habits Found
        </h3>
        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
          Monthly habits track big milestone goals, like reading a book or completing a monthly challenge.
        </p>
        {onSeedHabits && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onSeedHabits}
              leftIcon={<span className="material-symbols-outlined text-[16px]">auto_fix_high</span>}
            >
              Seed Sample Habits
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-section-header text-base sm:text-lg font-semibold text-on-surface">
            Monthly Milestones
          </h3>
          <span className="text-xs font-stat-label text-primary font-medium">
            {formattedMonthTitle}
          </span>
        </div>
        <span className="text-[11px] font-stat-label text-on-surface-variant uppercase">
          Monthly Completion
        </span>
      </div>

      {/* Monthly Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md sm:gap-lg">
        {monthlyHabits.map((habit) => {
          const metrics = habitMetricsMap[habit.id] || {
            isCompleted: false,
            progressPercent: 0,
            streakCount: 0,
          };
          const completed = isCompleted(habit.id);
          const habitColor = habit.color || '#a03e40';

          return (
            <div
              key={habit.id}
              onClick={() => onEditHabit(habit)}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-xl p-md sm:p-lg shadow-soft border border-outline-variant/15 hover:border-primary/40 transition-all duration-200 cursor-pointer space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: habitColor }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {habit.icon || 'menu_book'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-habit-name text-sm sm:text-base font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-stat-label text-on-surface-variant">
                        Goal: 1 / month
                      </span>
                      <span className="text-outline-variant text-[10px]">•</span>
                      <div className="flex items-center gap-0.5 text-tertiary">
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          local_fire_department
                        </span>
                        <span className="font-stat-label text-[10px] font-bold">
                          {metrics.streakCount}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Toggle Button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onToggleMonthlyEntry(habit.id)}
                    title={completed ? 'Mark as incomplete' : 'Mark as complete for this month'}
                    aria-label="Toggle monthly completion"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
                      completed
                        ? 'text-white shadow-soft ring-1 ring-black/10'
                        : 'border-2 border-outline-variant/60 dark:border-outline-variant/40 hover:border-tertiary hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: completed ? habitColor : 'transparent',
                    }}
                  >
                    {completed ? (
                      <span
                        className="material-symbols-outlined text-[18px] leading-none"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-outline-variant/30" />
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar & Rate */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-stat-label">
                  <span className="text-on-surface-variant text-[11px]">Progress</span>
                  <span
                    className="font-bold text-xs"
                    style={{ color: completed ? habitColor : 'inherit' }}
                  >
                    {metrics.progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-container-high dark:bg-surface-container-highest/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics.progressPercent}%`,
                      backgroundColor: habitColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
