import React from 'react';
import { MonthYearState } from '../../types';

interface DateNavigatorProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  className?: string;
}

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
  className = '',
}) => {
  const { formattedTitle } = formatMonthYear(currentDate);

  return (
    <div
      className={`flex items-center justify-between px-md py-2 bg-surface-container-lowest dark:bg-surface-container rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/15 select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => onChangeMonth(-1)}
        aria-label="Previous Month"
        className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high hover:text-on-surface transition-colors active:scale-90"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
      </button>

      <h2 className="font-section-header text-sm sm:text-base font-semibold text-on-surface min-w-[140px] text-center">
        {formattedTitle}
      </h2>

      <button
        type="button"
        onClick={() => onChangeMonth(1)}
        aria-label="Next Month"
        className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high hover:text-on-surface transition-colors active:scale-90"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </button>
    </div>
  );
};
