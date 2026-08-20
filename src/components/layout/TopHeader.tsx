import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const TopHeader: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isInstalled } = usePWAInstall();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 dark:bg-surface/90 backdrop-blur-md border-b border-outline-variant/15 transition-colors">
      <div className="flex items-center justify-between px-container-padding py-3 max-w-7xl mx-auto">
        {/* Left: Branding & App Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 active:scale-98 transition-transform">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-soft">
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              energy_savings_leaf
            </span>
          </div>
          <span className="font-app-title text-xl sm:text-2xl font-bold text-primary dark:text-primary-fixed-dim">
            HabitFlow
          </span>
        </Link>

        {/* Right: Actions & User Profile in the Right Corner */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* How to Install App / PWA Install Guide Link (Hidden if already installed) */}
          {!isInstalled && (
            <Link
              to="/install"
              title="How to Install HabitFlow on Phone & PC"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors border border-primary/20 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span className="hidden xs:inline">Install App</span>
            </Link>
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

          {/* Trophy & Achievements Link */}
          <Link
            to="/settings"
            title="View Trophies & Milestones"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </Link>

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

          {/* User Profile Avatar in the Right Corner linking to /settings */}
          {user ? (
            <Link
              to="/settings"
              title="Go to Settings & Profile"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 flex-shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-soft flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name || 'User Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary text-on-primary flex items-center justify-center font-stat-label font-bold text-xs sm:text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-soft"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
