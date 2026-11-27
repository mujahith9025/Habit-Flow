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

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics, userName, className = '' }) => {
  const { totalDailyHabits, completedTodayCount, completionPercentage, streakCount } = metrics;

  const { greeting } = getTimeGreeting();
  const displayName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container-lowest shadow-soft border border-outline-variant/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top Greeting & Streak */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h2 className="font-app-title text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            {greeting}, <span className="text-primary dark:text-primary">{displayName}</span>
          </h2>
        </div>

        {/* Minimal Streak Badge */}
        <div
          title={`Current streak: ${streakCount} consecutive days`}
          className="flex items-center gap-1.5 bg-[#A65A42]/10 text-[#A65A42] dark:text-[#ffb4a2] px-3 py-1 rounded-full border border-[#A65A42]/20 shadow-xs"
        >
          <span
            className="material-symbols-outlined text-[16px] text-[#A65A42] dark:text-[#ffb4a2]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_fire_department
          </span>
          <span className="font-stat-label text-xs uppercase tracking-wider font-extrabold font-tnum">
            {streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
          </span>
        </div>
      </div>

      {/* Clean Progress Card with Radial Orbit Gauge */}
      <div className="relative rounded-2xl overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-[#1C1F22] via-[#24282D] to-[#161719] text-white shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col justify-between gap-2.5 min-w-0">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="uppercase tracking-wider font-bold text-[11px]">Today's Progress</span>
              <span className="text-[11px] font-medium text-white/90 font-tnum">
                {completionPercentage}%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-app-title font-tnum text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {completedTodayCount} <span className="text-xl font-normal text-white/60">/ {totalDailyHabits}</span>
              </span>
              <span className="text-xs text-white/70 font-medium">completed</span>
            </div>

            {/* Sleek Pill Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#52995D] to-[#88C490] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              />
            </div>
          </div>

          {/* Radial Habit Orbit Gauge */}
          <div className="shrink-0 flex items-center justify-center pl-2">
            <RadialOrbitGauge
              percentage={completionPercentage}
              size={80}
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
