import { Habit, HabitEntry } from '../types';
import { HabitGridMetrics } from '../hooks/useDailyHabitsData';
import { getBotanicalRank } from './botanicalRank';

export interface PlainEnglishStory {
  monthTitle: string;
  categoryName: string;
  overallRate: number;
  totalChecks: number;
  totalHabits: number;

  // 1. "How did I do this month?"
  performanceHeadline: string;
  performanceStory: string;
  performanceBadge: string;

  // 2. "Where did I stumble?"
  frictionHeadline: string;
  frictionStory: string;
  frictionRemedy: string;
  frictionHabitName?: string;

  // 3. "What's my next milestone?"
  milestoneHeadline: string;
  milestoneStory: string;
  milestoneAction: string;
  milestoneHabitName?: string;
  daysToMilestone: number;
}

export function generatePlainEnglishStory(
  habits: Habit[],
  habitMetricsMap: Record<string, HabitGridMetrics>,
  entriesByHabit: Record<string, Record<string, HabitEntry>>,
  daysInMonth: { dayNum: number; dateKey: string; isToday: boolean }[],
  selectedDate: Date,
  categoryName: string
): PlainEnglishStory {
  const activeHabits = habits.filter((h) => !h.archived);
  const totalHabits = activeHabits.length;
  const monthTitle = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (totalHabits === 0) {
    return {
      monthTitle,
      categoryName,
      overallRate: 0,
      totalChecks: 0,
      totalHabits: 0,
      performanceHeadline: 'Starting Your Journey',
      performanceStory: `No active habits logged yet for ${monthTitle}. Create your first intention to start building neural scaffolding.`,
      performanceBadge: 'Fresh Canvas',
      frictionHeadline: 'No Obstacles Detected',
      frictionStory: 'You are at the starting line. The secret to beginning is making the first step ridiculously easy.',
      frictionRemedy: 'Choose 1 micro-habit that takes less than 2 minutes.',
      milestoneHeadline: 'First Habit Milestone',
      milestoneStory: 'Log your first 3 consecutive check-ins to unlock the Seedling intention badge.',
      milestoneAction: 'Create a habit and check it off today.',
      daysToMilestone: 3,
    };
  }

  // 1. Overall Consistency & Performance
  const habitKeys = Object.keys(habitMetricsMap);
  const sumRates = habitKeys.reduce((acc, hid) => acc + (habitMetricsMap[hid]?.monthProgressPercent || 0), 0);
  const overallRate = habitKeys.length > 0 ? Math.round(sumRates / habitKeys.length) : 0;
  const totalChecks = habitKeys.reduce((acc, hid) => acc + (habitMetricsMap[hid]?.completedCount || 0), 0);

  let performanceHeadline = 'Building Momentum';
  let performanceStory = `You completed ${totalChecks} check-ins with an overall consistency rate of ${overallRate}%.`;
  let performanceBadge = 'In Progress';

  if (overallRate >= 85) {
    performanceHeadline = 'Flawless Flow State';
    performanceStory = `Exceptional consistency! You achieved an ${overallRate}% completion rate across all ${totalHabits} habits in ${categoryName}. Your habits are operating on subconscious autopilot.`;
    performanceBadge = 'Mastery Flow';
  } else if (overallRate >= 80) {
    performanceHeadline = '80% Sweet Spot Achieved';
    performanceStory = `You hit ${overallRate}% consistency, crossing the optimal 80% flow benchmark for lasting habit automaticity without cognitive burnout.`;
    performanceBadge = '80% Flow';
  } else if (overallRate >= 65) {
    performanceHeadline = 'Solid Steady Progress';
    performanceStory = `You logged ${totalChecks} total checks with a ${overallRate}% consistency rate. You established a resilient foundation with room for life’s unexpected demands.`;
    performanceBadge = 'Steady Pace';
  } else if (overallRate >= 50) {
    performanceHeadline = 'Developing Habit Intention';
    performanceStory = `You completed ${overallRate}% of your planned habits. Your brain is laying the first synaptic pathways—focus on never missing two days in a row.`;
    performanceBadge = 'Forming Routine';
  } else {
    performanceHeadline = 'Rebuilding Daily Momentum';
    performanceStory = `You achieved ${overallRate}% consistency this month. Low friction is key when rebuilding—simplify your targets to get quick wins.`;
    performanceBadge = 'Reset Stage';
  }

  // 2. "Where did I stumble?" (Friction Analysis: Weekday vs Weekend, or lowest habit)
  let weekdayChecks = 0;
  let weekdayTotal = 0;
  let weekendChecks = 0;
  let weekendTotal = 0;

  daysInMonth.forEach((d) => {
    const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d.dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    activeHabits.forEach((h) => {
      const entry = entriesByHabit[h.id]?.[d.dateKey];
      if (isWeekend) {
        weekendTotal++;
        if (entry?.completed) weekendChecks++;
      } else {
        weekdayTotal++;
        if (entry?.completed) weekdayChecks++;
      }
    });
  });

  const weekdayRate = weekdayTotal > 0 ? Math.round((weekdayChecks / weekdayTotal) * 100) : 0;
  const weekendRate = weekendTotal > 0 ? Math.round((weekendChecks / weekendTotal) * 100) : 0;
  const weekendDip = weekdayRate - weekendRate;

  // Find lowest performing habit
  let lowestHabit: Habit | null = null;
  let lowestRate = 101;

  activeHabits.forEach((h) => {
    const rate = habitMetricsMap[h.id]?.monthProgressPercent ?? 0;
    if (rate < lowestRate) {
      lowestRate = rate;
      lowestHabit = h;
    }
  });

  let frictionHeadline = 'Weekend Routine Dip';
  let frictionStory = `Weekend consistency dropped to ${weekendRate}% compared to ${weekdayRate}% on weekdays (a ${weekendDip}% dip).`;
  let frictionRemedy = 'Weekend schedules lack the natural anchors of workdays. Try tying weekend habits to your morning coffee or breakfast ritual.';
  let frictionHabitName = lowestHabit ? (lowestHabit as Habit).name : undefined;

  if (weekendDip >= 25) {
    frictionHeadline = 'Significant Weekend Dip';
    frictionStory = `Weekends showed a noticeable ${weekendDip}% drop (${weekendRate}% vs ${weekdayRate}% weekdays).`;
    frictionRemedy = 'Create a dedicated "Weekend Version" with smaller goal counts to preserve your unbroken chain.';
  } else if (lowestHabit && lowestRate < 60) {
    frictionHeadline = `${(lowestHabit as Habit).name} Needs Gentler Anchoring`;
    frictionStory = `"${(lowestHabit as Habit).name}" had the most friction this month with a ${lowestRate}% completion rate.`;
    frictionRemedy = 'Scale this habit down to its 2-minute micro-version to eliminate resistance and rebuild momentum.';
  } else {
    frictionHeadline = 'Balanced Schedule Resilience';
    frictionStory = `Your weekday (${weekdayRate}%) and weekend (${weekendRate}%) momentum stayed remarkably balanced with minimal dip.`;
    frictionRemedy = 'Maintain your current cue-routine timing; your habit stack is well synchronized.';
  }

  // 3. "What's my next milestone?"
  let bestHabitForMilestone: Habit = activeHabits[0];
  let maxStreak = 0;
  let daysRemainingToMilestone = 7;

  activeHabits.forEach((h) => {
    const streak = habitMetricsMap[h.id]?.streakCount || 0;
    if (streak > maxStreak) {
      maxStreak = streak;
      bestHabitForMilestone = h;
    }
  });

  const rank = getBotanicalRank(maxStreak);
  if (rank.daysToNextRank > 0) {
    daysRemainingToMilestone = rank.daysToNextRank;
  } else {
    daysRemainingToMilestone = 10;
  }

  const milestoneHeadline = `${bestHabitForMilestone.name}: ${daysRemainingToMilestone} Days to ${rank.daysToNextRank > 0 ? 'Next Rank' : 'New Record'}`;
  const milestoneStory = `"${bestHabitForMilestone.name}" holds your strongest current momentum with an unbroken ${maxStreak}-day streak (${rank.icon} ${rank.label} Tier).`;
  const milestoneAction = `Check in for ${daysRemainingToMilestone} more consecutive days to unlock the ${rank.daysToNextRank > 0 ? (rank.key === 'seedling' ? 'Sprout' : rank.key === 'sprout' ? 'Evergreen' : 'Ancient Oak') : 'Century Milestone'}.`;

  return {
    monthTitle,
    categoryName,
    overallRate,
    totalChecks,
    totalHabits,
    performanceHeadline,
    performanceStory,
    performanceBadge,
    frictionHeadline,
    frictionStory,
    frictionRemedy,
    frictionHabitName,
    milestoneHeadline,
    milestoneStory,
    milestoneAction,
    milestoneHabitName: bestHabitForMilestone.name,
    daysToMilestone: daysRemainingToMilestone,
  };
}
