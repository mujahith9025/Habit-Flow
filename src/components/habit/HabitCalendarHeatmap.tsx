import React from 'react';
import { YearInPixelsHeatmap } from './YearInPixelsHeatmap';

export interface HabitCalendarHeatmapProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  isCompleted: (dateKey: string) => boolean;
  onToggleDate: (dateKey: string) => void;
  habitColor?: string;
  habitName: string;
  className?: string;
}

export const HabitCalendarHeatmap: React.FC<HabitCalendarHeatmapProps> = ({
  currentDate,
  onChangeMonth,
  isCompleted,
  onToggleDate,
  habitColor = '#2D5A34',
  habitName,
  className = '',
}) => {
  const handleChangeDate = (newDate: Date) => {
    // Compute month offset between currentDate and newDate
    const currentTotalMonths = currentDate.getFullYear() * 12 + currentDate.getMonth();
    const newTotalMonths = newDate.getFullYear() * 12 + newDate.getMonth();
    const monthDiff = newTotalMonths - currentTotalMonths;
    if (monthDiff !== 0) {
      onChangeMonth(monthDiff);
    }
  };

  return (
    <YearInPixelsHeatmap
      currentDate={currentDate}
      onChangeDate={handleChangeDate}
      isCompleted={isCompleted}
      onToggleDate={onToggleDate}
      habitColor={habitColor}
      habitName={habitName}
      defaultZoom="month"
      className={className}
    />
  );
};
