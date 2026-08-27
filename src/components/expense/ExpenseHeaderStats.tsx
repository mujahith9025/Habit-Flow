import React from 'react';
import { MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import { formatMoney } from '../../lib/expenseCalculations';

interface ExpenseHeaderStatsProps {
  totalCurrentBalance: number;
  totalAllTimeSavings: number;
  totalAllTimeExpenses: number;
  netAllTimeGrowth: number;
  activeSummary: MonthExpenseSummary | null;
  settings: ExpenseTrackerSettings;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onAutoFillCurrentMonth?: () => void;
}

export const ExpenseHeaderStats: React.FC<ExpenseHeaderStatsProps> = ({
  totalCurrentBalance,
  totalAllTimeSavings,
  totalAllTimeExpenses,
  netAllTimeGrowth,
  activeSummary,
  settings,
  onOpenAddModal,
  onOpenSettingsModal,
  onAutoFillCurrentMonth,
}) => {
  const sym = settings.currencySymbol || '₹';

  // If viewing a specific month, show that month's metrics; otherwise all-time
  const displayBalance = activeSummary ? activeSummary.endingBalance : totalCurrentBalance;
  const displaySavings = activeSummary ? activeSummary.totalSavings : totalAllTimeSavings;
  const displayExpenses = activeSummary ? activeSummary.totalExpenses : totalAllTimeExpenses;
  const displayNet = activeSummary ? activeSummary.netSavings : netAllTimeGrowth;
  const subtitleLabel = activeSummary ? `${activeSummary.monthTitle} Summary` : 'All-Time Savings Balance';

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-5 relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute -top-12 -right-12 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Row: Title + Total Amount Indication Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
            <h2 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              Total Amount Indication
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 font-body-text">
            {subtitleLabel} • Daily savings accumulation & itemized expense tracking
          </p>
        </div>

        {/* Action Buttons: 1-Tap Add Expense & Auto-fill */}
        <div className="flex items-center gap-2">
          {onAutoFillCurrentMonth && (
            <button
              type="button"
              onClick={onAutoFillCurrentMonth}
              title={`Auto-fill current month with default ${sym}${settings.defaultDailySavings}/day`}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:border-primary/40 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
              <span className="hidden xs:inline">Auto-Fill Month</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all flex items-center gap-1.5 active:scale-95 shadow-soft cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Entry</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettingsModal}
            title="Expense Tracker Settings & Theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[19px]">tune</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        {/* Card 1: Total Cumulative Balance (Hero) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent border border-primary/25 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-stat-label text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
              Total Cumulative Balance
            </span>
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              savings
            </span>
          </div>
          <div className="font-app-title text-2xl sm:text-3xl font-black text-primary dark:text-primary-fixed-dim mt-2 tracking-tight">
            {formatMoney(displayBalance, sym)}
          </div>
          <div className="text-[11px] font-stat-label text-on-surface-variant mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">trending_up</span>
            <span>Net Growth: <strong>{formatMoney(displayNet, sym)}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Savings Deposited */}
        <div className="p-4 rounded-xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-stat-label text-on-surface-variant uppercase tracking-wider">
              Total Savings Deposited
            </span>
            <span
              className="material-symbols-outlined text-secondary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_card
            </span>
          </div>
          <div className="font-app-title text-2xl sm:text-3xl font-black text-on-surface mt-2 tracking-tight">
            {formatMoney(displaySavings, sym)}
          </div>
          <div className="text-[11px] font-stat-label text-secondary dark:text-secondary-fixed font-semibold mt-1">
            Standard {sym}{settings.defaultDailySavings} daily accumulation
          </div>
        </div>

        {/* Card 3: Total Expenses Deducted */}
        <div className="p-4 rounded-xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-stat-label text-on-surface-variant uppercase tracking-wider">
              Total Expenses Spent
            </span>
            <span
              className="material-symbols-outlined text-error text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              receipt_long
            </span>
          </div>
          <div className="font-app-title text-2xl sm:text-3xl font-black text-error mt-2 tracking-tight">
            {formatMoney(displayExpenses, sym)}
          </div>
          <div className="text-[11px] font-stat-label text-on-surface-variant mt-1">
            Deducted from daily cumulative total
          </div>
        </div>
      </div>
    </div>
  );
};
