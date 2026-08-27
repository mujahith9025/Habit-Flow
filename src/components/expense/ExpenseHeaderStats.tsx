import React from 'react';
import { MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import { formatMoney } from '../../lib/expenseCalculations';

interface ExpenseHeaderStatsProps {
  totalCurrentBalance: number;
  activeSummary: MonthExpenseSummary | null;
  settings: ExpenseTrackerSettings;
  onOpenAddModal: () => void;
  onAutoFillCurrentMonth?: () => void;
}

export const ExpenseHeaderStats: React.FC<ExpenseHeaderStatsProps> = ({
  totalCurrentBalance,
  activeSummary,
  settings,
  onOpenAddModal,
  onAutoFillCurrentMonth,
}) => {
  const sym = settings.currencySymbol || '₹';

  // If viewing a specific month, show that month's ending balance; otherwise all-time cumulative
  const displayBalance = activeSummary ? activeSummary.endingBalance : totalCurrentBalance;
  const subtitleLabel = activeSummary ? `${activeSummary.monthTitle} Cumulative Savings` : 'All-Time Cumulative Savings';

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
        {/* Left: Total Cumulative Savings Indicator (ONLY this metric is shown) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              savings
            </span>
            <span className="font-stat-label text-xs font-bold text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
              Total Cumulative Savings
            </span>
            <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
              Live Balance
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <div className="font-app-title text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-primary-fixed-dim tracking-tight">
              {formatMoney(displayBalance, sym)}
            </div>
          </div>

          <p className="text-xs text-on-surface-variant font-body-text pt-0.5">
            {subtitleLabel} • Daily savings accumulation with expense deductions
          </p>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onAutoFillCurrentMonth && (
            <button
              type="button"
              onClick={onAutoFillCurrentMonth}
              title={`Auto-fill current month with default ${sym}${settings.defaultDailySavings}/day`}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
              <span className="hidden xs:inline">Auto-Fill Month</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all flex items-center gap-1.5 active:scale-95 shadow-soft cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
