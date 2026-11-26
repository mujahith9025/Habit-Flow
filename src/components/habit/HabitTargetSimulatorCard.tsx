import React, { useState, useMemo } from 'react';
import { calculateWhatIfScenario } from '../../utils/whatIfSimulator';
import { triggerHaptic } from '../../utils/haptics';

interface HabitTargetSimulatorCardProps {
  totalDays: number;
  daysElapsed: number;
  completedChecks: number;
  totalHabitCount: number;
  currentStreak?: number;
  selectedMonthTitle: string;
}

export const HabitTargetSimulatorCard: React.FC<HabitTargetSimulatorCardProps> = ({
  totalDays,
  daysElapsed,
  completedChecks,
  totalHabitCount,
  currentStreak = 0,
  selectedMonthTitle,
}) => {
  const [targetConsistency, setTargetConsistency] = useState<number>(100);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const scenario = useMemo(() => {
    return calculateWhatIfScenario({
      totalDays,
      daysElapsed,
      completedChecks,
      totalHabitCount,
      targetConsistencyPercent: targetConsistency,
      currentStreak,
    });
  }, [totalDays, daysElapsed, completedChecks, totalHabitCount, targetConsistency, currentStreak]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setTargetConsistency(val);
    if (val % 10 === 0) {
      triggerHaptic('tick');
    }
  };

  const handleApplyPreset = (pct: number) => {
    triggerHaptic('selection');
    setTargetConsistency(pct);
  };

  // Grade color scheme
  const gradeStyles = useMemo(() => {
    switch (scenario.grade) {
      case 'S':
        return {
          bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-500/30',
          badgeBg: 'bg-emerald-600 text-white',
        };
      case 'A':
        return {
          bg: 'bg-teal-500/15 dark:bg-teal-500/20',
          text: 'text-teal-700 dark:text-teal-300',
          border: 'border-teal-500/30',
          badgeBg: 'bg-teal-600 text-white',
        };
      case 'B':
        return {
          bg: 'bg-amber-500/15 dark:bg-amber-500/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-500/30',
          badgeBg: 'bg-amber-600 text-white',
        };
      case 'C':
        return {
          bg: 'bg-stone-500/15 dark:bg-stone-500/20',
          text: 'text-stone-700 dark:text-stone-300',
          border: 'border-stone-500/30',
          badgeBg: 'bg-stone-600 text-white',
        };
      case 'D':
      default:
        return {
          bg: 'bg-rose-500/15 dark:bg-rose-500/20',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-500/30',
          badgeBg: 'bg-rose-600 text-white',
        };
    }
  }, [scenario.grade]);

  return (
    <div
      id="simulator"
      className="japandi-card bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-5 sm:p-6 border border-outline-variant/20 shadow-soft transition-all"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[19px]">tune</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-section-header font-bold text-sm sm:text-base text-on-surface">
                Interactive "What-If" Target Simulator
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono hidden xs:inline">
                Pacing Lab
              </span>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant">
              Simulate consistency for the remaining {scenario.daysRemaining} day{scenario.daysRemaining === 1 ? '' : 's'} of {selectedMonthTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tick');
            setIsExpanded((prev) => !prev);
          }}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          aria-label={isExpanded ? 'Collapse simulator' : 'Expand simulator'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-5 animate-fadeIn">
          {/* Main 4-cell projection grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cell 1: Simulated Completion Rate */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-stat-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Simulated Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-black text-on-surface font-tnum">
                  {scenario.simulatedRate}%
                </span>
                {scenario.rateDelta !== 0 && (
                  <span
                    className={`text-[11px] font-bold font-mono font-tnum ${
                      scenario.rateDelta > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {scenario.rateDelta > 0 ? `+${scenario.rateDelta}%` : `${scenario.rateDelta}%`}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant/80 mt-0.5">
                Current: <strong className="font-tnum">{scenario.currentRate}%</strong>
              </span>
            </div>

            {/* Cell 2: Month Grade */}
            <div
              className={`p-3.5 rounded-2xl border ${gradeStyles.bg} ${gradeStyles.border} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="font-stat-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Projected Grade
                </span>
                <span
                  className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${gradeStyles.badgeBg}`}
                >
                  {scenario.grade}
                </span>
              </div>
              <span className={`font-bold text-sm ${gradeStyles.text} truncate mt-1`}>
                {scenario.gradeTitle}
              </span>
              <span className="text-[10px] text-on-surface-variant/80 truncate mt-0.5">
                {scenario.gradeDescription}
              </span>
            </div>

            {/* Cell 3: Milestone Badge */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-stat-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Milestone Status
              </span>
              <span className="font-bold text-xs text-on-surface mt-1 truncate">
                {scenario.milestoneBadge}
              </span>
              <span className="text-[10px] text-on-surface-variant/80 mt-0.5">
                {scenario.isFlowBenchmarkReached ? '✅ 80% flow reached' : 'Pacing towards 80%'}
              </span>
            </div>

            {/* Cell 4: Projected Unbroken Streak */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-stat-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Projected Streak
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono text-2xl font-black text-primary font-tnum">
                  {scenario.projectedStreak}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">days</span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80 mt-0.5">
                {targetConsistency === 100
                  ? `+${scenario.daysRemaining} days if unbroken`
                  : 'Requires 100% pacing'}
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/15">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-on-surface">
                Hypothetical Remaining Consistency:
              </span>
              <span className="font-mono font-bold text-primary text-sm font-tnum">
                {targetConsistency}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={targetConsistency}
              onChange={handleSliderChange}
              className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Target consistency slider"
            />

            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
              <span>0% (Halt)</span>
              <span>50% (Alternate Days)</span>
              <span>80% (Flow State)</span>
              <span>100% (Flawless)</span>
            </div>

            {/* Quick Action Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] font-bold text-on-surface-variant mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset(100)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  targetConsistency === 100
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                100% Flawless Flow
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(80)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  targetConsistency === 80
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                80% Flow Sweet Spot
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(scenario.currentRate)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  targetConsistency === scenario.currentRate
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                Current Velocity ({scenario.currentRate}%)
              </button>
              {targetConsistency !== 100 && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset(100)}
                  className="px-2 py-1 rounded-xl text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer ml-auto"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
