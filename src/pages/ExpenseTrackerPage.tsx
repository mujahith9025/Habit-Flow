import React, { useState } from 'react';
import { useExpenseTracker } from '../hooks/useExpenseTracker';
import { ExpenseHeaderStats } from '../components/expense/ExpenseHeaderStats';
import { ExpenseLedgerView } from '../components/expense/ExpenseLedgerView';
import { ExpenseAnalyticsView } from '../components/expense/ExpenseAnalyticsView';
import { AddExpenseModal } from '../components/expense/AddExpenseModal';
import { ExpenseSettingsModal } from '../components/expense/ExpenseSettingsModal';
import { DeleteAllWarningModal } from '../components/expense/DeleteAllWarningModal';
import { triggerHaptic } from '../utils/haptics';
import { triggerMilestoneCelebration } from '../utils/confetti';
import { ExpenseItem } from '../types/expense';

export const ExpenseTrackerPage: React.FC = () => {
  const {
    entriesMap,
    monthSummaries,
    activeSummary,
    activeRows,
    selectedMonthKey,
    setSelectedMonthKey,
    settings,
    loading,
    totalCurrentBalance,
    saveDailyEntry,
    deleteDayEntry,
    deleteAllEntries,
    updateSettings,
    autoFillMonth,
    seedSampleData,
  } = useExpenseTracker();

  const [activeView, setActiveView] = useState<'ledger' | 'analytics'>('ledger');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | undefined>();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  const handleOpenAddModal = (prefillDate?: string) => {
    setSelectedDateForModal(prefillDate);
    setIsAddModalOpen(true);
    triggerHaptic('light');
  };

  const handleSaveEntry = async (
    dateKey: string,
    savingsAmount: number,
    expenses: ExpenseItem[],
    notes?: string
  ) => {
    await saveDailyEntry(dateKey, {
      savingsAmount,
      expenses,
      notes,
    });
    triggerHaptic('success');
  };

  const handleAutoFillCurrentMonth = async () => {
    const today = new Date();
    const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const dayNum = today.getDate();
    if (
      window.confirm(
        `Auto-fill ${monthName} from Day 1 to Today (1st to ${dayNum}${dayNum === 1 ? 'st' : dayNum === 2 ? 'nd' : dayNum === 3 ? 'rd' : 'th'}) with standard ${settings.currencySymbol}${settings.defaultDailySavings}/day savings?\n\nNext days will automatically be added every day at 12:00 AM midnight!`
      )
    ) {
      await autoFillMonth(today.getFullYear(), today.getMonth(), settings.defaultDailySavings, dayNum);
      triggerMilestoneCelebration();
      triggerHaptic('success');
    }
  };

  const handleSeedSampleData = async () => {
    if (
      window.confirm(
        'Load the sample daily savings ledger records?'
      )
    ) {
      await seedSampleData();
      triggerMilestoneCelebration();
      triggerHaptic('success');
    }
  };

  const activeEntryForModal = selectedDateForModal ? entriesMap[selectedDateForModal] : undefined;

  if (loading && activeRows.length === 0) {
    return (
      <div className="w-full max-w-[1040px] mx-auto space-y-6 pb-16 animate-pulse">
        <div className="h-44 bg-surface-container rounded-2xl border border-outline-variant/15" />
        <div className="h-96 bg-surface-container rounded-3xl border border-outline-variant/15" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* 1. Header Total Amount Indication Hero Section */}
      <ExpenseHeaderStats
        totalCurrentBalance={totalCurrentBalance}
        activeSummary={activeSummary}
        settings={settings}
        onOpenAddModal={() => handleOpenAddModal()}
        onAutoFillCurrentMonth={handleAutoFillCurrentMonth}
      />

      {/* 2. 2-View Segmented Control: [ 📝 Daily Ledger | 📊 Analytics & Insights ] */}
      <div className="flex items-center justify-between gap-3 bg-surface-container-lowest dark:bg-surface-container p-1.5 rounded-2xl border border-outline-variant/15 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveView('ledger');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-stat-label text-xs font-bold transition-all cursor-pointer ${
              activeView === 'ledger'
                ? 'bg-primary text-on-primary shadow-soft scale-[1.01]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            <span>Daily Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveView('analytics');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-stat-label text-xs font-bold transition-all cursor-pointer ${
              activeView === 'analytics'
                ? 'bg-primary text-on-primary shadow-soft scale-[1.01]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">insights</span>
            <span>Analytics & Insights</span>
          </button>
        </div>

        {/* Quick Date Counter */}
        <span className="hidden sm:inline-block text-xs font-bold text-on-surface-variant px-3 font-stat-label">
          {activeRows.length} Days Recorded
        </span>
      </div>

      {/* 3. View Content (Ledger vs Analytics) */}
      {activeView === 'ledger' ? (
        <ExpenseLedgerView
          rows={activeRows}
          monthSummaries={monthSummaries}
          selectedMonthKey={selectedMonthKey}
          onSelectMonthKey={setSelectedMonthKey}
          settings={settings}
          onOpenAddModal={handleOpenAddModal}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onSeedSampleData={handleSeedSampleData}
          onAutoFillMonth={(y, m, upToDay) => autoFillMonth(y, m, settings.defaultDailySavings, upToDay)}
          onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
        />
      ) : (
        <ExpenseAnalyticsView
          rows={activeRows}
          monthSummaries={monthSummaries}
          totalCumulativeSavings={totalCurrentBalance}
          settings={settings}
        />
      )}

      {/* 4. Add / Edit Daily Savings & Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        dateKey={selectedDateForModal}
        existingEntry={activeEntryForModal}
        currencySymbol={settings.currencySymbol}
        defaultDailySavings={settings.defaultDailySavings}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDateForModal(undefined);
        }}
        onSave={handleSaveEntry}
        onDeleteDay={deleteDayEntry}
      />

      {/* 5. Settings & Customization Modal */}
      <ExpenseSettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={updateSettings}
        onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
      />

      {/* 6. Delete All Entries Warning Modal */}
      <DeleteAllWarningModal
        isOpen={isDeleteAllModalOpen}
        entryCount={Object.keys(entriesMap).length}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirmDelete={async () => {
          await deleteAllEntries();
          triggerHaptic('success');
        }}
      />
    </div>
  );
};
