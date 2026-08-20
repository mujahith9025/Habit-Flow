// Dynamic time-of-day and progress-aware gentle affirmations

export interface AffirmationState {
  completedCount: number;
  totalCount: number;
  maxStreak?: number;
}

const MORNING_QUOTES = [
  'Small daily improvements over time lead to stunning results.',
  'A gentle morning start. Focus on showing up today.',
  'Consistency is built one small habit at a time.',
  'Today is a fresh canvas for your positive routines.',
  'Gentle persistence beats aggressive perfection every time.',
];

const AFTERNOON_QUOTES = [
  'Keep the calm momentum going through your day.',
  'Every check-in is an investment in your future self.',
  'Pause, breathe, and honor your gentle progress.',
  'Steady progress is lasting progress.',
];

const EVENING_QUOTES = [
  'Reflect on today’s efforts with gratitude.',
  'You showed up today—that is what counts.',
  'Rest well knowing you nurtured your habits today.',
  'A peaceful evening to recharge for tomorrow.',
];

export function getGentleAffirmation(state: AffirmationState): {
  headline: string;
  quote: string;
  badge?: string;
  isComplete?: boolean;
} {
  const { completedCount, totalCount, maxStreak = 0 } = state;
  const hour = new Date().getHours();

  // 1. All habits completed today (100% completion)
  if (totalCount > 0 && completedCount >= totalCount) {
    return {
      headline: 'Perfect Day Achieved! 🎉',
      quote: 'Outstanding consistency! You completed all your habits for today. Rest and recharge.',
      badge: '100% COMPLETE',
      isComplete: true,
    };
  }

  // 2. Only 1 habit left
  if (totalCount > 1 && totalCount - completedCount === 1) {
    return {
      headline: 'Almost There! ⚡',
      quote: 'Just 1 habit remaining to complete today’s routine. You’ve got this gentle momentum!',
      badge: '1 HABIT LEFT',
    };
  }

  // 3. Great Streak Milestone
  if (maxStreak >= 7 && completedCount > 0) {
    return {
      headline: `${maxStreak}-Day Streak Active! 🔥`,
      quote: 'Your persistence is compounding day by day. Keep this gentle rhythm alive.',
      badge: `${maxStreak}D STREAK`,
    };
  }

  // 4. In-progress during the day
  if (completedCount > 0) {
    return {
      headline: 'Great Momentum ✨',
      quote: `${completedCount} of ${totalCount} habits completed today. Keep moving forward gently.`,
      badge: `${Math.round((completedCount / totalCount) * 100)}% DONE`,
    };
  }

  // 5. Time-of-day morning / afternoon / evening greeting when starting at 0%
  if (hour >= 4 && hour < 12) {
    const quote = MORNING_QUOTES[Math.floor(Math.random() * MORNING_QUOTES.length)];
    return {
      headline: 'Good Morning 🌅',
      quote,
    };
  }

  if (hour >= 12 && hour < 17) {
    const quote = AFTERNOON_QUOTES[Math.floor(Math.random() * AFTERNOON_QUOTES.length)];
    return {
      headline: 'Good Afternoon ☀️',
      quote,
    };
  }

  const quote = EVENING_QUOTES[Math.floor(Math.random() * EVENING_QUOTES.length)];
  return {
    headline: 'Gentle Reflection 🌙',
    quote,
  };
}
