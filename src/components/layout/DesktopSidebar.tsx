import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
}

const navItems: SidebarItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/habit/1', label: 'Habit View', icon: 'task_alt' },
  { to: '/debug', label: 'Real-time Sync', icon: 'sync', badge: 'Live' },
  { to: '/settings', label: 'Settings', icon: 'tune' },
];

export const DesktopSidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      <div className="space-y-6">
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
          <NavLink
            to="/habit/new"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-full bg-primary text-on-primary font-habit-name text-sm font-semibold shadow-soft hover:bg-on-primary-fixed-variant transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Habit</span>
          </NavLink>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl font-habit-name text-sm transition-all duration-200 ${
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
      </div>

      {/* Bottom Section: Gentle Persistence Card & User Footer */}
      <div className="space-y-4">
        {/* Soft Encouragement Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low dark:bg-surface-container-highest/40 border border-outline-variant/15">
          <div className="flex items-center gap-2 text-secondary dark:text-secondary-fixed mb-1">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="font-stat-label text-xs font-bold">Gentle Streak</span>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant">
            One small step daily creates calm momentum over time.
          </p>
        </div>

        {/* User Card with Sign-Out */}
        {user && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container dark:bg-surface-container-high border border-outline-variant/15">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs font-stat-label shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-habit-name text-xs font-semibold text-on-surface truncate">
                  {user.name}
                </p>
                <p className="font-body-text text-[11px] text-on-surface-variant truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors shrink-0"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
