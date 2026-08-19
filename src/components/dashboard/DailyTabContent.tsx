import React from 'react';
import { useDailyHabitsData } from '../../hooks/useDailyHabitsData';
import { DailyHabitsGrid } from './DailyHabitsGrid';
import { TopHabitsList } from './TopHabitsList';
import { formatMonthYear } from './DateNavigator';
import { Habit } from '../../types';

interface DailyTabContentProps {
  currentDate: Date;
  onEditHabit?: (habit: Habit) => void;
}

export const DailyTabContent: React.FC<DailyTabContentProps> = ({
  currentDate,
  onEditHabit,
}) => {
  const {
    dailyHabits,
    daysInMonth,
    habitMetricsMap,
    topHabits,
    isCompleted,
    toggleHabitEntry,
    seedHabits,
  } = useDailyHabitsData(currentDate);

  const { formattedTitle } = formatMonthYear(currentDate);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Sticky Daily Habits Grid */}
      <DailyHabitsGrid
        dailyHabits={dailyHabits}
        daysInMonth={daysInMonth}
        habitMetricsMap={habitMetricsMap}
        isCompleted={isCompleted}
        onToggleEntry={toggleHabitEntry}
        onEditHabit={onEditHabit}
        onSeedHabits={() => seedHabits().catch(console.error)}
        formattedMonthTitle={formattedTitle}
      />

      {/* 2. Top Habits Ranked Section */}
      <TopHabitsList topHabits={topHabits} />
    </div>
  );
};
