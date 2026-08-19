import React from 'react';
import { DashboardViewTab } from '../../types';

interface ViewTabsProps {
  activeTab: DashboardViewTab;
  onChangeTab: (tab: DashboardViewTab) => void;
  className?: string;
}

const tabs: { id: DashboardViewTab; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const ViewTabs: React.FC<ViewTabsProps> = ({
  activeTab,
  onChangeTab,
  className = '',
}) => {
  return (
    <div className={`flex justify-center sm:justify-start ${className}`}>
      <div className="bg-surface-container-low dark:bg-surface-container p-1 rounded-full inline-flex border border-outline-variant/15 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`px-5 sm:px-6 py-2 rounded-full font-stat-label text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-surface-container-lowest dark:bg-surface-container-high text-primary dark:text-primary-fixed-dim font-bold shadow-soft scale-100'
                  : 'text-on-surface-variant hover:text-on-surface font-semibold'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
