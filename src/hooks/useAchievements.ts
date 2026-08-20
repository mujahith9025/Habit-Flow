import { useMemo } from 'react';
import { Achievement } from '../types';
import { useHabits } from './useHabits';
import { useDashboardMetrics } from './useDashboardMetrics';

export function useAchievements(): {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  completionPercentage: number;
} {
  const { habits } = useHabits();
  const metrics = useDashboardMetrics();

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const currentStreak = metrics.streakCount || 0;
  const completedToday = metrics.completedTodayCount || 0;
  const totalDaily = metrics.totalDailyHabits || 0;
  const isPerfectDay = totalDaily > 0 && completedToday >= totalDaily;
  const isShieldActive = Boolean(metrics.isShieldActive);

  // Retrieve cached total check-in count or calculate
  const totalCheckInsEstimate = useMemo(() => {
    const cached = localStorage.getItem('habitflow_total_checkins');
    const parsed = cached ? parseInt(cached, 10) : 0;
    return Math.max(parsed, completedToday + currentStreak * Math.max(1, activeHabits.length));
  }, [completedToday, currentStreak, activeHabits.length]);

  const achievements: Achievement[] = useMemo(() => {
    const list: Array<Omit<Achievement, 'unlocked' | 'unlockedAt'>> = [
      {
        id: 'first_step',
        title: 'First Step',
        description: 'Log your very first habit check-in.',
        category: 'consistency',
        tier: 'bronze',
        icon: 'footprint',
        badgeEmoji: '🥉',
        target: 1,
        current: Math.min(1, totalCheckInsEstimate > 0 || completedToday > 0 ? 1 : 0),
      },
      {
        id: 'streak_3',
        title: 'Momentum Spark',
        description: 'Build a 3-day continuous habit streak.',
        category: 'streak',
        tier: 'bronze',
        icon: 'local_fire_department',
        badgeEmoji: '✨',
        target: 3,
        current: Math.min(3, currentStreak),
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day unbroken habit streak.',
        category: 'streak',
        tier: 'silver',
        icon: 'military_tech',
        badgeEmoji: '🔥',
        target: 7,
        current: Math.min(7, currentStreak),
      },
      {
        id: 'streak_14',
        title: 'Fortnight of Focus',
        description: 'Reach a 14-day continuous consistency streak.',
        category: 'streak',
        tier: 'gold',
        icon: 'hotel_class',
        badgeEmoji: '⚡',
        target: 14,
        current: Math.min(14, currentStreak),
      },
      {
        id: 'streak_30',
        title: 'Master of Consistency',
        description: 'Achieve a 30-day continuous streak milestone.',
        category: 'streak',
        tier: 'diamond',
        icon: 'workspace_premium',
        badgeEmoji: '👑',
        target: 30,
        current: Math.min(30, currentStreak),
      },
      {
        id: 'perfect_day',
        title: 'Flawless Day',
        description: 'Complete 100% of all daily habits in a single day.',
        category: 'consistency',
        tier: 'silver',
        icon: 'verified',
        badgeEmoji: '🎯',
        target: 1,
        current: isPerfectDay ? 1 : 0,
      },
      {
        id: 'habits_5',
        title: 'Habit Pioneer',
        description: 'Create 5 or more active habits across your routines.',
        category: 'habits',
        tier: 'silver',
        icon: 'dashboard_customize',
        badgeEmoji: '🌟',
        target: 5,
        current: Math.min(5, activeHabits.length),
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Accumulate 100 total habit completions.',
        category: 'consistency',
        tier: 'gold',
        icon: 'stars',
        badgeEmoji: '💯',
        target: 100,
        current: Math.min(100, totalCheckInsEstimate),
      },
      {
        id: 'streak_shield',
        title: 'Gentle Persistence',
        description: 'Protect a rest day using a Streak Shield.',
        category: 'special',
        tier: 'bronze',
        icon: 'shield',
        badgeEmoji: '🛡️',
        target: 1,
        current: isShieldActive ? 1 : 0,
      },
      {
        id: 'analytics_explorer',
        title: 'Insight Seeker',
        description: 'Explore multi-graph performance in Habit View.',
        category: 'special',
        tier: 'bronze',
        icon: 'analytics',
        badgeEmoji: '📊',
        target: 1,
        current: 1, // Granted on viewing analytics
      },
    ];

    return list.map((item) => {
      const unlocked = item.current >= item.target;
      const key = `habitflow_unlocked_${item.id}`;
      let unlockedAt: string | undefined = undefined;

      if (unlocked) {
        let storedDate = localStorage.getItem(key);
        if (!storedDate) {
          storedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          localStorage.setItem(key, storedDate);
        }
        unlockedAt = storedDate;
      }

      return {
        ...item,
        unlocked,
        unlockedAt,
      };
    });
  }, [currentStreak, completedToday, totalDaily, isPerfectDay, activeHabits.length, totalCheckInsEstimate, isShieldActive]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    achievements,
    unlockedCount,
    totalCount,
    completionPercentage,
  };
}
