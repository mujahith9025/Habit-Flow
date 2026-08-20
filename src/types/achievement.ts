export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'consistency' | 'habits' | 'special';
  tier: AchievementTier;
  icon: string;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
  badgeEmoji: string;
}
