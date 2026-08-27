import React, { useState } from 'react';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings } from '../../types/expense';
import { formatMoney, formatExpensesSummary } from '../../lib/expenseCalculations';

interface GoogleNotesLedgerViewProps {
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

export const GoogleNotesLedgerView: React.FC<GoogleNotesLedgerViewProps> = ({
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

  const [isPinned, setIsPinned] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Copy note as formatted plain text (Google Notes style export)
  const handleCopyNoteText = () => {
    let text = `${settings.title || 'MONEY SAVINGS'}\n\n`;
    text += `DATE       SAVINGS    CUMULATIVE   EXPENSES\n`;
    text += `---------------------------------------------------------\n`;

    rows.forEach((r) => {
      const expStr = formatExpensesSummary(r.expenses, sym);
      text += `${r.displayDate.padEnd(10)} ${formatMoney(r.savingsAmount, sym).padEnd(10)} ${formatMoney(r.cumulativeBalance, sym).padEnd(12)} ${expStr}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden flex flex-col min-h-[580px] transition-colors">
      {/* Top Action Header Bar (Styled cleanly in Project UI) */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-outline-variant/15 bg-surface-container-low/50 dark:bg-surface-container-high/20">
        {/* Left: Section Subheader */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
          </div>
          <div>
            <h2 className="font-section-header text-sm sm:text-base font-bold text-on-surface uppercase tracking-wider">
              {settings.title || 'MONEY SAVINGS'}
            </h2>
            <span className="text-[11px] font-body-text text-on-surface-variant">
              Google Notes Ledger Format • {rows.length} Dates Logged
            </span>
          </div>
        </div>

        {/* Right: Actions (Pin, Copy Text, 1-Tap Add, Options) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pin Button */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Note Pinned' : 'Pin Note'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isPinned
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}
            >
              push_pin
            </span>
          </button>

          {/* Copy Note Text */}
          <button
            type="button"
            onClick={handleCopyNoteText}
            title="Copy formatted note text"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/15 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
          </button>

          {/* Quick 1-Tap Add Entry */}
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            title="Add date entry"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>

          {/* 3-Dots Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              title="More actions"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/15 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-10 w-56 bg-surface-container-highest dark:bg-surface-container-low border border-outline-variant/30 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-md space-y-1 animate-scaleUp">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    onAutoFillMonth(d.getFullYear(), d.getMonth(), d.getDate());
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-high text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
                  <span>Auto-Fill Current Month</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSeedSampleData();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-high text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-500">history_edu</span>
                  <span>Load Screenshot Sample Data</span>
                </button>

                <div className="border-t border-outline-variant/20 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    onOpenSettingsModal();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-high text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Tracker Settings</span>
                </button>

                {onOpenDeleteAllModal && rows.length > 0 && (
                  <>
                    <div className="border-t border-outline-variant/20 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDeleteAllModal();
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-error hover:bg-error-container/20 text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-error">delete_forever</span>
                      <span>Delete All Entries...</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-secondary-container/90 text-on-secondary-container text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>📋 Formatted note text copied to clipboard!</span>
        </div>
      )}

      {/* Month Filter Selector Tabs (HabitFlow Style) */}
      <div className="px-5 sm:px-6 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectMonthKey('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedMonthKey === 'all'
              ? 'bg-primary text-on-primary shadow-sm scale-105'
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedMonthKey === m.monthKey
                ? 'bg-primary text-on-primary shadow-sm scale-105'
                : 'bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>{m.monthShortTitle}</span>
            <span className="text-[10px] opacity-80">({formatMoney(m.endingBalance, sym)})</span>
          </button>
        ))}
      </div>

      {/* Ledger Body */}
      <div className="p-5 sm:p-6 flex-1 space-y-3">
        {/* Note Title */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="font-app-title text-xl sm:text-2xl font-black tracking-wider text-on-surface uppercase select-none">
            {settings.title || 'MONEY SAVINGS'}
          </h1>
          <span className="font-stat-label text-xs font-semibold text-on-surface-variant">
            Daily {sym}{settings.defaultDailySavings} Savings
          </span>
        </div>

        {/* Dashed Divider Line */}
        <div className="border-b-2 border-dashed border-outline-variant/30" />

        {/* Ledger Table Header (DATE | SAVINGS | CUMULATIVE | EXPENSES) */}
        <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm font-stat-label font-bold tracking-widest text-on-surface-variant uppercase select-none py-1 px-2">
          <div className="col-span-2 sm:col-span-2 text-left">DATE</div>
          <div className="col-span-2 sm:col-span-2 text-center">SAVINGS</div>
          <div className="col-span-3 sm:col-span-3 text-center">CUMULATIVE</div>
          <div className="col-span-5 sm:col-span-5 text-left pl-2">EXPENSES</div>
        </div>

        {/* Dashed Divider Line */}
        <div className="border-b-2 border-dashed border-outline-variant/30" />

        {/* Empty State */}
        {rows.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">note_alt</span>
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
                <span>Auto-Fill This Month</span>
              </button>

              <button
                type="button"
                onClick={onSeedSampleData}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">history_edu</span>
                <span>Load Google Notes Reference</span>
              </button>
            </div>
          </div>
        ) : (
          /* Ledger Rows List */
          <div className="space-y-1 pt-1">
            {rows.map((row, index) => {
              const prevRow = index > 0 ? rows[index - 1] : null;
              const isMonthBreak = prevRow && prevRow.monthKey !== row.monthKey;
              const monthName = monthSummaries.find((m) => m.monthKey === row.monthKey)?.monthTitle || 'MONTH';
              const expSummaryStr = formatExpensesSummary(row.expenses, sym);

              return (
                <React.Fragment key={row.dateKey}>
                  {/* Month Break Header (e.g. "JULY MONTH") */}
                  {isMonthBreak && (
                    <div className="py-5 text-center">
                      <span className="px-4 py-1 rounded-full bg-surface-container-high text-on-surface font-black text-xs sm:text-sm tracking-widest uppercase border border-outline-variant/25 shadow-xs">
                        {monthName}
                      </span>
                    </div>
                  )}

                  {/* Single Date Ledger Row */}
                  <div
                    onClick={() => onOpenAddModal(row.dateKey)}
                    className={`grid grid-cols-12 gap-2 py-2 px-2 rounded-xl transition-all cursor-pointer select-none items-center group font-mono text-xs sm:text-sm ${
                      row.isToday
                        ? 'bg-primary/10 border border-primary/30 font-bold'
                        : 'hover:bg-surface-container-high/60 dark:hover:bg-surface-container-high/30'
                    }`}
                  >
                    {/* 1. DATE (e.g. 01/08) */}
                    <div className="col-span-2 sm:col-span-2 font-bold text-on-surface flex items-center gap-1.5">
                      <span>{row.displayDate}</span>
                      {row.isToday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-black uppercase font-sans">
                          Today
                        </span>
                      )}
                    </div>

                    {/* 2. SAVINGS (e.g. ₹25) */}
                    <div className="col-span-2 sm:col-span-2 text-center text-on-surface-variant font-medium">
                      {formatMoney(row.savingsAmount, sym)}
                    </div>

                    {/* 3. CUMULATIVE (e.g. ₹100, ₹300) */}
                    <div className="col-span-3 sm:col-span-3 text-center font-bold tracking-tight text-primary dark:text-primary-fixed-dim">
                      {formatMoney(row.cumulativeBalance, sym)}
                    </div>

                    {/* 4. EXPENSES (e.g. "( ₹ 100 - Cloth Alter & Other )") */}
                    <div className="col-span-5 sm:col-span-5 text-left pl-2 truncate">
                      {row.expenses && row.expenses.length > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] sm:text-xs">
                          {expSummaryStr}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/30 text-[11px] group-hover:text-primary/70 transition-colors font-sans">
                          + Add expense
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

      {/* Card Footer Status */}
      <div className="px-5 sm:px-6 py-3 border-t border-outline-variant/15 bg-surface-container-low/40 dark:bg-surface-container-high/10 flex items-center justify-between text-xs text-on-surface-variant">
        <span className="font-stat-label text-[11px]">
          Tap any row to edit savings or add expense deductions
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
