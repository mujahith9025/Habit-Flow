import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useSingleHabitHistory } from '../hooks/useSingleHabitHistory';
import { HabitStatsGrid } from '../components/habit/HabitStatsGrid';
import { HabitCalendarHeatmap } from '../components/habit/HabitCalendarHeatmap';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, loading: habitsLoading, createHabit } = useHabits();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active habits list
  const activeHabits = habits.filter((h) => !h.archived);

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

  const {
    habit,
    metrics,
    loading: historyLoading,
    isCompleted,
    toggleEntry,
    updateHabit,
    archiveHabit,
  } = useSingleHabitHistory(effectiveHabitId, selectedDate);

  const handleMonthChange = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
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

  if (habitsLoading || historyLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="font-body-text text-sm text-on-surface-variant">
          Loading habit progress and history...
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
            Create your first habit to start tracking daily consistency and calendar heatmaps.
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
      {/* 1. Habit Switcher Bar */}
      {activeHabits.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-stat-label text-on-surface-variant shrink-0 uppercase tracking-wider">
            Habits:
          </span>
          {activeHabits.map((h) => {
            const isSelected = h.id === habit.id;
            return (
              <button
                key={h.id}
                onClick={() => navigate(`/habit/${h.id}`)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-soft'
                    : 'bg-surface-container-lowest dark:bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                <span className="truncate max-w-[140px]">{h.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            title="Create another habit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container-lowest dark:bg-surface-container text-primary hover:bg-primary-fixed/20 border border-outline-variant/20 transition-all shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New</span>
          </button>
        </div>
      )}

      {/* 2. Habit Header Banner */}
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>Edit Habit</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="text-error hover:bg-error-container/20 px-3"
            title="Archive Habit"
          >
            <span className="material-symbols-outlined text-[18px]">archive</span>
          </Button>
        </div>
      </div>

      {/* 3. Metrics Summary Grid */}
      <HabitStatsGrid metrics={metrics} habitColor={habit.color || '#006398'} />

      {/* 4. Monthly Calendar Activity Heatmap */}
      <HabitCalendarHeatmap
        currentDate={selectedDate}
        onChangeMonth={handleMonthChange}
        isCompleted={isCompleted}
        onToggleDate={toggleEntry}
        habitColor={habit.color || '#006398'}
        habitName={habit.name}
      />

      {/* Edit Habit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        habitToEdit={habit}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        onArchive={handleArchive}
      />

      {/* Create Habit Modal */}
      <HabitFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateHabit}
      />
    </div>
  );
};
