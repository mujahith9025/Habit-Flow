import React from 'react';
import { useDailyHabitsData } from '../../hooks/useDailyHabitsData';
import { DailyHabitsGrid } from './DailyHabitsGrid';
import { TopHabitsList } from './TopHabitsList';
import { formatMonthYear } from './DateNavigator';
import { Habit } from '../../types';

interface DailyTabContentProps {
  currentDate: Date;
  selectedCategory?: string;
  onEditHabit?: (habit: Habit) => void;
}

export const DailyTabContent: React.FC<DailyTabContentProps> = ({
  currentDate,
  selectedCategory = 'all',
  onEditHabit,
}) => {
  const {
    dailyHabits,
    daysInMonth,
    habitMetricsMap,
    topHabits,
    isCompleted,
    getHabitEntry,
    toggleHabitEntry,
    seedHabits,
  } = useDailyHabitsData(currentDate, selectedCategory);

  const { formattedTitle } = formatMonthYear(currentDate);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Sticky Daily Habits Grid */}
      <DailyHabitsGrid
        dailyHabits={dailyHabits}
        daysInMonth={daysInMonth}
        habitMetricsMap={habitMetricsMap}
        isCompleted={isCompleted}
        getHabitEntry={getHabitEntry}
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
