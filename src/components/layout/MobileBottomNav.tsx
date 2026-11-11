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
    <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-surface-container-lowest/95 dark:bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/40 rounded-full py-1.5 px-3 shadow-[0px_8px_30px_rgba(24,25,27,0.08)] dark:shadow-[0px_8px_30px_rgba(0,0,0,0.4)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold shadow-soft'
                  : 'text-on-surface-variant hover:text-on-surface'
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
