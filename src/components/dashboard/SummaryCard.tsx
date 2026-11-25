import React from 'react';
import { DashboardMetrics } from '../../types';
import { RadialOrbitGauge } from '../ui/RadialOrbitGauge';

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
  if (streak === 0) return 'Plant the seed 🌱';
  if (streak < 3) return `${3 - streak}d to Sprout 🌿`;
  if (streak < 7) return `${7 - streak}d to Bamboo 🎋`;
  if (streak < 14) return `${14 - streak}d to Cedar 🌲`;
  if (streak < 30) return `${30 - streak}d to Deep Roots 🌳`;
  if (streak < 100) return `${100 - streak}d to Evergreen 🍃`;
  return 'Eternal Flow 🌊';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics, userName, className = '' }) => {
  const { totalDailyHabits, completedTodayCount, completionPercentage, streakCount } = metrics;

  const { greeting } = getTimeGreeting();
  const remainingCount = Math.max(0, totalDailyHabits - completedTodayCount);
  const progressSnip = getProgressSnippet(completionPercentage, remainingCount);
  const milestoneSnip = getNextStreakMilestone(streakCount);

  const displayName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container-lowest shadow-soft border border-outline-variant/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top Greeting & Friendly Whimsical Note with Editorial Scale Jump */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high dark:bg-surface-container-high text-[11px] font-semibold text-on-surface-variant mb-1 -rotate-1 shadow-xs">
            <span>Small steps, big results</span>
            <span className="material-symbols-outlined text-[13px]">trending_up</span>
          </div>
          <h2 className="font-app-title text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
            {greeting}, <span className="text-primary dark:text-primary">{displayName}</span> 👋
          </h2>
          <p className="font-editorial italic text-xs sm:text-sm text-on-surface-variant">
            Build what you love, one mindful day at a time.
          </p>
        </div>

        {/* Dual-Accent Gamified Streak & Milestone Badge (Terracotta Mindful Flame) */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            title={`Current streak: ${streakCount} consecutive days. ${milestoneSnip}`}
            className="flex items-center gap-1.5 bg-[#A65A42]/15 text-[#A65A42] dark:text-[#ffb4a2] px-3 py-1 rounded-full border border-[#A65A42]/25 shadow-xs"
          >
            <span
              className="material-symbols-outlined text-[16px] text-[#A65A42] dark:text-[#ffb4a2]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-stat-label text-xs uppercase tracking-wider font-extrabold">
              {streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>

          <span className="text-[10px] font-editorial italic text-on-surface-variant">
            {milestoneSnip}
          </span>
        </div>
      </div>

      {/* Hero Cinematic Progress Card with Radial Orbit Gauge */}
      <div className="relative rounded-2xl overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-[#1C1F22] via-[#24282D] to-[#161719] text-white shadow-soft">
        {/* Subtle decorative forest/mountain glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col justify-between gap-2.5 min-w-0">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="uppercase tracking-wider font-bold text-[11px]">Today's Progress</span>
              <span className="text-[11px] font-medium text-white/90 flex items-center gap-1 truncate ml-2">
                <span>{progressSnip.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-app-title text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {completedTodayCount} <span className="text-xl font-normal text-white/60">/ {totalDailyHabits}</span>
              </span>
              <span className="text-xs text-white/70 font-medium truncate">habits completed</span>
            </div>

            {/* Sleek Pill Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#52995D] to-[#88C490] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/80 pt-0.5">
              <span>{completionPercentage}% complete</span>
              <span className="flex items-center gap-1 text-white font-semibold">
                <span>Keep going</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Radial Habit Orbit Gauge */}
          <div className="shrink-0 flex items-center justify-center pl-2">
            <RadialOrbitGauge
              percentage={completionPercentage}
              size={84}
              strokeWidth={7}
              showValue={true}
              gradientColors={['#2D5A34', '#52995D', '#88C490']}
              trackColor="rgba(255, 255, 255, 0.15)"
              showOrbitMarker={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
