import React from 'react';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import {
  formatMoney,
  aggregateExpensesByCategory,
} from '../../lib/expenseCalculations';

interface ExpenseAnalyticsViewProps {
  rows: DailyLedgerRow[];
  monthSummaries: MonthExpenseSummary[];
  totalCumulativeSavings: number;
  settings: ExpenseTrackerSettings;
}

export const ExpenseAnalyticsView: React.FC<ExpenseAnalyticsViewProps> = ({
  rows,
  monthSummaries,
  totalCumulativeSavings,
  settings,
}) => {
  const sym = settings.currencySymbol || '₹';

  // 1. Financial Totals & Retention
  const totalDaysLogged = rows.length;
  const totalGrossSavings = rows.reduce((acc, r) => acc + r.savingsAmount, 0);
  const totalExpensesDeducted = rows.reduce(
    (acc, r) => acc + (r.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0),
    0
  );

  const retentionRate =
    totalGrossSavings > 0
      ? Math.max(0, Math.round(((totalGrossSavings - totalExpensesDeducted) / totalGrossSavings) * 100))
      : 100;

  const totalExpenseTransactions = rows.reduce((acc, r) => acc + (r.expenses?.length || 0), 0);
  const avgExpensePerTransaction =
    totalExpenseTransactions > 0 ? Math.round(totalExpensesDeducted / totalExpenseTransactions) : 0;
  const avgDailySavings = totalDaysLogged > 0 ? Math.round(totalGrossSavings / totalDaysLogged) : 0;

  // 2. Category Expense Breakdown
  const categoryBreakdown = aggregateExpensesByCategory(rows);
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top 4 Financial KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Current Net Savings */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Current Net Savings
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

        {/* Card 2: Total All-Time Expenses */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatMoney(totalExpensesDeducted, sym)}
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              {totalExpenseTransactions} deductions recorded
            </p>
          </div>
        </div>

        {/* Card 3: Total Gross Savings Deposited */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Gross Deposited
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">savings</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{formatMoney(totalGrossSavings, sym)}
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              {sym}{avgDailySavings}/day average pace
            </p>
          </div>
        </div>

        {/* Card 4: Savings Retention Rate */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-4 sm:p-5 shadow-soft border border-outline-variant/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
              Retention Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">shield</span>
            </div>
          </div>
          <div>
            <div className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface">
              {retentionRate}%
            </div>
            <p className="text-[11px] font-body-text text-on-surface-variant mt-1">
              {retentionRate >= 75 ? 'Excellent capital retention' : 'Watch expense deductions'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Expenses Classification by Category */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">category</span>
              <span>Expenses Classification by Category</span>
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Distribution and spending breakdown across all categorized deductions
            </p>
          </div>

          {topCategory && (
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold font-stat-label self-start sm:self-auto">
              Top Category: {topCategory.category.label} ({topCategory.percentage}%)
            </span>
          )}
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {categoryBreakdown.map((item) => (
              <div
                key={item.category.id}
                className="p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/20 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface"
                      style={{ backgroundColor: item.category.bgLight, color: item.category.color }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.category.icon}</span>
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-on-surface block">
                        {item.category.label}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-body-text">
                        {item.count} {item.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm font-mono text-amber-600 dark:text-amber-400 block">
                      {formatMoney(item.totalAmount, sym)}
                    </span>
                    <span className="text-[10px] font-bold font-stat-label text-on-surface-variant">
                      {item.percentage}% of expenses
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(item.percentage, 6)}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-on-surface-variant space-y-1">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block">
              receipt_long
            </span>
            <p>No expense deductions recorded yet.</p>
          </div>
        )}
      </div>

      {/* 3. Month-by-Month Comparative Report & Analytics */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 space-y-5">
        <div>
          <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">bar_chart</span>
            <span>Month-by-Month Report & Analytics</span>
          </h3>
          <p className="font-body-text text-xs text-on-surface-variant">
            Comparative financial performance comparing Gross Deposits vs Deductions vs Net Ending Balance
          </p>
        </div>

        {monthSummaries.length > 0 ? (
          <div className="space-y-6">
            {/* Visual Bars for Each Month */}
            <div className="space-y-4">
              {monthSummaries.map((m) => {
                const maxMonthVal = Math.max(m.totalSavings, m.totalExpenses, m.endingBalance, 100);
                const savingsPct = Math.round((m.totalSavings / maxMonthVal) * 100);
                const expensesPct = Math.round((m.totalExpenses / maxMonthVal) * 100);

                return (
                  <div
                    key={m.monthKey}
                    className="p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/30 dark:bg-surface-container-high/15 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{m.monthTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-stat-label font-semibold">
                          {m.rows.length} Days Recorded
                        </span>
                      </div>
                      <div className="font-mono font-extrabold text-primary dark:text-primary-fixed-dim">
                        Ending: {formatMoney(m.endingBalance, sym)}
                      </div>
                    </div>

                    {/* Comparative Bars */}
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {/* Savings Deposited Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-on-surface-variant text-[10px] font-sans">Deposited:</span>
                        <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.max(savingsPct, 8)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatMoney(m.totalSavings, sym)}
                        </span>
                      </div>

                      {/* Expenses Deducted Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-on-surface-variant text-[10px] font-sans">Expenses:</span>
                        <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
                            style={{ width: `${Math.max(expensesPct, m.totalExpenses > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-bold text-amber-600 dark:text-amber-400">
                          -{formatMoney(m.totalExpenses, sym)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Structured Table Overview */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-stat-label uppercase text-[10px]">
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3">Starting</th>
                    <th className="py-2 px-3">Deposited</th>
                    <th className="py-2 px-3">Expenses</th>
                    <th className="py-2 px-3">Net Change</th>
                    <th className="py-2 px-3 text-right">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-mono">
                  {monthSummaries.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-on-surface">{m.monthShortTitle}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{formatMoney(m.startingBalance, sym)}</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">+{formatMoney(m.totalSavings, sym)}</td>
                      <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">-{formatMoney(m.totalExpenses, sym)}</td>
                      <td className="py-2.5 px-3 font-bold text-on-surface">+{formatMoney(m.netSavings, sym)}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-primary dark:text-primary-fixed-dim">
                        {formatMoney(m.endingBalance, sym)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant py-4 text-center">No monthly history recorded yet.</p>
        )}
      </div>

      {/* 4. Meaningful Financial Insights & Observations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Capital Retention */}
        <div className="p-4.5 rounded-3xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 space-y-2 shadow-soft">
          <div className="flex items-center gap-2 text-primary font-bold text-xs font-section-header">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Capital Preservation</span>
          </div>
          <p className="text-xs font-body-text text-on-surface">
            You have successfully preserved <strong>{retentionRate}%</strong> of all saved capital ({formatMoney(totalCumulativeSavings, sym)} retained out of {formatMoney(totalGrossSavings, sym)} deposited).
          </p>
        </div>

        {/* Insight 2: Spend Category Concentration */}
        <div className="p-4.5 rounded-3xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 space-y-2 shadow-soft">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs font-section-header">
            <span className="material-symbols-outlined text-[18px]">pie_chart</span>
            <span>Spending Concentration</span>
          </div>
          <p className="text-xs font-body-text text-on-surface">
            {topCategory
              ? `Your highest expense outflow is in ${topCategory.category.label}, representing ${topCategory.percentage}% (${formatMoney(topCategory.totalAmount, sym)}) of all deductions with an average of ${formatMoney(avgExpensePerTransaction, sym)} per transaction.`
              : 'Zero expense deductions logged so far. 100% of your deposits remain intact.'}
          </p>
        </div>

        {/* Insight 3: Daily Discipline */}
        <div className="p-4.5 rounded-3xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 space-y-2 shadow-soft">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-section-header">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            <span>Savings Velocity</span>
          </div>
          <p className="text-xs font-body-text text-on-surface">
            Maintaining a daily rate of <strong>{sym}{settings.defaultDailySavings}</strong> per day results in <strong>{formatMoney(settings.defaultDailySavings * 30, sym)}</strong> in reliable monthly capital growth.
          </p>
        </div>
      </div>
    </div>
  );
};
