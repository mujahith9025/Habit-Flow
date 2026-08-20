import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface DailyGridCellProps {
  habitId: string;
  dateKey: string;
  isCompleted: boolean;
  isToday: boolean;
  hasNote?: boolean;
  habitColor?: string;
  onToggle: () => void;
}

export const DailyGridCell: React.FC<DailyGridCellProps> = ({
  dateKey,
  isCompleted,
  isToday,
  hasNote,
  onToggle,
}) => {
  const handleToggle = () => {
    triggerHaptic(isCompleted ? 'medium' : 'light');
    onToggle();
  };

  return (
    <td
      className={`p-1.5 sm:p-2 text-center transition-colors border-r border-outline-variant/15 relative ${
        isToday
          ? 'bg-primary-fixed/20 dark:bg-primary-fixed-dim/15 border-x-2 border-primary/40 font-bold'
          : 'hover:bg-surface-container-low/50 dark:hover:bg-surface-container-high/30'
      }`}
    >
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleToggle}
          title={
            isCompleted
              ? `Mark as incomplete (${isToday ? 'Today' : dateKey})`
              : `Mark as completed (${isToday ? 'Today' : dateKey})`
          }
          aria-label={isCompleted ? 'Completed' : 'Pending'}
          className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
            isCompleted
              ? 'bg-primary text-on-primary shadow-soft ring-1 ring-black/10 hover:brightness-110'
              : isToday
              ? 'border-2 border-primary/80 dark:border-primary-fixed-dim hover:bg-primary/20 bg-surface-container-lowest dark:bg-surface-container ring-2 ring-primary/30 ring-offset-1 ring-offset-background'
              : 'border-2 border-outline-variant/60 dark:border-outline hover:border-primary hover:bg-primary-fixed/15 bg-surface-container-lowest dark:bg-surface-container'
          }`}
        >
          {isCompleted ? (
            <span
              className="material-symbols-outlined text-[15px] sm:text-[16px] leading-none font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          ) : isToday ? (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30 group-hover:bg-primary/40" />
          )}
        </button>

        {hasNote && (
          <span
            title="Note attached"
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-background shadow-xs pointer-events-none"
          />
        )}
      </div>
    </td>
  );
};
