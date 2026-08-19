import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../hooks/useAuth';

export const TopHeader: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, installPWA } = usePWAInstall();
  const { user } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 dark:bg-surface/90 backdrop-blur-md border-b border-outline-variant/15 transition-colors">
      <div className="flex items-center justify-between px-container-padding py-3 max-w-7xl mx-auto">
        {/* Left: Avatar (Mobile & Desktop) + Branding */}
        <div className="flex items-center gap-3">
          {/* User Profile Avatar linking to /settings */}
          {user ? (
            <Link
              to="/settings"
              title="Go to Settings"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 flex-shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-soft flex items-center justify-center"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name || 'User Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-container text-on-primary-container flex items-center justify-center font-stat-label font-bold text-xs sm:text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Title Branding */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-app-title text-xl sm:text-2xl font-bold text-primary dark:text-primary-fixed-dim">
              HabitFlow
            </span>
          </Link>
        </div>

        {/* Right: Actions (PWA install, Theme toggle, Calendar action) */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={installPWA}
              title="Install App"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-soft"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden xs:inline">Install App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors active:scale-95"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Quick sync link / action button */}
          {isDashboard && (
            <Link
              to="/debug"
              title="Real-time Sync Inspector"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-primary dark:text-primary-fixed-dim rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">calendar_today</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
