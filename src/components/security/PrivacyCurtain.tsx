import React, { useState, useEffect } from 'react';
import { useAppLock } from '../../context/AppLockContext';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';

/**
 * Mobile App Switcher & Task Manager Privacy Curtain
 * 
 * Instantly blurs and covers the screen whenever the app is minimized,
 * backgrounded, or viewed in the OS multi-tasking / app switcher pane.
 * Prevents sensitive habit routines, financial metrics, and reflections
 * from appearing in OS screenshots.
 */
export const PrivacyCurtain: React.FC = () => {
  const { privacyCurtainEnabled } = useAppLock();
  const [isBackgrounded, setIsBackgrounded] = useState(false);

  useEffect(() => {
    if (!privacyCurtainEnabled) {
      setIsBackgrounded(false);
      return;
    }

    const handleVisibilityChange = () => {
      setIsBackgrounded(document.visibilityState === 'hidden');
    };

    const handleBlur = () => {
      // In mobile PWA and multi-tasking views, blur fires when user opens app switcher
      setIsBackgrounded(true);
    };

    const handleFocus = () => {
      setIsBackgrounded(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handleBlur);
    window.addEventListener('pageshow', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handleBlur);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, [privacyCurtainEnabled]);

  if (!privacyCurtainEnabled || !isBackgrounded) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[999999] pointer-events-none flex flex-col items-center justify-center bg-surface/90 dark:bg-[#0B0C0E]/95 backdrop-blur-3xl select-none transition-opacity duration-150"
    >
      <div className="flex flex-col items-center text-center space-y-3 p-6 animate-scaleUp">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
          <HabitFlowLogo size={42} />
        </div>
        <div className="space-y-1">
          <h2 className="font-app-title text-xl font-bold text-on-surface tracking-tight">
            HabitFlow
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 border border-secondary/20 text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <span>Privacy Shield Active</span>
          </div>
        </div>
        <p className="font-body-text text-xs text-on-surface-variant max-w-xs">
          Your personal habits and daily reflections are protected from multi-tasking view.
        </p>
      </div>
    </div>
  );
};
