import React from 'react';
import { NavLink } from 'react-router-dom';

export const MobileBottomNav: React.FC = () => {
  const navTabs = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/habit', label: 'Habit', icon: 'task_alt' },
    { to: '/expenses', label: 'Expenses', icon: 'account_balance_wallet' },
    { to: '/settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 dark:bg-surface-container/90 backdrop-blur-lg border-t border-outline-variant/20 px-container-padding py-2 pb-safe shadow-[0px_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="font-stat-label text-[10px] mt-0.5 tracking-normal">
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
