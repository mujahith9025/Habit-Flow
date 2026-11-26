import React, { useState, useMemo } from 'react';
import { Habit, HabitEntry, HabitMood } from '../../types';
import { analyzeMoodCorrelations } from '../../utils/moodCorrelation';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { triggerHaptic } from '../../utils/haptics';

interface HabitEmotionalROIMatrixProps {
  habits: Habit[];
  entriesByHabit: Record<string, Record<string, HabitEntry>>;
  habitMetricsMap?: Record<string, HabitGridMetrics>;
  className?: string;
}

const MOOD_EMOJI: Record<HabitMood, string> = {
  energized: '⚡',
  calm: '🧘',
  focused: '🎯',
  proud: '💪',
  tired: '😴',
};

export const HabitEmotionalROIMatrix: React.FC<HabitEmotionalROIMatrixProps> = ({
  habits,
  entriesByHabit,
  habitMetricsMap = {},
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'quadrants' | 'ranked'>('quadrants');

  const report = useMemo(() => {
    return analyzeMoodCorrelations(habits, entriesByHabit);
  }, [habits, entriesByHabit]);

  const { insights } = report;

  // Classify habits into 4 ROI Quadrants:
  // 1. Anchor: Consistency >= 70% & Positive Mood Rate >= 75%
  // 2. High-Yield: Consistency < 70% & Positive Mood Rate >= 75%
  // 3. Disciplined: Consistency >= 70% & Positive Mood Rate < 75%
  // 4. Emerging: Consistency < 70% & Positive Mood Rate < 75%
  const classifiedHabits = useMemo(() => {
    return habits.map((h) => {
      const metric = habitMetricsMap[h.id];
      const consistencyRate = metric ? metric.monthProgressPercent : 50;
      const moodInsight = insights.find((i) => i.habitId === h.id);
      const positiveMoodRate = moodInsight ? moodInsight.positiveRate : 70;

      let quadrant: 'anchor' | 'high_yield' | 'disciplined' | 'emerging' = 'emerging';
      if (consistencyRate >= 70 && positiveMoodRate >= 75) {
        quadrant = 'anchor';
      } else if (consistencyRate < 70 && positiveMoodRate >= 75) {
        quadrant = 'high_yield';
      } else if (consistencyRate >= 70 && positiveMoodRate < 75) {
        quadrant = 'disciplined';
      }

      return {
        habit: h,
        consistencyRate,
        positiveMoodRate,
        quadrant,
        moodInsight,
      };
    });
  }, [habits, habitMetricsMap, insights]);

  // Habit of the Month: Top habit combining consistency and emotional return
  const habitOfTheMonth = useMemo(() => {
    if (classifiedHabits.length === 0) return null;
    return classifiedHabits.reduce((best, cur) => {
      const curScore = cur.consistencyRate * 0.5 + cur.positiveMoodRate * 0.5;
      const bestScore = best.consistencyRate * 0.5 + best.positiveMoodRate * 0.5;
      return curScore > bestScore ? cur : best;
    }, classifiedHabits[0]);
  }, [classifiedHabits]);

  const anchorList = classifiedHabits.filter((h) => h.quadrant === 'anchor');
  const highYieldList = classifiedHabits.filter((h) => h.quadrant === 'high_yield');
  const disciplinedList = classifiedHabits.filter((h) => h.quadrant === 'disciplined');
  const emergingList = classifiedHabits.filter((h) => h.quadrant === 'emerging');

  if (habits.length === 0) return null;

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline-variant/30 shadow-soft space-y-5 transition-all ${className}`}
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Habit Emotional ROI Matrix
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant">
            Mind-body correlation analyzing execution consistency against self-reported reflection moods.
          </p>
        </div>

        {/* View Switcher: Quadrants vs Ranked */}
        <div className="flex items-center gap-1 bg-surface-container-low dark:bg-surface-container-high/40 p-1 rounded-full border border-outline-variant/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewMode('quadrants');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'quadrants'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Quadrant Matrix
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewMode('ranked');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'ranked'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ranked List
          </button>
        </div>
      </div>

      {/* 2. Habit of the Month Honor Ribbon */}
      {habitOfTheMonth && (
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent rounded-2xl p-4 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-lg shadow-soft shrink-0">
              🌟
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full bg-primary/15 text-primary dark:text-primary-fixed-dim text-[10px] font-black uppercase tracking-wider mb-0.5">
                Habit of the Month Honor
              </div>
              <h4 className="font-app-title text-base font-bold text-on-surface">
                {habitOfTheMonth.habit.name}
              </h4>
              <p className="text-xs text-on-surface-variant font-body-text">
                Highest combined execution consistency ({habitOfTheMonth.consistencyRate}%) and positive mood return ({habitOfTheMonth.positiveMoodRate}%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-stat-label text-xs font-bold">
              {habitOfTheMonth.consistencyRate}% Flow
            </span>
            <span className="px-3 py-1 rounded-full bg-[#52995D]/20 text-[#2D5A34] dark:text-[#88C490] font-stat-label text-xs font-bold">
              {habitOfTheMonth.positiveMoodRate}% Mood Lift
            </span>
          </div>
        </div>
      )}

      {/* 3. Quadrant Grid Presentation */}
      {viewMode === 'quadrants' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Anchor Habits */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-[#52995D]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🌟</span>
                <div>
                  <h4 className="font-app-title text-sm font-bold text-on-surface">
                    Anchor Habits
                  </h4>
                  <span className="text-[10px] text-on-surface-variant">
                    High Consistency (≥70%) • High Mood Lift (≥75%)
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#52995D]/15 text-[#2D5A34] dark:text-[#88C490]">
                {anchorList.length} Habits
              </span>
            </div>

            {anchorList.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-3 text-center">
                Keep tracking habits to build anchor foundations.
              </p>
            ) : (
              <div className="space-y-2">
                {anchorList.map(({ habit, consistencyRate, positiveMoodRate, moodInsight }) => (
                  <div
                    key={habit.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container flex items-center justify-between gap-2 border border-outline-variant/15 text-xs shadow-2xs"
                  >
                    <div className="truncate">
                      <span className="font-bold text-on-surface truncate block">{habit.name}</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {moodInsight?.topMood ? `Top mood: ${MOOD_EMOJI[moodInsight.topMood]} ${moodInsight.topMood}` : 'Deep flow state'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-primary">{consistencyRate}%</span>
                      <span className="text-[10px] text-[#52995D] font-bold">+{positiveMoodRate}% ROI</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quadrant 2: High-Yield Habits */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-[#D4A373]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <div>
                  <h4 className="font-app-title text-sm font-bold text-on-surface">
                    High-Yield Opportunities
                  </h4>
                  <span className="text-[10px] text-on-surface-variant">
                    High Mood Lift (≥75%) • Moderate Consistency (&lt;70%)
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A373]/20 text-[#8C5D30] dark:text-[#E2B788]">
                {highYieldList.length} Habits
              </span>
            </div>

            {highYieldList.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-3 text-center">
                All high-yield habits are currently locked in steady rhythm!
              </p>
            ) : (
              <div className="space-y-2">
                {highYieldList.map(({ habit, consistencyRate, positiveMoodRate }) => (
                  <div
                    key={habit.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container flex items-center justify-between gap-2 border border-outline-variant/15 text-xs shadow-2xs"
                  >
                    <div className="truncate">
                      <span className="font-bold text-on-surface truncate block">{habit.name}</span>
                      <span className="text-[10px] text-on-surface-variant">
                        Highest emotional upside if scheduled consistently
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-on-surface">{consistencyRate}%</span>
                      <span className="text-[10px] text-[#D4A373] font-bold">+{positiveMoodRate}% ROI</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quadrant 3: Disciplined Habits */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <div>
                  <h4 className="font-app-title text-sm font-bold text-on-surface">
                    Disciplined Routines
                  </h4>
                  <span className="text-[10px] text-on-surface-variant">
                    High Consistency (≥70%) • Neutral Return
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface-variant">
                {disciplinedList.length} Habits
              </span>
            </div>

            {disciplinedList.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-3 text-center">
                None in this category.
              </p>
            ) : (
              <div className="space-y-2">
                {disciplinedList.map(({ habit, consistencyRate }) => (
                  <div
                    key={habit.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container flex items-center justify-between gap-2 border border-outline-variant/15 text-xs shadow-2xs"
                  >
                    <span className="font-bold text-on-surface truncate">{habit.name}</span>
                    <span className="font-bold text-primary">{consistencyRate}% Consistency</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quadrant 4: Emerging Habits */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🌱</span>
                <div>
                  <h4 className="font-app-title text-sm font-bold text-on-surface">
                    Emerging Habits
                  </h4>
                  <span className="text-[10px] text-on-surface-variant">
                    New routines forming automaticity
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface-variant">
                {emergingList.length} Habits
              </span>
            </div>

            {emergingList.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-3 text-center">
                All active habits have achieved established consistency!
              </p>
            ) : (
              <div className="space-y-2">
                {emergingList.map(({ habit, consistencyRate }) => (
                  <div
                    key={habit.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container flex items-center justify-between gap-2 border border-outline-variant/15 text-xs shadow-2xs"
                  >
                    <span className="font-bold text-on-surface truncate">{habit.name}</span>
                    <span className="text-on-surface-variant font-medium">{consistencyRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Ranked List View */
        <div className="space-y-2.5">
          {classifiedHabits
            .sort((a, b) => b.positiveMoodRate - a.positiveMoodRate)
            .map(({ habit, consistencyRate, positiveMoodRate, moodInsight }) => (
              <div
                key={habit.id}
                className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: habit.color || '#2D5A34' }}
                  />
                  <div>
                    <h5 className="font-app-title font-bold text-on-surface text-sm">
                      {habit.name}
                    </h5>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {moodInsight?.insightQuote || 'Swipe left or tap note icon on habits to log daily feelings.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                      Consistency
                    </span>
                    <span className="font-bold text-on-surface text-sm">{consistencyRate}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                      Mood Return
                    </span>
                    <span className="font-bold text-[#52995D] text-sm">+{positiveMoodRate}% ROI</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
