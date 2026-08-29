import React from 'react';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import { formatMoney, inferExpenseCategory } from '../../lib/expenseCalculations';

interface ExpenseLedgerViewProps {
  rows: DailyLedgerRow[];
  monthSummaries: MonthExpenseSummary[];
  selectedMonthKey: string;
  onSelectMonthKey: (mKey: string) => void;
  settings: ExpenseTrackerSettings;
  onOpenAddModal: (prefillDate?: string) => void;
  onOpenSettingsModal: () => void;
  onSeedSampleData: () => void;
  onAutoFillMonth: (year: number, month: number, upToDay?: number) => void;
  onOpenDeleteAllModal?: () => void;
}

export const ExpenseLedgerView: React.FC<ExpenseLedgerViewProps> = ({
  rows,
  monthSummaries,
  selectedMonthKey,
  onSelectMonthKey,
  settings,
  onOpenAddModal,
  onOpenSettingsModal,
  onSeedSampleData,
  onAutoFillMonth,
  onOpenDeleteAllModal,
}) => {
  const sym = settings.currencySymbol || '₹';

  // Active month summary if filtered
  const activeMonthSummary =
    selectedMonthKey !== 'all' ? monthSummaries.find((m) => m.monthKey === selectedMonthKey) : null;

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-soft border border-outline-variant/15 overflow-hidden flex flex-col min-h-[580px] transition-colors">
      {/* 1. Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-outline-variant/15 bg-surface-container-low/50 dark:bg-surface-container-high/20 gap-3">
        {/* Left: Section Subheader */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">calendar_today</span>
          </div>
          <div>
            <h2 className="font-section-header text-sm sm:text-base font-bold text-on-surface tracking-wide">
              {settings.title || 'Daily Savings Ledger'}
            </h2>
            <p className="text-[11px] font-body-text text-on-surface-variant">
              Daily {sym}{settings.defaultDailySavings} Target • {rows.length} Dates Logged
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Auto-Fill Current Month */}
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              onAutoFillMonth(d.getFullYear(), d.getMonth(), d.getDate());
            }}
            title="Auto-fill missing dates for current month"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
            <span className="hidden sm:inline">Auto-Fill Month</span>
          </button>

          {/* Quick 1-Tap Log Entry */}
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-on-primary-fixed-variant flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Entry</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            title="Tracker Settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/15 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      {/* 2. Month Selector Tabs */}
      <div className="px-5 sm:px-6 pt-3.5 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-outline-variant/10">
        <button
          type="button"
          onClick={() => onSelectMonthKey('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedMonthKey === 'all'
              ? 'bg-primary text-on-primary shadow-xs scale-105'
              : 'bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Months Ledger
        </button>

        {monthSummaries.map((m) => (
          <button
            key={m.monthKey}
            type="button"
            onClick={() => onSelectMonthKey(m.monthKey)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedMonthKey === m.monthKey
                ? 'bg-primary text-on-primary shadow-xs scale-105'
                : 'bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>{m.monthShortTitle}</span>
            <span className="text-[10px] opacity-80 font-mono">({formatMoney(m.endingBalance, sym)})</span>
          </button>
        ))}
      </div>

      {/* Active Month Mini-Stats Summary Strip (if filtered) */}
      {activeMonthSummary && (
        <div className="px-5 sm:px-6 py-2.5 bg-surface-container-low/40 dark:bg-surface-container-high/15 border-b border-outline-variant/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-stat-label block">Deposited</span>
              <span className="font-bold text-on-surface">+{formatMoney(activeMonthSummary.totalSavings, sym)}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-stat-label block">Spent</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">-{formatMoney(activeMonthSummary.totalExpenses, sym)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant uppercase font-stat-label block">Ending Net</span>
            <span className="font-extrabold text-primary dark:text-primary-fixed-dim">{formatMoney(activeMonthSummary.endingBalance, sym)}</span>
          </div>
        </div>
      )}

      {/* 3. Daily Ledger Table (With Merged SAVINGS & BALANCE Column) */}
      <div className="p-4 sm:p-6 flex-1 space-y-2">
        {/* Table Header: Merged SAVINGS & BALANCE */}
        <div className="grid grid-cols-12 gap-2 text-xs font-stat-label font-bold tracking-wider text-on-surface-variant uppercase select-none py-2 px-3 bg-surface-container-low/60 dark:bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
          <div className="col-span-2 sm:col-span-2 text-left">DATE</div>
          <div className="col-span-4 sm:col-span-4 text-left pl-1">SAVINGS & NET BALANCE</div>
          <div className="col-span-6 sm:col-span-6 text-left pl-2">EXPENSES & CATEGORY</div>
        </div>

        {/* Empty State */}
        {rows.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
              <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </div>
            <p className="text-sm font-body-text text-on-surface-variant">No money savings entries recorded yet.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  onAutoFillMonth(d.getFullYear(), d.getMonth(), d.getDate());
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                <span>Auto-Fill Current Month</span>
              </button>

              <button
                type="button"
                onClick={onSeedSampleData}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">history_edu</span>
                <span>Load Sample Records</span>
              </button>
            </div>
          </div>
        ) : (
          /* Ledger Rows List */
          <div className="space-y-1.5 pt-1">
            {rows.map((row, index) => {
              const prevRow = index > 0 ? rows[index - 1] : null;
              const isMonthBreak = prevRow && prevRow.monthKey !== row.monthKey;
              const monthName = monthSummaries.find((m) => m.monthKey === row.monthKey)?.monthTitle || 'MONTH';

              return (
                <React.Fragment key={row.dateKey}>
                  {/* Month Break Header (if scrolling all months) */}
                  {isMonthBreak && (
                    <div className="py-3 text-center">
                      <span className="px-4 py-1 rounded-full bg-surface-container-high text-on-surface font-extrabold text-xs tracking-wider uppercase border border-outline-variant/20 shadow-xs">
                        {monthName}
                      </span>
                    </div>
                  )}

                  {/* Single Date Ledger Row */}
                  <div
                    onClick={() => onOpenAddModal(row.dateKey)}
                    className={`grid grid-cols-12 gap-2 py-2.5 px-3 rounded-2xl transition-all cursor-pointer select-none items-center group text-xs sm:text-sm border ${
                      row.isToday
                        ? 'bg-primary/10 border-primary/35 shadow-xs font-semibold'
                        : 'bg-surface-container-lowest dark:bg-surface-container hover:bg-surface-container-low dark:hover:bg-surface-container-high/40 border-outline-variant/10'
                    }`}
                  >
                    {/* 1. DATE */}
                    <div className="col-span-2 sm:col-span-2 font-bold text-on-surface flex items-center gap-1.5 font-mono">
                      <span>{row.displayDate}</span>
                      {row.isToday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-black uppercase font-sans">
                          Today
                        </span>
                      )}
                    </div>

                    {/* 2. MERGED: SAVINGS & NET BALANCE */}
                    <div className="col-span-4 sm:col-span-4 flex items-center gap-2 pl-1 font-mono">
                      {/* Daily Deposit Badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        +{formatMoney(row.savingsAmount, sym)}
                      </span>

                      {/* Running Net Balance */}
                      <span className="font-extrabold text-primary dark:text-primary-fixed-dim text-xs sm:text-sm">
                        {formatMoney(row.cumulativeBalance, sym)}
                        <span className="text-[10px] font-normal text-on-surface-variant ml-1 font-sans">Net</span>
                      </span>
                    </div>

                    {/* 3. EXPENSES & DETAILS (Categorized Chips) */}
                    <div className="col-span-6 sm:col-span-6 pl-2 truncate flex items-center gap-1.5 overflow-hidden">
                      {row.expenses && row.expenses.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap truncate">
                          {row.expenses.map((exp, idx) => {
                            const cat = inferExpenseCategory(exp.description, exp.category);
                            return (
                              <span
                                key={exp.id || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 max-w-[200px] truncate"
                              >
                                <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                                <span className="font-bold">-{formatMoney(exp.amount, sym)}</span>
                                <span className="truncate opacity-90">{exp.description}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/35 text-[11px] group-hover:text-primary/70 transition-colors font-sans flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">add</span>
                          <span>Add expense</span>
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Footer Status Bar */}
      <div className="px-5 sm:px-6 py-3 border-t border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/10 flex items-center justify-between text-xs text-on-surface-variant">
        <span className="font-stat-label text-[11px]">
          Tap any date row to modify daily savings or add categorized expenses
        </span>
        <div className="flex items-center gap-3">
          {onOpenDeleteAllModal && rows.length > 0 && (
            <button
              type="button"
              onClick={onOpenDeleteAllModal}
              className="text-[11px] font-semibold text-error hover:text-error/80 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              title="Delete all entries in the expense tracker"
            >
              <span className="material-symbols-outlined text-[15px]">delete_forever</span>
              <span>Delete All</span>
            </button>
          )}
          <span className="font-stat-label text-[11px] font-bold text-on-surface">
            {rows.length} Days Recorded
          </span>
        </div>
      </div>
    </div>
  );
};
