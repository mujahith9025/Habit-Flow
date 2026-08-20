import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';

export const DesktopSidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { habits } = useHabits();
  const navigate = useNavigate();

  const activeHabits = habits.filter((h) => !h.archived);

  // Distinct tracker categories with habit counts
  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    const cat = h.category?.trim() || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categories = Object.keys(categoryCounts).sort();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/habit', label: 'Habit View', icon: 'task_alt' },
    { to: '/debug', label: 'Real-time Sync', icon: 'sync', badge: 'Live' },
    { to: '/settings', label: 'Settings', icon: 'tune' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.warn('Sign out error:', e);
      navigate('/login');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-surface-container-lowest dark:bg-surface-container border-r border-outline-variant/20 min-h-screen p-md justify-between shrink-0">
      {/* Top Section */}
      <div className="space-y-5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-soft">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              energy_savings_leaf
            </span>
          </div>
          <div>
            <h1 className="font-app-title text-xl font-bold text-primary dark:text-primary-fixed-dim leading-none">
              HabitFlow
            </h1>
            <p className="font-body-text text-xs text-on-surface-variant mt-1">
              Gentle Persistence
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="px-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-full bg-primary text-on-primary font-habit-name text-sm font-semibold shadow-soft hover:bg-on-primary-fixed-variant transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Habit</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-habit-name text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-stat-label">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Tracker Boards Category List in Sidebar */}
        {categories.length > 0 && (
          <div className="pt-3 border-t border-outline-variant/15 px-2 space-y-1.5">
            <span className="font-stat-label text-[11px] text-on-surface-variant uppercase tracking-wider font-bold block px-2 mb-1">
              Tracker Boards
            </span>
            <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin pr-1">
              {categories.map((cat) => {
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="truncate font-medium">{cat}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-container-highest dark:bg-surface-container-high text-on-surface-variant">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Card Footer */}
      <div className="pt-4 border-t border-outline-variant/20 px-2 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || 'HF'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-app-title text-sm font-semibold text-on-surface truncate">
              {user?.name || user?.email?.split('@')[0] || 'Member'}
            </p>
            <p className="font-body-text text-xs text-on-surface-variant truncate">
              {user?.email || 'Active Plan'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
