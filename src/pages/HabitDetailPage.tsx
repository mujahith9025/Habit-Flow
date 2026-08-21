import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useSingleHabitHistory } from '../hooks/useSingleHabitHistory';
import { useDailyHabitsData } from '../hooks/useDailyHabitsData';
import { HabitStatsGrid } from '../components/habit/HabitStatsGrid';
import { HabitWeeklyGraphsView } from '../components/habit/HabitWeeklyGraphsView';
import { HabitCalendarHeatmap } from '../components/habit/HabitCalendarHeatmap';
import { CategoryAggregateGraphsView } from '../components/habit/CategoryAggregateGraphsView';
import { HabitUnifiedHeader } from '../components/habit/HabitUnifiedHeader';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { formatMonthYear } from '../components/dashboard/DateNavigator';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { isHabitActiveInMonth } from '../types';

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
  const {
    habits,
    loading: habitsLoading,
    createHabit,
    removeHabitFromMonth,
    deleteHabit,
  } = useHabits();

  // Selected date defaults to current date / current month on initial entry
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<'graphs' | 'calendar'>('graphs');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const { formattedTitle } = formatMonthYear(selectedDate);

  // Active habits list filtered for the currently selected month
  const activeHabits = habits.filter((h) => isHabitActiveInMonth(h, currentMonthKey));

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

  // Match habit if URL ID passed
  const matchedHabit = id ? activeHabits.find((h) => h.id === id) : undefined;

  // Sync category and habit selection from URL or defaults
  useEffect(() => {
    if (matchedHabit) {
      const habitCat = matchedHabit.category?.trim() || 'General';
      setSelectedCategory(habitCat);
      setSelectedHabitId(matchedHabit.id);
    } else {
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
      setSelectedHabitId('all');
    }
  }, [id, matchedHabit, categories]);

  const currentCategory = selectedCategory || (categories.length > 0 ? categories[0] : 'General');
  const habitsInCurrentCategory = categoryHabitsMap[currentCategory] || [];

  // Effective habit for single-habit deep dive
  const effectiveHabit =
    selectedHabitId !== 'all'
      ? habitsInCurrentCategory.find((h) => h.id === selectedHabitId) || habitsInCurrentCategory[0]
      : habitsInCurrentCategory[0];

  // Data for single habit
  const {
    habit,
    metrics: singleMetrics,
    isCompleted: isSingleCompleted,
    toggleEntry: toggleSingleEntry,
    updateHabit,
    archiveHabit,
  } = useSingleHabitHistory(effectiveHabit?.id, selectedDate);

  // Data for aggregate category (all habits under current tracker board)
  const {
    daysInMonth,
    habitMetricsMap: aggregateMetricsMap,
    isCompleted: isAggregateCompleted,
    toggleHabitEntry: toggleAggregateEntry,
  } = useDailyHabitsData(selectedDate, currentCategory);

  const getCategoryIcon = (cat: string) => {
    const key = cat.toLowerCase();
    return CATEGORY_ICONS[key] || '📋';
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedHabitId('all');
    navigate('/habit');
  };

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    if (habitId !== 'all') {
      navigate(`/habit/${habitId}`);
    } else {
      navigate('/habit');
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
        `Are you sure you want to permanently delete "${habit.name}" across ALL months?\n\nThis will remove the habit and its logs permanently.\n\nTip: To remove it from ${formattedTitle} only, use the Edit button.`
      )
    ) {
      try {
        await deleteHabit(habit.id);
        setSelectedHabitId('all');
        navigate('/habit');
      } catch (err) {
        console.error('Failed to delete habit:', err);
      }
    }
  };

  const handleRemoveFromMonth = async (habitId: string, monthKey: string) => {
    try {
      await removeHabitFromMonth(habitId, monthKey);
      setSelectedHabitId('all');
      navigate('/habit');
    } catch (err) {
      console.error('Failed to remove habit from month:', err);
    }
  };

  const handleArchive = async () => {
    if (!habit) return;
    if (window.confirm(`Archive "${habit.name}"? Historical logs will be preserved.`)) {
      try {
        await archiveHabit(true);
        setSelectedHabitId('all');
        navigate('/habit');
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
    startMonth?: string;
    endMonth?: string;
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
    startMonth?: string;
    endMonth?: string;
  }) => {
    const newHabit = await createHabit(data);
    setIsCreateModalOpen(false);
    navigate(`/habit/${newHabit.id}`);
  };

  const selectedMonthIdx = selectedDate.getMonth();

  if (habitsLoading) {
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
            Create your first habit to start tracking daily, weekly, and monthly performance graphs.
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Streamlined Unified Header & Navigation Bar */}
      <HabitUnifiedHeader
        categories={categories}
        currentCategory={currentCategory}
        categoryHabitsMap={categoryHabitsMap}
        selectedHabitId={selectedHabitId}
        habitsInCurrentCategory={habitsInCurrentCategory}
        selectedDate={selectedDate}
        formattedMonthTitle={formattedTitle}
        getCategoryIcon={getCategoryIcon}
        onSelectCategory={handleSelectCategory}
        onSelectHabit={handleSelectHabit}
        onMonthChange={handleMonthChange}
        onSelectMonthIndex={handleSelectMonthIndex}
        onSelectYear={handleSelectYear}
        onResetToCurrentMonth={() => setSelectedDate(new Date())}
        onOpenCreateHabitModal={() => setIsCreateModalOpen(true)}
      />

      {/* 3. Main Analytics Content Area */}
      {selectedHabitId === 'all' ? (
        /* A. AGGREGATE ALL HABITS VIEW (Daily, Weekly, Monthly graphs for ALL habits under this title) */
        <CategoryAggregateGraphsView
          categoryName={currentCategory}
          habits={habitsInCurrentCategory}
          daysInMonth={daysInMonth}
          habitMetricsMap={aggregateMetricsMap}
          isCompleted={isAggregateCompleted}
          onToggleEntry={toggleAggregateEntry}
          selectedMonthTitle={formattedTitle}
          onCreateHabit={() => setIsCreateModalOpen(true)}
        />
      ) : (
        /* B. INDIVIDUAL HABIT DEEP DIVE VIEW */
        habit && (
          <div className="space-y-6">
            {/* Habit Header Banner */}
            <div className="bg-surface-container-lowest dark:bg-surface-container p-5 sm:p-6 rounded-2xl border border-outline-variant/15 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

              {/* Right: Actions */}
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

            {/* Metrics Summary Grid for the selected habit */}
            <HabitStatsGrid
              metrics={singleMetrics}
              selectedMonthTitle={MONTH_NAMES[selectedMonthIdx]}
              habitColor={habit.color || '#006398'}
            />

            {/* Graph / Calendar View Switcher Tabs */}
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

            {/* Individual Habit Visualization */}
            {activeAnalyticsView === 'graphs' ? (
              <HabitWeeklyGraphsView
                currentDate={selectedDate}
                onChangeMonth={handleMonthChange}
                isCompleted={isSingleCompleted}
                onToggleDate={toggleSingleEntry}
                habitName={habit.name}
                habitFrequency={habit.frequency}
                goalCount={habit.goalCount}
              />
            ) : (
              <HabitCalendarHeatmap
                currentDate={selectedDate}
                onChangeMonth={handleMonthChange}
                isCompleted={isSingleCompleted}
                onToggleDate={toggleSingleEntry}
                habitColor={habit.color || '#006398'}
                habitName={habit.name}
              />
            )}
          </div>
        )
      )}

      {/* Edit Habit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        habitToEdit={habit}
        currentMonthKey={currentMonthKey}
        formattedMonthTitle={formattedTitle}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        onRemoveFromMonth={handleRemoveFromMonth}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

      {/* Create Habit Modal */}
      <HabitFormModal
        isOpen={isCreateModalOpen}
        defaultCategory={currentCategory}
        currentMonthKey={currentMonthKey}
        formattedMonthTitle={formattedTitle}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateHabit}
      />
    </div>
  );
};
