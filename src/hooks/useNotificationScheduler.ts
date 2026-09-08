import { useEffect, useState } from 'react';
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
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const { dailyHabits, isCompleted } = useDailyHabitsData(currentDate, 'all');

  // Check and update date if day has changed (e.g. across midnight)
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      if (
        now.getDate() !== currentDate.getDate() ||
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(now);
      }
    };

    const interval = setInterval(checkDateChange, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

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
        const now = new Date();
        if (now.getDate() !== currentDate.getDate()) {
          setCurrentDate(now);
        }
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
  }, [dailyHabits, isCompleted, currentDate]);
}
