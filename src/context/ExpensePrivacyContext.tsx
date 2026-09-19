import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { triggerHaptic } from '../utils/haptics';

export type AutoLockDuration = 0 | 60 | 120 | 300; // seconds: 0 (disabled), 1m, 2m, 5m

interface ExpensePrivacyContextType {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
  setDiscreetMode: (enabled: boolean) => void;
  autoLockTimeout: AutoLockDuration;
  setAutoLockTimeout: (duration: AutoLockDuration) => void;
  isAutoLocked: boolean;
  unlock: () => void;
}

const STORAGE_KEY_DISCREET = 'habitflow_discreet_balance_mode';
const STORAGE_KEY_AUTOLOCK = 'habitflow_privacy_autolock_timeout';

const ExpensePrivacyContext = createContext<ExpensePrivacyContextType | undefined>(undefined);

export const ExpensePrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDiscreetMode, setIsDiscreetModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DISCREET) === 'true';
    } catch {
      return false;
    }
  });

  const [autoLockTimeout, setAutoLockTimeoutState] = useState<AutoLockDuration>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTOLOCK);
      if (saved !== null) {
        const parsed = Number(saved);
        if ([0, 60, 120, 300].includes(parsed)) {
          return parsed as AutoLockDuration;
        }
      }
      return 0; // Default off
    } catch {
      return 0;
    }
  });

  const [isAutoLocked, setIsAutoLocked] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Record user interaction activity timestamp
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Sync discreet mode preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISCREET, String(isDiscreetMode));
    } catch (e) {
      console.warn('Could not save discreet balance mode preference:', e);
    }
  }, [isDiscreetMode]);

  // Sync auto lock duration preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTOLOCK, String(autoLockTimeout));
    } catch (e) {
      console.warn('Could not save autolock timeout preference:', e);
    }
  }, [autoLockTimeout]);

  // Attach global user interaction listeners
  useEffect(() => {
    if (autoLockTimeout === 0) return;

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'mousemove', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      recordActivity();
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Inactivity check interval
    const interval = setInterval(() => {
      if (autoLockTimeout > 0) {
        const elapsedSeconds = (Date.now() - lastActivityRef.current) / 1000;
        if (elapsedSeconds >= autoLockTimeout && !isAutoLocked) {
          setIsAutoLocked(true);
          setIsDiscreetModeState(true);
        }
      }
    }, 2000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(interval);
    };
  }, [autoLockTimeout, isAutoLocked, recordActivity]);

  const toggleDiscreetMode = () => {
    triggerHaptic('light');
    setIsDiscreetModeState((prev) => !prev);
  };

  const setDiscreetMode = (enabled: boolean) => {
    triggerHaptic('light');
    setIsDiscreetModeState(enabled);
  };

  const setAutoLockTimeout = (duration: AutoLockDuration) => {
    triggerHaptic('light');
    setAutoLockTimeoutState(duration);
    lastActivityRef.current = Date.now();
    if (duration === 0) {
      setIsAutoLocked(false);
    }
  };

  const unlock = () => {
    triggerHaptic('success');
    setIsAutoLocked(false);
    setIsDiscreetModeState(false);
    lastActivityRef.current = Date.now();
  };

  return (
    <ExpensePrivacyContext.Provider
      value={{
        isDiscreetMode,
        toggleDiscreetMode,
        setDiscreetMode,
        autoLockTimeout,
        setAutoLockTimeout,
        isAutoLocked,
        unlock,
      }}
    >
      {children}
    </ExpensePrivacyContext.Provider>
  );
};

export function useExpensePrivacy(): ExpensePrivacyContextType {
  const context = useContext(ExpensePrivacyContext);
  if (!context) {
    throw new Error('useExpensePrivacy must be used within an ExpensePrivacyProvider');
  }
  return context;
}
