import React from 'react';

interface HabitAriaLiveNarrativeProps {
  monthTitle: string;
  categoryName: string;
  completionRate: number;
  totalChecks: number;
  longestStreak: number;
  peakDayName: string;
  isSingleHabit?: boolean;
  habitName?: string;
}

export const HabitAriaLiveNarrative: React.FC<HabitAriaLiveNarrativeProps> = ({
  monthTitle,
  categoryName,
  completionRate,
  totalChecks,
  longestStreak,
  peakDayName,
  isSingleHabit,
  habitName,
}) => {
  const targetName = isSingleHabit && habitName ? habitName : `${categoryName} tracker board`;

  const narrative = `Monthly habit report for ${targetName} in ${monthTitle}. Overall completion rate is ${completionRate} percent with ${totalChecks} total checks logged. Longest unbroken streak is ${longestStreak} days. Your peak consistency day is ${peakDayName}. ${
    completionRate >= 80
      ? 'Congratulations, you have crossed the 80 percent flow benchmark.'
      : 'Keep building momentum to reach the 80 percent flow state threshold.'
  }`;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="habit-aria-narrative"
    >
      {narrative}
    </div>
  );
};
