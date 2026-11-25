import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  isBiometricsAvailable,
  verifyBiometricCredential,
  hasAppPin,
  verifyAppPin,
  setAppPin,
  clearAppPin,
  isAppLockEnabled as checkAppLockEnabled,
  setAppLockEnabled as persistAppLockEnabled,
  getAutoLockMinutes as readAutoLockMinutes,
  setAutoLockMinutes as persistAutoLockMinutes,
  isPrivacyCurtainEnabled as readPrivacyCurtain,
  setPrivacyCurtainEnabled as persistPrivacyCurtain,
} from '../utils/biometrics';
import { triggerHaptic } from '../utils/haptics';
import { announce } from '../utils/announcer';

interface AppLockContextType {
  isLocked: boolean;
  isAppLockEnabled: boolean;
  isBiometricsSupported: boolean;
  hasPin: boolean;
  autoLockMinutes: number;
  privacyCurtainEnabled: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  authenticateBiometric: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  removePin: () => void;
  enableAppLock: (enabled: boolean) => void;
  changeAutoLockMinutes: (mins: number) => void;
  togglePrivacyCurtain: (enabled: boolean) => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAppLockEnabled, setIsAppLockEnabledState] = useState<boolean>(() => checkAppLockEnabled());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // If app lock is enabled, start in locked state for security
    return checkAppLockEnabled();
  });
  const [isBiometricsSupported, setIsBiometricsSupported] = useState(false);
  const [hasPin, setHasPin] = useState<boolean>(() => hasAppPin());
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(() => readAutoLockMinutes());
  const [privacyCurtainEnabled, setPrivacyCurtainEnabledState] = useState<boolean>(() =>
    readPrivacyCurtain()
  );

  const lastActiveRef = useRef<number>(Date.now());
  const backgroundTimestampRef = useRef<number | null>(null);

  // Check biometric hardware support on mount
  useEffect(() => {
    let isMounted = true;
    isBiometricsAvailable().then((supported) => {
      if (isMounted) setIsBiometricsSupported(supported);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const lockApp = useCallback(() => {
    if (!isAppLockEnabled) return;
    setIsLocked(true);
    announce('HabitFlow is locked. Authenticate to resume.', 'assertive');
  }, [isAppLockEnabled]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    lastActiveRef.current = Date.now();
    triggerHaptic('success');
    announce('HabitFlow unlocked.');
  }, []);

  const authenticateBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const verified = await verifyBiometricCredential();
      if (verified) {
        unlockApp();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Biometric unlock attempt failed:', err);
      return false;
    }
  }, [unlockApp]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      const valid = await verifyAppPin(pin);
      if (valid) {
        unlockApp();
        return true;
      }
      triggerHaptic('double');
      announce('Incorrect PIN. Please try again.', 'assertive');
      return false;
    },
    [unlockApp]
  );

  const setupPin = useCallback(async (pin: string): Promise<void> => {
    await setAppPin(pin);
    setHasPin(true);
    triggerHaptic('success');
    announce('Security PIN configured successfully.');
  }, []);

  const removePin = useCallback(() => {
    clearAppPin();
    setHasPin(false);
    triggerHaptic('light');
    announce('Security PIN removed.');
  }, []);

  const enableAppLock = useCallback((enabled: boolean) => {
    persistAppLockEnabled(enabled);
    setIsAppLockEnabledState(enabled);
    if (!enabled) {
      setIsLocked(false);
    }
  }, []);

  const changeAutoLockMinutes = useCallback((mins: number) => {
    persistAutoLockMinutes(mins);
    setAutoLockMinutesState(mins);
  }, []);

  const togglePrivacyCurtain = useCallback((enabled: boolean) => {
    persistPrivacyCurtain(enabled);
    setPrivacyCurtainEnabledState(enabled);
  }, []);

  // Inactivity and Background Watcher
  useEffect(() => {
    if (!isAppLockEnabled || autoLockMinutes < 0) return;

    const handleUserActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // User activity events
    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    // Periodic inactivity timer check
    const interval = setInterval(() => {
      if (isLocked) return;
      const elapsedMs = Date.now() - lastActiveRef.current;
      const timeoutMs = autoLockMinutes * 60 * 1000;

      if (autoLockMinutes > 0 && elapsedMs >= timeoutMs) {
        lockApp();
      }
    }, 5000);

    // Visibility / background handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        backgroundTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (backgroundTimestampRef.current !== null && !isLocked) {
          const bgElapsed = Date.now() - backgroundTimestampRef.current;
          if (autoLockMinutes === 0 || bgElapsed >= autoLockMinutes * 60 * 1000) {
            lockApp();
          }
          backgroundTimestampRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isAppLockEnabled, autoLockMinutes, isLocked, lockApp]);

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        isAppLockEnabled,
        isBiometricsSupported,
        hasPin,
        autoLockMinutes,
        privacyCurtainEnabled,
        lockApp,
        unlockApp,
        authenticateBiometric,
        unlockWithPin,
        setupPin,
        removePin,
        enableAppLock,
        changeAutoLockMinutes,
        togglePrivacyCurtain,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
};

export function useAppLock(): AppLockContextType {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
