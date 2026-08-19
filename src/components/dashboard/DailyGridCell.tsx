import React from 'react';

interface DailyGridCellProps {
  habitId: string;
  dateKey: string;
  isCompleted: boolean;
  isToday: boolean;
  habitColor?: string;
  onToggle: () => void;
}

export const DailyGridCell: React.FC<DailyGridCellProps> = ({
  isCompleted,
  isToday,
  habitColor = '#006398',
  onToggle,
}) => {
  return (
    <td
      className={`p-1.5 sm:p-2 text-center transition-colors ${
        isToday ? 'bg-primary-container/20 dark:bg-primary-container/10' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        aria-label={isCompleted ? 'Completed' : 'Pending'}
        className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
          isCompleted
            ? 'text-white shadow-soft ring-1 ring-black/10'
            : 'border-2 border-outline-variant/60 dark:border-outline-variant/40 hover:border-primary hover:bg-primary-fixed/15 hover:scale-105'
        }`}
        style={{
          backgroundColor: isCompleted ? habitColor : 'transparent',
        }}
      >
        {isCompleted ? (
          <span
            className="material-symbols-outlined text-[15px] sm:text-[16px] leading-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check
          </span>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/20 group-hover:bg-primary/40" />
        )}
      </button>
    </td>
  );
};
