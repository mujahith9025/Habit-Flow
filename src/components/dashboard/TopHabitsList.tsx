import React from 'react';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';

interface TopHabitsListProps {
  topHabits: HabitGridMetrics[];
  className?: string;
}

export const TopHabitsList: React.FC<TopHabitsListProps> = ({
  topHabits,
  className = '',
}) => {
  if (topHabits.length === 0) return null;

  // Display top 4 ranked habits
  const displayedHabits = topHabits.slice(0, 4);

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <h2 className="font-section-header text-base sm:text-lg font-semibold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary">
            emoji_events
          </span>
          Top Habits
        </h2>
        <span className="text-[11px] font-stat-label text-on-surface-variant uppercase">
          Ranked by consistency
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md sm:gap-lg">
        {displayedHabits.map((item) => {
          const { habit, monthProgressPercent, streakCount, rank } = item;
          const radius = 22;
          const circumference = 2 * Math.PI * radius; // ~138.23
          const strokeDashoffset =
            circumference - (circumference * Math.min(100, Math.max(0, monthProgressPercent))) / 100;

          return (
            <div
              key={habit.id}
              className="bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-all duration-200"
            >
              {/* Left: Mini SVG Progress Ring + Habit Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Mini SVG Progress Ring */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                    <circle
                      className="text-primary/10 stroke-current"
                      cx="30"
                      cy="30"
                      fill="transparent"
                      r={radius}
                      strokeWidth="5"
                    />
                    <circle
                      className="text-primary stroke-current transition-all duration-1000 ease-out"
                      cx="30"
                      cy="30"
                      fill="transparent"
                      r={radius}
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs font-bold text-primary dark:text-primary-fixed-dim leading-none">
                      {monthProgressPercent}%
                    </span>
                  </div>
                </div>

                {/* Habit Name & Rank */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-habit-name text-xs sm:text-sm font-semibold text-on-surface truncate">
                    {habit.name}
                  </h4>
                  <p className="font-stat-label text-[10px] sm:text-[11px] text-on-surface-variant uppercase mt-0.5 tracking-wider">
                    Rank #{rank}
                  </p>
                </div>
              </div>

              {/* Right: Flame Streak Pill Badge */}
              <div className="flex items-center gap-1 bg-primary-fixed/40 dark:bg-primary-fixed-dim/20 text-on-primary-fixed-variant dark:text-primary-fixed-dim px-2.5 sm:px-3 py-1 rounded-full border border-primary/20 shrink-0">
                <span
                  className="material-symbols-outlined text-[14px] text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-stat-label text-[10px] sm:text-xs uppercase tracking-wider font-bold">
                  {streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
