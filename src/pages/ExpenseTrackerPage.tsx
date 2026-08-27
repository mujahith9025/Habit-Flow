import React, { useState } from 'react';
import { useExpenseTracker } from '../hooks/useExpenseTracker';
import { ExpenseHeaderStats } from '../components/expense/ExpenseHeaderStats';
import { GoogleNotesLedgerView } from '../components/expense/GoogleNotesLedgerView';
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
    if (
      window.confirm(
        `Auto-fill ${today.toLocaleString('en-US', { month: 'long', year: 'numeric' })} with standard ${settings.currencySymbol}${settings.defaultDailySavings}/day savings?`
      )
    ) {
      await autoFillMonth(today.getFullYear(), today.getMonth(), settings.defaultDailySavings);
      triggerMilestoneCelebration();
      triggerHaptic('success');
    }
  };

  const handleSeedSampleData = async () => {
    if (
      window.confirm(
        'Load the exact August & July sample savings records from the Google Notes reference image?'
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
      {/* 1. Header Total Amount Indication Hero Section (Only shows Total Cumulative Savings) */}
      <ExpenseHeaderStats
        totalCurrentBalance={totalCurrentBalance}
        activeSummary={activeSummary}
        settings={settings}
        onOpenAddModal={() => handleOpenAddModal()}
        onAutoFillCurrentMonth={handleAutoFillCurrentMonth}
      />

      {/* 2. Google Notes "MONEY SAVINGS" Ledger Table (Native Project UI) */}
      <GoogleNotesLedgerView
        rows={activeRows}
        monthSummaries={monthSummaries}
        selectedMonthKey={selectedMonthKey}
        onSelectMonthKey={setSelectedMonthKey}
        settings={settings}
        onOpenAddModal={handleOpenAddModal}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onSeedSampleData={handleSeedSampleData}
        onAutoFillMonth={(y, m) => autoFillMonth(y, m)}
        onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
      />

      {/* 3. Add / Edit Daily Savings & Expense Modal */}
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

      {/* 4. Settings & Customization Modal */}
      <ExpenseSettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={updateSettings}
        onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
      />

      {/* 5. Delete All Entries Warning Modal */}
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
