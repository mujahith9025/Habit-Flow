import React, { useState } from 'react';
import { Achievement, AchievementTier } from '../../types';
import { useAchievements } from '../../hooks/useAchievements';

interface AchievementsShelfProps {
  className?: string;
}

const TIER_STYLES: Record<
  AchievementTier,
  { border: string; bg: string; badge: string; text: string; glow: string }
> = {
  bronze: {
    border: 'border-amber-700/40 dark:border-amber-600/40',
    bg: 'bg-amber-950/10 dark:bg-amber-900/20',
    badge: 'bg-amber-800/20 text-amber-800 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(180,83,9,0.15)]',
  },
  silver: {
    border: 'border-slate-400/40 dark:border-slate-500/40',
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    badge: 'bg-slate-600/20 text-slate-700 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-300',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.2)]',
  },
  gold: {
    border: 'border-yellow-500/50 dark:border-yellow-400/50',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    badge: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
    text: 'text-yellow-600 dark:text-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.25)]',
  },
  diamond: {
    border: 'border-cyan-500/50 dark:border-cyan-400/50',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300',
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.3)]',
  },
};

export const AchievementsShelf: React.FC<AchievementsShelfProps> = ({ className = '' }) => {
  const { achievements, unlockedCount, totalCount, completionPercentage } = useAchievements();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  const displayed = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <section className={`space-y-4 ${className}`}>
      {/* Header with Title & Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Milestones & Achievements
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
            Unlock trophies as you build gentle consistency and break records
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant/20 shadow-xs self-start sm:self-auto">
          <span className="text-xs font-bold text-primary dark:text-primary-fixed-dim font-stat-label">
            {unlockedCount} / {totalCount} Unlocked ({completionPercentage}%)
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 p-4 sm:p-6 space-y-5">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-stat-label">
            <span className="text-on-surface-variant font-medium">Trophy Completion</span>
            <span className="font-bold text-primary dark:text-primary-fixed-dim">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-outline-variant/15">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-amber-500 rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${Math.max(4, completionPercentage)}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 border-b border-outline-variant/10 pb-3">
          {(['all', 'unlocked', 'locked'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize transition-all duration-150 ${
                filter === tab
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'all' ? `All (${totalCount})` : tab === 'unlocked' ? `Unlocked (${unlockedCount})` : `Locked (${totalCount - unlockedCount})`}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {displayed.map((badge) => {
            const style = TIER_STYLES[badge.tier];
            const progressPercent = Math.min(100, Math.round((badge.current / badge.target) * 100));

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden flex flex-col justify-between ${
                  badge.unlocked
                    ? `${style.bg} ${style.border} ${style.glow} hover:scale-[1.02]`
                    : 'bg-surface-container-low/40 dark:bg-surface-container-high/20 border-outline-variant/20 hover:border-outline-variant/40 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Badge Card Header */}
                <div className="flex items-start gap-3">
                  {/* Icon Avatar */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform ${
                      badge.unlocked
                        ? 'bg-surface-container-lowest dark:bg-surface-container shadow-soft ring-2 ring-primary/30'
                        : 'bg-surface-container text-on-surface-variant/40'
                    }`}
                  >
                    {badge.unlocked ? (
                      <span>{badge.badgeEmoji}</span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60">
                        lock
                      </span>
                    )}
                  </div>

                  {/* Title & Tier Badge */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`font-habit-name text-xs sm:text-sm font-bold truncate ${
                          badge.unlocked ? 'text-on-surface' : 'text-on-surface-variant'
                        }`}
                      >
                        {badge.title}
                      </h4>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-stat-label shrink-0 ${
                          badge.unlocked ? style.badge : 'bg-surface-container text-on-surface-variant/70'
                        }`}
                      >
                        {badge.tier}
                      </span>
                    </div>
                    <p className="font-body-text text-[11px] text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Badge Bottom Progress or Unlocked Timestamp */}
                <div className="mt-3 pt-2.5 border-t border-outline-variant/10 text-[10px] font-stat-label">
                  {badge.unlocked ? (
                    <div className="flex items-center justify-between text-secondary dark:text-secondary-fixed font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Completed</span>
                      </span>
                      {badge.unlockedAt && (
                        <span className="text-on-surface-variant font-normal">{badge.unlockedAt}</span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Progress</span>
                        <span className="font-bold">
                          {badge.current} / {badge.target}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Modal Popup when tapping a badge */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-2xl border border-outline-variant/20 p-6 space-y-4 z-10 animate-scaleUp text-center">
            {/* Big Badge Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-4xl shadow-soft ring-4 ring-primary/20">
              {selectedBadge.unlocked ? selectedBadge.badgeEmoji : '🔒'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-stat-label ${TIER_STYLES[selectedBadge.tier].badge}`}>
                  {selectedBadge.tier} Tier
                </span>
                {selectedBadge.unlocked && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-stat-label">
                    Unlocked
                  </span>
                )}
              </div>
              <h3 className="font-section-header text-lg font-bold text-on-surface">
                {selectedBadge.title}
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                {selectedBadge.description}
              </p>
            </div>

            {/* Progress / Status */}
            <div className="bg-surface-container-low dark:bg-surface-container-high/40 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between font-stat-label text-on-surface">
                <span>Required Target:</span>
                <span className="font-bold">{selectedBadge.target}</span>
              </div>
              <div className="flex justify-between font-stat-label text-on-surface">
                <span>Current Progress:</span>
                <span className="font-bold">{selectedBadge.current}</span>
              </div>
              {selectedBadge.unlockedAt && (
                <div className="flex justify-between font-stat-label text-secondary dark:text-secondary-fixed pt-1 border-t border-outline-variant/15">
                  <span>Unlocked Date:</span>
                  <span className="font-bold">{selectedBadge.unlockedAt}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-stat-label text-xs font-bold hover:bg-primary/90 transition-colors shadow-soft"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
