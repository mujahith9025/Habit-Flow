import React, { useState, useRef, useEffect } from 'react';
import { MonthYearState } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface DateNavigatorProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  onSelectMonthDate?: (date: Date) => void;
  className?: string;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatMonthYear(date: Date): MonthYearState {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const formattedTitle = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  return { year, month, monthKey, formattedTitle };
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onChangeMonth,
  onSelectMonthDate,
  className = '',
}) => {
  const { formattedTitle } = formatMonthYear(currentDate);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedYear = currentDate.getFullYear();
  const selectedMonthIdx = currentDate.getMonth();

  const today = new Date();
  const realCurrentYear = today.getFullYear();
  const realCurrentMonthIdx = today.getMonth();

  const [viewingYear, setViewingYear] = useState<number>(selectedYear);

  // Sync viewing year when currentDate changes
  useEffect(() => {
    setViewingYear(currentDate.getFullYear());
  }, [currentDate]);

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

  const handleStepMonth = (offset: number) => {
    triggerHaptic('light');
    onChangeMonth(offset);
  };

  const handleStepYear = (offset: number) => {
    triggerHaptic('light');
    setViewingYear((prev) => prev + offset);
  };

  const handleSelectMonth = (monthIndex: number) => {
    triggerHaptic('selection');
    const targetDate = new Date(viewingYear, monthIndex, 1);
    if (onSelectMonthDate) {
      onSelectMonthDate(targetDate);
    } else {
      // Calculate month offset if onSelectMonthDate is not provided
      const currentTotalMonths = currentDate.getFullYear() * 12 + currentDate.getMonth();
      const targetTotalMonths = viewingYear * 12 + monthIndex;
      const diff = targetTotalMonths - currentTotalMonths;
      onChangeMonth(diff);
    }
    setIsMonthPickerOpen(false);
  };

  const handleJumpToToday = () => {
    triggerHaptic('selection');
    setViewingYear(realCurrentYear);
    const targetDate = new Date(realCurrentYear, realCurrentMonthIdx, 1);
    if (onSelectMonthDate) {
      onSelectMonthDate(targetDate);
    } else {
      const currentTotalMonths = currentDate.getFullYear() * 12 + currentDate.getMonth();
      const targetTotalMonths = realCurrentYear * 12 + realCurrentMonthIdx;
      onChangeMonth(targetTotalMonths - currentTotalMonths);
    }
    setIsMonthPickerOpen(false);
  };

  const isCurrentRealMonth =
    selectedYear === realCurrentYear && selectedMonthIdx === realCurrentMonthIdx;

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <div
        className="flex items-center justify-between px-md py-1.5 bg-surface-container-lowest dark:bg-surface-container rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/15 select-none"
      >
        <button
          type="button"
          onClick={() => handleStepMonth(-1)}
          aria-label="Previous Month"
          className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high hover:text-on-surface transition-colors active:scale-90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {/* Interactive Month & Year Popover Trigger Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsMonthPickerOpen((prev) => !prev);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-on-surface hover:bg-surface-container-high/60 transition-all font-section-header text-sm sm:text-base font-bold active:scale-95 cursor-pointer"
          title="Click to select any month and year"
        >
          <span
            className="material-symbols-outlined text-[16px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            calendar_today
          </span>
          <span>{formattedTitle}</span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            {isMonthPickerOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleStepMonth(1)}
          aria-label="Next Month"
          className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high hover:text-on-surface transition-colors active:scale-90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* 12-Month & Year Dropdown Popover */}
      {isMonthPickerOpen && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-72 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/25 p-3.5 space-y-3 animate-scaleUp">
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
              const isSelected = selectedMonthIdx === idx && selectedYear === viewingYear;
              const isRealNow = idx === realCurrentMonthIdx && viewingYear === realCurrentYear;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-soft scale-105'
                      : isRealNow
                      ? 'border border-primary/50 text-primary font-bold bg-primary/10 hover:bg-primary/20'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Bottom Controls: Quick Current Month Reset */}
          {!isCurrentRealMonth && (
            <div className="flex items-center justify-end pt-2 border-t border-outline-variant/15 text-xs">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3 py-1 rounded-lg font-bold font-stat-label text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Current Month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
