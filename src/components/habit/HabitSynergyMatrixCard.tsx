import React from 'react';
import { HabitSynergyReport } from '../../utils/habitSynergy';
import { AnalyticalHelpTooltip } from '../ui/AnalyticalHelpTooltip';

interface HabitSynergyMatrixCardProps {
  synergyReport: HabitSynergyReport;
  className?: string;
}

export const HabitSynergyMatrixCard: React.FC<HabitSynergyMatrixCardProps> = ({
  synergyReport,
  className = '',
}) => {
  const { hasSufficientData, keystoneHabit, topPairs } = synergyReport;

  if (!hasSufficientData || topPairs.length === 0) {
    return null;
  }

  return (
    <div
      className={`japandi-card rounded-3xl p-5 sm:p-6 shadow-soft space-y-5 transition-all ${className}`}
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hub
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface flex items-center">
              Habit Synergy & Stacking Engine
              <AnalyticalHelpTooltip
                term="Habit Stacking Synergy"
                explanation="Calculates the conditional probability that completing habit A naturally triggers you to complete habit B."
              />
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant">
            Atomic behavioral co-occurrence uncovering which habits naturally catalyze other routines.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container self-start sm:self-auto font-stat-label">
          {topPairs.length} High-Synergy Pairs
        </span>
      </div>

      {/* 2. Keystone Habit Catalyst Banner */}
      {keystoneHabit && (
        <div className="bg-gradient-to-r from-secondary/15 via-primary/10 to-transparent rounded-2xl p-4 border border-secondary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-lg shadow-soft shrink-0">
              ⚡
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-secondary/20 text-on-secondary-container text-[10px] font-black uppercase tracking-wider mb-0.5 font-stat-label">
                Keystone Habit Catalyst
              </div>
              <h4 className="font-app-title text-base font-bold text-on-surface">
                {keystoneHabit.habit.name}
              </h4>
              <p className="text-xs text-on-surface-variant font-body-text">
                {keystoneHabit.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-stat-label font-tnum text-xs font-bold">
              +{keystoneHabit.catalyticScore}% Catalytic Lift
            </span>
          </div>
        </div>
      )}

      {/* 3. Stacking Blueprints (James Clear Archetype) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-stat-label">
          Recommended Habit Stacking Blueprints
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {topPairs.map((pair, idx) => (
            <div
              key={`${pair.primaryHabit.id}_${pair.secondaryHabit.id}_${idx}`}
              className="p-4 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/15 flex flex-col justify-between space-y-3 shadow-2xs hover:border-primary/30 transition-colors"
            >
              {/* Top Row: Habit Stacking Pair Chips */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-surface-container-highest text-on-surface">
                    {pair.primaryHabit.name}
                  </span>
                  <span className="text-xs text-on-surface-variant font-bold">➔</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                    {pair.secondaryHabit.name}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#52995D]/20 text-[#2D5A34] dark:text-[#88C490] font-stat-label font-tnum shrink-0">
                  +{pair.synergyLiftPercent}% Lift
                </span>
              </div>

              {/* Blueprint Prompt */}
              <blockquote className="text-xs italic text-on-surface border-l-2 border-primary/40 pl-2.5 py-0.5">
                "{pair.stackingBlueprint}"
              </blockquote>

              {/* Bottom Stat Chips */}
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-stat-label font-tnum pt-1 border-t border-outline-variant/10">
                <span>
                  Co-occurrence: <strong className="text-on-surface font-tnum">{pair.coOccurrenceProbability}%</strong> of the time
                </span>
                <span>
                  Base: <span className="text-on-surface-variant font-tnum">{pair.baselineProbability}%</span>
                </span>
                <span>
                  <strong className="text-primary font-tnum">{pair.daysBothDone}d</strong> stacked
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
