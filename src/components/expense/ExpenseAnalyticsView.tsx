import React, { useState } from 'react';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import { formatMoney } from '../../lib/expenseCalculations';
import { triggerHaptic } from '../../utils/haptics';

interface ExpenseAnalyticsViewProps {
  rows: DailyLedgerRow[];
  monthSummaries: MonthExpenseSummary[];
  totalCumulativeSavings: number;
  settings: ExpenseTrackerSettings;
  onOpenExportModal?: () => void;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ExpenseAnalyticsView: React.FC<ExpenseAnalyticsViewProps> = ({
  rows,
  monthSummaries,
  totalCumulativeSavings,
  settings,
}) => {
  const sym = settings.currencySymbol || '₹';
  const [calculatorDailyRate, setCalculatorDailyRate] = useState(settings.defaultDailySavings || 50);

  // 1. Core Analytics Calculations
  const totalDaysLogged = rows.length;
  const totalGrossSavings = rows.reduce((acc, r) => acc + r.savingsAmount, 0);
  const totalExpensesDeducted = rows.reduce(
    (acc, r) => acc + (r.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0),
    0
  );

  const avgDailySavings = totalDaysLogged > 0 ? Math.round(totalCumulativeSavings / totalDaysLogged) : 0;
  const projectedYearlySavings = avgDailySavings * 365;

  // Streak Calculation (consecutive recorded days)
  let activeStreak = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].savingsAmount > 0) {
      activeStreak++;
    } else {
      break;
    }
  }

  // 2. Day-of-Week Breakdown
  const dayOfWeekTotals: Record<number, { count: number; total: number }> = {
    0: { count: 0, total: 0 },
    1: { count: 0, total: 0 },
    2: { count: 0, total: 0 },
    3: { count: 0, total: 0 },
    4: { count: 0, total: 0 },
    5: { count: 0, total: 0 },
    6: { count: 0, total: 0 },
  };

  rows.forEach((r) => {
    const d = new Date(r.dateKey);
    const day = isNaN(d.getDay()) ? 0 : d.getDay();
    dayOfWeekTotals[day].count++;
    dayOfWeekTotals[day].total += r.savingsAmount;
  });

  const dayOfWeekAverages = WEEKDAY_NAMES.map((name, index) => {
    const data = dayOfWeekTotals[index];
    const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
    return { name, avg, count: data.count };
  });

  const maxDayAvg = Math.max(...dayOfWeekAverages.map((d) => d.avg), 1);
  const bestDay = dayOfWeekAverages.reduce((max, d) => (d.avg > max.avg ? d : max), dayOfWeekAverages[0]);

  // 3. Milestones Calculation
  const milestones = [
    { id: 'bronze', label: '🥉 Starter Vault', target: 1000 },
    { id: 'silver', label: '🥈 Silver Cushion', target: 5000 },
    { id: 'gold', label: '🥇 Gold Fortress', target: 10000 },
    { id: 'diamond', label: '💎 Diamond Reserve', target: 25000 },
  ];

  const nextMilestone = milestones.find((m) => totalCumulativeSavings < m.target) || milestones[milestones.length - 1];
  const remainingToMilestone = Math.max(0, nextMilestone.target - totalCumulativeSavings);
  const daysToMilestone = avgDailySavings > 0 ? Math.ceil(remainingToMilestone / avgDailySavings) : 0;

  // 4. Cumulative Trend Line Coordinates (SVG)
  const chartPoints = rows.slice(-30); // Last 30 entries
  const maxBalance = Math.max(...chartPoints.map((r) => r.cumulativeBalance), 100);
  const minBalance = Math.min(...chartPoints.map((r) => r.cumulativeBalance), 0);
  const balanceRange = Math.max(maxBalance - minBalance, 1);

  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 20;
  const paddingY = 25;

  const pointsString = chartPoints
    .map((r, i) => {
      const x = paddingX + (i / Math.max(chartPoints.length - 1, 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((r.cumulativeBalance - minBalance) / balanceRange) * (svgHeight - paddingY * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top 4 Financial KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Cumulative Savings */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Total Cumulative
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-primary dark:text-primary-fixed-dim">
              {formatMoney(totalCumulativeSavings, sym)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold font-stat-label">
                +{totalDaysLogged} Days Logged
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Daily Average Rate */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Daily Average Pace
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface">
              {formatMoney(avgDailySavings, sym)}
              <span className="text-xs font-normal text-on-surface-variant ml-1">/ day</span>
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              Target: {sym}{settings.defaultDailySavings}/day
            </p>
          </div>
        </div>

        {/* Card 3: Active Savings Streak */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Savings Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface">
              {activeStreak}
              <span className="text-xs font-normal text-on-surface-variant ml-1">days</span>
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              Consistent financial discipline
            </p>
          </div>
        </div>

        {/* Card 4: Annual Forecast */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              1-Year Projected
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">auto_graph</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-primary dark:text-primary-fixed-dim">
              {formatMoney(projectedYearlySavings, sym)}
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              Annual wealth accumulation
            </p>
          </div>
        </div>
      </div>

      {/* 2. Cumulative Growth Curve (Interactive SVG Area Chart) */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
              <span>Cumulative Wealth Trajectory</span>
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Day-by-day continuous growth trajectory of your saved capital
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-stat-label">
              Peak: {formatMoney(maxBalance, sym)}
            </span>
          </div>
        </div>

        {chartPoints.length > 1 ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="savingsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#006398" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#006398" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="currentColor" strokeOpacity="0.15" />

              {/* Filled Area */}
              <polygon
                points={`${paddingX},${svgHeight - paddingY} ${pointsString} ${svgWidth - paddingX},${svgHeight - paddingY}`}
                fill="url(#savingsAreaGradient)"
              />

              {/* Line Stroke */}
              <polyline
                points={pointsString}
                fill="none"
                stroke="#006398"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {chartPoints.map((r, i) => {
                const x = paddingX + (i / Math.max(chartPoints.length - 1, 1)) * (svgWidth - paddingX * 2);
                const y = svgHeight - paddingY - ((r.cumulativeBalance - minBalance) / balanceRange) * (svgHeight - paddingY * 2);
                return (
                  <circle
                    key={r.dateKey}
                    cx={x}
                    cy={y}
                    r={i === chartPoints.length - 1 ? "5" : "3"}
                    className="fill-primary stroke-background stroke-2 transition-all hover:scale-150"
                  >
                    <title>{`${r.displayDate}: ${formatMoney(r.cumulativeBalance, sym)}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            Log at least 2 daily entries to visualize your growth trajectory curve.
          </div>
        )}

        {/* Breakdown Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-outline-variant/10 text-xs">
          <div>
            <span className="text-on-surface-variant block text-[11px]">Gross Deposited</span>
            <span className="font-bold text-on-surface">{formatMoney(totalGrossSavings, sym)}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Total Deductions</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">-{formatMoney(totalExpensesDeducted, sym)}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Net Retained</span>
            <span className="font-bold text-secondary">{formatMoney(totalCumulativeSavings, sym)}</span>
          </div>
        </div>
      </div>

      {/* 3. Month-by-Month Comparison & Day-of-Week Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Month-by-Month Bar Comparison */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                Month-by-Month Savings
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant">
                Monthly ending cumulative balances
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {monthSummaries.length > 0 ? (
              monthSummaries.map((m) => {
                const maxMonthBal = Math.max(...monthSummaries.map((ms) => ms.endingBalance), 1);
                const percent = Math.round((m.endingBalance / maxMonthBal) * 100);

                return (
                  <div key={m.monthKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-stat-label">
                      <span className="font-bold text-on-surface">{m.monthTitle}</span>
                      <span className="font-extrabold text-primary dark:text-primary-fixed-dim">
                        {formatMoney(m.endingBalance, sym)}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="h-3.5 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                        style={{ width: `${Math.max(percent, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-on-surface-variant py-4 text-center">No monthly history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Day-of-Week Pattern */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                Weekly Pattern
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold font-stat-label">
                Peak: {bestDay.name}s
              </span>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
              Average savings logged per weekday
            </p>
          </div>

          <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-2">
            {dayOfWeekAverages.map((d) => {
              const heightPercent = Math.round((d.avg / maxDayAvg) * 100);
              const isPeak = d.name === bestDay.name && d.avg > 0;

              return (
                <div key={d.name} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-surface-container-high rounded-t-lg overflow-hidden flex flex-col justify-end h-20">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isPeak
                          ? 'bg-gradient-to-t from-primary to-primary-focus shadow-xs'
                          : 'bg-primary/40'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 10)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-stat-label font-bold ${isPeak ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-body-text text-on-surface-variant text-center pt-1 border-t border-outline-variant/10">
            {bestDay.avg > 0
              ? `You save the most consistently on ${bestDay.name}s (${formatMoney(bestDay.avg, sym)} avg).`
              : 'Keep logging to unlock weekly financial patterns.'}
          </p>
        </div>
      </div>

      {/* 4. Gamified Savings Milestones & Next Target Countdown */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                military_tech
              </span>
              <span>Savings Milestone Badges</span>
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Accumulate savings to unlock financial milestone tiers
            </p>
          </div>

          {remainingToMilestone > 0 && (
            <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold font-stat-label">
              🎯 Only {formatMoney(remainingToMilestone, sym)} to {nextMilestone.label}
            </span>
          )}
        </div>

        {/* Milestones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const isUnlocked = totalCumulativeSavings >= m.target;
            const progressPercent = Math.min(100, Math.round((totalCumulativeSavings / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-secondary-container/20 border-secondary/30 shadow-xs'
                    : 'bg-surface-container-low/40 dark:bg-surface-container-high/20 border-outline-variant/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-on-surface">{m.label}</span>
                  {isUnlocked ? (
                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                  ) : (
                    <span className="text-[10px] font-bold text-on-surface-variant font-stat-label">{progressPercent}%</span>
                  )}
                </div>

                <div className="font-app-title text-base font-extrabold text-on-surface mt-1">
                  {formatMoney(m.target, sym)}
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-secondary' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {daysToMilestone > 0 && (
          <p className="text-xs text-on-surface-variant text-center pt-2">
            💡 At your current average pace of <strong>{formatMoney(avgDailySavings, sym)}/day</strong>, you will reach{' '}
            <strong>{nextMilestone.label}</strong> in approximately <strong>{daysToMilestone} days</strong>.
          </p>
        )}
      </div>

      {/* 5. "What-If" Compounding Projection Calculator */}
      <div className="bg-gradient-to-br from-primary/5 via-surface-container-low to-surface-container-lowest dark:from-primary/10 dark:via-surface-container dark:to-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-primary/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">calculate</span>
          </div>
          <div>
            <h3 className="font-section-header text-base font-bold text-on-surface">
              Daily Savings Wealth Calculator
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              See how small daily increments compound over time
            </p>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-stat-label">
            <span className="text-on-surface-variant font-medium">Daily Savings Amount:</span>
            <span className="text-base font-extrabold text-primary">
              {sym}{calculatorDailyRate} / day
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={calculatorDailyRate}
            onChange={(e) => {
              triggerHaptic('selection');
              setCalculatorDailyRate(Number(e.target.value));
            }}
            className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
          />

          <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
            <span>{sym}10</span>
            <span>{sym}250</span>
            <span>{sym}500/day</span>
          </div>
        </div>

        {/* Projected Horizon Cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant/15 text-center">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant font-stat-label block">
              1 Month (30d)
            </span>
            <span className="font-app-title text-base sm:text-lg font-extrabold text-on-surface mt-0.5 block">
              {formatMoney(calculatorDailyRate * 30, sym)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant/15 text-center">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant font-stat-label block">
              6 Months (180d)
            </span>
            <span className="font-app-title text-base sm:text-lg font-extrabold text-on-surface mt-0.5 block">
              {formatMoney(calculatorDailyRate * 180, sym)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-center">
            <span className="text-[10px] uppercase font-bold text-primary font-stat-label block">
              1 Year (365d)
            </span>
            <span className="font-app-title text-base sm:text-lg font-black text-primary dark:text-primary-fixed-dim mt-0.5 block">
              {formatMoney(calculatorDailyRate * 365, sym)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
