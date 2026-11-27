import React from 'react';
import { PlainEnglishStory } from '../../utils/plainEnglishStory';
import { triggerHaptic } from '../../utils/haptics';

interface HabitPlainEnglishStoryViewProps {
  story: PlainEnglishStory;
  onSwitchToAnalytics: () => void;
  onOpenMilestoneCard?: () => void;
}

export const HabitPlainEnglishStoryView: React.FC<HabitPlainEnglishStoryViewProps> = ({
  story,
  onSwitchToAnalytics,
  onOpenMilestoneCard,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn select-none">
      {/* 3 Conversational Story Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: How Did I Do? */}
        <div className="japandi-card bg-surface-container-lowest dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-emerald-500/25 shadow-soft relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-stat-label font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/15">
                Monthly Health
              </span>
              <span className="text-2xl">🌱</span>
            </div>

            <h3 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              How did I do this month?
            </h3>

            <div className="font-mono text-3xl font-black text-primary font-tnum">
              {story.overallRate}%
              <span className="text-xs font-normal text-on-surface-variant ml-1.5 font-sans">
                flow rate
              </span>
            </div>

            <p className="font-body-text text-xs text-on-surface leading-relaxed">
              {story.performanceStory}
            </p>
          </div>

          <div className="pt-2 border-t border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between relative z-10">
            <span>Logged Checks:</span>
            <strong className="font-mono font-bold text-on-surface font-tnum">
              {story.totalChecks} checks
            </strong>
          </div>
        </div>

        {/* Card 2: Where Did I Stumble? */}
        <div className="japandi-card bg-surface-container-lowest dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-amber-500/25 shadow-soft relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-stat-label font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/15">
                Friction Analysis
              </span>
              <span className="text-2xl">🧭</span>
            </div>

            <h3 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              Where did I stumble?
            </h3>

            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {story.frictionHeadline}
            </div>

            <p className="font-body-text text-xs text-on-surface leading-relaxed">
              {story.frictionStory}
            </p>
          </div>

          <div className="pt-2.5 border-t border-outline-variant/15 text-[10.5px] text-on-surface-variant bg-surface-container-low/50 dark:bg-surface-container-high/30 p-2.5 rounded-xl leading-relaxed relative z-10">
            <strong className="text-primary block font-stat-label uppercase tracking-wider text-[9.5px] mb-0.5">
              Compassionate Remedy:
            </strong>
            <span>{story.frictionRemedy}</span>
          </div>
        </div>

        {/* Card 3: What's My Next Milestone? */}
        <div className="japandi-card bg-surface-container-lowest dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-teal-500/25 shadow-soft relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-stat-label font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 px-2.5 py-0.5 rounded-full bg-teal-500/15">
                Next Target
              </span>
              <span className="text-2xl">🎯</span>
            </div>

            <h3 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              What's my next milestone?
            </h3>

            <div className="text-xs font-bold text-teal-700 dark:text-teal-300">
              {story.milestoneHeadline}
            </div>

            <p className="font-body-text text-xs text-on-surface leading-relaxed">
              {story.milestoneStory}
            </p>
          </div>

          <div className="pt-2.5 border-t border-outline-variant/15 text-[10.5px] text-on-surface-variant bg-surface-container-low/50 dark:bg-surface-container-high/30 p-2.5 rounded-xl leading-relaxed relative z-10">
            <strong className="text-teal-700 dark:text-teal-300 block font-stat-label uppercase tracking-wider text-[9.5px] mb-0.5">
              Next Action:
            </strong>
            <span>{story.milestoneAction}</span>
          </div>
        </div>
      </div>

      {/* Switch to Analytics CTA Bar */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-stone-800/60 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">bar_chart</span>
          <span>Want granular numbers, Catmull-Rom curves, and heatmaps?</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMilestoneCard && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenMilestoneCard();
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-all cursor-pointer"
            >
              Share Story
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSwitchToAnalytics();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold shadow-soft hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Explore Deep Analytics</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
