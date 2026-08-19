import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  iconName?: string;
  title: string;
  subtitle: string;
  showBackToSignIn?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  iconName = 'energy_savings_leaf',
  title,
  subtitle,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-pastel-gradient dark:bg-background text-on-surface font-body-text antialiased flex flex-col justify-between items-center p-container-padding relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows for soothing visual aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-container/30 dark:bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-container/30 dark:bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-full bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all active:scale-95 shadow-soft"
          aria-label="Toggle Theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto my-auto z-10 relative pt-8 pb-4">
        {/* Header / Identity */}
        <header className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-lowest dark:bg-surface-container text-primary dark:text-primary-fixed-dim mb-4 shadow-soft border border-outline-variant/15">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {iconName}
            </span>
          </div>
          <h1 className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface mb-1.5">
            {title}
          </h1>
          <p className="font-body-text text-sm text-on-surface-variant max-w-xs mx-auto">
            {subtitle}
          </p>
        </header>

        {/* Card Body */}
        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-[24px] shadow-soft p-6 sm:p-8 border border-outline-variant/20 relative">
          {children}
        </div>
      </main>

      {/* App Footer */}
      <footer className="w-full text-center py-4 z-10">
        <p className="font-body-text text-xs text-outline flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">cloud_sync</span>
          <span>Your data syncs automatically across all your devices</span>
        </p>
      </footer>
    </div>
  );
};
