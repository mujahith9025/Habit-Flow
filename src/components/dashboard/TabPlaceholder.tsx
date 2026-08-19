import React from 'react';
import { DashboardViewTab } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

interface TabPlaceholderProps {
  activeTab: DashboardViewTab;
  onSeedHabits?: () => void;
  habitCount: number;
}

export const TabPlaceholder: React.FC<TabPlaceholderProps> = ({
  activeTab,
  onSeedHabits,
  habitCount,
}) => {
  const tabConfig = {
    daily: {
      title: 'Daily Habits Matrix',
      description: 'Your daily check-in grid and habit cards will appear here.',
      icon: 'view_timeline',
      phase: 'Phase B4',
    },
    weekly: {
      title: 'Weekly Progress Overview',
      description: 'Weekly frequency targets and milestone summaries will appear here.',
      icon: 'date_range',
      phase: 'Phase B5',
    },
    monthly: {
      title: 'Monthly Habit Heatmap',
      description: 'Monthly consistency heatmaps and streak analytics will appear here.',
      icon: 'calendar_month',
      phase: 'Phase B5',
    },
  };

  const current = tabConfig[activeTab];

  return (
    <Card variant="elevated" className="py-12 px-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-container/30 text-primary dark:text-primary-fixed-dim mx-auto flex items-center justify-center shadow-soft">
        <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {current.icon}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-section-header text-lg font-bold text-on-surface">
          {current.title}
        </h3>
        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
          {current.description}
        </p>
      </div>

      {habitCount === 0 && onSeedHabits && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSeedHabits}
            leftIcon={<span className="material-symbols-outlined text-[16px]">auto_fix_high</span>}
          >
            Seed Sample Habits
          </Button>
        </div>
      )}

      <div className="pt-2 flex items-center justify-center gap-3 text-xs text-on-surface-variant">
        <span>Content Grid: <strong className="text-primary">{current.phase}</strong></span>
        <span>•</span>
        <Link to="/debug" className="text-primary hover:underline font-semibold font-stat-label uppercase">
          Open Real-Time Sync Inspector &rarr;
        </Link>
      </div>
    </Card>
  );
};
