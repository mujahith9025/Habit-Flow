import React from 'react';
import { Habit } from '../../types';
import { WeeklyHabitMetrics } from '../../hooks/useWeeklyHabitsData';
import { Button } from '../ui/Button';

interface WeeklyHabitsGridProps {
  weeklyHabits: Habit[];
  habitMetricsMap: Record<string, WeeklyHabitMetrics>;
  isCompleted: (habitId: string, weekNumber: number) => boolean;
  onToggleWeeklyEntry: (habitId: string, weekNumber: number) => void;
  onEditHabit: (habit: Habit) => void;
  onSeedHabits?: () => void;
  formattedMonthTitle: string;
}

export const WeeklyHabitsGrid: React.FC<WeeklyHabitsGridProps> = ({
  weeklyHabits,
  habitMetricsMap,
  isCompleted,
  onToggleWeeklyEntry,
  onEditHabit,
  onSeedHabits,
  formattedMonthTitle,
}) => {
  const weeks = [1, 2, 3, 4, 5];

  if (weeklyHabits.length === 0) {
    return (
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-secondary-fixed/30 text-secondary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">date_range</span>
        </div>
        <h3 className="font-section-header text-base font-semibold text-on-surface">
          No Weekly Habits Found
        </h3>
        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
          Weekly habits help you focus on multi-day targets like gym workouts or weekly reviews.
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
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-section-header text-base sm:text-lg font-semibold text-on-surface">
            Weekly Habits
          </h3>
          <span className="text-xs font-stat-label text-primary font-medium">
            {formattedMonthTitle}
          </span>
        </div>
        <span className="text-[11px] font-stat-label text-on-surface-variant uppercase">
          Weeks 1 – 5
        </span>
      </div>

      {/* Grid Container */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-soft border border-outline-variant/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px] sm:min-w-[750px]">
            <thead>
              <tr className="bg-surface-container-low/70 dark:bg-surface-container-high/40 border-b border-outline-variant/20">
                <th className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 text-left min-w-[180px] sm:min-w-[240px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/15">
                  <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Habit
                  </span>
                </th>

                {weeks.map((w) => (
                  <th
                    key={w}
                    className="p-3 sm:p-4 text-center min-w-[60px] sm:min-w-[70px] border-r border-outline-variant/10"
                  >
                    <span className="font-stat-label text-xs sm:text-sm font-bold text-on-surface">
                      W{w}
                    </span>
                  </th>
                ))}

                <th className="p-3 sm:p-4 text-right min-w-[64px] sm:min-w-[72px]">
                  <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                    %
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="text-on-surface divide-y divide-outline-variant/10">
              {weeklyHabits.map((habit) => {
                const metrics = habitMetricsMap[habit.id] || {
                  completedWeeksCount: 0,
                  progressPercent: 0,
                  streakCount: 0,
                  goalCount: 4,
                };

                return (
                  <tr
                    key={habit.id}
                    onClick={() => onEditHabit(habit)}
                    className="hover:bg-surface-container-low/40 dark:hover:bg-surface-container-high/20 transition-colors cursor-pointer group"
                  >
                    {/* Habit Info Column */}
                    <td className="sticky left-0 z-20 bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] border-r border-outline-variant/15">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: habit.color || '#286b33' }}
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {habit.icon || 'fitness_center'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="font-habit-name text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate block">
                            {habit.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-stat-label text-on-surface-variant">
                              Goal: {metrics.goalCount}/mo
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
                                {metrics.completedWeeksCount}w
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* W1 - W5 Checkbox Cells */}
                    {weeks.map((w) => {
                      const completed = isCompleted(habit.id, w);

                      return (
                        <td
                          key={w}
                          className="p-2 sm:p-3 text-center border-r border-outline-variant/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleWeeklyEntry(habit.id, w)}
                            title={completed ? 'Mark as incomplete' : 'Mark as complete for Week ' + w}
                            aria-label={`Week ${w} status`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
                              completed
                                ? 'text-white shadow-soft ring-1 ring-black/10'
                                : 'border-2 border-outline-variant/60 dark:border-outline-variant/40 hover:border-secondary hover:bg-secondary-fixed/15 hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: completed ? habit.color || '#286b33' : 'transparent',
                            }}
                          >
                            {completed ? (
                              <span
                                className="material-symbols-outlined text-[16px] sm:text-[18px] leading-none"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-outline-variant/20 group-hover:bg-secondary/40" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* % Column */}
                    <td className="p-3 sm:p-4 text-right font-stat-label text-xs sm:text-sm font-bold text-secondary dark:text-secondary-fixed">
                      {metrics.progressPercent}%
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
