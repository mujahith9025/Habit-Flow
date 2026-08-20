import React, { useState, useEffect } from 'react';
import { Habit, HabitMood } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface DailyHabitNoteModalProps {
  isOpen: boolean;
  habit: Habit | null;
  dateKey: string;
  initialNote?: string;
  initialMood?: HabitMood;
  initialTags?: string[];
  onClose: () => void;
  onSave: (habitId: string, dateKey: string, note: string, mood?: string, tags?: string[]) => Promise<void>;
}

const MOOD_OPTIONS: Array<{ value: HabitMood; emoji: string; label: string; bg: string }> = [
  { value: 'energized', emoji: '⚡', label: 'Energized', bg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300' },
  { value: 'calm', emoji: '🧘', label: 'Calm', bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300' },
  { value: 'focused', emoji: '🎯', label: 'Deep Focus', bg: 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300' },
  { value: 'proud', emoji: '💪', label: 'Proud', bg: 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300' },
  { value: 'tired', emoji: '😴', label: 'Low Energy', bg: 'bg-slate-500/15 border-slate-500/40 text-slate-600 dark:text-slate-300' },
];

const PRESET_TAGS = [
  '#Consistent',
  '#MorningWin',
  '#ProudMoment',
  '#OvercameResistance',
  '#EasyFlow',
  '#Grateful',
];

export const DailyHabitNoteModal: React.FC<DailyHabitNoteModalProps> = ({
  isOpen,
  habit,
  dateKey,
  initialNote = '',
  initialMood,
  initialTags = [],
  onClose,
  onSave,
}) => {
  const [note, setNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<HabitMood | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote || '');
      setSelectedMood(initialMood);
      setSelectedTags(initialTags || []);
    }
  }, [isOpen, initialNote, initialMood, initialTags]);

  if (!isOpen || !habit) return null;

  const handleToggleTag = (tag: string) => {
    triggerHaptic('light');
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectMood = (mood: HabitMood) => {
    triggerHaptic('light');
    setSelectedMood((prev) => (prev === mood ? undefined : mood));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      triggerHaptic('medium');
      await onSave(habit.id, dateKey, note, selectedMood, selectedTags);
      onClose();
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSaving(true);
      triggerHaptic('light');
      await onSave(habit.id, dateKey, '', undefined, []);
      onClose();
    } catch (err) {
      console.error('Failed to clear reflection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Format readable date
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-2xl border border-outline-variant/20 p-5 sm:p-6 space-y-4.5 z-10 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-soft"
              style={{ backgroundColor: habit.color || '#006398' }}
            >
              <span className="material-symbols-outlined text-[22px]">{habit.icon || 'energy_savings_leaf'}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface truncate">
                {habit.name}
              </h3>
              <p className="font-stat-label text-[11px] text-on-surface-variant">
                Daily Reflection • {formattedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 1-Tap Mood / Energy Feeling */}
        <div className="space-y-1.5">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            How did this habit feel?
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_OPTIONS.map((item) => {
              const isSelected = selectedMood === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelectMood(item.value)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-90 ${
                    isSelected
                      ? `${item.bg} border-current shadow-xs font-bold ring-2 ring-primary/40`
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="text-lg leading-none">{item.emoji}</span>
                  <span className="text-[9px] font-stat-label truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Tag Chips */}
        <div className="space-y-1.5">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            Quick Reflection Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`text-[11px] font-stat-label px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Free-form Note Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Daily Note & Breakthrough
            </label>
            <span className="text-[10px] font-stat-label text-on-surface-variant">
              {note.length}/280
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="Jot down quick thoughts, progress, gratitude, or obstacles (e.g. 5km run felt easy, was in the zone!)..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {(initialNote || initialMood || initialTags.length > 0) ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl text-xs font-semibold font-stat-label text-error hover:bg-error-container/20 transition-colors"
            >
              Clear Note
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-stat-label text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-stat-label text-xs font-bold hover:bg-primary/90 transition-all shadow-soft flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">done</span>
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
