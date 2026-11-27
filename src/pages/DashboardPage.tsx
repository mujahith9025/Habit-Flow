import React, { useState } from 'react';
import { DateNavigator, formatMonthYear } from '../components/dashboard/DateNavigator';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { TodayFocusCard } from '../components/dashboard/TodayFocusCard';
import { CategoryFilterTabs } from '../components/dashboard/CategoryFilterTabs';
import { ViewTabs } from '../components/dashboard/ViewTabs';
import { DailyTabContent } from '../components/dashboard/DailyTabContent';
import { WeeklyTabContent } from '../components/dashboard/WeeklyTabContent';
import { MonthlyTabContent } from '../components/dashboard/MonthlyTabContent';
import { FloatingActionButton } from '../components/dashboard/FloatingActionButton';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useDailyHabitsData } from '../hooks/useDailyHabitsData';
import { useHabits } from '../hooks/useHabits';
import { DashboardViewTab, Habit, HabitFrequency, isHabitActiveInMonth } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Month/Year navigation state
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Add / Edit Habit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Support native PWA launcher shortcuts (?action=new_habit, ?view=today)
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const view = params.get('view');

      if (action === 'new_habit') {
        setIsModalOpen(true);
        setEditingHabit(null);
      }
      if (view === 'today' || view === 'daily') {
        setActiveTab('daily');
        setSelectedDate(new Date());
      }

      if (action || view) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // Ignore in test or non-browser environments
    }
  }, []);

  const selectedMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const { formattedTitle } = formatMonthYear(selectedDate);

  const {
    habits,
    loading: habitsLoading,
    createHabit,
    updateHabit,
    removeHabitFromMonth,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  // Filter active habits for the selected month
  const activeHabits = habits.filter((h) => isHabitActiveInMonth(h, selectedMonthKey));

  // Group categories
  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    const cat = h.category?.trim() || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categories = Object.keys(categoryCounts).sort();

  // Effective category supports specific selected category or first available board
  const effectiveCategory =
    selectedCategory && categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
      ? selectedCategory
      : categories.length > 0
        ? categories[0]
        : 'General';

  // Live real-time dashboard summary metrics & daily habit data for Today's Focus Card
  const metrics = useDashboardMetrics(selectedMonthKey, effectiveCategory);
  const {
    dailyHabits,
    habitMetricsMap,
    entriesByHabit,
    isCompleted,
    getHabitEntry,
    toggleHabitEntry,
    updateHabitValue,
    toggleHabitPause,
    batchCompleteTodayHabits,
    batchResetTodayHabits,
    saveHabitNote,
  } = useDailyHabitsData(selectedDate, effectiveCategory);

  const handleMonthChange = (offset: number) => {
    setSelectedDate((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
    });
  };

  const handleOpenAddModal = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (data: {
    name: string;
    category?: string;
    frequency: HabitFrequency;
    timeOfDay?: Habit['timeOfDay'];
    habitType?: Habit['habitType'];
    targetValue?: number;
    unit?: string;
    stepValue?: number;
    timerDuration?: number;
    scheduleType?: Habit['scheduleType'];
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
  }) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, {
        name: data.name,
        category: data.category,
        frequency: data.frequency,
        timeOfDay: data.timeOfDay,
        habitType: data.habitType,
        targetValue: data.targetValue,
        unit: data.unit,
        stepValue: data.stepValue,
        timerDuration: data.timerDuration,
        scheduleType: data.scheduleType,
        daysOfWeek: data.daysOfWeek,
        targetDaysPerWeek: data.targetDaysPerWeek,
        tags: data.tags,
        isPaused: data.isPaused,
        pauseStartDate: data.pauseStartDate,
        pauseEndDate: data.pauseEndDate,
        pauseReason: data.pauseReason,
        goalCount: data.goalCount,
        color: data.color,
        startMonth: data.startMonth,
        endMonth: data.endMonth,
      });
    } else {
      await createHabit({
        name: data.name,
        category: data.category || (effectiveCategory !== 'all' ? effectiveCategory : 'General'),
        frequency: data.frequency,
        timeOfDay: data.timeOfDay,
        habitType: data.habitType,
        targetValue: data.targetValue,
        unit: data.unit,
        stepValue: data.stepValue,
        timerDuration: data.timerDuration,
        scheduleType: data.scheduleType,
        daysOfWeek: data.daysOfWeek,
        targetDaysPerWeek: data.targetDaysPerWeek,
        tags: data.tags,
        isPaused: data.isPaused,
        pauseStartDate: data.pauseStartDate,
        pauseEndDate: data.pauseEndDate,
        pauseReason: data.pauseReason,
        goalCount: data.goalCount,
        color: data.color,
        startMonth: data.startMonth,
        endMonth: data.endMonth,
        sortOrder: habits.length,
      });
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId);
  };

  const handleArchiveHabit = async (habitId: string) => {
    await archiveHabit(habitId, true);
  };

  if (habitsLoading && habits.length === 0) {
    return <DashboardSkeleton />;
  }

  const userDisplayName = user?.name || user?.email?.split('@')[0] || '';

  return (
    <div className="w-full max-w-[1180px] mx-auto space-y-6 pb-12">
      {/* 1. Month / Year Navigation Subheader */}
      <div className="flex items-center justify-center w-full">
        <DateNavigator
          currentDate={selectedDate}
          onChangeMonth={handleMonthChange}
          className="w-full max-w-xs sm:max-w-sm"
        />
      </div>

      {/* 2. Inspo Asymmetric Bento Grid: Greeting Section & Summary + Dynamic Today's Tasks Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
        {/* Supporting Bento Tile: Flow Summary & Radial Orbit Gauge (5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 w-full flex flex-col">
          <SummaryCard
            metrics={metrics}
            userName={userDisplayName}
            className="h-full min-h-[220px]"
          />
        </div>

        {/* Lead Bento Tile: Dynamic Today's Focus Checklist (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 w-full flex flex-col">
          <TodayFocusCard
            habits={dailyHabits}
            habitMetricsMap={habitMetricsMap}
            isCompleted={isCompleted}
            categoryName={effectiveCategory === 'all' ? 'All Habits' : effectiveCategory}
            entriesByHabit={entriesByHabit}
            getHabitEntry={getHabitEntry}
            onToggleEntry={toggleHabitEntry}
            onUpdateValue={updateHabitValue}
            onTogglePause={toggleHabitPause}
            onBatchCompleteToday={batchCompleteTodayHabits}
            onBatchResetToday={batchResetTodayHabits}
            onSaveNote={saveHabitNote}
            onAddNewHabit={handleOpenAddModal}
            className="h-full min-h-[220px]"
          />
        </div>
      </div>

      {/* 3. Category / Tracker Board Selector Tabs */}
      <CategoryFilterTabs
        habits={habits}
        selectedCategory={effectiveCategory}
        onSelectCategory={setSelectedCategory}
        onAddNewCategory={handleOpenAddModal}
      />

      {/* 4. View Toggle Tabs (Daily / Weekly / Monthly) */}
      <div className="flex justify-center w-full pt-1">
        <ViewTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* 5. Tab Content: Daily Grid, Weekly Grid, or Monthly Grid */}
      {activeTab === 'daily' && (
        <DailyTabContent
          currentDate={selectedDate}
          selectedCategory={effectiveCategory}
          onEditHabit={handleOpenEditModal}
        />
      )}

      {activeTab === 'weekly' && (
        <WeeklyTabContent
          currentDate={selectedDate}
          selectedCategory={effectiveCategory}
          onEditHabit={handleOpenEditModal}
        />
      )}

      {activeTab === 'monthly' && (
        <MonthlyTabContent
          currentDate={selectedDate}
          selectedCategory={effectiveCategory}
          onEditHabit={handleOpenEditModal}
        />
      )}

      {/* 6. Floating Action Button (FAB) -> Opens Add Habit Modal */}
      <FloatingActionButton onClick={handleOpenAddModal} />

      {/* 7. Add / Edit Habit Modal */}
      <HabitFormModal
        isOpen={isModalOpen}
        habitToEdit={editingHabit}
        defaultCategory={effectiveCategory !== 'all' ? effectiveCategory : undefined}
        currentMonthKey={selectedMonthKey}
        formattedMonthTitle={formattedTitle}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        onRemoveFromMonth={removeHabitFromMonth}
        onDelete={handleDeleteHabit}
        onArchive={handleArchiveHabit}
      />
    </div>
  );
};
