import { useEffect, useRef } from 'react';
import {
  checkAndTriggerScheduledReminders,
  getNotificationSettings,
  isNotificationSupported,
} from '../lib/notificationService';
import { useDailyHabitsData } from './useDailyHabitsData';

/**
 * Global hook that monitors and triggers scheduled Morning and Evening habit push notifications
 */
export function useNotificationScheduler(): void {
  const today = useRef(new Date()).current;
  const { dailyHabits, isCompleted } = useDailyHabitsData(today, 'all');

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const checkReminders = () => {
      const settings = getNotificationSettings();
      if (!settings.enabled || settings.permissionStatus !== 'granted') return;

      checkAndTriggerScheduledReminders({
        dailyHabits,
        isCompleted,
      }).catch((err) => {
        console.warn('Reminder scheduler check failed:', err);
      });
    };

    // 1. Initial check
    checkReminders();

    // 2. Periodic interval check every 30 seconds
    const interval = setInterval(checkReminders, 30 * 1000);

    // 3. Tab visibility / device wake-up check
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [dailyHabits, isCompleted]);
}
