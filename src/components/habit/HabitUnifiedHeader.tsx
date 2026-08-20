import React, { useState } from 'react';
import { Habit } from '../../types';

interface HabitUnifiedHeaderProps {
  categories: string[];
  currentCategory: string;
  categoryHabitsMap: Record<string, Habit[]>;
  selectedHabitId: string;
  habitsInCurrentCategory: Habit[];
  selectedDate: Date;
  formattedMonthTitle: string;
  getCategoryIcon: (cat: string) => string;
  onSelectCategory: (cat: string) => void;
  onSelectHabit: (habitId: string) => void;
  onMonthChange: (offset: number) => void;
  onSelectMonthIndex: (monthIdx: number) => void;
  onSelectYear: (offset: number) => void;
  onResetToCurrentMonth: () => void;
  onOpenCreateHabitModal: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const HabitUnifiedHeader: React.FC<HabitUnifiedHeaderProps> = ({
  categories,
  currentCategory,
  categoryHabitsMap,
  selectedHabitId,
  habitsInCurrentCategory,
  selectedDate,
  formattedMonthTitle,
  getCategoryIcon,
  onSelectCategory,
  onSelectHabit,
  onMonthChange,
  onSelectMonthIndex,
  onSelectYear,
  onResetToCurrentMonth,
  onOpenCreateHabitModal,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonthIdx = selectedDate.getMonth();
  const isCurrentMonth =
    new Date().getMonth() === selectedMonthIdx && new Date().getFullYear() === selectedYear;

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/15 shadow-soft p-4 sm:p-5 space-y-3.5 relative">
      {/* Row 1: Tracker Board Selector & Compact Month Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline-variant/10">
        {/* Left: Tracker Board / Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0 flex-1 min-w-0">
          <span className="text-[11px] font-stat-label text-on-surface-variant font-bold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Board:
          </span>
          {categories.map((cat) => {
            const isSelected = currentCategory.toLowerCase() === cat.toLowerCase();
            const count = categoryHabitsMap[cat]?.length || 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-soft font-bold scale-[1.01]'
                    : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Compact Month Navigator Stepper */}
        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto relative">
          <button
            type="button"
            onClick={() => onMonthChange(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors active:scale-90"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {/* Month Popover Trigger */}
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface font-stat-label text-xs font-bold transition-colors border border-outline-variant/20 active:scale-95"
            title="Click to select specific month"
          >
            <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_today
            </span>
            <span>{formattedMonthTitle}</span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              {isMonthPickerOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onMonthChange(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors active:scale-90"
            title="Next Month"
            aria-label="Next Month"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onResetToCurrentMonth}
              className="text-[10px] font-stat-label font-bold text-primary hover:underline px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors ml-0.5"
            >
              Today
            </button>
          )}

          {/* Quick Month Dropdown Picker */}
          {isMonthPickerOpen && (
            <div className="absolute top-10 right-0 z-40 w-64 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/20 p-3 space-y-2.5 animate-scaleUp">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => onSelectYear(-1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="font-stat-label text-xs font-bold text-on-surface">{selectedYear}</span>
                <button
                  type="button"
                  onClick={() => onSelectYear(1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {MONTH_NAMES.map((name, idx) => {
                  const isSelected = selectedMonthIdx === idx;
                  const isNow = new Date().getMonth() === idx && new Date().getFullYear() === selectedYear;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        onSelectMonthIndex(idx);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : isNow
                          ? 'border border-primary/40 text-primary font-bold bg-primary/10'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Habit Selector Pills + Add Habit CTA */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 flex-1 min-w-0">
          <span className="text-[11px] font-stat-label text-on-surface-variant font-bold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Analytics:
          </span>

          {/* Aggregate All Habits Pill */}
          <button
            type="button"
            onClick={() => onSelectHabit('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
              selectedHabitId === 'all'
                ? 'bg-secondary text-on-secondary shadow-soft font-bold scale-[1.01]'
                : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {selectedHabitId === 'all' ? 'equalizer' : 'bar_chart'}
            </span>
            <span>All Habits</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                selectedHabitId === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              {habitsInCurrentCategory.length}
            </span>
          </button>

          {/* Individual Habit Pills */}
          {habitsInCurrentCategory.map((h) => {
            const isSelected = selectedHabitId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectHabit(h.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-secondary text-on-secondary shadow-soft font-bold scale-[1.01]'
                    : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: h.color || '#006398' }}
                />
                <span className="truncate max-w-[130px] sm:max-w-[170px]">{h.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right CTA: New Habit Button */}
        <button
          type="button"
          onClick={onOpenCreateHabitModal}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-xs border border-primary/20"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span className="hidden xs:inline">New Habit</span>
        </button>
      </div>
    </div>
  );
};
