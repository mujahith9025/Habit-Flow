import { Habit, HabitEntry, isEntryCompleted } from '../types/habit';
import { MonthDayInfo } from '../hooks/useDailyHabitsData';

export interface FlowForecastResult {
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  isFutureMonth: boolean;
  daysElapsed: number;
  daysRemaining: number;
  completedToDate: number;
  currentRatePercent: number;
  trailingDailyVelocity: number; // Avg checks per day across all habits in trailing 7 days
  projectedTotalChecks: number;
  projectedRatePercent: number;
  is80TargetSecured: boolean;
  target80Delta: number; // +/- difference vs 80% benchmark
  requiredDailyPaceFor80: number; // Checks/day needed in remaining days to hit 80%
  activeShieldsCount: number;
  consumedShieldsCount: number;
  naturalLanguageInsight: string;
}

export function calculateFlowForecast(
  habits: Habit[],
  entriesByHabit: Record<string, Record<string, HabitEntry>>,
  daysInMonth: MonthDayInfo[],
  selectedDate: Date
): FlowForecastResult {
  const totalHabits = habits.length;
  const totalDaysInMonth = daysInMonth.length;
  const totalPossibleChecks = Math.max(totalHabits * totalDaysInMonth, 1);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const todayDayNum = now.getDate();

  const selYear = selectedDate.getFullYear();
  const selMonthIdx = selectedDate.getMonth();

  const isCurrentMonth = selYear === currentYear && selMonthIdx === currentMonthIdx;
  const isPastMonth =
    selYear < currentYear || (selYear === currentYear && selMonthIdx < currentMonthIdx);
  const isFutureMonth =
    selYear > currentYear || (selYear === currentYear && selMonthIdx > currentMonthIdx);

  // 1. Calculate completions for each day in this month
  const dailyCompletions: Record<number, number> = {};
  let totalCompletionsAcrossMonth = 0;

  daysInMonth.forEach((d) => {
    let dayDone = 0;
    habits.forEach((h) => {
      const entry = entriesByHabit[h.id]?.[d.dateKey];
      if (isEntryCompleted(h, entry)) {
        dayDone++;
      }
    });
    dailyCompletions[d.dayNum] = dayDone;
    totalCompletionsAcrossMonth += dayDone;
  });

  // Calculate Grace Days / Shields
  let activeShields = 0;
  let consumedShields = 0;
  habits.forEach((h) => {
    if (h.isPaused) activeShields++;
  });

  if (isPastMonth) {
    const finalRate = Math.min(100, Math.round((totalCompletionsAcrossMonth / totalPossibleChecks) * 100));
    const target80Delta = finalRate - 80;
    return {
      isCurrentMonth: false,
      isPastMonth: true,
      isFutureMonth: false,
      daysElapsed: totalDaysInMonth,
      daysRemaining: 0,
      completedToDate: totalCompletionsAcrossMonth,
      currentRatePercent: finalRate,
      trailingDailyVelocity: Number((totalCompletionsAcrossMonth / totalDaysInMonth).toFixed(1)),
      projectedTotalChecks: totalCompletionsAcrossMonth,
      projectedRatePercent: finalRate,
      is80TargetSecured: finalRate >= 80,
      target80Delta,
      requiredDailyPaceFor80: 0,
      activeShieldsCount: activeShields,
      consumedShieldsCount: consumedShields,
      naturalLanguageInsight:
        finalRate >= 80
          ? `Archived with excellence: Finished at ${finalRate}% consistency, surpassing the 80% Flow benchmark by +${target80Delta}%.`
          : `Historical milestone: Logged ${totalCompletionsAcrossMonth} checks, closing the month at ${finalRate}%.`,
    };
  }

  if (isFutureMonth) {
    return {
      isCurrentMonth: false,
      isPastMonth: false,
      isFutureMonth: true,
      daysElapsed: 0,
      daysRemaining: totalDaysInMonth,
      completedToDate: 0,
      currentRatePercent: 0,
      trailingDailyVelocity: 0,
      projectedTotalChecks: 0,
      projectedRatePercent: 0,
      is80TargetSecured: false,
      target80Delta: -80,
      requiredDailyPaceFor80: Number(((totalPossibleChecks * 0.8) / totalDaysInMonth).toFixed(1)),
      activeShieldsCount: activeShields,
      consumedShieldsCount: 0,
      naturalLanguageInsight: `Upcoming cycle: Maintaining an average of ${((totalPossibleChecks * 0.8) / totalDaysInMonth).toFixed(1)} check-ins/day will secure the 80% Flow threshold.`,
    };
  }

  // Current Active Month
  const daysElapsed = Math.min(todayDayNum, totalDaysInMonth);
  const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);

  let completedToDate = 0;
  for (let d = 1; d <= daysElapsed; d++) {
    completedToDate += dailyCompletions[d] || 0;
  }

  const possibleChecksToDate = Math.max(daysElapsed * totalHabits, 1);
  const currentRatePercent = Math.min(100, Math.round((completedToDate / possibleChecksToDate) * 100));

  // Trailing velocity (up to 7 days)
  const windowDays = Math.min(7, daysElapsed);
  let trailingSum = 0;
  for (let i = 0; i < windowDays; i++) {
    const dayIndex = daysElapsed - i;
    trailingSum += dailyCompletions[dayIndex] || 0;
  }
  const trailingVelocity = windowDays > 0 ? Number((trailingSum / windowDays).toFixed(1)) : 0;

  // Projection
  const projectedRemainingChecks = Math.round(trailingVelocity * daysRemaining);
  const projectedTotalChecks = Math.min(totalPossibleChecks, completedToDate + projectedRemainingChecks);
  const projectedRatePercent = Math.min(100, Math.round((projectedTotalChecks / totalPossibleChecks) * 100));

  const target80Checks = Math.ceil(totalPossibleChecks * 0.8);
  const is80TargetSecured = projectedRatePercent >= 80;
  const target80Delta = projectedRatePercent - 80;

  const checksNeededFor80 = Math.max(0, target80Checks - completedToDate);
  const requiredDailyPaceFor80 =
    daysRemaining > 0 ? Number((checksNeededFor80 / daysRemaining).toFixed(1)) : 0;

  let naturalLanguageInsight = '';
  if (is80TargetSecured) {
    naturalLanguageInsight = `🌟 80% Flow Benchmark Secured: At your trailing pace of ${trailingVelocity} checks/day, you are on course to finish at ${projectedRatePercent}% (+${target80Delta}% above target).`;
  } else if (daysRemaining > 0) {
    naturalLanguageInsight = `⚡ Velocity Needed: You are tracking toward ${projectedRatePercent}%. Aim for ${requiredDailyPaceFor80} check-ins/day over the remaining ${daysRemaining} days to lock in 80% Flow.`;
  } else {
    naturalLanguageInsight = `Final day of cycle: Current consistency is locked at ${currentRatePercent}%.`;
  }

  return {
    isCurrentMonth,
    isPastMonth: false,
    isFutureMonth: false,
    daysElapsed,
    daysRemaining,
    completedToDate,
    currentRatePercent,
    trailingDailyVelocity: trailingVelocity,
    projectedTotalChecks,
    projectedRatePercent,
    is80TargetSecured,
    target80Delta,
    requiredDailyPaceFor80,
    activeShieldsCount: activeShields,
    consumedShieldsCount: consumedShields,
    naturalLanguageInsight,
  };
}
