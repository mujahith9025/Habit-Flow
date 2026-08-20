import React from 'react';
import { Habit } from '../../types';

interface CategoryFilterTabsProps {
  habits: Habit[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddNewCategory: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  all: '🌟',
  'self challenges': '🎯',
  'diet & nutrition': '🥗',
  diet: '🥗',
  fitness: '🏃',
  workout: '🏋️',
  mindfulness: '🧘',
  meditation: '🧘',
  'study & work': '📚',
  study: '📚',
  work: '💼',
  general: '🌱',
  health: '❤️',
};

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  habits,
  selectedCategory,
  onSelectCategory,
  onAddNewCategory,
}) => {
  const activeHabits = habits.filter((h) => !h.archived);

  // Group counts by category
  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    const cat = h.category?.trim() || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts).sort();

  const getIcon = (cat: string) => {
    const key = cat.toLowerCase();
    return CATEGORY_ICONS[key] || '📋';
  };

  return (
    <div className="w-full bg-surface-container-lowest dark:bg-surface-container p-2.5 sm:p-3.5 rounded-2xl border border-outline-variant/15 shadow-soft">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            dashboard_customize
          </span>
          <h3 className="font-section-header text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
            Tracker Boards
          </h3>
        </div>

        <button
          onClick={onAddNewCategory}
          className="text-xs font-semibold text-primary hover:text-primary-fixed-dim hover:underline flex items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Habit to Tracker</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* All Habits Tab */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
              : 'bg-surface-container-low dark:bg-surface-container-high/50 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
          }`}
        >
          <span>🌟</span>
          <span>All Trackers</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-highest dark:bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            {activeHabits.length}
          </span>
        </button>

        {/* Dynamic Category Tabs */}
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          const count = categoryCounts[cat];

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
                  : 'bg-surface-container-low dark:bg-surface-container-high/50 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
              }`}
            >
              <span>{getIcon(cat)}</span>
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
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

        {/* Create New Category Quick Button */}
        <button
          onClick={onAddNewCategory}
          title="Create a new Tracker Board"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-primary hover:border-primary/40 border border-dashed border-outline-variant/40 transition-all shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>New Board</span>
        </button>
      </div>
    </div>
  );
};
