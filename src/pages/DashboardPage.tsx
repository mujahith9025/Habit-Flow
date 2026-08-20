import React, { useState } from 'react';
import { DateNavigator } from '../components/dashboard/DateNavigator';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { CategoryFilterTabs } from '../components/dashboard/CategoryFilterTabs';
import { ViewTabs } from '../components/dashboard/ViewTabs';
import { DailyTabContent } from '../components/dashboard/DailyTabContent';
import { WeeklyTabContent } from '../components/dashboard/WeeklyTabContent';
import { MonthlyTabContent } from '../components/dashboard/MonthlyTabContent';
import { FloatingActionButton } from '../components/dashboard/FloatingActionButton';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useHabits } from '../hooks/useHabits';
import { DashboardViewTab, Habit, HabitFrequency } from '../types';
import { Link } from 'react-router-dom';

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

  // Effective category defaults to the first available category (no 'all' tab)
  const effectiveCategory = categories.length > 0
    ? (!selectedCategory || selectedCategory === 'all' || !categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
        ? categories[0]
        : selectedCategory)
    : 'General';

  // Live real-time dashboard summary metrics (filtered by category)
  const metrics = useDashboardMetrics(selectedMonthKey, effectiveCategory);

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
    color: string;
    icon: string;
  }) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, {
        name: data.name,
        category: data.category,
        frequency: data.frequency,
        goalCount: data.goalCount,
        color: data.color,
        icon: data.icon,
      });
    } else {
      await createHabit({
        name: data.name,
        category: data.category || (effectiveCategory !== 'all' ? effectiveCategory : 'General'),
        frequency: data.frequency,
        goalCount: data.goalCount,
        color: data.color,
        icon: data.icon,
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

      {/* 2. Top Grid: Summary Card & Gentle Affirmation Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg w-full">
        {/* Summary Card (5 columns on desktop) */}
        <div className="lg:col-span-5 w-full">
          <SummaryCard metrics={metrics} className="h-full min-h-[220px]" />
        </div>

        {/* Visual Affirmation Card (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container shadow-soft border border-outline-variant/15 rounded-xl p-md sm:p-lg flex flex-col justify-between relative overflow-hidden min-h-[220px]">
          {/* Decorative background glow */}
          <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-secondary-container/20 dark:bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-stat-label text-xs font-bold text-secondary dark:text-secondary-fixed uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">spa</span>
                Gentle Persistence
              </span>
              <span className="text-[11px] font-stat-label px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {habits.length} {habits.length === 1 ? 'Habit' : 'Habits'} Active
              </span>
            </div>

            <h3 className="font-section-header text-lg sm:text-xl font-semibold text-on-surface leading-snug mb-2">
              "Small, consistent steps build lasting calm momentum."
            </h3>

            <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-md">
              Focus on today's progress with kindness. Misses are met with grace rather than guilt.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-stat-label text-[11px] text-on-surface-variant uppercase">
                Real-Time Sync Online
              </span>
            </div>

            <Link
              to="/debug"
              className="text-xs font-semibold text-primary dark:text-primary-fixed-dim hover:underline flex items-center gap-1"
            >
              <span>Sync Inspector</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Category / Tracker Board Selector Tabs (Only specific categories) */}
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
