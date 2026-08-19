import React from 'react';
import { DashboardMetrics } from '../../types';

interface SummaryCardProps {
  metrics: DashboardMetrics;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics, className = '' }) => {
  const { totalDailyHabits, completedTodayCount, completionPercentage, streakCount } = metrics;

  // SVG Progress Ring calculations (radius = 42, circumference ~ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, completionPercentage))) / 100;

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-md sm:p-lg flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Soft decorative background glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary-container/20 dark:bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Top: Header & Streak Badge */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h2 className="font-section-header text-base sm:text-lg font-semibold text-on-surface mb-0.5">
            Today's Progress
          </h2>
          <p className="text-on-surface-variant font-body-text text-xs">
            {completionPercentage === 100 && totalDailyHabits > 0
              ? 'All daily habits completed today!'
              : 'Keep up the gentle momentum.'}
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 bg-primary-fixed/40 dark:bg-primary-fixed-dim/20 text-on-primary-fixed-variant dark:text-primary-fixed-dim px-3 py-1.5 rounded-full border border-primary/20 shrink-0">
          <span
            className="material-symbols-outlined text-[16px] text-tertiary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_fire_department
          </span>
          <span className="font-stat-label text-xs uppercase tracking-wider font-bold">
            {streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
          </span>
        </div>
      </div>

      {/* Card Center/Bottom: Progress Ring & Details */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 pt-1">
        {/* SVG Progress Ring */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              className="text-primary/10 stroke-current"
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              strokeWidth="8"
            />
            {/* Animated Fill Stroke */}
            <circle
              className="text-primary stroke-current transition-all duration-1000 ease-out"
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="font-app-title text-xl sm:text-2xl font-bold text-on-surface tracking-tight leading-none">
              {completionPercentage}
              <span className="text-xs sm:text-sm font-normal text-on-surface-variant">%</span>
            </span>
          </div>
        </div>

        {/* Text Counts */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left justify-center">
          <div className="flex items-baseline gap-1">
            <span className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface leading-none">
              {completedTodayCount}
            </span>
            <span className="font-section-header text-base text-on-surface-variant">
              / {totalDailyHabits}
            </span>
          </div>
          <p className="text-on-surface-variant font-body-text text-xs sm:text-sm mt-1">
            {totalDailyHabits === 0
              ? 'No daily habits configured yet'
              : `${completedTodayCount} of ${totalDailyHabits} habits completed today`}
          </p>
        </div>
      </div>
    </div>
  );
};
