import React, { useState } from 'react';
import { Habit, HabitEntry, HabitMood } from '../../types';
import { analyzeMoodCorrelations, HabitMoodInsight } from '../../utils/moodCorrelation';
import { triggerHaptic } from '../../utils/haptics';

interface MoodCorrelationCardProps {
  habits: Habit[];
  entriesByHabit: Record<string, Record<string, HabitEntry>>;
  className?: string;
}

const MOOD_EMOJI: Record<HabitMood, string> = {
  energized: '⚡',
  calm: '🧘',
  focused: '🎯',
  proud: '💪',
  tired: '😴',
};

export const MoodCorrelationCard: React.FC<MoodCorrelationCardProps> = ({
  habits,
  entriesByHabit,
  className = '',
}) => {
  const [showAllInsights, setShowAllInsights] = useState(false);
  const report = analyzeMoodCorrelations(habits, entriesByHabit);
  const { topHabitInsight, insights, totalReflectionsCount } = report;

  // Fallback if user hasn't logged reflection moods yet
  if (!topHabitInsight) {
    return (
      <div
        className={`bg-surface-container-lowest dark:bg-surface-container-lowest oled:!bg-[#0B0C0E] rounded-3xl p-5 border border-outline-variant/30 oled:border-outline-variant/15 shadow-soft transition-all ${className}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <div>
              <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                Mood & Habit Synergy
              </h3>
              <p className="font-body-text text-[11px] text-on-surface-variant">
                Mind-body correlation engine
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            Insights
          </span>
        </div>

        <div className="pt-3 text-center py-4 space-y-2">
          <span className="text-2xl">🌱</span>
          <p className="font-habit-name text-xs font-bold text-on-surface">
            Discover What Energizes You
          </p>
          <p className="font-body-text text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Swipe left on any completed habit on mobile (or tap the note icon) to log your feeling.
            HabitFlow will automatically calculate which habits give you the greatest energy, calm, and flow!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container-lowest oled:!bg-[#0B0C0E] rounded-3xl p-5 sm:p-6 border border-outline-variant/30 oled:border-outline-variant/15 shadow-soft transition-all space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
          </div>
          <div>
            <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
              Mood & Habit Synergy
            </h3>
            <p className="font-body-text text-[11px] text-on-surface-variant">
              Based on {totalReflectionsCount} reflection notes
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
          Live Correlation
        </span>
      </div>

      {/* Hero Highlight Insight */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/10 via-surface-container-low/40 to-surface-container-lowest dark:from-secondary/15 dark:to-surface-container-high/20 border border-secondary/25 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: topHabitInsight.habitColor }}
            >
              <span className="material-symbols-outlined text-[16px]">{topHabitInsight.habitIcon}</span>
            </div>
            <span className="font-habit-name text-xs sm:text-sm font-bold text-on-surface">
              {topHabitInsight.habitName}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-stat-label">
            <span>+{topHabitInsight.liftPercent}%</span>
            <span>{MOOD_EMOJI[topHabitInsight.topMood]}</span>
          </div>
        </div>

        <p className="font-body-text text-xs text-on-surface leading-relaxed italic">
          "{topHabitInsight.insightQuote}"
        </p>

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/15">
          <span>{topHabitInsight.positiveRate}% Positive Feelings</span>
          <span>Logged {topHabitInsight.totalLoggedDays} days</span>
        </div>
      </div>

      {/* Expandable list if user has multiple habits with logged reflections */}
      {insights.length > 1 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-stat-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Habit Impact Rankings
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAllInsights(!showAllInsights);
              }}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              {showAllInsights ? 'Show Top' : `View All (${insights.length})`}
            </button>
          </div>

          <div className="space-y-1.5">
            {(showAllInsights ? insights : insights.slice(0, 3)).map((item: HabitMoodInsight) => (
              <div
                key={item.habitId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/15 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{MOOD_EMOJI[item.topMood]}</span>
                  <span className="font-semibold text-on-surface truncate">{item.habitName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-stat-label font-bold text-secondary">+{item.liftPercent}%</span>
                  <span className="text-[10px] text-on-surface-variant">({item.positiveRate}% positive)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
