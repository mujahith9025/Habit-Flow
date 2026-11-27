import React, { useState } from 'react';
import { getBotanicalRank } from '../../utils/botanicalRank';
import { triggerHaptic } from '../../utils/haptics';

interface BotanicalGrowthRankBadgeProps {
  days: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BotanicalGrowthRankBadge: React.FC<BotanicalGrowthRankBadgeProps> = ({
  days,
  showProgress = true,
  size = 'md',
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const rank = getBotanicalRank(days);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onClick={() => {
          triggerHaptic('tick');
          setShowTooltip((prev) => !prev);
        }}
        className={`japandi-card rounded-2xl border transition-all cursor-pointer select-none ${
          rank.colorClass.bg
        } ${rank.colorClass.border} ${
          isSmall ? 'p-1.5 px-2.5' : isLarge ? 'p-3.5 px-4' : 'p-2.5 px-3.5'
        }`}
        title={`Click for neurobiology insight: ${rank.stageTitle}`}
      >
        <div className="flex items-center gap-2">
          {/* Botanical Emoji with Ambient Rim */}
          <span
            className={`flex items-center justify-center shrink-0 ${
              isSmall ? 'text-base' : isLarge ? 'text-2xl' : 'text-xl'
            }`}
          >
            {rank.icon}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-app-title font-extrabold truncate ${rank.colorClass.text} ${
                  isSmall ? 'text-xs' : isLarge ? 'text-sm' : 'text-xs'
                }`}
              >
                {rank.label}
              </span>

              <span className="text-[10px] font-bold text-on-surface-variant/80 font-mono font-tnum">
                {rank.days}d
              </span>
            </div>

            <p
              className={`text-on-surface-variant/90 truncate font-medium ${
                isSmall ? 'text-[9.5px]' : 'text-[10.5px]'
              }`}
            >
              {rank.stageTitle}
            </p>
          </div>
        </div>

        {/* Progress Bar towards Next Neurobiological Rank */}
        {showProgress && rank.daysToNextRank > 0 && (
          <div className="mt-2 pt-1 border-t border-outline-variant/15 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-on-surface-variant font-mono">
              <span>Next Threshold</span>
              <span className="font-bold font-tnum">{rank.daysToNextRank}d to next</span>
            </div>
            <div className="w-full bg-surface-container-high/60 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${rank.progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {showProgress && rank.daysToNextRank === 0 && (
          <div className="mt-1.5 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ✨ Automaticity Plateau Mastered
          </div>
        )}
      </div>

      {/* Floating Scientific Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-stone-900/95 dark:bg-stone-950/95 text-stone-100 text-xs shadow-xl border border-stone-700/60 z-50 animate-scaleUp pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-800">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span>{rank.icon}</span>
              <span>{rank.label} ({rank.stageTitle})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="text-stone-400 hover:text-white p-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            {rank.stageDescription}
          </p>
          <div className="mt-2 pt-1 border-t border-stone-800 text-[9.5px] text-stone-400 font-mono">
            UCL 66-day Habit Automaticity Scale
          </div>
        </div>
      )}
    </div>
  );
};
