import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { CloudSyncStatus } from '../ui/CloudSyncStatus';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';

interface TopHeaderProps {
  isSidebarCollapsed?: boolean;
  onOpenCommandPalette?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  isSidebarCollapsed = false,
  onOpenCommandPalette,
}) => {
  const { theme, isDark, isOled, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isInstalled } = usePWAInstall();
  const location = useLocation();

  const getScreenMeta = (pathname: string): { title: string; subtitle?: string; icon: string } => {
    if (pathname.startsWith('/dashboard')) {
      return { title: 'Dashboard', icon: 'dashboard', subtitle: 'Daily Routine & Focus' };
    }
    if (pathname.startsWith('/habit')) {
      return { title: 'Analytics & Reports', icon: 'insights', subtitle: 'Performance & Heatmaps' };
    }
    if (pathname.startsWith('/setting')) {
      return { title: 'Settings', icon: 'tune', subtitle: 'Preferences & System' };
    }
    if (pathname.startsWith('/install')) {
      return { title: 'Install App', icon: 'install_mobile', subtitle: 'PWA Setup' };
    }
    if (pathname.startsWith('/debug')) {
      return { title: 'Data Layer Debug', icon: 'bug_report', subtitle: 'Diagnostics' };
    }
    return { title: 'HabitFlow', icon: 'spa' };
  };

  const screenMeta = getScreenMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 w-full transition-all md:px-6 md:pt-3 md:pb-1 pointer-events-none">
      <div className="flex items-center justify-between px-container-padding py-2.5 max-w-7xl mx-auto bg-surface/90 dark:bg-surface/90 backdrop-blur-md border-b md:border border-outline-variant/20 md:rounded-full md:shadow-soft transition-all pointer-events-auto">
        {/* Left: Responsive Brand / Active Screen Title */}
        <div className="flex items-center gap-3">
          {/* Mobile view (< md): Always show HabitFlow Brand & Logo since sidebar is hidden */}
          <Link
            to="/dashboard"
            className="flex md:hidden items-center gap-2.5 active:scale-98 transition-transform"
          >
            <HabitFlowLogo size={32} />
            <span className="font-app-title text-xl font-bold text-primary dark:text-primary-fixed-dim">
              HabitFlow
            </span>
          </Link>

          {/* Desktop view (md+): Eliminate double-branding when sidebar is visible */}
          <div className="hidden md:flex items-center gap-3">
            {isSidebarCollapsed ? (
              // When desktop sidebar is collapsed (72px): show compact brand + active breadcrumb
              <div className="flex items-center gap-2.5 animate-fadeIn">
                <Link to="/dashboard" className="flex items-center gap-2 group">
                  <HabitFlowLogo size={28} />
                  <span className="font-app-title text-lg font-bold text-primary dark:text-primary-fixed-dim">
                    HabitFlow
                  </span>
                </Link>
                <span className="text-outline-variant/40 font-light text-base select-none">/</span>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span
                    className="material-symbols-outlined text-primary text-[19px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {screenMeta.icon}
                  </span>
                  <h2 className="font-app-title text-base font-bold text-on-surface tracking-tight">
                    {screenMeta.title}
                  </h2>
                </div>
              </div>
            ) : (
              // When desktop sidebar is EXPANDED (w-64/72): Replace redundant logo/text with active screen title
              <div className="flex items-center gap-2.5 animate-fadeIn">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {screenMeta.icon}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-app-title text-lg lg:text-xl font-bold text-on-surface tracking-tight leading-none">
                    {screenMeta.title}
                  </h2>
                  {screenMeta.subtitle && (
                    <span className="hidden lg:inline text-xs text-on-surface-variant font-body-text">
                      • {screenMeta.subtitle}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & User Profile in the Right Corner */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Command Palette Search Button (Cmd+K / Ctrl+K) */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Search & Commands (Cmd+K / Ctrl+K)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high border border-outline-variant/30 transition-all cursor-pointer active:scale-95 shadow-xs"
              aria-label="Open Command Palette (Cmd + K)"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">search</span>
              <span className="hidden md:inline text-[11px]">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-surface-container-highest/70 text-on-surface-variant">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Real-Time Cloud Sync Verification Indicator */}
          <CloudSyncStatus variant="header" />
          {/* How to Install App / PWA Install Guide Link (Hidden if already installed) */}
          {!isInstalled && (
            <Link
              to="/install"
              title="How to Install HabitFlow on Phone & PC"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors border border-primary/20 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span className="hidden sm:inline">Install App</span>
            </Link>
          )}

          {/* Theme Toggle (3-way: Light -> Dark -> OLED Obsidian) */}
          <button
            onClick={toggleTheme}
            title={
              theme === 'oled'
                ? 'Theme: OLED Obsidian (Click for Warm Light)'
                : isDark
                ? 'Theme: Japandi Charcoal (Click for OLED Obsidian)'
                : 'Theme: Warm Light (Click for Japandi Charcoal)'
            }
            className={`w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-all active:scale-95 ${
              isOled ? 'ring-1 ring-primary/40 bg-surface-container-high/60 shadow-oled-glow' : ''
            }`}
            aria-label="Toggle Theme"
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform ${
                theme === 'oled'
                  ? 'text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(82,153,93,0.5)]'
                  : ''
              }`}
            >
              {theme === 'oled' ? 'nights_stay' : isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Avatar in the Right Corner linking to /settings */}
          {user ? (
            <Link
              to="/settings"
              title="Go to Settings & Profile"
              className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 flex-shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-soft flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40"
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
