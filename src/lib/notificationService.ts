import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types/notification';
import { formatDateKey } from '../hooks/useDashboardMetrics';
import { Habit } from '../types/habit';

const STORAGE_KEY = 'habitflow_notification_settings';

/**
 * Checks if browser/device supports Web Notifications
 */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Notification !== 'undefined' &&
    'Notification' in window
  );
}

/**
 * Returns the current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported() || typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';

  try {
    const result = await Notification.requestPermission();
    // Update stored settings with new permission status
    const current = getNotificationSettings();
    saveNotificationSettings({
      ...current,
      permissionStatus: result,
      enabled: result === 'granted',
    });
    return result;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Retrieves persisted notification settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        permissionStatus: getNotificationPermission(),
        enabled: parsed.enabled && getNotificationPermission() === 'granted',
      };
    }
  } catch (err) {
    console.warn('Failed to parse notification settings:', err);
  }

  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    permissionStatus: getNotificationPermission(),
  };
}

/**
 * Persists notification settings to localStorage
 */
export function saveNotificationSettings(
  updates: Partial<NotificationSettings>
): NotificationSettings {
  const current = getNotificationSettings();
  const updated: NotificationSettings = {
    ...current,
    ...updates,
    permissionStatus: getNotificationPermission(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save notification settings:', err);
    }
  }

  return updated;
}

/**
 * Shows a native push/mobile notification via Service Worker or Web Notification API
 */
export async function sendPushNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'habitflow-reminder',
    vibrate: [200, 100, 200],
    data: { url: '/dashboard' },
    ...options,
  } as unknown as NotificationOptions;

  // Try Service Worker registration first (best for Mobile PWA background alerts)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch {
      // Fallback to standard Notification constructor
    }
  }

  // Fallback to desktop / browser standard Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      window.location.href = '/dashboard';
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Notification constructor error:', err);
    return false;
  }
}

/**
 * Sends an interactive test notification
 */
export async function sendTestNotification(): Promise<boolean> {
  const granted =
    Notification.permission === 'granted' ||
    (await requestNotificationPermission()) === 'granted';

  if (!granted) return false;

  return sendPushNotification('HabitFlow Reminders Active! 🔔', {
    body: 'Morning kick-off and evening task completion alerts are configured and ready!',
    tag: 'habitflow-test-alert',
  });
}

/**
 * Checks if current time is within 3 minutes of target HH:MM (with 24-hour midnight wrap-around)
 */
export function isTimeToTrigger(targetTimeStr: string, now: Date = new Date()): boolean {
  if (!targetTimeStr) return false;
  const [targetHour, targetMinute] = targetTimeStr.split(':').map(Number);
  if (isNaN(targetHour) || isNaN(targetMinute)) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const currentTotalMins = currentHour * 60 + currentMinute;
  const targetTotalMins = targetHour * 60 + targetMinute;

  // Calculate elapsed minutes since target time, wrapping around midnight (1440 mins in a day)
  const diff = (currentTotalMins - targetTotalMins + 1440) % 1440;

  return diff >= 0 && diff <= 3;
}

/**
 * Evaluates and triggers morning or evening task completion notifications if due
 */
export async function checkAndTriggerScheduledReminders(params: {
  dailyHabits: Habit[];
  isCompleted: (habitId: string, dateKey: string) => boolean;
  streakCount?: number;
  now?: Date;
}): Promise<{ morningSent: boolean; eveningSent: boolean }> {
  const settings = getNotificationSettings();
  if (!settings.enabled || settings.permissionStatus !== 'granted') {
    return { morningSent: false, eveningSent: false };
  }

  const now = params.now || new Date();
  const todayDateKey = formatDateKey(now);

  const activeHabits = params.dailyHabits.filter((h) => !h.archived);
  const completedTodayCount = activeHabits.filter((h) =>
    params.isCompleted(h.id, todayDateKey)
  ).length;
  const remainingCount = activeHabits.length - completedTodayCount;

  let morningSent = false;
  let eveningSent = false;

  // 1. Morning Kick-off Reminder
  if (
    settings.morningReminderEnabled &&
    settings.lastMorningNotifiedDate !== todayDateKey &&
    isTimeToTrigger(settings.morningTime, now)
  ) {
    const count = activeHabits.length;
    const body =
      count > 0
        ? `Good morning! ☀️ You have ${count} daily ${
            count === 1 ? 'habit' : 'habits'
          } waiting today. Start strong!`
        : 'Good morning! ☀️ Ready to build positive momentum today?';

    const sent = await sendPushNotification('Morning Habit Kick-off ☀️', {
      body,
      tag: `habitflow-morning-${todayDateKey}`,
    });

    if (sent) {
      morningSent = true;
      saveNotificationSettings({ lastMorningNotifiedDate: todayDateKey });
    }
  }

  // 2. Evening Task Completion Reminder
  if (
    settings.eveningReminderEnabled &&
    settings.lastEveningNotifiedDate !== todayDateKey &&
    isTimeToTrigger(settings.eveningTime, now)
  ) {
    let title = 'Evening Habit Reminder 🌙';
    let body = '';

    if (remainingCount === 0 && activeHabits.length > 0) {
      title = 'Outstanding! 🏆 Streak Secure';
      body = 'All daily habits completed for today! Calm momentum in motion.';
    } else if (remainingCount > 0) {
      body = `You have ${remainingCount} ${
        remainingCount === 1 ? 'habit' : 'habits'
      } remaining today. 1-Tap to complete your streak! 🔥`;
    } else {
      body = 'Check in on your daily habits before wrapping up for the night.';
    }

    const sent = await sendPushNotification(title, {
      body,
      tag: `habitflow-evening-${todayDateKey}`,
    });

    if (sent) {
      eveningSent = true;
      saveNotificationSettings({ lastEveningNotifiedDate: todayDateKey });
    }
  }

  return { morningSent, eveningSent };
}
