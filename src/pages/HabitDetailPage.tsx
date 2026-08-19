import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSingleHabitHistory } from '../hooks/useSingleHabitHistory';
import { HabitStatsGrid } from '../components/habit/HabitStatsGrid';
import { HabitCalendarHeatmap } from '../components/habit/HabitCalendarHeatmap';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 7, 19));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    habit,
    metrics,
    loading,
    isCompleted,
    toggleEntry,
    updateHabit,
    archiveHabit,
  } = useSingleHabitHistory(id, selectedDate);

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

  const handleSaveModal = async (data: {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    goalCount: number;
    color: string;
    icon: string;
  }) => {
    await updateHabit(data);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="font-body-text text-sm text-on-surface-variant">
          Loading habit progress and history...
        </p>
      </div>
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
          This habit may have been archived or does not exist.
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header with Back Button & Habit Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/dashboard"
            aria-label="Back to Dashboard"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>

          {/* Habit Icon Container */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-soft shrink-0"
            style={{ backgroundColor: habit.color || '#006398' }}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {habit.icon || 'energy_savings_leaf'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
                {habit.name}
              </h1>
              <Badge variant="primary" size="sm" className="capitalize">
                {habit.frequency}
              </Badge>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
              Goal: {habit.goalCount} {habit.frequency === 'daily' ? 'time per day' : 'times per period'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<span className="material-symbols-outlined text-[16px]">edit</span>}
          >
            Edit Habit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="text-error hover:bg-error-container/20"
            leftIcon={<span className="material-symbols-outlined text-[16px]">archive</span>}
          >
            Archive
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Grid (Current Streak, Longest Streak, Monthly %, Lifetime) */}
      <HabitStatsGrid metrics={metrics} habitColor={habit.color} />

      {/* 3. Monthly Calendar Heatmap */}
      <HabitCalendarHeatmap
        currentDate={selectedDate}
        onChangeMonth={handleMonthChange}
        isCompleted={isCompleted}
        onToggleDate={toggleEntry}
        habitColor={habit.color}
        habitName={habit.name}
      />

      {/* 4. Edit Habit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        habitToEdit={habit}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveModal}
        onArchive={async () => {
          await archiveHabit(true);
          navigate('/dashboard');
        }}
      />
    </div>
  );
};
