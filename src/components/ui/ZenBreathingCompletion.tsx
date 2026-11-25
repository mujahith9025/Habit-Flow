import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface ZenBreathingCompletionProps {
  completedCount: number;
  categoryName?: string;
  onShowAllHabits?: () => void;
  onOpenEveningReflection?: () => void;
}

/**
 * Zen Mindful Breathing Completion Micro-Moment
 * 
 * Inspired by Inspo health/wellness exemplars (Allia Health, Mooala).
 * Replaces generic checkmark empty states with a calming, animated
 * mindful breathing pebble and reflection prompt.
 */
export const ZenBreathingCompletion: React.FC<ZenBreathingCompletionProps> = ({
  completedCount,
  categoryName,
  onShowAllHabits,
  onOpenEveningReflection,
}) => {
  return (
    <div className="py-7 px-4 sm:px-6 text-center rounded-3xl bg-surface-container-low/50 dark:bg-surface-container-low/20 border border-outline-variant/30 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
      {/* Concentric Mindful Breathing Rings */}
      <div className="relative flex items-center justify-center my-1">
        {/* Ambient Outer Halo */}
        <div className="absolute w-24 h-24 rounded-full bg-secondary/10 dark:bg-secondary/15 animate-zen-pulse-slow pointer-events-none" />

        {/* Pulsing Breathing Core */}
        <div className="w-16 h-16 rounded-full bg-secondary-container/60 dark:bg-secondary-container/40 border border-secondary/30 flex items-center justify-center shadow-xs animate-zen-breathe">
          <span
            className="material-symbols-outlined text-[28px] text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            spa
          </span>
        </div>
      </div>

      {/* Editorial Typographic Message */}
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-editorial italic text-xl sm:text-2xl font-normal text-on-surface tracking-tight">
          Gentle flow complete.
        </h3>
        <p className="font-body-text text-xs text-on-surface-variant leading-relaxed">
          Every habit in {categoryName || 'your routine'} is honored for today. Inhale deeply, exhale slowly, and enjoy the stillness.
        </p>
      </div>

      {/* Mindful Actions with Dual-Color Accents */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        {onOpenEveningReflection && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('note');
              onOpenEveningReflection();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#A65A42]/15 text-[#A65A42] hover:bg-[#A65A42] hover:text-white border border-[#A65A42]/30 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">edit_note</span>
            <span>Evening Reflection</span>
          </button>
        )}

        {onShowAllHabits && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onShowAllHabits();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-high/60 hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span>Show completed ({completedCount})</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        )}
      </div>
    </div>
  );
};
