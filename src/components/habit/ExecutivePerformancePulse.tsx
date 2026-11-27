import React, { useMemo } from 'react';
import { Habit } from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { HabitHistoryMetrics } from '../../hooks/useSingleHabitHistory';
import { useCategoryAllTimeData } from '../../hooks/useCategoryAllTimeData';
import { triggerHaptic } from '../../utils/haptics';
import { BotanicalGrowthRankBadge } from './BotanicalGrowthRankBadge';
import { AnalyticalHelpTooltip } from '../ui/AnalyticalHelpTooltip';

export interface ExecutivePerformancePulseProps {
  selectedHabitId: string;
  categoryName: string;
  selectedDate: Date;
  formattedMonthTitle: string;
  habits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  singleHabit?: Habit | null;
  singleMetrics?: HabitHistoryMetrics | null;
  onOpenMilestoneCard?: () => void;
  onOpenLaurelCeremony?: () => void;
  className?: string;
}

export const ExecutivePerformancePulse: React.FC<ExecutivePerformancePulseProps> = ({
  selectedHabitId,
  categoryName,
  selectedDate,
  formattedMonthTitle,
  habits,
  habitMetricsMap,
  singleHabit,
  singleMetrics,
  onOpenMilestoneCard,
  onOpenLaurelCeremony,
  className = '',
}) => {
  const isSingle = selectedHabitId !== 'all' && singleHabit != null;

  // Previous month calculation for period-over-period comparison
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const prevDate = useMemo(() => new Date(currentYear, currentMonth - 1, 1), [currentYear, currentMonth]);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthName = prevDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Category-level all-time intelligence for the aggregate board view
  const categoryAllTime = useCategoryAllTimeData(habits);

  // Compute metrics depending on whether single habit or category aggregate is viewed
  const pulseData = useMemo(() => {
    if (isSingle && singleMetrics && singleHabit) {
      const rate = singleMetrics.monthCompletionPercent;
      const completed = singleMetrics.monthCompletedDays;
      const total = singleMetrics.daysInMonth;
      const currentStreak = singleMetrics.currentStreak;
      const longestStreak = singleMetrics.longestStreak;

      // Period-over-period lift
      const prevMonthPerf = singleMetrics.monthlyHistory.find((m) => m.monthKey === prevMonthKey);
      const prevRate = prevMonthPerf ? prevMonthPerf.percent : null;
      const delta = prevRate !== null ? Math.round((rate - prevRate) * 10) / 10 : null;

      // Peak Day
      const peak = singleMetrics.peakDayOfWeek;
      const peakDayName = peak?.day || 'Mid-week';
      const peakDayPercent = peak?.percent || rate;

      // Weekday vs Weekend stats
      let weekdayCount = 0;
      let weekdayTotal = 0;
      let weekendCount = 0;
      let weekendTotal = 0;
      singleMetrics.dayOfWeekStats.forEach((d) => {
        if (d.shortLabel === 'Sat' || d.shortLabel === 'Sun') {
          weekendCount += d.count;
          weekendTotal += d.totalDays;
        } else {
          weekdayCount += d.count;
          weekdayTotal += d.totalDays;
        }
      });
      const weekdayRate = weekdayTotal > 0 ? Math.round((weekdayCount / weekdayTotal) * 100) : rate;
      const weekendRate = weekendTotal > 0 ? Math.round((weekendCount / weekendTotal) * 100) : rate;

      return {
        title: singleHabit.name,
        badgeLabel: singleHabit.category || categoryName,
        rate,
        prevRate,
        delta,
        completed,
        total,
        currentStreak,
        longestStreak,
        shieldsCount: 0,
        peakDayName,
        peakDayPercent,
        weekdayRate,
        weekendRate,
        contextLead: `Target: ${singleHabit.goalCount || 1}x/${singleHabit.frequency || 'daily'}`,
      };
    }

    // Category / Board Aggregate View
    const metricsList = Object.values(habitMetricsMap);
    const completed = metricsList.reduce((acc, m) => acc + (m.completedCount || 0), 0);
    const total = metricsList.reduce((acc, m) => acc + (m.targetCount || 0), 0);
    const rate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    // Period-over-period delta for board
    const prevTrend = categoryAllTime.monthlyCategoryTrend.find((t) => t.monthKey === prevMonthKey);
    const prevRate = prevTrend ? prevTrend.averagePercent : null;
    const delta = prevRate !== null ? Math.round((rate - prevRate) * 10) / 10 : null;

    // Peak Day & Weekday vs Weekend
    const peakDayName = categoryAllTime.peakDay?.day || 'Wednesday';
    const peakDayPercent = categoryAllTime.peakDay?.percent || rate;
    const weekdayRate = categoryAllTime.weekdayPercent || rate;
    const weekendRate = categoryAllTime.weekendPercent || rate;

    // Max streak & Grace Shields active
    const maxStreak = metricsList.reduce((max, m) => Math.max(max, m.streakCount || 0), 0);
    const longestStreak = categoryAllTime.topHabit?.longestStreak || maxStreak;
    const shieldsCount = metricsList.filter((m) => m.isShieldActive || (m.shieldsRemaining || 0) > 0).length;

    const topHabitName = categoryAllTime.topHabit?.habit.name;

    return {
      title: `${categoryName} Tracker Board`,
      badgeLabel: `${habits.length} Active Habits`,
      rate,
      prevRate,
      delta,
      completed,
      total,
      currentStreak: maxStreak,
      longestStreak,
      shieldsCount,
      peakDayName,
      peakDayPercent,
      weekdayRate,
      weekendRate,
      contextLead: topHabitName ? `Lead Habit: ${topHabitName}` : `${habits.length} Habits Tracked`,
    };
  }, [
    isSingle,
    singleMetrics,
    singleHabit,
    categoryName,
    habits,
    habitMetricsMap,
    prevMonthKey,
    categoryAllTime,
  ]);

  // Editorial headline & status tone
  const editorial = useMemo(() => {
    const { rate } = pulseData;
    if (rate >= 85) {
      return {
        eyebrow: 'Flourishing Flow State',
        headline: 'Excellence Compounded — Locked In Rhythm',
        statusPill: '🌟 Peak Flow',
        statusClass: 'bg-[#52995D]/15 text-[#2D5A34] dark:text-[#88C490] border-[#52995D]/30',
      };
    }
    if (rate >= 70) {
      return {
        eyebrow: 'Grounded Resilience',
        headline: 'Steady Roots Deepening — Consistent Momentum',
        statusPill: '⚡ Solid Rhythm',
        statusClass: 'bg-primary/10 text-primary dark:text-primary-fixed-dim border-primary/20',
      };
    }
    if (rate >= 50) {
      return {
        eyebrow: 'Steady Compounding',
        headline: 'One Mindful Step at a Time — Habit Foundation',
        statusPill: '🌱 Building Base',
        statusClass: 'bg-[#D4A373]/20 text-[#8C5D30] dark:text-[#E2B788] border-[#D4A373]/30',
      };
    }
    return {
      eyebrow: 'Gentle Cultivation',
      headline: 'Sowing the Seeds — Every Small Repetition Matters',
      statusPill: '🌿 New Growth',
      statusClass: 'bg-[#A65A42]/15 text-[#A65A42] dark:text-[#E8927C] border-[#A65A42]/30',
    };
  }, [pulseData]);

  // Dynamic natural-language executive takeaway
  const takeaway = useMemo(() => {
    const { delta, rate, weekdayRate, weekendRate, peakDayName, peakDayPercent } = pulseData;

    if (delta !== null && delta >= 5) {
      return `Momentum is accelerating! Completion rate is up ${delta}% compared to ${prevMonthName}.`;
    }
    if (delta !== null && delta <= -7) {
      return `Consistency is down ${Math.abs(delta)}% vs ${prevMonthName}. Re-anchor with lightweight 2-minute micro-habits to regain rhythm.`;
    }
    if (weekdayRate > 0 && weekendRate > 0 && weekdayRate - weekendRate >= 18) {
      const drop = Math.round(weekdayRate - weekendRate);
      return `Your habit rhythm dips by ${drop}% on weekends (${weekdayRate}% weekday vs ${weekendRate}% weekend). Consider setting intentional gentle anchors.`;
    }
    if (peakDayPercent >= 75) {
      return `Peak execution occurs on ${peakDayName}s with a ${peakDayPercent}% check-in rate. Channel that mid-week energy across your wider routine.`;
    }
    if (rate >= 80) {
      return `You have achieved a locked-in Flow State (${rate}%). Automaticity and identity-level habit compounding are taking hold.`;
    }
    if (rate >= 50) {
      return `Solid foundational consistency at ${rate}%. Focus on showing up daily without breaking the chain.`;
    }
    return `Building lifelong habits takes patience. Showing up for even 2 mindful minutes each day keeps neural momentum alive.`;
  }, [pulseData, prevMonthName]);

  return (
    <div
      className={`japandi-card rounded-3xl p-5 sm:p-6 shadow-soft relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Subtle Botanical Aura Glow Accents (Japandi Inspo) */}
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-secondary/5 dark:bg-secondary/10 blur-3xl pointer-events-none" />

      {/* Top Header: Badge, Title, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high dark:bg-surface-container-high text-[11px] font-semibold text-on-surface-variant shadow-xs whitespace-nowrap">
            <span
              className="material-symbols-outlined text-[14px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              insights
            </span>
            <span>Monthly Overview</span>
            <span>•</span>
            <span className="font-bold text-on-surface">{formattedMonthTitle}</span>
          </div>

          <h2 className="font-app-title text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            {isSingle ? pulseData.title : `${categoryName} (${habits.length} habits)`}
          </h2>
        </div>

        {/* Status Pill, Botanical Growth Rank, Milestone Card & Laurel Ceremony */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <div
            className={`px-3 py-1 rounded-full border text-xs font-bold font-stat-label flex items-center gap-1.5 shadow-2xs ${editorial.statusClass}`}
          >
            <span>{editorial.statusPill}</span>
          </div>

          {/* Botanical Growth Rank Badge */}
          <BotanicalGrowthRankBadge
            days={pulseData.longestStreak}
            size="sm"
            showProgress={false}
          />

          {/* Shareable Milestone Card Modal Trigger */}
          {onOpenMilestoneCard && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenMilestoneCard();
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Share Milestone Card"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-500">stars</span>
              <span className="hidden sm:inline">Milestone Card</span>
            </button>
          )}

          {/* End-of-Month Laurel Ceremony Trigger */}
          {onOpenLaurelCeremony && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('milestone');
                onOpenLaurelCeremony();
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-fixed-dim border border-primary/30 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Open Month Laurel Ceremony"
            >
              <span>👑</span>
              <span className="hidden sm:inline">Laurel</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Bento Micro-Tiles with Pinned Optical Baselines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 my-4 relative z-10 items-stretch">
        {/* Tile 1: Consistency */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-all min-h-[136px] flex flex-col justify-between">
          <div className="h-6 flex items-center justify-between">
            <span className="font-stat-label text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-on-surface-variant flex items-center">
              Monthly Consistency
              <AnalyticalHelpTooltip
                term="80% Flow State"
                explanation="Behavioral scientists found that reaching 80% consistency is the optimal threshold for permanent habit automaticity without burnout or guilt."
              />
            </span>

            {/* Period-over-Period Lift Pill */}
            {pulseData.delta !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-tnum ${
                  pulseData.delta > 0
                    ? 'bg-[#52995D]/15 text-[#2D5A34] dark:text-[#88C490]'
                    : pulseData.delta < 0
                    ? 'bg-[#A65A42]/15 text-[#A65A42] dark:text-[#E8927C]'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
                title={`Change compared to ${prevMonthName}`}
              >
                {pulseData.delta > 0 ? `+${pulseData.delta}% ↗` : pulseData.delta < 0 ? `${pulseData.delta}% ↘` : '0.0% ➔'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-highest text-on-surface-variant">
                <span>Baseline 🌱</span>
              </span>
            )}
          </div>

          <div className="h-10 flex items-baseline">
            <div className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {pulseData.rate}
              <span className="text-base font-semibold text-primary ml-0.5">%</span>
            </div>
          </div>

          <div className="h-5 flex items-center">
            <p className="text-[11px] text-on-surface-variant font-body-text truncate">
              <span className="font-bold font-tnum text-on-surface">{pulseData.completed}</span> of{' '}
              <span className="font-bold font-tnum text-on-surface">{pulseData.total}</span> checks
              {pulseData.delta !== null ? ` • vs ${prevMonthName}` : ''}
            </p>
          </div>
        </div>

        {/* Tile 2: Best Day */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-all min-h-[136px] flex flex-col justify-between">
          <div className="h-6 flex items-center justify-between">
            <span className="font-stat-label text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-on-surface-variant flex items-center">
              Best Day
              <AnalyticalHelpTooltip
                term="Peak Energy Day"
                explanation="The day of the week when your habit execution rate statistically reaches its highest probability."
              />
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/40 text-on-secondary-container font-tnum">
              <span>{pulseData.peakDayPercent}% Rate</span>
            </span>
          </div>

          <div className="h-10 flex items-baseline">
            <div className="font-app-title text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight capitalize truncate">
              {pulseData.peakDayName}s
            </div>
          </div>

          <div className="h-5 flex items-center">
            <p className="text-[11px] text-on-surface-variant font-body-text truncate">
              Weekday: <span className="font-bold font-tnum text-on-surface">{pulseData.weekdayRate}%</span> • Weekend:{' '}
              <span className="font-bold font-tnum text-on-surface">{pulseData.weekendRate}%</span>
            </p>
          </div>
        </div>

        {/* Tile 3: Current Streak */}
        <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-all min-h-[136px] flex flex-col justify-between">
          <div className="h-6 flex items-center justify-between">
            <span className="font-stat-label text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-on-surface-variant flex items-center">
              Current Streak
              <AnalyticalHelpTooltip
                term="Streak Momentum"
                explanation="Tracks unbroken consecutive days of execution. Never missing twice prevents neural decay."
              />
            </span>
            {pulseData.shieldsCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A65A42]/15 text-[#A65A42] dark:text-[#E8927C] font-tnum">
                <span>{pulseData.shieldsCount} Shield{pulseData.shieldsCount > 1 ? 's' : ''} 🛡️</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:text-primary-fixed-dim font-tnum">
                <span>Best: {pulseData.longestStreak}d 🔥</span>
              </span>
            )}
          </div>

          <div className="h-10 flex items-baseline">
            <div className="font-app-title font-tnum text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {pulseData.currentStreak}
              <span className="text-base font-semibold text-on-surface-variant ml-1">Days</span>
            </div>
          </div>

          <div className="h-5 flex items-center">
            <p className="text-[11px] text-on-surface-variant font-body-text truncate">
              {pulseData.contextLead} • Best: <span className="font-bold font-tnum text-on-surface">{pulseData.longestStreak}d</span>
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Natural-Language Key Highlight Bar */}
      <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-3 sm:p-3.5 border border-primary/15 flex items-start sm:items-center gap-2.5 relative z-10">
        <span
          className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5 sm:mt-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <div className="text-xs text-on-surface leading-relaxed">
          <span className="font-bold text-primary dark:text-primary-fixed-dim mr-1.5">Key Highlight:</span>
          <span className="text-on-surface-variant">{takeaway}</span>
        </div>
      </div>
    </div>
  );
};
