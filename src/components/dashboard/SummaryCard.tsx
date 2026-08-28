import React from 'react';
import { DashboardMetrics } from '../../types';

interface SummaryCardProps {
  metrics: DashboardMetrics;
  userName?: string;
  className?: string;
}

function getTimeGreeting(): { greeting: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', icon: 'wb_sunny' };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', icon: 'wb_cloudy' };
  } else {
    return { greeting: 'Good evening', icon: 'nights_stay' };
  }
}

function getProgressSnippet(percentage: number, remaining: number): { label: string; icon: string } {
  if (remaining === 0 && percentage === 100) {
    return { label: '100% Done • Outstanding! 🏆', icon: 'celebration' };
  }
  if (percentage >= 75) {
    return { label: `${percentage}% Done • Almost there! 🚀`, icon: 'rocket_launch' };
  }
  if (percentage >= 50) {
    return { label: `${percentage}% Done • Halfway through! 💪`, icon: 'trending_up' };
  }
  if (percentage > 0) {
    return { label: `${percentage}% Done • Great start! ✨`, icon: 'bolt' };
  }
  return { label: 'Ready for today? 🌱', icon: 'calendar_today' };
}

function getNextStreakMilestone(streak: number): string {
  if (streak < 7) return `${7 - streak}d to Bronze 🥉`;
  if (streak < 14) return `${14 - streak}d to Silver 🥈`;
  if (streak < 30) return `${30 - streak}d to Gold 🥇`;
  if (streak < 100) return `${100 - streak}d to Diamond 💎`;
  return 'Legendary 👑';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics, userName, className = '' }) => {
  const { totalDailyHabits, completedTodayCount, completionPercentage, streakCount } = metrics;

  const { greeting } = getTimeGreeting();
  const remainingCount = Math.max(0, totalDailyHabits - completedTodayCount);
  const progressSnip = getProgressSnippet(completionPercentage, remainingCount);
  const milestoneSnip = getNextStreakMilestone(streakCount);

  // SVG Progress Ring calculations (radius = 42, circumference ~ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * Math.min(100, Math.max(0, completionPercentage))) / 100;

  const displayName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Soft decorative background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

      {/* Card Top: Greeting & Streak Badge */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              {greeting}, {displayName}! 👋
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {remainingCount === 0 && totalDailyHabits > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container border border-secondary/20">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>All habits done today! 🎉</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-body-text">
                <strong className="text-primary dark:text-primary-fixed-dim font-bold">
                  {remainingCount} {remainingCount === 1 ? 'habit' : 'habits'} left today
                </strong>
                <span>• Keep momentum</span>
              </span>
            )}
          </div>
        </div>

        {/* Gamified Streak & Milestone Badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            title={`Current streak: ${streakCount} consecutive days. ${milestoneSnip}`}
            className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary-fixed-dim/20 text-primary dark:text-primary-fixed-dim px-3 py-1 rounded-full border border-primary/25 shadow-xs"
          >
            <span
              className="material-symbols-outlined text-[16px] text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-stat-label text-xs uppercase tracking-wider font-extrabold">
              {streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>

          <span className="text-[10px] font-stat-label text-on-surface-variant font-medium">
            {milestoneSnip}
          </span>
        </div>
      </div>

      {/* Card Center/Bottom: Progress Ring & Motivation */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 pt-2">
        {/* SVG Progress Ring */}
        <div className="relative w-24 h-24 sm:w-26 sm:h-26 shrink-0 flex items-center justify-center">
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
            <span className="font-app-title text-xl sm:text-2xl font-black text-on-surface tracking-tight leading-none">
              {completionPercentage}
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant">%</span>
            </span>
          </div>
        </div>

        {/* Text Details with motivational badge */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left justify-center space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-app-title text-2xl sm:text-3xl font-black text-on-surface leading-none">
              {completedTodayCount}
            </span>
            <span className="font-section-header text-sm text-on-surface-variant font-bold">
              of {totalDailyHabits} completed
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-container-high dark:bg-surface-container-highest/40 text-on-surface text-xs font-semibold border border-outline-variant/15 shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-primary">
              {progressSnip.icon}
            </span>
            <span>{progressSnip.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
