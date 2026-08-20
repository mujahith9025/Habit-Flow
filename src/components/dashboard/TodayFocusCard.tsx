import React, { useState } from 'react';
import { Habit, TimeOfDay } from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { formatDateKey } from '../../hooks/useDashboardMetrics';
import { triggerHaptic } from '../../utils/haptics';
import { triggerMilestoneCelebration } from '../../utils/confetti';

interface TodayFocusCardProps {
  habits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  onToggleEntry: (habitId: string, dateKey: string) => Promise<void>;
  onAddNewHabit?: () => void;
  className?: string;
}

type FilterTime = 'all' | 'morning' | 'afternoon' | 'evening';

const TIME_OF_DAY_CONFIG: Record<
  TimeOfDay,
  { label: string; icon: string; timeRange: string; color: string }
> = {
  morning: { label: 'Morning', icon: 'wb_sunny', timeRange: '5 AM – 12 PM', color: 'text-amber-500' },
  afternoon: { label: 'Afternoon', icon: 'light_mode', timeRange: '12 PM – 5 PM', color: 'text-orange-500' },
  evening: { label: 'Evening', icon: 'bedtime', timeRange: '5 PM – 11 PM', color: 'text-indigo-400' },
  anytime: { label: 'Anytime', icon: 'schedule', timeRange: 'Flexible', color: 'text-primary' },
};

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
  const currentHour = today.getHours();

  // Smart suggestion for current time period
  const defaultPeriod: FilterTime =
    currentHour >= 4 && currentHour < 12
      ? 'morning'
      : currentHour >= 12 && currentHour < 17
      ? 'afternoon'
      : 'evening';

  const [activeFilter, setActiveFilter] = useState<FilterTime>('all');

  const activeHabits = habits.filter((h) => !h.archived);

  // Compute completed count for today across all active habits
  let totalCompletedToday = 0;
  activeHabits.forEach((h) => {
    if (isCompleted(h.id, todayDateKey)) {
      totalCompletedToday++;
    }
  });

  const totalCount = activeHabits.length;
  const percentDone = totalCount > 0 ? Math.round((totalCompletedToday / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && totalCompletedToday === totalCount;

  // Filter habits according to selected Time of Day
  const displayedHabits = activeHabits.filter((h) => {
    if (activeFilter === 'all') return true;
    const habitTime = h.timeOfDay || 'anytime';
    return habitTime === activeFilter || habitTime === 'anytime';
  });

  // Calculate stats for each time period
  const periodCounts = {
    morning: activeHabits.filter((h) => (h.timeOfDay || 'anytime') === 'morning' || (h.timeOfDay || 'anytime') === 'anytime').length,
    afternoon: activeHabits.filter((h) => (h.timeOfDay || 'anytime') === 'afternoon' || (h.timeOfDay || 'anytime') === 'anytime').length,
    evening: activeHabits.filter((h) => (h.timeOfDay || 'anytime') === 'evening' || (h.timeOfDay || 'anytime') === 'anytime').length,
  };

  const handleToggle = async (habitId: string) => {
    const isCurrentlyDone = isCompleted(habitId, todayDateKey);
    
    // Tactile haptic feedback
    triggerHaptic(isCurrentlyDone ? 'medium' : 'light');

    // Check if completing this habit hits 100%
    if (!isCurrentlyDone && totalCompletedToday + 1 === totalCount) {
      setTimeout(() => {
        triggerMilestoneCelebration();
        triggerHaptic('success');
      }, 150);
    }

    await onToggleEntry(habitId, todayDateKey);
  };

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-md sm:p-lg flex flex-col justify-between relative overflow-hidden min-h-[240px] ${className}`}
    >
      {/* Decorative background accent */}
      <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-primary-container/20 dark:bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
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
              {totalCompletedToday} of {totalCount} Done ({percentDone}%)
            </span>
          )}
        </div>

        {/* Time-of-Day Filter Chips */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2 border-b border-outline-variant/10">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('morning')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 flex items-center gap-1 shrink-0 ${
                activeFilter === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : defaultPeriod === 'morning'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>🌅 Morning</span>
              <span className="text-[9px] opacity-80">({periodCounts.morning})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('afternoon')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 flex items-center gap-1 shrink-0 ${
                activeFilter === 'afternoon'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : defaultPeriod === 'afternoon'
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>☀️ Afternoon</span>
              <span className="text-[9px] opacity-80">({periodCounts.afternoon})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('evening')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 flex items-center gap-1 shrink-0 ${
                activeFilter === 'evening'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : defaultPeriod === 'evening'
                  ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/30'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>🌙 Evening</span>
              <span className="text-[9px] opacity-80">({periodCounts.evening})</span>
            </button>
          </div>
        )}

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
        ) : displayedHabits.length === 0 ? (
          <div className="py-6 text-center">
            <p className="font-body-text text-xs text-on-surface-variant">
              No habits tagged for this time period.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
            {displayedHabits.map((habit) => {
              const done = isCompleted(habit.id, todayDateKey);
              const metrics = habitMetricsMap[habit.id];
              const streak = metrics?.streakCount ?? 0;
              const isShieldActive = metrics?.isShieldActive;
              const timeTag = habit.timeOfDay && habit.timeOfDay !== 'anytime' ? TIME_OF_DAY_CONFIG[habit.timeOfDay] : null;

              return (
                <div
                  key={habit.id}
                  onClick={() => handleToggle(habit.id)}
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

                    {/* Habit Name & Time of Day Tag */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-habit-name text-xs sm:text-sm font-semibold truncate block transition-colors ${
                            done
                              ? 'text-on-surface-variant line-through opacity-80'
                              : 'text-on-surface'
                          }`}
                        >
                          {habit.name}
                        </span>
                        {timeTag && (
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 opacity-90 ${timeTag.color}`}>
                            <span className="material-symbols-outlined text-[12px]">{timeTag.icon}</span>
                            <span className="hidden xs:inline">{timeTag.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak Flame & Shield badge */}
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
                    {isShieldActive && (
                      <span
                        title="Protected by Streak Shield"
                        className="material-symbols-outlined text-[12px] text-secondary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        shield
                      </span>
                    )}
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
