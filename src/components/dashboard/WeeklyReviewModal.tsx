import React, { useState, useMemo } from 'react';
import { Habit, HabitEntry } from '../../types';
import { formatDateKey } from '../../hooks/useDashboardMetrics';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { triggerHaptic } from '../../utils/haptics';
import { triggerMilestoneCelebration } from '../../utils/confetti';
import { playCelebrationChime } from '../../utils/zenAudio';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  entriesByHabit: Record<string, Record<string, HabitEntry>>;
  onSaveReflection?: (reflection: string, mood: string) => Promise<void>;
}

const WEEKLY_FEELINGS = [
  { label: 'Peaceful', emoji: '🧘' },
  { label: 'Grateful', emoji: '✨' },
  { label: 'Productive', emoji: '🚀' },
  { label: 'Balanced', emoji: '⚖️' },
  { label: 'Growing', emoji: '🌱' },
];

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  habits,
  entriesByHabit,
  onSaveReflection,
}) => {
  const [reflection, setReflection] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('Grateful');
  const [isSaved, setIsSaved] = useState(false);

  // Compute 7-day week performance metrics (Monday to Sunday)
  const weekStats = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays: Array<{ date: Date; dateKey: string; dayName: string }> = [];
    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        date: d,
        dateKey: formatDateKey(d),
        dayName: DAY_NAMES[i],
      });
    }

    const activeHabits = habits.filter((h) => !h.archived);
    let totalCompletions = 0;
    const possibleCompletions = activeHabits.length * 7;
    const dayCompletions: Record<string, number> = {};
    const habitCompletions: Record<string, number> = {};

    weekDays.forEach((day) => {
      let countForDay = 0;
      activeHabits.forEach((h) => {
        if (entriesByHabit[h.id]?.[day.dateKey]?.completed) {
          totalCompletions++;
          countForDay++;
          habitCompletions[h.id] = (habitCompletions[h.id] || 0) + 1;
        }
      });
      dayCompletions[day.dayName] = countForDay;
    });

    const completionRate =
      possibleCompletions > 0 ? Math.round((totalCompletions / possibleCompletions) * 100) : 0;

    // Best performing day
    let peakDay = 'Wednesday';
    let maxDayCount = -1;
    Object.entries(dayCompletions).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = day;
      }
    });

    // Top habit of the week
    let topHabitName = activeHabits[0]?.name || 'Daily Focus';
    let maxHabitCount = -1;
    Object.entries(habitCompletions).forEach(([hId, count]) => {
      if (count > maxHabitCount) {
        maxHabitCount = count;
        const found = activeHabits.find((h) => h.id === hId);
        if (found) topHabitName = found.name;
      }
    });

    const startDateStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endDateStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      startDateStr,
      endDateStr,
      totalCompletions,
      completionRate,
      peakDay,
      topHabitName,
      maxHabitCount: Math.max(0, maxHabitCount),
    };
  }, [habits, entriesByHabit]);

  const handleSave = async () => {
    triggerHaptic('ripple');
    playCelebrationChime();
    triggerMilestoneCelebration();

    // Persist weekly review in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('habitflow_weekly_reviews') || '[]');
      stored.unshift({
        date: formatDateKey(new Date()),
        weekRange: `${weekStats.startDateStr} – ${weekStats.endDateStr}`,
        completions: weekStats.totalCompletions,
        rate: weekStats.completionRate,
        feeling: selectedFeeling,
        reflection: reflection.trim(),
      });
      localStorage.setItem('habitflow_weekly_reviews', JSON.stringify(stored.slice(0, 52)));
      await onSaveReflection?.(reflection.trim(), selectedFeeling);
    } catch (e) {
      console.debug('Failed to save weekly review locally', e);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1800);
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">self_improvement</span>
          </div>
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Weekly Mindful Review
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              {weekStats.startDateStr} – {weekStats.endDateStr} • Gentle Persistence Recap
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Weekly Achievement Metric Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
            <span className="font-app-title text-xl font-extrabold text-primary block">
              {weekStats.totalCompletions}
            </span>
            <span className="text-[10px] font-stat-label text-on-surface-variant uppercase font-bold">
              Check-ins
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
            <span className="font-app-title text-xl font-extrabold text-secondary block">
              {weekStats.completionRate}%
            </span>
            <span className="text-[10px] font-stat-label text-on-surface-variant uppercase font-bold">
              Consistency
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
            <span className="font-app-title text-xl font-extrabold text-tertiary block truncate">
              {weekStats.peakDay}
            </span>
            <span className="text-[10px] font-stat-label text-on-surface-variant uppercase font-bold">
              Peak Day
            </span>
          </div>
        </div>

        {/* Highlight Callout */}
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="text-xs min-w-0">
            <span className="font-bold text-on-surface block truncate">
              Star Habit: {weekStats.topHabitName}
            </span>
            <span className="text-on-surface-variant">
              Checked off {weekStats.maxHabitCount} times this week without missing a beat.
            </span>
          </div>
        </div>

        {/* 1. Mindful Feeling Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="font-section-header text-xs font-semibold text-on-surface block">
            How does this week feel?
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEKLY_FEELINGS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedFeeling(f.label);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-stat-label font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedFeeling === f.label
                    ? 'bg-secondary text-on-secondary shadow-xs scale-102'
                    : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. One-Sentence Mindful Reflection Input */}
        <div className="space-y-1.5">
          <label className="font-section-header text-xs font-semibold text-on-surface block">
            One-Sentence Mindful Reflection
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What is one small victory or peaceful moment you're grateful for this week? (e.g. Even on busy days, taking 10 minutes to walk kept me grounded)..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Success Confirmation */}
        {isSaved && (
          <div className="p-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Weekly reflection recorded with gentle flow! 🌿</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold font-stat-label text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-soft active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            <span>Complete Review</span>
          </button>
        </div>
      </div>
    </BottomSheetModal>
  );
};
