import React from 'react';
import { Habit } from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { formatDateKey } from '../../hooks/useDashboardMetrics';

interface TodayFocusCardProps {
  habits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  onToggleEntry: (habitId: string, dateKey: string) => Promise<void>;
  onAddNewHabit?: () => void;
  className?: string;
}

export const TodayFocusCard: React.FC<TodayFocusCardProps> = ({
  habits,
  habitMetricsMap,
  isCompleted,
  onToggleEntry,
  onAddNewHabit,
  className = '',
}) => {
  const today = new Date();
  const todayDateKey = formatDateKey(today);

  const activeHabits = habits.filter((h) => !h.archived);

  // Compute completed count for today
  let completedCount = 0;
  activeHabits.forEach((h) => {
    if (isCompleted(h.id, todayDateKey)) {
      completedCount++;
    }
  });

  const totalCount = activeHabits.length;
  const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-md sm:p-lg flex flex-col justify-between relative overflow-hidden min-h-[220px] ${className}`}
    >
      {/* Decorative background accent */}
      <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-primary-container/20 dark:bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-stat-label text-xs font-bold text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
              Today's Focus
            </span>
          </div>

          {totalCount > 0 && (
            <span
              className={`text-[11px] font-stat-label font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                allDone
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high dark:bg-surface-container-highest text-on-surface'
              }`}
            >
              {completedCount} of {totalCount} Done ({percentDone}%)
            </span>
          )}
        </div>

        {/* Habit Checklist or Empty State */}
        {totalCount === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="font-body-text text-xs text-on-surface-variant">
              No habits in this tracker board yet.
            </p>
            {onAddNewHabit && (
              <button
                onClick={onAddNewHabit}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add your first habit</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
            {activeHabits.map((habit) => {
              const done = isCompleted(habit.id, todayDateKey);
              const metrics = habitMetricsMap[habit.id];
              const streak = metrics?.streakCount ?? 0;

              return (
                <div
                  key={habit.id}
                  onClick={() => onToggleEntry(habit.id, todayDateKey)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
                    done
                      ? 'bg-secondary-container/20 dark:bg-secondary-container/10 border-secondary/30'
                      : 'bg-surface-container-low dark:bg-surface-container-high/30 border-outline-variant/20 hover:border-primary/40'
                  }`}
                >
                  {/* Left: Checkbox + Habit info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Custom 1-tap Checkbox */}
                    <button
                      type="button"
                      aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        done
                          ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                          : 'border-2 border-outline-variant/50 hover:border-primary bg-surface-container-lowest dark:bg-surface-container'
                      }`}
                    >
                      {done && (
                        <span className="material-symbols-outlined text-[16px] font-bold animate-scaleUp">
                          check
                        </span>
                      )}
                    </button>

                    {/* Icon + Habit Name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="material-symbols-outlined text-[18px] shrink-0"
                        style={{
                          color: habit.color || '#006398',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        {habit.icon || 'energy_savings_leaf'}
                      </span>
                      <span
                        className={`font-habit-name text-xs sm:text-sm font-semibold truncate transition-colors ${
                          done
                            ? 'text-on-surface-variant line-through opacity-80'
                            : 'text-on-surface'
                        }`}
                      >
                        {habit.name}
                      </span>
                    </div>
                  </div>

                  {/* Right: Streak Flame badge */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="material-symbols-outlined text-[15px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      local_fire_department
                    </span>
                    <span className="font-stat-label text-xs font-bold text-on-surface">
                      {streak}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer: Status Banner */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-xs">
        {allDone ? (
          <div className="flex items-center gap-1.5 text-secondary dark:text-secondary-fixed font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>All done for today! Calm momentum in motion.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Tap any habit to check-in for today</span>
          </div>
        )}

        <span className="font-stat-label text-[10px] text-on-surface-variant uppercase">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};
