import React, { useState } from 'react';
import { Habit } from '../../types';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { Button } from '../ui/Button';
import { triggerHaptic } from '../../utils/haptics';
import { playCheckChime } from '../../utils/zenAudio';

interface VacationPauseModalProps {
  isOpen: boolean;
  habits: Habit[];
  activeHabit?: Habit | null;
  onClose: () => void;
  onPauseHabit: (
    habitId: string,
    isPaused: boolean,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
  onPauseAllHabits?: (
    isPaused: boolean,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
}

const REASON_OPTIONS = [
  { label: '🌴 Vacation', value: 'Vacation' },
  { label: '✈️ Travel', value: 'Travel' },
  { label: '💊 Recovery / Illness', value: 'Recovery' },
  { label: '🧘 Rest & Reset', value: 'Rest' },
];

export const VacationPauseModal: React.FC<VacationPauseModalProps> = ({
  isOpen,
  habits,
  activeHabit,
  onClose,
  onPauseHabit,
  onPauseAllHabits,
}) => {
  const [scope, setScope] = useState<'single' | 'all'>('single');
  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    activeHabit?.id || habits[0]?.id || ''
  );
  const [reason, setReason] = useState('Vacation');
  const [durationDays, setDurationDays] = useState<number | 'manual'>(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHabit = habits.find((h) => h.id === selectedHabitId) || activeHabit;
  const isCurrentlyPaused = currentHabit?.isPaused ?? false;

  const handleApplyPause = async (pauseState: boolean) => {
    setIsSubmitting(true);
    triggerHaptic('success');
    playCheckChime();

    try {
      const today = new Date();
      const startDate = today.toISOString().slice(0, 10);
      let endDate: string | undefined = undefined;

      if (pauseState && typeof durationDays === 'number') {
        const end = new Date(today);
        end.setDate(end.getDate() + durationDays);
        endDate = end.toISOString().slice(0, 10);
      }

      if (scope === 'all' && onPauseAllHabits) {
        await onPauseAllHabits(pauseState, reason, startDate, endDate);
      } else if (currentHabit) {
        await onPauseHabit(currentHabit.id, pauseState, reason, startDate, endDate);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update vacation pause:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Vacation & Travel Pause"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm select-none">
        {/* Psychological Momentum Banner */}
        <div className="p-3.5 rounded-2xl bg-secondary-container/40 border border-secondary/30 text-on-secondary-container flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">
            beach_access
          </span>
          <div>
            <p className="font-semibold text-xs leading-snug">
              <span className="font-bold">Streak Freeze Active:</span> Pausing habits preserves your historical consistency. Missed days during your break will not reset your hard-earned streaks.
            </p>
          </div>
        </div>

        {/* Scope Selector: Single Habit vs All Habits */}
        <div>
          <label className="block text-[11px] font-stat-label font-bold text-on-surface-variant uppercase mb-1.5">
            Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setScope('single');
              }}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                scope === 'single'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              Single Habit
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setScope('all');
              }}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              All Habits ({habits.length})
            </button>
          </div>
        </div>

        {/* Habit Selector (if single) */}
        {scope === 'single' && (
          <div>
            <label className="block text-[11px] font-stat-label font-bold text-on-surface-variant uppercase mb-1.5">
              Select Habit
            </label>
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.isPaused ? ' (Currently Paused)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason Selector */}
        <div>
          <label className="block text-[11px] font-stat-label font-bold text-on-surface-variant uppercase mb-1.5">
            Reason
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {REASON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setReason(opt.value);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  reason === opt.value
                    ? 'bg-secondary text-on-secondary border-secondary shadow-xs font-bold'
                    : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label className="block text-[11px] font-stat-label font-bold text-on-surface-variant uppercase mb-1.5">
            Pause Duration
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '3 Days', days: 3 },
              { label: '7 Days', days: 7 },
              { label: '14 Days', days: 14 },
              { label: 'Indefinite', days: 'manual' },
            ].map((d) => (
              <button
                key={String(d.days)}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setDurationDays(d.days as any);
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  durationDays === d.days
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                    : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          {isCurrentlyPaused ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleApplyPause(false)}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
            >
              Resume Habit Now ↗
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            disabled={isSubmitting}
            onClick={() => handleApplyPause(true)}
            className="flex-1"
          >
            {isSubmitting ? 'Updating...' : isCurrentlyPaused ? 'Update Pause' : 'Pause & Protect Streak'}
          </Button>
        </div>
      </div>
    </BottomSheetModal>
  );
};
