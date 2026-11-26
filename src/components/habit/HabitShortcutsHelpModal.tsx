import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface HabitShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitShortcutsHelpModal: React.FC<HabitShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '[', action: 'Cycle to previous habit in board' },
    { key: ']', action: 'Cycle to next habit in board' },
    { key: 'M', action: 'Focus / open Month selector' },
    { key: 'P', action: '1-Tap Executive PDF export' },
    { key: '?', action: 'Toggle this keyboard shortcuts cheat-sheet' },
    { key: 'Swipe ◀ ▶', action: 'Mobile swipe left/right between months with haptics' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('tick');
          onClose();
        }
      }}
    >
      <div className="japandi-card bg-surface-container-lowest dark:bg-surface-container max-w-md w-full rounded-3xl p-6 border border-outline-variant/30 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
            </div>
            <h3 className="font-section-header font-bold text-base text-on-surface">
              Report Hotkeys & Gestures
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/15 text-xs"
            >
              <span className="text-on-surface-variant font-medium">{sc.action}</span>
              <kbd className="px-2 py-1 rounded-md bg-surface-container-highest dark:bg-stone-800 text-on-surface font-mono font-bold text-[11px] border border-outline-variant/30 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-xs shadow-soft hover:opacity-95 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
