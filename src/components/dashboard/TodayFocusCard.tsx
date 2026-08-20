import React, { useState } from 'react';
import { Habit, HabitEntry } from '../../types';
import { HabitGridMetrics } from '../../hooks/useDailyHabitsData';
import { formatDateKey } from '../../hooks/useDashboardMetrics';
import { triggerHaptic } from '../../utils/haptics';
import { triggerMilestoneCelebration } from '../../utils/confetti';
import { DailyHabitNoteModal } from './DailyHabitNoteModal';

interface TodayFocusCardProps {
  habits: Habit[];
  habitMetricsMap: Record<string, HabitGridMetrics>;
  isCompleted: (habitId: string, dateKey: string) => boolean;
  getHabitEntry?: (habitId: string, dateKey: string) => HabitEntry | undefined;
  onToggleEntry: (habitId: string, dateKey: string) => Promise<void>;
  onSaveNote?: (habitId: string, dateKey: string, note: string, mood?: string, tags?: string[]) => Promise<void>;
  onAddNewHabit?: () => void;
  className?: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  energized: '⚡',
  calm: '🧘',
  focused: '🎯',
  proud: '💪',
  tired: '😴',
};

export const TodayFocusCard: React.FC<TodayFocusCardProps> = ({
  habits,
  habitMetricsMap,
  isCompleted,
  getHabitEntry,
  onToggleEntry,
  onSaveNote,
  onAddNewHabit,
  className = '',
}) => {
  const today = new Date();
  const todayDateKey = formatDateKey(today);

  const [activeNoteHabit, setActiveNoteHabit] = useState<Habit | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);

  // Compute completed count for today
  let completedCount = 0;
  activeHabits.forEach((h) => {
    if (isCompleted(h.id, todayDateKey)) {
      completedCount++;
    }
  });

  const totalCount = activeHabits.length;
  const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const handleToggle = async (habitId: string) => {
    const isCurrentlyDone = isCompleted(habitId, todayDateKey);
    
    // Tactile haptic feedback
    triggerHaptic(isCurrentlyDone ? 'medium' : 'light');

    // Check if completing this habit hits 100%
    if (!isCurrentlyDone && completedCount + 1 === totalCount) {
      setTimeout(() => {
        triggerMilestoneCelebration();
        triggerHaptic('success');
      }, 150);
    }

    await onToggleEntry(habitId, todayDateKey);
  };

  const handleSaveNote = async (
    habitId: string,
    dateKey: string,
    note: string,
    mood?: string,
    tags?: string[]
  ) => {
    if (onSaveNote) {
      await onSaveNote(habitId, dateKey, note, mood, tags);
    }
  };

  const activeEntry = activeNoteHabit && getHabitEntry ? getHabitEntry(activeNoteHabit.id, todayDateKey) : undefined;

  return (
    <div
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-md sm:p-lg flex flex-col justify-between relative overflow-hidden min-h-[220px] ${className}`}
    >
      {/* Decorative background accent */}
      <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-primary-container/20 dark:bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-stat-label text-xs font-bold text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
              Today's Focus
            </span>
          </div>

          {totalCount > 0 && (
            <span
              className={`text-[11px] font-stat-label font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                allDone
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high dark:bg-surface-container-highest text-on-surface'
              }`}
            >
              {completedCount} of {totalCount} Done ({percentDone}%)
            </span>
          )}
        </div>

        {/* Habit Checklist or Empty State */}
        {totalCount === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="font-body-text text-xs text-on-surface-variant">
              No habits in this tracker board yet.
            </p>
            {onAddNewHabit && (
              <button
                onClick={onAddNewHabit}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add your first habit</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[175px] overflow-y-auto scrollbar-thin pr-1">
            {activeHabits.map((habit) => {
              const done = isCompleted(habit.id, todayDateKey);
              const metrics = habitMetricsMap[habit.id];
              const streak = metrics?.streakCount ?? 0;
              const isShieldActive = metrics?.isShieldActive;
              const entry = getHabitEntry ? getHabitEntry(habit.id, todayDateKey) : undefined;
              const hasNote = Boolean(entry?.note || entry?.mood || (entry?.tags && entry.tags.length > 0));

              return (
                <div
                  key={habit.id}
                  onClick={() => handleToggle(habit.id)}
                  className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
                    done
                      ? 'bg-secondary-container/20 dark:bg-secondary-container/10 border-secondary/30'
                      : 'bg-surface-container-low dark:bg-surface-container-high/30 border-outline-variant/20 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Checkbox + Habit info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Custom 1-tap Checkbox */}
                      <button
                        type="button"
                        aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                          done
                            ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                            : 'border-2 border-outline-variant/50 hover:border-primary bg-surface-container-lowest dark:bg-surface-container'
                        }`}
                      >
                        {done && (
                          <span className="material-symbols-outlined text-[16px] font-bold animate-scaleUp">
                            check
                          </span>
                        )}
                      </button>

                      {/* Habit Name */}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-habit-name text-xs sm:text-sm font-semibold truncate block transition-colors ${
                            done
                              ? 'text-on-surface-variant line-through opacity-80'
                              : 'text-on-surface'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>
                    </div>

                    {/* Right Action Icons: 1-Tap Note Button + Streak Flame */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {/* 1-Tap Note & Reflection Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNoteHabit(habit);
                        }}
                        title={hasNote ? `Reflection logged: "${entry?.note || ''}"` : "Add 1-tap note & reflection"}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                          hasNote
                            ? 'bg-primary/15 text-primary dark:text-primary-fixed ring-1 ring-primary/30 font-bold'
                            : 'text-on-surface-variant/60 hover:text-primary hover:bg-surface-container-high'
                        }`}
                      >
                        {entry?.mood ? (
                          <span className="text-[14px] leading-none">{MOOD_EMOJIS[entry.mood] || '📝'}</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">
                            {hasNote ? 'edit_note' : 'note_add'}
                          </span>
                        )}
                      </button>

                      {/* Streak Flame & Shield badge */}
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[15px] text-tertiary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          local_fire_department
                        </span>
                        <span className="font-stat-label text-xs font-bold text-on-surface">
                          {streak}d
                        </span>
                        {isShieldActive && (
                          <span
                            title="Protected by Streak Shield"
                            className="material-symbols-outlined text-[12px] text-secondary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            shield
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attached Note Preview Snippet (if present) */}
                  {hasNote && (
                    <div className="mt-1.5 pl-9 flex items-center gap-1.5 flex-wrap text-[11px] font-body-text text-on-surface-variant/80">
                      {entry?.mood && (
                        <span className="font-semibold text-primary dark:text-primary-fixed-dim inline-flex items-center gap-0.5">
                          <span>{MOOD_EMOJIS[entry.mood]}</span>
                          <span className="capitalize">{entry.mood}</span>
                        </span>
                      )}
                      {entry?.tags && entry.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-surface-container-high px-1.5 py-0.2 rounded text-on-surface-variant">
                          {t}
                        </span>
                      ))}
                      {entry?.note && (
                        <span className="truncate italic text-[10.5px]">
                          "{entry.note}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer: Status Banner */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-xs">
        {allDone ? (
          <div className="flex items-center gap-1.5 text-secondary dark:text-secondary-fixed font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>All done for today! Calm momentum in motion.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Tap any habit to check-in • 📝 Add reflection</span>
          </div>
        )}

        <span className="font-stat-label text-[10px] text-on-surface-variant uppercase">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* 1-Tap Daily Habit Note Modal */}
      {activeNoteHabit && (
        <DailyHabitNoteModal
          isOpen={Boolean(activeNoteHabit)}
          habit={activeNoteHabit}
          dateKey={todayDateKey}
          initialNote={activeEntry?.note}
          initialMood={activeEntry?.mood}
          initialTags={activeEntry?.tags}
          onClose={() => setActiveNoteHabit(null)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
};
