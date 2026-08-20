import React, { useState } from 'react';
import { DateNavigator } from '../components/dashboard/DateNavigator';
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
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useDailyHabitsData } from '../hooks/useDailyHabitsData';
import { useHabits } from '../hooks/useHabits';
import { DashboardViewTab, Habit, HabitFrequency } from '../types';

export const DashboardPage: React.FC = () => {
  // Month/Year navigation state
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Add / Edit Habit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const selectedMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

  const { habits, loading: habitsLoading, createHabit, updateHabit, archiveHabit } = useHabits();

  const activeHabits = habits.filter((h) => !h.archived);

  // Group categories
  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    const cat = h.category?.trim() || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categories = Object.keys(categoryCounts).sort();

  // Effective category defaults to the first available category
  const effectiveCategory = categories.length > 0
    ? (!selectedCategory || selectedCategory === 'all' || !categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
        ? categories[0]
        : selectedCategory)
    : 'General';

  // Live real-time dashboard summary metrics & daily habit data for Today's Focus Card
  const metrics = useDashboardMetrics(selectedMonthKey, effectiveCategory);
  const {
    dailyHabits,
    habitMetricsMap,
    isCompleted,
    toggleHabitEntry,
  } = useDailyHabitsData(selectedDate, effectiveCategory);

  const handleMonthChange = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
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
    goalCount: number;
    color?: string;
    icon?: string;
  }) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, {
        name: data.name,
        category: data.category,
        frequency: data.frequency,
        goalCount: data.goalCount,
        color: data.color,
      });
    } else {
      await createHabit({
        name: data.name,
        category: data.category || (effectiveCategory !== 'all' ? effectiveCategory : 'General'),
        frequency: data.frequency,
        goalCount: data.goalCount,
        color: data.color,
        sortOrder: habits.length,
      });
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    await archiveHabit(habitId, true);
  };

  if (habitsLoading && habits.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6 pb-12">
      {/* 1. Month / Year Navigation Subheader */}
      <div className="flex items-center justify-center w-full">
        <DateNavigator
          currentDate={selectedDate}
          onChangeMonth={handleMonthChange}
          className="w-full max-w-xs sm:max-w-sm"
        />
      </div>

      {/* 2. Top Grid: Summary Card & Dynamic Today's Focus Action Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg w-full">
        {/* Summary Card (5 columns on desktop) */}
        <div className="lg:col-span-5 w-full">
          <SummaryCard metrics={metrics} className="h-full min-h-[220px]" />
        </div>

        {/* Dynamic Today's Focus Card (7 columns on desktop) */}
        <div className="lg:col-span-7 w-full">
          <TodayFocusCard
            habits={dailyHabits}
            habitMetricsMap={habitMetricsMap}
            isCompleted={isCompleted}
            onToggleEntry={toggleHabitEntry}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        onArchive={handleArchiveHabit}
      />
    </div>
  );
};
