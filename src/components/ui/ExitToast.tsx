import React from 'react';

interface ExitToastProps {
  show: boolean;
}

export const ExitToast: React.FC<ExitToastProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce-subtle">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface-container-highest/95 dark:bg-surface-container-high/95 text-on-surface backdrop-blur-md border border-outline-variant/30 shadow-2xl ring-1 ring-primary/30">
        <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          arrow_back
        </span>
        <span className="font-stat-label text-xs sm:text-sm font-semibold tracking-wide">
          Press back again to exit HabitFlow
        </span>
      </div>
    </div>
  );
};
