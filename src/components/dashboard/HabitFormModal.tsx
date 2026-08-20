import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequency } from '../../types';
import { Button } from '../ui/Button';

interface HabitFormModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  defaultCategory?: string;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category?: string;
    frequency: HabitFrequency;
    goalCount: number;
    color: string;
    icon?: string;
  }) => Promise<void>;
  onArchive?: (habitId: string) => Promise<void>;
}

const COLOR_PALETTE = [
  { name: 'Primary Teal', hex: '#006398', bgClass: 'bg-primary' },
  { name: 'Success Green', hex: '#286b33', bgClass: 'bg-secondary' },
  { name: 'Terracotta', hex: '#a03e40', bgClass: 'bg-tertiary' },
  { name: 'Coral', hex: '#ff8e8d', bgClass: 'bg-tertiary-container' },
  { name: 'Sky Blue', hex: '#64b5f6', bgClass: 'bg-primary-container' },
  { name: 'Mint Green', hex: '#abf4ac', bgClass: 'bg-secondary-container' },
];

const PRESET_CATEGORIES = [
  { label: '🎯 Self Challenges', value: 'Self Challenges' },
  { label: '🥗 Diet & Nutrition', value: 'Diet & Nutrition' },
  { label: '🏃 Fitness', value: 'Fitness' },
  { label: '🧘 Mindfulness', value: 'Mindfulness' },
  { label: '📚 Study & Work', value: 'Study & Work' },
  { label: '🌟 General', value: 'General' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  habitToEdit,
  defaultCategory,
  onClose,
  onSave,
  onArchive,
}) => {
  const isEditMode = Boolean(habitToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [goalCount, setGoalCount] = useState(1);
  const [color, setColor] = useState('#006398');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      const initialCat = habitToEdit.category || 'General';
      const isPreset = PRESET_CATEGORIES.some((c) => c.value.toLowerCase() === initialCat.toLowerCase());
      if (isPreset) {
        setCategory(initialCat);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setIsCustomCategory(true);
        setCustomCategory(initialCat);
      }
      setFrequency(habitToEdit.frequency || 'daily');
      setGoalCount(habitToEdit.goalCount || 1);
      setColor(habitToEdit.color || '#006398');
    } else {
      setName('');
      const initialCat = defaultCategory || 'General';
      const isPreset = PRESET_CATEGORIES.some((c) => c.value.toLowerCase() === initialCat.toLowerCase());
      if (isPreset) {
        setCategory(initialCat);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setIsCustomCategory(true);
        setCustomCategory(initialCat);
      }
      setFrequency('daily');
      setGoalCount(1);
      setColor('#006398');
    }
    setError(null);
  }, [habitToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const goalLabels: Record<HabitFrequency, string> = {
    daily: 'Times per day',
    weekly: 'Times per month (weeks)',
    monthly: 'Times per month',
  };

  const handleCategorySelect = (val: string) => {
    if (val === 'Custom') {
      setIsCustomCategory(true);
      setCategory('Custom');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
      setCustomCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim() || 'General'
      : category;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        category: finalCategory,
        frequency,
        goalCount: Math.max(1, goalCount),
        color,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save habit:', err);
      const errMsg = (err as Error)?.message || '';
      if (errMsg.includes('permission-denied') || errMsg.includes('insufficient permissions')) {
        setError('Firestore permission denied. Please deploy the updated Firestore security rules or set Test Mode in Firebase Console.');
      } else {
        setError(errMsg || 'An error occurred while saving. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!habitToEdit || !onArchive) return;
    if (window.confirm(`Are you sure you want to archive "${habitToEdit.name}"? Historical logs will be preserved.`)) {
      try {
        setIsSubmitting(true);
        await onArchive(habitToEdit.id);
        onClose();
      } catch (err) {
        console.error('Failed to archive habit:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative w-full sm:max-w-lg bg-surface-container-lowest dark:bg-surface-container rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/20 p-6 max-h-[92vh] overflow-y-auto z-10 animate-scaleUp">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-4" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: color }}
            />
            <h2 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
              {isEditMode ? 'Edit Habit' : 'Create New Habit'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 text-error text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* 1. Habit Name */}
          <div className="space-y-1.5">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Habit Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. No Sugar Foods, Cold Showers, Workout..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>

          {/* 2. Category / Tracker Section */}
          <div className="space-y-2">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Tracker Category / Routine
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = !isCustomCategory && category.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-soft'
                        : 'bg-surface-container-low dark:bg-surface-container-high/50 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleCategorySelect('Custom')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  isCustomCategory
                    ? 'bg-primary text-on-primary shadow-soft'
                    : 'bg-surface-container-low dark:bg-surface-container-high/50 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                + Custom Title
              </button>
            </div>

            {/* Custom Category Input */}
            {isCustomCategory && (
              <input
                type="text"
                placeholder="Enter custom tracker title (e.g. Morning Routine, Keto Diet...)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-primary/50 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-all animate-fadeIn"
              />
            )}
          </div>

          {/* 3. Frequency Selector Tabs */}
          <div className="space-y-1.5">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Frequency
            </label>
            <div className="flex bg-surface-container-low dark:bg-surface-container-high/40 p-1 rounded-full border border-outline-variant/20">
              {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`flex-1 py-2 rounded-full font-stat-label text-xs uppercase tracking-wider transition-all duration-200 ${
                    frequency === freq
                      ? 'bg-surface-container-lowest dark:bg-surface-container-high text-primary font-bold shadow-soft'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Goal Stepper */}
          <div className="space-y-1.5">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              {goalLabels[frequency]}
            </label>
            <div className="bg-surface-container-low dark:bg-surface-container-high/40 rounded-xl p-3 flex items-center justify-between border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setGoalCount((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-lowest dark:bg-surface-container text-on-surface shadow-sm hover:bg-surface-bright active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>

              <span className="font-app-title text-2xl font-bold text-on-surface">
                {goalCount}
              </span>

              <button
                type="button"
                onClick={() => setGoalCount((prev) => prev + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-lowest dark:bg-surface-container text-on-surface shadow-sm hover:bg-surface-bright active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>

          {/* 5. Color Swatches */}
          <div className="space-y-1.5">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Color Theme
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {COLOR_PALETTE.map((c) => {
                const isSelected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setColor(c.hex)}
                    className={`w-9 h-9 rounded-full shrink-0 transition-transform active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-105 shadow-soft'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions Area */}
          <div className="pt-4 border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            {isEditMode && onArchive && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isSubmitting}
                className="text-xs font-semibold text-error hover:bg-error-container/20 px-3 py-2 rounded-xl transition-colors w-full sm:w-auto"
              >
                Archive Habit
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 sm:flex-initial"
              >
                {isSubmitting
                  ? 'Saving...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Create Habit'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
