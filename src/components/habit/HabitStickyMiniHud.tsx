import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface HabitStickyMiniHudProps {
  isVisible: boolean;
  boardName: string;
  boardIcon?: string;
  selectedMonthTitle: string;
  completionRate: number;
  isSingleHabit?: boolean;
  habitName?: string;
  onExportPDF: () => void;
  onScrollToTop: () => void;
  onToggleShortcutsModal?: () => void;
}

export const HabitStickyMiniHud: React.FC<HabitStickyMiniHudProps> = ({
  isVisible,
  boardName,
  boardIcon,
  selectedMonthTitle,
  completionRate,
  isSingleHabit,
  habitName,
  onExportPDF,
  onScrollToTop,
  onToggleShortcutsModal,
}) => {
  if (!isVisible) return null;

  const isFlowAchieved = completionRate >= 80;

  return (
    <aside
      aria-label="Floating report quick controls"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out animate-slideDown max-w-[94vw] sm:max-w-2xl w-auto pointer-events-auto"
    >
      <div className="flex items-center gap-2 sm:gap-3.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-stone-900/92 dark:bg-stone-950/95 text-stone-100 backdrop-blur-md border border-stone-700/60 shadow-2xl text-xs">
        {/* Left: Tracker Board / Habit Name */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onScrollToTop();
          }}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors text-left cursor-pointer group shrink-0"
          title="Scroll to Top"
        >
          {boardIcon && <span className="text-[14px]">{boardIcon}</span>}
          <span className="font-bold max-w-[90px] sm:max-w-[130px] truncate text-stone-200 group-hover:text-emerald-300">
            {isSingleHabit && habitName ? habitName : boardName}
          </span>
        </button>

        <span className="w-1 h-1 rounded-full bg-stone-600 shrink-0" />

        {/* Month Title */}
        <span className="text-stone-300 font-medium shrink-0 hidden xs:inline">
          {selectedMonthTitle}
        </span>

        <span className="w-1 h-1 rounded-full bg-stone-600 shrink-0 hidden xs:inline" />

        {/* Flow Metric Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold font-tnum text-[11px] shrink-0 ${
            isFlowAchieved
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-stone-800 text-stone-300 border border-stone-700'
          }`}
          title={`${completionRate}% overall flow consistency`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isFlowAchieved ? 'bg-emerald-400 animate-pulse' : 'bg-stone-400'
            }`}
          />
          <span>{completionRate}% Flow</span>
        </div>

        {/* Right Action: PDF Export */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onExportPDF();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all active:scale-95 shadow-xs cursor-pointer shrink-0 text-[11px]"
          title="Export Executive PDF Report (Shortcut: P)"
        >
          <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
          <span className="hidden sm:inline">PDF</span>
        </button>

        {/* Optional Hotkey / Info Trigger */}
        {onToggleShortcutsModal && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onToggleShortcutsModal();
            }}
            className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 text-[11px] font-mono hidden md:flex"
            title="Keyboard shortcuts: [ / ] habits, M month, P PDF, ? shortcuts"
            aria-label="View keyboard shortcuts"
          >
            ?
          </button>
        )}

        {/* Scroll to Top Arrow */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onScrollToTop();
          }}
          className="w-6 h-6 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
        </button>
      </div>
    </aside>
  );
};
