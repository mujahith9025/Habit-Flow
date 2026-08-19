import React from 'react';
import { useMonthlyHabitsData } from '../../hooks/useMonthlyHabitsData';
import { MonthlyHabitsGrid } from './MonthlyHabitsGrid';
import { formatMonthYear } from './DateNavigator';
import { Habit } from '../../types';

interface MonthlyTabContentProps {
  currentDate: Date;
  onEditHabit: (habit: Habit) => void;
}

export const MonthlyTabContent: React.FC<MonthlyTabContentProps> = ({
  currentDate,
  onEditHabit,
}) => {
  const {
    monthlyHabits,
    habitMetricsMap,
    isCompleted,
    toggleMonthlyEntry,
    seedHabits,
  } = useMonthlyHabitsData(currentDate);

  const { formattedTitle } = formatMonthYear(currentDate);

  return (
    <div className="space-y-6 animate-fadeIn">
      <MonthlyHabitsGrid
        monthlyHabits={monthlyHabits}
        habitMetricsMap={habitMetricsMap}
        isCompleted={isCompleted}
        onToggleMonthlyEntry={toggleMonthlyEntry}
        onEditHabit={onEditHabit}
        onSeedHabits={() => seedHabits().catch(console.error)}
        formattedMonthTitle={formattedTitle}
      />
    </div>
  );
};
