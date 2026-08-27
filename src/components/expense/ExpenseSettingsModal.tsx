import React, { useState, useEffect } from 'react';
import { ExpenseTrackerSettings } from '../../types/expense';

interface ExpenseSettingsModalProps {
  isOpen: boolean;
  settings: ExpenseTrackerSettings;
  onClose: () => void;
  onSave: (updates: Partial<ExpenseTrackerSettings>) => Promise<void>;
}

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham (AED)' },
  { symbol: '﷼', code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit (RM)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
];

export const ExpenseSettingsModal: React.FC<ExpenseSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(settings.title || 'MONEY SAVINGS');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [defaultDailySavings, setDefaultDailySavings] = useState(settings.defaultDailySavings ?? 25);
  const [startingBalance, setStartingBalance] = useState(settings.startingBalance ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(settings.title || 'MONEY SAVINGS');
      setCurrencySymbol(settings.currencySymbol || '₹');
      setDefaultDailySavings(settings.defaultDailySavings ?? 25);
      setStartingBalance(settings.startingBalance ?? 0);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || 'MONEY SAVINGS',
        currencySymbol,
        defaultDailySavings: Math.max(0, Number(defaultDailySavings) || 0),
        startingBalance: Number(startingBalance) || 0,
      });
      onClose();
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-2xl border border-outline-variant/25 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/40 dark:bg-surface-container-high/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h3 className="font-app-title text-base font-bold text-on-surface">
                Money Savings Settings
              </h3>
              <p className="text-[11px] text-on-surface-variant font-body-text">
                Customize note layout, currency, and defaults
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto scrollbar-thin">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase font-stat-label">
              Note Title Header
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="MONEY SAVINGS"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface text-sm font-bold tracking-wider uppercase focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase font-stat-label">
              Currency Symbol
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrencySymbol(c.symbol)}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                    currencySymbol === c.symbol
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-low dark:bg-surface-container-high/30 text-on-surface border-outline-variant/20 hover:border-primary/40'
                  }`}
                >
                  <span className="text-sm font-black block">{c.symbol}</span>
                  <span className="text-[10px] opacity-80">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default Daily Savings & Starting Balance */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase font-stat-label">
                Default Daily Savings
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-primary">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={defaultDailySavings}
                  onChange={(e) => setDefaultDailySavings(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase font-stat-label">
                Starting Carryover
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-secondary">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-soft flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
