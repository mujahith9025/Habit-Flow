import React, { useState, useRef, useEffect } from 'react';
import { MonthExpenseSummary } from '../../types/expense';
import { triggerHaptic } from '../../utils/haptics';

interface ExpenseMonthNavigatorProps {
  selectedMonthKey: string; // 'all' or 'YYYY-MM'
  onSelectMonthKey: (mKey: string) => void;
  monthSummaries: MonthExpenseSummary[];
  onAutoFillMonth?: (year: number, month: number) => void;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ExpenseMonthNavigator: React.FC<ExpenseMonthNavigatorProps> = ({
  selectedMonthKey,
  onSelectMonthKey,
  monthSummaries,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const currentRealYear = today.getFullYear();
  const currentRealMonthIdx = today.getMonth();
  const currentRealMonthKey = `${currentRealYear}-${String(currentRealMonthIdx + 1).padStart(2, '0')}`;

  // Compute viewing year & month from selectedMonthKey (or default to current real date)
  const [viewingYear, setViewingYear] = useState<number>(() => {
    if (selectedMonthKey !== 'all') {
      const [y] = selectedMonthKey.split('-');
      const parsed = parseInt(y, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return currentRealYear;
  });

  const selectedMonthIdx =
    selectedMonthKey !== 'all' ? parseInt(selectedMonthKey.split('-')[1], 10) - 1 : -1;

  // Sync viewingYear when selectedMonthKey changes externally
  useEffect(() => {
    if (selectedMonthKey !== 'all') {
      const [y] = selectedMonthKey.split('-');
      const parsed = parseInt(y, 10);
      if (!isNaN(parsed)) setViewingYear(parsed);
    }
  }, [selectedMonthKey]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    }
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Step month by offset (-1 or +1)
  const handleStepMonth = (offset: number) => {
    triggerHaptic('selection');
    let targetYear = viewingYear;
    let targetMonthIdx = selectedMonthIdx;

    if (selectedMonthKey === 'all' || targetMonthIdx === -1) {
      targetMonthIdx = currentRealMonthIdx;
      targetYear = currentRealYear;
    }

    const nextDate = new Date(targetYear, targetMonthIdx + offset, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;
    const nextKey = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

    setViewingYear(nextYear);
    onSelectMonthKey(nextKey);
  };

  // Step Year inside popover
  const handleStepYear = (offset: number) => {
    triggerHaptic('light');
    setViewingYear((prev) => prev + offset);
  };

  // Select a specific month from the 12-month grid
  const handleSelectMonth = (monthIndex: number) => {
    triggerHaptic('selection');
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const key = `${viewingYear}-${monthStr}`;
    onSelectMonthKey(key);
    setIsMonthPickerOpen(false);
  };

  // Select All Months
  const handleSelectAllMonths = () => {
    triggerHaptic('selection');
    onSelectMonthKey('all');
    setIsMonthPickerOpen(false);
  };

  // Jump to Current Real Month
  const handleJumpToCurrentMonth = () => {
    triggerHaptic('selection');
    setViewingYear(currentRealYear);
    onSelectMonthKey(currentRealMonthKey);
    setIsMonthPickerOpen(false);
  };

  // Current display label
  let displayTitle = 'All Months Ledger';
  if (selectedMonthKey !== 'all' && selectedMonthIdx >= 0 && selectedMonthIdx < 12) {
    displayTitle = `${MONTH_NAMES_FULL[selectedMonthIdx]} ${viewingYear}`;
  }

  const isCurrentMonthActive = selectedMonthKey === currentRealMonthKey;

  return (
    <div className="relative px-5 sm:px-6 pt-3.5 pb-2 border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-2.5">
      {/* Left: Stepper Navigation & 12-Month Popover Trigger */}
      <div className="flex items-center gap-1.5" ref={popoverRef}>
        {/* Previous Month Arrow */}
        <button
          type="button"
          onClick={() => handleStepMonth(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all active:scale-90 shadow-xs cursor-pointer"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Interactive Month & Year Popover Trigger Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsMonthPickerOpen((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-stat-label text-xs font-bold transition-all border active:scale-95 cursor-pointer ${
            selectedMonthKey === 'all'
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
              : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-outline-variant/20 shadow-xs'
          }`}
          title="Click to select any month and year"
        >
          <span
            className="material-symbols-outlined text-[16px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            calendar_month
          </span>
          <span className="font-semibold">{displayTitle}</span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            {isMonthPickerOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {/* Next Month Arrow */}
        <button
          type="button"
          onClick={() => handleStepMonth(1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all active:scale-90 shadow-xs cursor-pointer"
          title="Next Month"
          aria-label="Next Month"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>

        {/* Quick Current Month Jump Button (if not viewing current month) */}
        {!isCurrentMonthActive && (
          <button
            type="button"
            onClick={handleJumpToCurrentMonth}
            className="text-[11px] font-stat-label font-bold text-primary hover:underline px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors ml-1 active:scale-95 cursor-pointer"
          >
            Today
          </button>
        )}

        {/* 12-Month & Year Dropdown Popover */}
        {isMonthPickerOpen && (
          <div className="absolute top-12 left-5 z-40 w-72 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/25 p-3.5 space-y-3 animate-scaleUp">
            {/* Year Stepper Header */}
            <div className="flex items-center justify-between px-1 border-b border-outline-variant/15 pb-2">
              <button
                type="button"
                onClick={() => handleStepYear(-1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-90 cursor-pointer"
                title="Previous Year"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <span className="font-stat-label text-sm font-extrabold text-on-surface">
                {viewingYear}
              </span>

              <button
                type="button"
                onClick={() => handleStepYear(1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-90 cursor-pointer"
                title="Next Year"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            {/* 12 Months Grid (4 columns x 3 rows) */}
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES_SHORT.map((name, idx) => {
                const monthKey = `${viewingYear}-${String(idx + 1).padStart(2, '0')}`;
                const isSelected = selectedMonthKey === monthKey;
                const isRealNow =
                  idx === currentRealMonthIdx && viewingYear === currentRealYear;
                const hasEntries = monthSummaries.some((m) => m.monthKey === monthKey);

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-soft scale-105'
                        : isRealNow
                        ? 'border border-primary/50 text-primary font-bold bg-primary/10 hover:bg-primary/20'
                        : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{name}</span>
                    {hasEntries && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-primary absolute bottom-1 left-1/2 -translate-x-1/2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls: All Months & Current Month */}
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-xs">
              <button
                type="button"
                onClick={handleSelectAllMonths}
                className={`px-3 py-1 rounded-lg font-bold font-stat-label transition-colors cursor-pointer ${
                  selectedMonthKey === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                All Months
              </button>

              <button
                type="button"
                onClick={handleJumpToCurrentMonth}
                className="px-3 py-1 rounded-lg font-bold font-stat-label text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Current Month
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Tab Pills for Fast Switching */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full sm:max-w-md pb-0.5">
        <button
          type="button"
          onClick={() => onSelectMonthKey('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedMonthKey === 'all'
              ? 'bg-primary text-on-primary shadow-xs scale-105'
              : 'bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All
        </button>

        {monthSummaries.map((m, idx) => (
          <button
            key={m.monthKey}
            type="button"
            onClick={() => onSelectMonthKey(m.monthKey)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedMonthKey === m.monthKey
                ? 'bg-primary text-on-primary shadow-xs scale-105'
                : 'bg-surface-container-high dark:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>{m.monthShortTitle}</span>
            {idx === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
