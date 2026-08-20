import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useSingleHabitHistory } from '../hooks/useSingleHabitHistory';
import { HabitStatsGrid } from '../components/habit/HabitStatsGrid';
import { HabitWeeklyGraphsView } from '../components/habit/HabitWeeklyGraphsView';
import { HabitCalendarHeatmap } from '../components/habit/HabitCalendarHeatmap';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { formatMonthYear } from '../components/dashboard/DateNavigator';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const CATEGORY_ICONS: Record<string, string> = {
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, loading: habitsLoading, createHabit, deleteHabit } = useHabits();

  // Selected date defaults to current date / current month on initial entry
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<'graphs' | 'calendar'>('graphs');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active habits list
  const activeHabits = habits.filter((h) => !h.archived);

  // Group habits by category
  const categoryHabitsMap: Record<string, typeof activeHabits> = {};
  activeHabits.forEach((h) => {
    const cat = h.category?.trim() || 'General';
    if (!categoryHabitsMap[cat]) {
      categoryHabitsMap[cat] = [];
    }
    categoryHabitsMap[cat].push(h);
  });

  const categories = Object.keys(categoryHabitsMap).sort();

  // Determine effective habit ID
  const matchedHabit = activeHabits.find((h) => h.id === id);
  const effectiveHabitId = matchedHabit
    ? matchedHabit.id
    : activeHabits.length > 0
    ? activeHabits[0].id
    : id;

  // Auto-sync route if ID in URL was invalid (e.g. /habit/1) but user has active habits
  useEffect(() => {
    if (!habitsLoading && activeHabits.length > 0 && (!matchedHabit || id === '1')) {
      navigate(`/habit/${activeHabits[0].id}`, { replace: true });
    }
  }, [habitsLoading, activeHabits, matchedHabit, id, navigate]);

  // Sync selected category with current habit
  useEffect(() => {
    if (matchedHabit) {
      const habitCat = matchedHabit.category?.trim() || 'General';
      setSelectedCategory(habitCat);
    } else if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [matchedHabit, categories]);

  const {
    habit,
    metrics,
    loading: historyLoading,
    isCompleted,
    toggleEntry,
    updateHabit,
    archiveHabit,
  } = useSingleHabitHistory(effectiveHabitId, selectedDate);

  // Filter habits under the currently selected tracker title
  const currentCategory = selectedCategory || (habit?.category?.trim() || 'General');
  const habitsInCurrentCategory = categoryHabitsMap[currentCategory] || (habit ? [habit] : []);

  const getCategoryIcon = (cat: string) => {
    const key = cat.toLowerCase();
    return CATEGORY_ICONS[key] || '📋';
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const habitsInCat = categoryHabitsMap[cat] || [];
    if (habitsInCat.length > 0) {
      if (!habitsInCat.some((h) => h.id === habit?.id)) {
        navigate(`/habit/${habitsInCat[0].id}`);
      }
    }
  };

  const handleMonthChange = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  };

  const handleSelectMonthIndex = (monthIdx: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(monthIdx);
      return next;
    });
  };

  const handleSelectYear = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(next.getFullYear() + offset);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!habit) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${habit.name}"?\n\nThis will remove the habit and its logs permanently.`
      )
    ) {
      try {
        await deleteHabit(habit.id);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to delete habit:', err);
      }
    }
  };

  const handleArchive = async () => {
    if (!habit) return;
    if (window.confirm(`Archive "${habit.name}"? Historical logs will be preserved.`)) {
      try {
        await archiveHabit(true);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to archive habit:', err);
      }
    }
  };

  const handleSaveEdit = async (data: {
    name: string;
    category?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    goalCount: number;
    color?: string;
    icon?: string;
  }) => {
    await updateHabit(data);
  };

  const handleCreateHabit = async (data: {
    name: string;
    category?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    goalCount: number;
    color?: string;
    icon?: string;
  }) => {
    const newHabit = await createHabit(data);
    setIsCreateModalOpen(false);
    navigate(`/habit/${newHabit.id}`);
  };

  const selectedYear = selectedDate.getFullYear();
  const selectedMonthIdx = selectedDate.getMonth();
  const { formattedTitle } = formatMonthYear(selectedDate);

  if (habitsLoading || historyLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="font-body-text text-sm text-on-surface-variant">
          Loading habit analytics and performance graphs...
        </p>
      </div>
    );
  }

  // 0 Habits empty state
  if (activeHabits.length === 0) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto my-12 p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary-fixed/30 text-primary mx-auto flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-[32px]">energy_savings_leaf</span>
        </div>
        <div className="space-y-1">
          <h2 className="font-section-header text-xl font-bold text-on-surface">
            No Active Habits Yet
          </h2>
          <p className="font-body-text text-xs text-on-surface-variant max-w-xs mx-auto">
            Create your first habit to start tracking weekly performance graphs and consistency gauges.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
            Create First Habit
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <HabitFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateHabit}
        />
      </Card>
    );
  }

  if (!habit || habit.archived) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto my-12 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed/30 text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">search_off</span>
        </div>
        <h2 className="font-section-header text-lg font-bold text-on-surface">
          Habit Not Found
        </h2>
        <p className="font-body-text text-xs text-on-surface-variant">
          This habit may have been archived or removed.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Categorized 2-Tier Habit Navigator */}
      <div className="bg-surface-container-lowest dark:bg-surface-container p-4 sm:p-5 rounded-2xl border border-outline-variant/15 shadow-soft space-y-4">
        {/* Tier 1: Tracker Board / Category Selector */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                dashboard_customize
              </span>
              1. Select Tracker Board:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = currentCategory.toLowerCase() === cat.toLowerCase();
              const count = categoryHabitsMap[cat]?.length || 0;

              return (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                  }`}
                >
                  <span>{getCategoryIcon(cat)}</span>
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
          </div>
        </div>

        {/* Tier 2: Habits under Selected Tracker Board */}
        <div className="pt-3 border-t border-outline-variant/15">
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <span className="text-xs font-stat-label text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                checklist
              </span>
              2. Select Habit for Analytics ({currentCategory}):
            </span>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Habit</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {habitsInCurrentCategory.map((h) => {
              const isSelected = h.id === habit.id;
              return (
                <button
                  key={h.id}
                  onClick={() => navigate(`/habit/${h.id}`)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-secondary text-on-secondary shadow-soft scale-[1.02]'
                      : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <span className="truncate max-w-[160px]">{h.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Habit Header Banner (for the selected habit) */}
      <div className="bg-surface-container-lowest dark:bg-surface-container p-5 sm:p-6 rounded-2xl border border-outline-variant/15 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Habit Identity */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
              {habit.name}
            </h1>
            {habit.category && (
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-primary dark:text-primary-fixed-dim font-stat-label">
                {habit.category}
              </span>
            )}
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-stat-label">
              {habit.frequency || 'daily'}
            </span>
          </div>
          <p className="font-body-text text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Goal: {habit.goalCount || 1} time{(habit.goalCount || 1) > 1 ? 's' : ''} per {habit.frequency === 'weekly' ? 'week' : habit.frequency === 'monthly' ? 'month' : 'day'}
          </p>
        </div>

        {/* Right: Actions (Edit, Delete, Archive) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>Edit</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-error hover:bg-error-container/20 px-3"
            title="Delete Habit Permanently"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="text-on-surface-variant hover:bg-surface-container-high px-2.5"
            title="Archive Habit"
          >
            <span className="material-symbols-outlined text-[18px]">archive</span>
          </Button>
        </div>
      </div>

      {/* 3. Interactive Month Navigation Bar (Jan - Dec + Year) */}
      <div className="bg-surface-container-lowest dark:bg-surface-container p-3 sm:p-4 rounded-2xl border border-outline-variant/15 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              calendar_month
            </span>
            <h3 className="font-section-header text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
              Analytics Month: <span className="text-primary dark:text-primary-fixed-dim">{formattedTitle}</span>
            </h3>
          </div>

          {/* Year Switcher Stepper */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => handleSelectYear(-1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors"
              title="Previous Year"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="font-stat-label text-xs font-bold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface">
              {selectedYear}
            </span>
            <button
              onClick={() => handleSelectYear(1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface transition-colors"
              title="Next Year"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="ml-1 text-[11px] font-stat-label font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary-fixed/15 transition-colors"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* 12 Months Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MONTH_NAMES.map((name, idx) => {
            const isSelected = selectedMonthIdx === idx;
            const isCurrentMonthNow =
              new Date().getMonth() === idx && new Date().getFullYear() === selectedYear;

            return (
              <button
                key={name}
                onClick={() => handleSelectMonthIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-soft font-bold scale-[1.02]'
                    : 'bg-surface-container-low dark:bg-surface-container-high/30 text-on-surface hover:bg-surface-container-high border border-outline-variant/15'
                }`}
              >
                <span>{name.slice(0, 3)}</span>
                {isCurrentMonthNow && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Metrics Summary Grid for the selected month */}
      <HabitStatsGrid
        metrics={metrics}
        selectedMonthTitle={MONTH_NAMES[selectedMonthIdx]}
        habitColor={habit.color || '#006398'}
      />

      {/* 5. Graph / Calendar View Switcher Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-surface-container-low dark:bg-surface-container p-1 rounded-xl border border-outline-variant/20 shadow-sm">
          <button
            onClick={() => setActiveAnalyticsView('graphs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAnalyticsView === 'graphs'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
            <span>Weekly Performance Graphs</span>
          </button>

          <button
            onClick={() => setActiveAnalyticsView('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAnalyticsView === 'calendar'
                ? 'bg-primary text-on-primary shadow-soft'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>Calendar Heatmap</span>
          </button>
        </div>
      </div>

      {/* 6. Main Analytics Visualization: Weekly Performance Graphs or Calendar Heatmap */}
      {activeAnalyticsView === 'graphs' ? (
        <HabitWeeklyGraphsView
          currentDate={selectedDate}
          onChangeMonth={handleMonthChange}
          isCompleted={isCompleted}
          onToggleDate={toggleEntry}
          habitName={habit.name}
          habitFrequency={habit.frequency}
          goalCount={habit.goalCount}
        />
      ) : (
        <HabitCalendarHeatmap
          currentDate={selectedDate}
          onChangeMonth={handleMonthChange}
          isCompleted={isCompleted}
          onToggleDate={toggleEntry}
          habitColor={habit.color || '#006398'}
          habitName={habit.name}
        />
      )}

      {/* Edit Habit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        habitToEdit={habit}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

      {/* Create Habit Modal */}
      <HabitFormModal
        isOpen={isCreateModalOpen}
        defaultCategory={currentCategory}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateHabit}
      />
    </div>
  );
};
