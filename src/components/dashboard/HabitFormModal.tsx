import React, { useState, useEffect } from 'react';
import {
  Habit,
  HabitFrequency,
  HabitTimeOfDay,
  HabitType,
  HabitScheduleType,
} from '../../types';
import { Button } from '../ui/Button';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { triggerHaptic } from '../../utils/haptics';

interface HabitFormModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  defaultCategory?: string;
  currentMonthKey?: string; // e.g. "2026-08"
  formattedMonthTitle?: string; // e.g. "August 2026"
  onClose: () => void;
  onSave: (data: {
    name: string;
    category?: string;
    frequency: HabitFrequency;
    timeOfDay?: HabitTimeOfDay;
    habitType?: HabitType;
    targetValue?: number;
    unit?: string;
    stepValue?: number;
    timerDuration?: number;
    scheduleType?: HabitScheduleType;
    daysOfWeek?: number[];
    targetDaysPerWeek?: number;
    tags?: string[];
    isPaused?: boolean;
    pauseStartDate?: string;
    pauseEndDate?: string;
    pauseReason?: string;
    goalCount: number;
    color?: string;
    icon?: string;
    startMonth?: string;
    endMonth?: string;
    excludedMonths?: string[];
  }) => Promise<void>;
  onRemoveFromMonth?: (habitId: string, monthKey: string) => Promise<void>;
  onDelete?: (habitId: string) => Promise<void>;
  onArchive?: (habitId: string) => Promise<void>;
}

const PRESET_CATEGORIES = [
  { label: '🎯 Self Challenges', value: 'Self Challenges' },
  { label: '🥗 Diet & Nutrition', value: 'Diet & Nutrition' },
  { label: '🏃 Fitness', value: 'Fitness' },
  { label: '🧘 Mindfulness', value: 'Mindfulness' },
  { label: '📚 Study & Work', value: 'Study & Work' },
  { label: '🌟 General', value: 'General' },
];

const SUGGESTED_TAGS = ['#morning', '#health', '#mindset', '#focus', '#fitness', '#routine'];

const DAYS_OF_WEEK_LABELS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  habitToEdit,
  defaultCategory,
  currentMonthKey,
  formattedMonthTitle,
  onClose,
  onSave,
  onRemoveFromMonth,
  onDelete,
  onArchive,
}) => {
  const isEditMode = Boolean(habitToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');
  const [goalCount, setGoalCount] = useState(1);
  const [monthScope, setMonthScope] = useState<'all' | 'from_current' | 'current_only'>('all');

  // Advanced Section 4 states
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(2500);
  const [unit, setUnit] = useState<string>('ml');
  const [stepValue, setStepValue] = useState<number>(250);
  const [timerDuration, setTimerDuration] = useState<number>(15);
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string>('Vacation');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMonthTitle = formattedMonthTitle || 'Current Month';

  // Initialize or reset form values
  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      const initialCat = habitToEdit.category || 'General';
      const isPreset = PRESET_CATEGORIES.some(
        (c) => c.value.toLowerCase() === initialCat.toLowerCase()
      );
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
      setTimeOfDay(habitToEdit.timeOfDay || 'anytime');
      setGoalCount(habitToEdit.goalCount || 1);

      // Advanced properties
      setHabitType(habitToEdit.habitType || 'boolean');
      setTargetValue(habitToEdit.targetValue || 2500);
      setUnit(habitToEdit.unit || 'ml');
      setStepValue(habitToEdit.stepValue || 250);
      setTimerDuration(habitToEdit.timerDuration || 15);
      setScheduleType(habitToEdit.scheduleType || 'daily');
      setDaysOfWeek(habitToEdit.daysOfWeek || [1, 2, 3, 4, 5]);
      setTargetDaysPerWeek(habitToEdit.targetDaysPerWeek || 3);
      setTags(habitToEdit.tags || []);
      setIsPaused(habitToEdit.isPaused || false);
      setPauseReason(habitToEdit.pauseReason || 'Vacation');

      if (
        habitToEdit.startMonth &&
        habitToEdit.endMonth &&
        habitToEdit.startMonth === habitToEdit.endMonth
      ) {
        setMonthScope('current_only');
      } else if (habitToEdit.startMonth) {
        setMonthScope('from_current');
      } else {
        setMonthScope('all');
      }
    } else {
      setName('');
      const initialCat = defaultCategory || 'General';
      const isPreset = PRESET_CATEGORIES.some(
        (c) => c.value.toLowerCase() === initialCat.toLowerCase()
      );
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
      setTimeOfDay('anytime');
      setGoalCount(1);
      setMonthScope('all');

      // Reset advanced fields
      setHabitType('boolean');
      setTargetValue(2500);
      setUnit('ml');
      setStepValue(250);
      setTimerDuration(15);
      setScheduleType('daily');
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setTargetDaysPerWeek(3);
      setTags([]);
      setIsPaused(false);
      setPauseReason('Vacation');
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

  const handleToggleDayOfWeek = (day: number) => {
    triggerHaptic('selection');
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day].sort()
    );
  };

  const handleAddTag = (tagToAdd: string) => {
    const formatted = tagToAdd.trim().replace(/^#+/, '');
    if (!formatted) return;
    const cleanTag = `#${formatted.toLowerCase()}`;
    if (!tags.includes(cleanTag)) {
      triggerHaptic('selection');
      setTags([...tags, cleanTag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    triggerHaptic('selection');
    setTags(tags.filter((t) => t !== tagToRemove));
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

    let startMonth: string | undefined = undefined;
    let endMonth: string | undefined = undefined;

    if (monthScope === 'from_current' && currentMonthKey) {
      startMonth = currentMonthKey;
    } else if (monthScope === 'current_only' && currentMonthKey) {
      startMonth = currentMonthKey;
      endMonth = currentMonthKey;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        category: finalCategory,
        frequency,
        timeOfDay,
        habitType,
        targetValue: habitType === 'numeric' ? Math.max(1, targetValue) : undefined,
        unit: habitType === 'numeric' ? unit.trim() : undefined,
        stepValue: habitType === 'numeric' ? Math.max(1, stepValue) : undefined,
        timerDuration: habitType === 'timer' ? Math.max(1, timerDuration) : undefined,
        scheduleType,
        daysOfWeek: scheduleType === 'days_of_week' ? daysOfWeek : undefined,
        targetDaysPerWeek: scheduleType === 'times_per_week' ? targetDaysPerWeek : undefined,
        tags,
        isPaused,
        pauseReason: isPaused ? pauseReason : undefined,
        goalCount: Math.max(1, goalCount),
        startMonth,
        endMonth,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save habit:', err);
      const errMsg = (err as Error)?.message || '';
      setError(errMsg || 'An error occurred while saving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromMonth = async () => {
    if (!habitToEdit || !currentMonthKey || !onRemoveFromMonth) return;
    if (
      window.confirm(
        `Remove "${habitToEdit.name}" from ${activeMonthTitle} only?\n\nIt will be hidden from ${activeMonthTitle}, but your habit and data will remain preserved in other months.`
      )
    ) {
      try {
        setIsSubmitting(true);
        await onRemoveFromMonth(habitToEdit.id, currentMonthKey);
        onClose();
      } catch (err) {
        console.error('Failed to remove habit from month:', err);
        setError('Failed to remove habit from month. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteAllMonths = async () => {
    if (!habitToEdit || !onDelete) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${habitToEdit.name}" ACROSS ALL MONTHS?\n\nThis will remove the habit and all its historical logs permanently.`
      )
    ) {
      try {
        setIsSubmitting(true);
        await onDelete(habitToEdit.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete habit:', err);
        setError('Failed to delete habit. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleArchive = async () => {
    if (!habitToEdit || !onArchive) return;
    if (
      window.confirm(
        `Archive "${habitToEdit.name}"? Historical logs will be preserved in records.`
      )
    ) {
      try {
        setIsSubmitting(true);
        await onArchive(habitToEdit.id);
        onClose();
      } catch (err) {
        console.error('Failed to archive habit:', err);
        setError('Failed to archive habit. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={isEditMode ? 'Edit Habit' : 'Create New Habit'}
      subtitle={
        currentMonthKey ? (
          <span className="text-[11px] font-stat-label text-primary dark:text-primary-fixed-dim font-semibold">
            Viewing: {activeMonthTitle}
          </span>
        ) : undefined
      }
    >
      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto scrollbar-thin pr-1">
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
            placeholder="e.g. Daily Hydration, 50 Pushups, Deep Work, Reading..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>

        {/* 2. Habit Type Tabs (Standard vs Numeric vs Zen Timer) */}
        <div className="space-y-1.5">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            Habit Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low dark:bg-surface-container-high/40 p-1 rounded-2xl border border-outline-variant/20">
            {[
              { type: 'boolean' as HabitType, label: 'Standard', icon: 'check_circle', desc: 'Yes / No Check' },
              { type: 'numeric' as HabitType, label: 'Numeric Goal', icon: 'pin', desc: '2,500ml, 50 reps' },
              { type: 'timer' as HabitType, label: 'Zen Timer', icon: 'timer', desc: '15m, 25m Pomodoro' },
            ].map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setHabitType(t.type);
                }}
                className={`p-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  habitType === t.type
                    ? 'bg-surface-container-lowest dark:bg-surface-container-high text-primary font-bold shadow-soft'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                <span className="text-[11px] font-bold mt-0.5">{t.label}</span>
                <span className="text-[9px] text-on-surface-variant opacity-80">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2b. Numeric Goal Configurations */}
        {habitType === 'numeric' && (
          <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/30 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-[17px]">calculate</span>
              <span>Quantitative Goal Settings</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-stat-label font-bold text-on-surface-variant uppercase mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] font-stat-label font-bold text-on-surface-variant uppercase mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. ml, pushups, pages"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] font-stat-label font-bold text-on-surface-variant uppercase mb-1">
                  Step Increment
                </label>
                <input
                  type="number"
                  min="1"
                  value={stepValue}
                  onChange={(e) => setStepValue(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-on-surface"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2c. Zen Timer Configurations */}
        {habitType === 'timer' && (
          <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/30 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
              <span>Zen Countdown / Pomodoro Duration</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '10m', mins: 10 },
                { label: '15m (Mindful)', mins: 15 },
                { label: '25m (Pomodoro)', mins: 25 },
                { label: '45m (Deep Work)', mins: 45 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setTimerDuration(preset.mins);
                  }}
                  className={`px-2 py-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                    timerDuration === preset.mins
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Flexible Schedules (Everyday vs Days of Week vs Times per Week) */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[17px]">event_repeat</span>
            <label className="block font-section-header text-xs font-bold text-on-surface">
              Schedule & Rest Days
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'daily' as HabitScheduleType, label: 'Everyday' },
              { id: 'days_of_week' as HabitScheduleType, label: 'Days of Week' },
              { id: 'times_per_week' as HabitScheduleType, label: 'Target / Week' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setScheduleType(s.id);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  scheduleType === s.id
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                    : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Days of Week Selector Pills */}
          {scheduleType === 'days_of_week' && (
            <div className="pt-2 animate-fadeIn space-y-1.5">
              <span className="text-[11px] text-on-surface-variant block">
                Select active days (other days become scheduled Rest Days without breaking streaks):
              </span>
              <div className="flex items-center justify-between gap-1">
                {DAYS_OF_WEEK_LABELS.map((d) => {
                  const isSelected = daysOfWeek.includes(d.day);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => handleToggleDayOfWeek(d.day)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                          : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Times Per Week */}
          {scheduleType === 'times_per_week' && (
            <div className="pt-2 animate-fadeIn flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Target days per week:</span>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setTargetDaysPerWeek(num);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      targetDaysPerWeek === num
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Tags & Custom Hashtags */}
        <div className="space-y-2">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            Hashtags & Labels
          </label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-error cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g. #health, #deepwork)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-on-surface"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddTag(newTagInput)}
            >
              + Tag
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {SUGGESTED_TAGS.map((sTag) => (
              <button
                key={sTag}
                type="button"
                onClick={() => handleAddTag(sTag)}
                className="text-[10px] text-on-surface-variant hover:text-primary px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/20 cursor-pointer"
              >
                +{sTag}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Vacation & Travel Pause Toggle */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400">
              beach_access
            </span>
            <div>
              <span className="font-section-header text-xs font-bold text-on-surface block">
                Vacation & Travel Pause
              </span>
              <span className="text-[10px] text-on-surface-variant block">
                Freezes streaks so travel/illness does not reset your streak.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPaused}
              onChange={(e) => {
                triggerHaptic('selection');
                setIsPaused(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
          </label>
        </div>

        {/* 6. Category Section */}
        <div className="space-y-2">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            Tracker Category / Routine
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATEGORIES.map((cat) => {
              const isSelected =
                !isCustomCategory &&
                category.toLowerCase() === cat.value.toLowerCase();
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

        {/* 7. Month Scope */}
        {currentMonthKey && (
          <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-high/30 border border-outline-variant/20">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[17px]">
                calendar_month
              </span>
              <label className="block font-section-header text-xs font-bold text-on-surface">
                Month Scope & Availability
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMonthScope('all')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  monthScope === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-outline-variant/20 hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <div className="text-xs font-bold">🌐 All Months</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Reflects across every month
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMonthScope('from_current')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  monthScope === 'from_current'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-outline-variant/20 hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <div className="text-xs font-bold">📅 From {activeMonthTitle}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Starts from this month onwards
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMonthScope('current_only')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  monthScope === 'current_only'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-outline-variant/20 hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <div className="text-xs font-bold">🎯 {activeMonthTitle} Only</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Only active in this month
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 8. Frequency Selector Tabs */}
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

        {/* Time-Aware Ritual Bundle Selector */}
        {frequency === 'daily' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block font-section-header text-xs font-semibold text-on-surface">
              Ritual Time of Day
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'morning', label: 'Morning', icon: 'wb_sunny', desc: '5am - 12pm' },
                { value: 'afternoon', label: 'Afternoon', icon: 'light_mode', desc: '12pm - 5pm' },
                { value: 'evening', label: 'Evening', icon: 'nights_stay', desc: '5pm - Night' },
                { value: 'anytime', label: 'Anytime', icon: 'schedule', desc: 'All Day' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTimeOfDay(item.value as HabitTimeOfDay)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    timeOfDay === item.value
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/10 shadow-xs'
                      : 'border-outline-variant/25 bg-surface-container-low dark:bg-surface-container-high/30 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {item.icon}
                    </span>
                    {timeOfDay === item.value && (
                      <span
                        className="material-symbols-outlined text-[15px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="font-habit-name text-xs font-bold text-on-surface block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">
                      {item.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 9. Goal Stepper */}
        <div className="space-y-1.5">
          <label className="block font-section-header text-xs font-semibold text-on-surface">
            {goalLabels[frequency]}
          </label>
          <div className="bg-surface-container-low dark:bg-surface-container-high/40 rounded-xl p-3 flex items-center justify-between border border-outline-variant/20">
            <button
              type="button"
              onClick={() => setGoalCount((prev) => Math.max(1, prev - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-lowest dark:bg-surface-container text-on-surface shadow-sm hover:bg-surface-bright active:scale-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>

            <span className="font-app-title text-2xl font-bold text-on-surface">
              {goalCount}
            </span>

            <button
              type="button"
              onClick={() => setGoalCount((prev) => prev + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-lowest dark:bg-surface-container text-on-surface shadow-sm hover:bg-surface-bright active:scale-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
        </div>

        {/* Actions Area */}
        <div className="pt-4 border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isEditMode && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {currentMonthKey && onRemoveFromMonth && (
                <button
                  type="button"
                  onClick={handleRemoveFromMonth}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 border border-amber-500/20 cursor-pointer"
                  title={`Remove from ${activeMonthTitle} only (keeps habit in other months)`}
                >
                  <span className="material-symbols-outlined text-[15px]">event_busy</span>
                  <span>Remove from {activeMonthTitle}</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteAllMonths}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-error hover:bg-error-container/20 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Permanently delete habit across all months"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span>Delete All Months</span>
                </button>
              )}

              {onArchive && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low px-2 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Archive habit"
                >
                  <span className="material-symbols-outlined text-[15px]">archive</span>
                  <span>Archive</span>
                </button>
              )}
            </div>
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
    </BottomSheetModal>
  );
};
