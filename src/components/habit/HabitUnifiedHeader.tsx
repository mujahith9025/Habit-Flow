import React, { useState, useRef, useEffect } from 'react';
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
  onExportReport?: (format: 'pdf' | 'csv') => void;
  densityMode?: 'spacious' | 'compact';
  onToggleDensityMode?: () => void;
  isMonthPickerOpen?: boolean;
  onToggleMonthPicker?: (open?: boolean) => void;
  storyMode?: boolean;
  onToggleStoryMode?: () => void;
  isColorblindSafe?: boolean;
  onToggleColorblindMode?: () => void;
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
  onExportReport,
  densityMode = 'spacious',
  onToggleDensityMode,
  isMonthPickerOpen: controlledMonthPickerOpen,
  onToggleMonthPicker,
  storyMode = false,
  onToggleStoryMode,
  isColorblindSafe = false,
  onToggleColorblindMode,
}) => {
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);
  const [internalMonthPickerOpen, setInternalMonthPickerOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const isMonthPickerOpen =
    controlledMonthPickerOpen !== undefined ? controlledMonthPickerOpen : internalMonthPickerOpen;

  const handleToggleMonthPicker = (targetState?: boolean) => {
    const nextState = targetState !== undefined ? targetState : !isMonthPickerOpen;
    if (onToggleMonthPicker) {
      onToggleMonthPicker(nextState);
    } else {
      setInternalMonthPickerOpen(nextState);
    }
  };

  const boardPickerRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const exportPickerRef = useRef<HTMLDivElement>(null);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonthIdx = selectedDate.getMonth();
  const isCurrentMonth =
    new Date().getMonth() === selectedMonthIdx && new Date().getFullYear() === selectedYear;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (boardPickerRef.current && !boardPickerRef.current.contains(target)) {
        setIsBoardPickerOpen(false);
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(target)) {
        handleToggleMonthPicker(false);
      }
      if (exportPickerRef.current && !exportPickerRef.current.contains(target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl border border-outline-variant/20 shadow-soft p-3 sm:p-4 space-y-3 relative transition-all">
      {/* Tier 1: Master Controls (Board Selector + Month Navigator + Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Tracker Board Selector */}
        <div ref={boardPickerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsBoardPickerOpen((prev) => !prev);
              handleToggleMonthPicker(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-low dark:bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface border border-outline-variant/25 transition-all active:scale-95 shadow-2xs cursor-pointer"
            title="Select Tracker Board"
          >
            <span className="text-[15px]">{getCategoryIcon(currentCategory)}</span>
            <span className="font-habit-name font-bold max-w-[120px] sm:max-w-[160px] truncate">
              {currentCategory}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface-variant font-tnum">
              {categoryHabitsMap[currentCategory]?.length || 0}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {isBoardPickerOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Board Selector Popover */}
          {isBoardPickerOpen && (
            <div className="absolute top-11 left-0 z-50 w-56 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-xl border border-outline-variant/20 p-2 space-y-1 animate-scaleUp">
              <div className="px-2.5 py-1 text-[10px] font-stat-label font-bold text-on-surface-variant uppercase tracking-wider">
                Tracker Boards
              </div>
              {categories.map((cat) => {
                const isSelected = currentCategory.toLowerCase() === cat.toLowerCase();
                const count = categoryHabitsMap[cat]?.length || 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      setIsBoardPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{getCategoryIcon(cat)}</span>
                      <span className="truncate">{cat}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold font-tnum ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Month Stepper + Utility Buttons + New Habit */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Month Stepper Controller */}
          <div ref={monthPickerRef} className="flex items-center gap-1 relative shrink-0">
            <button
              type="button"
              onClick={() => onMonthChange(-1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors active:scale-90 cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {/* Month Popover Trigger */}
            <button
              type="button"
              onClick={() => {
                handleToggleMonthPicker();
                setIsBoardPickerOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface font-stat-label text-xs font-bold transition-colors border border-outline-variant/20 active:scale-95 cursor-pointer"
              title="Click to select specific month"
            >
              <span
                className="material-symbols-outlined text-[15px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
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
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors active:scale-90 cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={onResetToCurrentMonth}
                className="text-[10px] font-stat-label font-bold text-primary hover:underline px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors ml-0.5 cursor-pointer"
              >
                Today
              </button>
            )}

            {/* Quick Month Dropdown Picker */}
            {isMonthPickerOpen && (
              <div className="absolute top-11 right-0 z-50 w-64 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/20 p-3 space-y-2.5 animate-scaleUp">
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => onSelectYear(-1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <span className="font-stat-label text-xs font-bold text-on-surface">{selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => onSelectYear(1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected = selectedMonthIdx === idx;
                    const isNow =
                      new Date().getMonth() === idx && new Date().getFullYear() === selectedYear;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          onSelectMonthIndex(idx);
                          handleToggleMonthPicker(false);
                        }}
                        className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
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

          {/* Symmetrical Utility Icon Cluster */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Story Mode Toggle */}
            {onToggleStoryMode && (
              <button
                type="button"
                onClick={onToggleStoryMode}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all active:scale-90 border cursor-pointer shadow-2xs ${
                  storyMode
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'text-on-surface bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high border-outline-variant/25'
                }`}
                title={`Switch to ${storyMode ? 'Analytics View' : 'Story View'}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {storyMode ? 'auto_stories' : 'bar_chart'}
                </span>
              </button>
            )}

            {/* Colorblind Palette Toggle */}
            {onToggleColorblindMode && (
              <button
                type="button"
                onClick={onToggleColorblindMode}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all active:scale-90 border cursor-pointer shadow-2xs ${
                  isColorblindSafe
                    ? 'bg-blue-600 text-white border-blue-500 font-bold'
                    : 'text-on-surface bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high border-outline-variant/25'
                }`}
                title={`Toggle Colorblind Palette (${isColorblindSafe ? 'Active' : 'Standard'})`}
                aria-pressed={isColorblindSafe}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isColorblindSafe ? 'palette' : 'contrast'}
                </span>
              </button>
            )}

            {/* Layout Density Mode Toggle */}
            {onToggleDensityMode && (
              <button
                type="button"
                onClick={onToggleDensityMode}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold text-on-surface bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high transition-all active:scale-90 border border-outline-variant/25 cursor-pointer shadow-2xs"
                title={`Layout: ${densityMode === 'spacious' ? 'Spacious (Click for Compact)' : 'Compact (Click for Spacious)'}`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">
                  {densityMode === 'spacious' ? 'density_small' : 'density_medium'}
                </span>
              </button>
            )}

            {/* Export Report Dropdown Trigger */}
            {onExportReport && (
              <div ref={exportPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen((prev) => !prev);
                    handleToggleMonthPicker(false);
                    setIsBoardPickerOpen(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high transition-all active:scale-95 border border-outline-variant/25 cursor-pointer shadow-2xs"
                  title="Export Monthly Report (PDF / CSV)"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">download</span>
                  <span className="hidden xs:inline">Export</span>
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                    {isExportMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Export Popover Menu */}
                {isExportMenuOpen && (
                  <div className="absolute top-11 right-0 z-50 w-48 bg-surface-container-lowest dark:bg-surface-container-high rounded-2xl shadow-xl border border-outline-variant/20 p-2 space-y-1 animate-scaleUp">
                    <div className="px-2.5 py-1 text-[10px] font-stat-label font-bold text-on-surface-variant uppercase tracking-wider">
                      Download Report
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportReport('pdf');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-all cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
                      <div>
                        <div className="font-semibold text-xs leading-none">PDF Report</div>
                        <span className="text-[10px] text-on-surface-variant">Printable summary</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportReport('csv');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-all cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">table_chart</span>
                      <div>
                        <div className="font-semibold text-xs leading-none">CSV Spreadsheet</div>
                        <span className="text-[10px] text-on-surface-variant">Tabular metrics</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* New Habit Action Button */}
            <button
              type="button"
              onClick={onOpenCreateHabitModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-xs border border-primary/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span className="hidden xs:inline">New Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated Habit Filter Strip with Subtle Overflow Gradient */}
      <div className="pt-2 border-t border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {/* Aggregate All Habits Pill */}
        <button
          type="button"
          onClick={() => onSelectHabit('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer ${
            selectedHabitId === 'all'
              ? 'bg-primary text-on-primary shadow-soft font-bold scale-[1.01]'
              : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {selectedHabitId === 'all' ? 'equalizer' : 'bar_chart'}
          </span>
          <span>All Habits</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold font-tnum ${
              selectedHabitId === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            {habitsInCurrentCategory.length}
          </span>
        </button>

        {/* Individual Habit Chips */}
        {habitsInCurrentCategory.map((h) => {
          const isSelected = selectedHabitId === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectHabit(h.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-secondary text-on-secondary shadow-soft font-bold scale-[1.01]'
                  : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: h.color || '#2D5A34' }}
              />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{h.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
