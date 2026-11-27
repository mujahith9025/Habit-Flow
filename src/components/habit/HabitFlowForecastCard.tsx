import React from 'react';
import { FlowForecastResult } from '../../utils/flowForecast';
import { AnalyticalHelpTooltip } from '../ui/AnalyticalHelpTooltip';

interface HabitFlowForecastCardProps {
  forecast: FlowForecastResult;
  className?: string;
}

export const HabitFlowForecastCard: React.FC<HabitFlowForecastCardProps> = ({
  forecast,
  className = '',
}) => {
  const {
    isCurrentMonth,
    isPastMonth,
    daysRemaining,
    completedToDate,
    trailingDailyVelocity,
    projectedTotalChecks,
    projectedRatePercent,
    is80TargetSecured,
    target80Delta,
    requiredDailyPaceFor80,
    activeShieldsCount,
    naturalLanguageInsight,
  } = forecast;

  return (
    <div
      className={`japandi-card rounded-3xl p-5 sm:p-6 shadow-soft space-y-4 transition-all ${className}`}
    >
      {/* 1. Header with Target Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              speed
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center">
              Flow Forecast & Pacing Intelligence
              <AnalyticalHelpTooltip
                term="Flow Pacing"
                explanation="Calculated from your rolling 7-day velocity to forecast your month-end completion percentage against the 80% Flow benchmark."
              />
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant">
            Predictive trajectory based on your trailing 7-day velocity versus the 80% Flow benchmark.
          </p>
        </div>

        {/* Status Badge */}
        <div className="self-start sm:self-auto">
          {is80TargetSecured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#52995D]/15 text-[#2D5A34] dark:text-[#88C490] border border-[#52995D]/30 shadow-2xs font-stat-label font-tnum">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>80% Flow Target Secured ({projectedRatePercent}%)</span>
            </span>
          ) : isCurrentMonth && daysRemaining > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A373]/20 text-[#8C5D30] dark:text-[#E2B788] border border-[#D4A373]/40 shadow-2xs font-stat-label font-tnum">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>Target: {requiredDailyPaceFor80} checks/day</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/20 font-stat-label">
              <span>{isPastMonth ? 'Cycle Complete' : 'Upcoming Cycle'}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. 4-Pillar Predictive Metric Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cell 1: Projected Month-End Rate */}
        <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col justify-between space-y-2">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            Projected Month-End Rate
          </span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-on-surface">
                {projectedRatePercent}%
              </span>
              <span
                className={`text-xs font-bold font-stat-label font-tnum ${
                  target80Delta >= 0
                    ? 'text-[#2D5A34] dark:text-[#88C490]'
                    : 'text-[#A65A42] dark:text-[#E8927C]'
                }`}
              >
                {target80Delta >= 0 ? `+${target80Delta}%` : `${target80Delta}%`} vs 80%
              </span>
            </div>
            {/* Progress bar gauge */}
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${projectedRatePercent}%`,
                  backgroundColor: projectedRatePercent >= 80 ? '#2D5A34' : '#D4A373',
                }}
              />
            </div>
          </div>
        </div>

        {/* Cell 2: Trailing Daily Velocity */}
        <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col justify-between space-y-2">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold flex items-center">
            Current Daily Velocity
            <AnalyticalHelpTooltip
              term="Daily Velocity"
              explanation="The average number of habit checks you have completed per day over the trailing 7 days."
            />
          </span>
          <div>
            <div className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-primary dark:text-primary-fixed-dim">
              {trailingDailyVelocity}
              <span className="text-xs font-normal text-on-surface-variant ml-1">checks/d</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-body-text mt-1">
              Trailing 7-day average check-in pace
            </p>
          </div>
        </div>

        {/* Cell 3: Completed vs Remaining */}
        <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col justify-between space-y-2">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            Pacing & Progress
          </span>
          <div>
            <div className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-on-surface">
              {completedToDate}
              <span className="text-xs font-normal text-on-surface-variant ml-1">
                / {projectedTotalChecks} proj
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-body-text mt-1">
              {daysRemaining > 0 ? `${daysRemaining} days remaining in cycle` : 'Cycle finalized'}
            </p>
          </div>
        </div>

        {/* Cell 4: Streak Shield Safety Net */}
        <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col justify-between space-y-2">
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            Resilience & Shields
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                shield
              </span>
              <span className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-on-surface">
                {activeShieldsCount}
              </span>
              <span className="text-xs font-normal text-on-surface-variant">Active</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-body-text mt-1">
              {activeShieldsCount > 0 ? 'Vacation / pause safety active' : 'Zero streak shields consumed'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Natural Language Botanical Insight Banner */}
      <div className="p-3.5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
          psychology
        </span>
        <p className="text-xs text-on-surface leading-relaxed font-body-text">
          {naturalLanguageInsight}
        </p>
      </div>
    </div>
  );
};
