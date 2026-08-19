import React from 'react';
import { useWeeklyHabitsData } from '../../hooks/useWeeklyHabitsData';
import { WeeklyHabitsGrid } from './WeeklyHabitsGrid';
import { formatMonthYear } from './DateNavigator';
import { Habit } from '../../types';

interface WeeklyTabContentProps {
  currentDate: Date;
  onEditHabit: (habit: Habit) => void;
}

export const WeeklyTabContent: React.FC<WeeklyTabContentProps> = ({
  currentDate,
  onEditHabit,
}) => {
  const {
    weeklyHabits,
    habitMetricsMap,
    isCompleted,
    toggleWeeklyEntry,
    seedHabits,
  } = useWeeklyHabitsData(currentDate);

  const { formattedTitle } = formatMonthYear(currentDate);

  return (
    <div className="space-y-6 animate-fadeIn">
      <WeeklyHabitsGrid
        weeklyHabits={weeklyHabits}
        habitMetricsMap={habitMetricsMap}
        isCompleted={isCompleted}
        onToggleWeeklyEntry={toggleWeeklyEntry}
        onEditHabit={onEditHabit}
        onSeedHabits={() => seedHabits().catch(console.error)}
        formattedMonthTitle={formattedTitle}
      />
    </div>
  );
};
