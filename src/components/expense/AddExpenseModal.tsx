import React, { useState, useEffect } from 'react';
import { DailyMoneyEntry, ExpenseItem } from '../../types/expense';
import { formatDayMonth } from '../../lib/expenseCalculations';

interface AddExpenseModalProps {
  isOpen: boolean;
  dateKey?: string;
  existingEntry?: DailyMoneyEntry;
  currencySymbol?: string;
  defaultDailySavings?: number;
  onClose: () => void;
  onSave: (
    dateKey: string,
    savingsAmount: number,
    expenses: ExpenseItem[],
    notes?: string
  ) => Promise<void>;
  onDeleteDay?: (dateKey: string) => Promise<void>;
}

const COMMON_EXPENSE_TAGS = [
  { label: '👔 Cloth Alter & Other', text: 'Cloth Alter & Other' },
  { label: '💼 Interview', text: 'Interview' },
  { label: '🍽️ Canteen', text: 'Canteen' },
  { label: '📜 Income Certificate', text: 'income Certificate' },
  { label: '🤲 Sadaqah Amount', text: 'Sadaqah Amount' },
  { label: '🛒 Groceries', text: 'Groceries' },
  { label: '🚗 Travel / Petrol', text: 'Travel' },
  { label: '⚡ Utility Bills', text: 'Utility' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  dateKey: initialDateKey,
  existingEntry,
  currencySymbol = '₹',
  defaultDailySavings = 25,
  onClose,
  onSave,
  onDeleteDay,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateKey, setDateKey] = useState<string>(initialDateKey || todayStr);
  const [savingsAmount, setSavingsAmount] = useState<number>(defaultDailySavings);
  const [expenses, setExpenses] = useState<Array<{ id: string; amount: number; description: string }>>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeDate = initialDateKey || todayStr;
      setDateKey(activeDate);

      if (existingEntry) {
        setSavingsAmount(existingEntry.savingsAmount ?? defaultDailySavings);
        setExpenses(
          existingEntry.expenses && existingEntry.expenses.length > 0
            ? existingEntry.expenses.map((e) => ({
                id: e.id,
                amount: e.amount,
                description: e.description,
              }))
            : []
        );
        setNotes(existingEntry.notes || '');
      } else {
        setSavingsAmount(defaultDailySavings);
        setExpenses([]);
        setNotes('');
      }
    }
  }, [isOpen, initialDateKey, existingEntry, defaultDailySavings, todayStr]);

  if (!isOpen) return null;

  const handleAddExpenseItem = (initialDesc: string = '') => {
    setExpenses((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        amount: 100,
        description: initialDesc,
      },
    ]);
  };

  const handleUpdateExpenseItem = (
    id: string,
    field: 'amount' | 'description',
    value: string | number
  ) => {
    setExpenses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : String(value),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveExpenseItem = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateKey) return;

    setIsSaving(true);
    try {
      const cleanedExpenses: ExpenseItem[] = expenses
        .filter((item) => item.amount > 0 || item.description.trim().length > 0)
        .map((item) => ({
          id: item.id.startsWith('temp_')
            ? `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            : item.id,
          amount: Number(item.amount) || 0,
          description: item.description.trim() || 'Expense',
        }));

      await onSave(dateKey, Number(savingsAmount) || 0, cleanedExpenses, notes.trim());
      onClose();
    } catch (err) {
      console.error('Error saving money entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteDay || !dateKey) return;
    if (window.confirm(`Delete money savings record for ${formatDayMonth(dateKey)}?`)) {
      setIsSaving(true);
      try {
        await onDeleteDay(dateKey);
        onClose();
      } catch (err) {
        console.error('Error deleting entry:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const totalExpenseSum = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-2xl border border-outline-variant/25 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/40 dark:bg-surface-container-high/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h3 className="font-app-title text-base font-bold text-on-surface">
                {existingEntry ? `Edit Entry • ${formatDayMonth(dateKey)}` : 'Log Daily Savings & Expense'}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-body-text">
                Money Savings Ledger & Itemized Deductions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Row 1: Date & Daily Savings Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase font-stat-label">
                Date (DATE)
              </label>
              <input
                type="date"
                required
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Formatted as: <strong>{formatDayMonth(dateKey)}</strong>
              </span>
            </div>

            {/* Daily Savings Amount */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase font-stat-label">
                Daily Savings (SAVINGS)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-primary dark:text-primary-fixed-dim">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="25"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[25, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSavingsAmount(amt)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                      savingsAmount === amt
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary'
                    }`}
                  >
                    {currencySymbol}{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Itemized Expenses (EXPENSES) */}
          <div className="space-y-3 pt-2 border-t border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-on-surface uppercase font-stat-label block">
                  Deducted Expenses (EXPENSES)
                </label>
                <span className="text-[11px] text-on-surface-variant font-body-text">
                  Any money spent will be deducted from your cumulative balance
                </span>
              </div>

              {totalExpenseSum > 0 && (
                <span className="text-xs font-black text-error px-2.5 py-1 rounded-full bg-error-container/20 border border-error/20">
                  Total Spent: {currencySymbol}{totalExpenseSum}
                </span>
              )}
            </div>

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EXPENSE_TAGS.map((tag) => (
                <button
                  key={tag.text}
                  type="button"
                  onClick={() => handleAddExpenseItem(tag.text)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container-high hover:bg-primary/15 hover:text-primary hover:border-primary/40 text-on-surface-variant border border-outline-variant/20 transition-colors cursor-pointer active:scale-95"
                >
                  + {tag.label}
                </button>
              ))}
            </div>

            {/* Expense Items List */}
            {expenses.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 text-center space-y-2 bg-surface-container-low/30">
                <span className="text-xs text-on-surface-variant block">No expenses on this date</span>
                <button
                  type="button"
                  onClick={() => handleAddExpenseItem()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high hover:bg-primary/15 text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Add Expense Item</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                {expenses.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-outline-variant/25 bg-surface-container-low dark:bg-surface-container-high/30 flex items-center gap-2"
                  >
                    {/* Amount */}
                    <div className="w-28 relative shrink-0">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-error">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.amount}
                        onChange={(e) => handleUpdateExpenseItem(item.id, 'amount', e.target.value)}
                        placeholder="100"
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-surface-container-lowest dark:bg-surface-container text-xs font-bold text-error border border-outline-variant/20 focus:outline-none"
                      />
                    </div>

                    {/* Description (e.g. Cloth Alter & Other) */}
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleUpdateExpenseItem(item.id, 'description', e.target.value)}
                      placeholder="Reason (e.g. Cloth Alter & Other, Canteen)"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest dark:bg-surface-container text-xs text-on-surface border border-outline-variant/20 focus:outline-none"
                    />

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddExpenseItem()}
                  className="w-full py-2 rounded-xl border border-dashed border-outline-variant/30 hover:border-primary text-xs font-bold text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Another Expense</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between gap-3">
            {existingEntry && onDeleteDay ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-soft flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
