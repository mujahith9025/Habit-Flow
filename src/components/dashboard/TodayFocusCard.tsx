import React, { useState } from 'react';
import {
  Habit,
  HabitEntry,
  isHabitPausedOnDate,
  isHabitScheduledForDate,
} from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { formatDateKey } from '../../hooks/useDashboardMetrics';
import { triggerHaptic } from '../../utils/haptics';
import { triggerMilestoneCelebration } from '../../utils/confetti';
import {
  playCheckChime,
  playStreakChime,
  playCelebrationChime,
  playNoteChime,
} from '../../utils/zenAudio';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';
import { RadialOrbitGauge } from '../ui/RadialOrbitGauge';
import { SwipeableHabitItem } from './SwipeableHabitItem';
import { DailyHabitNoteModal } from './DailyHabitNoteModal';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { ZenTimerModal } from './ZenTimerModal';
import { VacationPauseModal } from './VacationPauseModal';

interface TodayFocusCardProps {
  habits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  categoryName?: string;
  entriesByHabit?: Record<string, Record<string, HabitEntry>>;
  getHabitEntry?: (habitId: string, dateKey: string) => HabitEntry | undefined;
  onToggleEntry: (habitId: string, dateKey: string) => Promise<void>;
  onUpdateValue?: (
    habitId: string,
    dateKey: string,
    newValue: number,
    timerSecondsElapsed?: number
  ) => Promise<void>;
  onTogglePause?: (
    habitId: string,
    isPaused: boolean,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
  onBatchCompleteToday?: (habitIds: string[]) => Promise<void>;
  onBatchResetToday?: (habitIds: string[]) => Promise<void>;
  onSaveNote?: (
    habitId: string,
    dateKey: string,
    note: string,
    mood?: string,
    tags?: string[]
  ) => Promise<void>;
  onAddNewHabit?: () => void;
  className?: string;
}

export const TodayFocusCard: React.FC<TodayFocusCardProps> = ({
  habits,
  habitMetricsMap,
  isCompleted,
  categoryName,
  entriesByHabit = {},
  getHabitEntry,
  onToggleEntry,
  onUpdateValue,
  onTogglePause,
  onBatchCompleteToday,
  onBatchResetToday,
  onSaveNote,
  onAddNewHabit,
  className = '',
}) => {
  const today = new Date();
  const todayDateKey = formatDateKey(today);

  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [lastBatchCompletedIds, setLastBatchCompletedIds] = useState<string[]>([]);
  const [noteHabit, setNoteHabit] = useState<Habit | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);

  // Advanced state: Zen Timer, Vacation Pause, Tags, Rituals
  const [timerHabit, setTimerHabit] = useState<Habit | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedRitual, setSelectedRitual] = useState<
    'all' | 'morning' | 'afternoon' | 'evening'
  >('all');
  const [filterMode, setFilterMode] = useState<'all' | 'remaining'>(() => {
    return (
      (localStorage.getItem('habitflow_today_filter') as 'all' | 'remaining') ||
      'all'
    );
  });

  // Time-aware ritual slot detection
  const currentHour = today.getHours();
  const activeRitualSlot: 'morning' | 'afternoon' | 'evening' =
    currentHour >= 5 && currentHour < 12
      ? 'morning'
      : currentHour >= 12 && currentHour < 17
      ? 'afternoon'
      : 'evening';

  const handleSetFilterMode = (mode: 'all' | 'remaining') => {
    setFilterMode(mode);
    localStorage.setItem('habitflow_today_filter', mode);
    triggerHaptic('selection');
  };

  const handleSelectRitual = (
    slot: 'all' | 'morning' | 'afternoon' | 'evening'
  ) => {
    setSelectedRitual(slot);
    triggerHaptic('selection');
  };

  const handleOpenNote = (habit: Habit) => {
    setNoteHabit(habit);
    setIsNoteModalOpen(true);
    playNoteChime();
  };

  const handleOpenTimer = (habit: Habit) => {
    setTimerHabit(habit);
    setIsTimerModalOpen(true);
  };

  const activeHabits = habits.filter((h) => !h.archived);

  // Extract all unique tags across active habits
  const allTags = Array.from(
    new Set(activeHabits.flatMap((h) => h.tags || []))
  ).filter(Boolean);

  // Vacation paused habits check
  const pausedHabits = activeHabits.filter((h) => isHabitPausedOnDate(h, today));

  // Compute completed count for today
  let completedCount = 0;
  activeHabits.forEach((h) => {
    if (isCompleted(h.id, todayDateKey)) {
      completedCount++;
    }
  });

  const totalCount = activeHabits.length;
  const remainingCount = totalCount - completedCount;
  const percentDone =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Filter by ritual bundle
  const ritualFilteredHabits = activeHabits.filter((h) => {
    if (selectedRitual === 'all') return true;
    const slot = h.timeOfDay || 'anytime';
    return slot === selectedRitual || slot === 'anytime';
  });

  // Filter by tag
  const tagFilteredHabits = ritualFilteredHabits.filter((h) => {
    if (!selectedTag) return true;
    return h.tags?.includes(selectedTag);
  });

  // Filter by remaining vs all
  const displayedHabits = tagFilteredHabits.filter((h) => {
    if (filterMode === 'remaining') {
      return !isCompleted(h.id, todayDateKey);
    }
    return true;
  });

  // "Never Miss Twice" Grace Days check
  const protectedHabits = activeHabits.filter(
    (h) => habitMetricsMap[h.id]?.isShieldActive
  );
  const isSundayOrMonday = today.getDay() === 0 || today.getDay() === 1;

  const handleToggle = async (habitId: string) => {
    const isCurrentlyDone = isCompleted(habitId, todayDateKey);

    if (!isCurrentlyDone) {
      const hitsAllDone = completedCount + 1 === totalCount;
      const currentStreak = habitMetricsMap[habitId]?.streakCount ?? 0;

      if (hitsAllDone) {
        triggerHaptic('ripple');
        playCelebrationChime();
        setTimeout(() => {
          triggerMilestoneCelebration();
        }, 150);
      } else if (currentStreak > 0) {
        triggerHaptic('double');
        playStreakChime();
      } else {
        triggerHaptic('tick');
        playCheckChime();
      }
    } else {
      triggerHaptic('medium');
    }

    await onToggleEntry(habitId, todayDateKey);
  };

  // 1-Tap Finish All Today
  const handleQuickFinishAll = async () => {
    if (isBatchProcessing || remainingCount <= 0) return;

    const pendingHabitIds = activeHabits
      .filter((h) => !isCompleted(h.id, todayDateKey))
      .map((h) => h.id);

    if (pendingHabitIds.length === 0) return;

    setIsBatchProcessing(true);
    triggerHaptic('success');
    triggerMilestoneCelebration();

    setLastBatchCompletedIds(pendingHabitIds);

    try {
      if (onBatchCompleteToday) {
        await onBatchCompleteToday(pendingHabitIds);
      } else {
        await Promise.all(
          pendingHabitIds.map((id) => onToggleEntry(id, todayDateKey))
        );
      }
      setShowUndoBanner(true);
      setTimeout(() => {
        setShowUndoBanner(false);
      }, 6000);
    } catch (err) {
      console.error('Failed to quick finish all today:', err);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Undo Quick Finish All
  const handleUndoQuickFinishAll = async () => {
    if (lastBatchCompletedIds.length === 0) return;

    setIsBatchProcessing(true);
    triggerHaptic('medium');
    setShowUndoBanner(false);

    try {
      if (onBatchResetToday) {
        await onBatchResetToday(lastBatchCompletedIds);
      } else {
        await Promise.all(
          lastBatchCompletedIds.map((id) => onToggleEntry(id, todayDateKey))
        );
      }
      setLastBatchCompletedIds([]);
    } catch (err) {
      console.error('Failed to undo quick finish all:', err);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container-lowest shadow-soft border border-outline-variant/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden min-h-[220px] transition-all duration-300 ${className}`}
    >
      {/* Decorative background accent */}
      <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header with Quick Finish All & Vacation Pause Trigger */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
              Today's Tasks {categoryName ? `• ${categoryName}` : ''}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Vacation Pause Trigger */}
            <button
              type="button"
              onClick={() => setIsVacationModalOpen(true)}
              title="Pause habits for vacation or travel"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant text-[11px] font-semibold hover:text-on-surface transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">beach_access</span>
              <span className="hidden xs:inline">Pause</span>
            </button>

            {/* Quick Finish All Today Button */}
            {!allDone && totalCount > 0 && remainingCount > 0 && (
              <button
                type="button"
                onClick={handleQuickFinishAll}
                disabled={isBatchProcessing}
                title={`Mark all ${remainingCount} remaining habits in ${categoryName || 'this board'} as done for today`}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold font-stat-label shadow-soft hover:scale-102 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  done_all
                </span>
                <span>Finish All ({remainingCount})</span>
              </button>
            )}

            {/* Progress Pill & Compact Radial Orbit */}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5">
                <RadialOrbitGauge
                  percentage={percentDone}
                  size={26}
                  strokeWidth={3}
                  showOrbitMarker={false}
                  showValue={false}
                  gradientColors={['#2D5A34', '#52995D', '#88C490']}
                  trackColor="rgba(45, 90, 52, 0.15)"
                />
                <span
                  className={`text-[11px] font-stat-label font-bold px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                    allDone
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-low dark:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {allDone && (
                    <span className="material-symbols-outlined text-[13px]">
                      verified
                    </span>
                  )}
                  {completedCount}/{totalCount} ({percentDone}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Temporary Undo Banner */}
        {showUndoBanner && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-secondary-container/90 text-on-secondary-container text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <span>🎉 All {categoryName ? `${categoryName} ` : ''}habits checked off for today!</span>
            </span>
            <button
              type="button"
              onClick={handleUndoQuickFinishAll}
              className="px-2.5 py-0.5 rounded-lg bg-surface-container-lowest dark:bg-surface-container text-primary font-bold hover:underline text-[11px] shadow-xs active:scale-90 transition-all cursor-pointer"
            >
              Undo
            </button>
          </div>
        )}

        {/* Vacation Paused Habits Active Banner */}
        {pausedHabits.length > 0 && (
          <div className="mb-2.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">
                beach_access
              </span>
              <p className="text-[11px] font-medium leading-tight">
                <span className="font-bold">{pausedHabits.length} habit(s) paused:</span> Streaks are safely frozen and protected.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVacationModalOpen(true)}
              className="px-2 py-0.5 rounded-md bg-surface-container-lowest dark:bg-surface-container text-primary text-[10px] font-bold hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>
        )}

        {/* "Never Miss Twice" Grace Day Streak Protection Banner */}
        {protectedHabits.length > 0 && (
          <div className="mb-2.5 px-3.5 py-2 rounded-2xl bg-secondary-container/40 border border-secondary/25 text-on-secondary-container flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                shield
              </span>
              <div>
                <p className="font-semibold text-[11px] leading-tight">
                  <span className="font-bold">Never Miss Twice Shield:</span> {protectedHabits[0].name} missed yesterday, but your streak is protected! Complete it today to keep the flow.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold shrink-0">
              Shielded
            </span>
          </div>
        )}

        {/* Sunday/Monday Weekly Mindful Review Banner */}
        {isSundayOrMonday && (
          <div className="mb-2.5 px-3.5 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-on-surface flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                auto_stories
              </span>
              <p className="text-[11px] text-on-surface font-medium leading-tight">
                <span className="font-bold text-primary">Weekly Review:</span> Reflect on this week's momentum and mindful wins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWeeklyReviewOpen(true)}
              className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold hover:scale-102 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Review ↗
            </button>
          </div>
        )}

        {/* Time-Aware Ritual Bundles & Tags Filter Bar */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-1">
            {/* Rituals */}
            {[
              { id: 'all', label: 'All', icon: 'apps' },
              { id: 'morning', label: 'Morning', icon: 'wb_sunny' },
              { id: 'afternoon', label: 'Afternoon', icon: 'light_mode' },
              { id: 'evening', label: 'Evening', icon: 'bedtime' },
            ].map((slot) => {
              const isSelected = selectedRitual === slot.id && !selectedTag;
              const isCurrentTimeSlot = slot.id === activeRitualSlot;
              const count = activeHabits.filter((h) => {
                if (slot.id === 'all') return true;
                const hSlot = h.timeOfDay || 'anytime';
                return hSlot === slot.id || hSlot === 'anytime';
              }).length;

              if (slot.id !== 'all' && count === 0) return null;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setSelectedTag(null);
                    handleSelectRitual(slot.id as any);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{slot.icon}</span>
                  <span>{slot.label}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-variant/40'
                    }`}
                  >
                    {count}
                  </span>
                  {isCurrentTimeSlot && slot.id !== 'all' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"
                      title="Active ritual right now"
                    />
                  )}
                </button>
              );
            })}

            {/* Custom Hashtags Chips */}
            {allTags.map((tag) => {
              const isTagSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTag(isTagSelected ? null : tag);
                  }}
                  className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isTagSelected
                      ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Habit Checklist or Empty State */}
        {totalCount === 0 ? (
          <div className="py-6 text-center space-y-2.5">
            <div className="flex justify-center">
              <HabitFlowLogo size={36} />
            </div>
            <p className="font-body-text text-xs text-on-surface-variant">
              No habits in {categoryName ? `"${categoryName}"` : 'this board'} yet.
            </p>
            {onAddNewHabit && (
              <button
                type="button"
                onClick={onAddNewHabit}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add your first habit</span>
              </button>
            )}
          </div>
        ) : filterMode === 'remaining' && displayedHabits.length === 0 ? (
          <div className="py-6 text-center space-y-2 bg-surface-container-low/40 dark:bg-surface-container-low/20 rounded-2xl border border-outline-variant/20 p-4 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-secondary-container/40 text-secondary mx-auto flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                task_alt
              </span>
            </div>
            <p className="font-section-header text-xs font-bold text-on-surface">
              All tasks checked off for today!
            </p>
            <p className="font-body-text text-[11px] text-on-surface-variant max-w-xs mx-auto">
              Every habit in {categoryName || 'this board'} is completed.
            </p>
            <button
              type="button"
              onClick={() => handleSetFilterMode('all')}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Show all completed habits ({totalCount})</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[195px] overflow-y-auto scrollbar-thin pr-1">
            {displayedHabits.map((habit) => {
              const done = isCompleted(habit.id, todayDateKey);
              const metrics = habitMetricsMap[habit.id];
              const streak = metrics?.streakCount ?? 0;
              const isShieldActive = metrics?.isShieldActive;
              const entry = getHabitEntry?.(habit.id, todayDateKey);
              const hasNote = Boolean(
                entry?.note || entry?.mood || (entry?.tags && entry.tags.length > 0)
              );
              const currentValue = entry?.currentValue ?? 0;
              const timerSecondsElapsed = entry?.timerSecondsElapsed ?? 0;
              const isRestDay = !isHabitScheduledForDate(habit, today);
              const isPaused = isHabitPausedOnDate(habit, today);

              return (
                <SwipeableHabitItem
                  key={habit.id}
                  habit={habit}
                  done={done}
                  streak={streak}
                  currentValue={currentValue}
                  timerSecondsElapsed={timerSecondsElapsed}
                  isRestDay={isRestDay}
                  isPaused={isPaused}
                  isShieldActive={isShieldActive}
                  hasNote={hasNote}
                  onToggle={() => handleToggle(habit.id)}
                  onOpenNote={() => handleOpenNote(habit)}
                  onUpdateValue={async (val) => {
                    if (onUpdateValue) {
                      await onUpdateValue(habit.id, todayDateKey, val);
                    }
                  }}
                  onOpenTimer={() => handleOpenTimer(habit)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer: Status Banner */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-xs">
        {allDone ? (
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold bg-[#E8EFE8] dark:bg-[#1E2E20] px-3 py-1 rounded-full border border-emerald-500/20 animate-fadeIn text-xs">
            <span className="material-symbols-outlined text-[16px] text-emerald-700 dark:text-emerald-400">
              spa
            </span>
            <span>All done for today. Rest well ᵕ̈</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="hidden sm:inline">
              Tap or swipe right to check-in • Swipe left for reflection note
            </span>
            <span className="sm:hidden">Swipe right to check-in • Left for note</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-on-surface-variant italic font-body-text hidden xs:inline">
            Better than yesterday ↗
          </span>
          <span className="font-stat-label text-[10px] text-on-surface-variant uppercase font-bold">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Swipe Left Reflection Note Bottom Sheet Modal */}
      <DailyHabitNoteModal
        isOpen={isNoteModalOpen}
        habit={noteHabit}
        dateKey={todayDateKey}
        initialNote={
          noteHabit ? getHabitEntry?.(noteHabit.id, todayDateKey)?.note : ''
        }
        initialMood={
          noteHabit ? getHabitEntry?.(noteHabit.id, todayDateKey)?.mood : undefined
        }
        initialTags={
          noteHabit ? getHabitEntry?.(noteHabit.id, todayDateKey)?.tags : []
        }
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteHabit(null);
        }}
        onSave={async (habitId, dateKey, note, mood, tags) => {
          if (onSaveNote) {
            await onSaveNote(habitId, dateKey, note, mood, tags);
            playCheckChime();
          }
          setIsNoteModalOpen(false);
          setNoteHabit(null);
        }}
      />

      {/* Zen Timer & Pomodoro Bottom Sheet Modal */}
      <ZenTimerModal
        isOpen={isTimerModalOpen}
        habit={timerHabit}
        dateKey={todayDateKey}
        initialElapsedSeconds={
          timerHabit
            ? getHabitEntry?.(timerHabit.id, todayDateKey)?.timerSecondsElapsed ?? 0
            : 0
        }
        onClose={() => {
          setIsTimerModalOpen(false);
          setTimerHabit(null);
        }}
        onComplete={async (habitId, dateKey, elapsedSeconds) => {
          if (onUpdateValue) {
            const elapsedMins = Math.ceil(elapsedSeconds / 60);
            await onUpdateValue(habitId, dateKey, elapsedMins, elapsedSeconds);
          }
          setIsTimerModalOpen(false);
          setTimerHabit(null);
        }}
      />

      {/* Vacation & Travel Pause Bottom Sheet Modal */}
      <VacationPauseModal
        isOpen={isVacationModalOpen}
        habits={habits}
        onClose={() => setIsVacationModalOpen(false)}
        onPauseHabit={async (habitId, isPaused, reason, start, end) => {
          if (onTogglePause) {
            await onTogglePause(habitId, isPaused, reason, start, end);
          }
          setIsVacationModalOpen(false);
        }}
        onPauseAllHabits={async (isPaused, reason, start, end) => {
          if (onTogglePause) {
            await Promise.all(
              activeHabits.map((h) =>
                onTogglePause(h.id, isPaused, reason, start, end)
              )
            );
          }
          setIsVacationModalOpen(false);
        }}
      />

      {/* Sunday Mindful Weekly Review Bottom Sheet */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        habits={habits}
        entriesByHabit={entriesByHabit}
        onClose={() => setIsWeeklyReviewOpen(false)}
      />
    </div>
  );
};
