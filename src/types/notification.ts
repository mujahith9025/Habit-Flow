export interface NotificationSettings {
  enabled: boolean;
  morningReminderEnabled: boolean;
  morningTime: string; // Format 'HH:MM' (24-hour e.g. '08:00')
  eveningReminderEnabled: boolean;
  eveningTime: string; // Format 'HH:MM' (24-hour e.g. '20:00')
  permissionStatus: NotificationPermission; // 'default' | 'granted' | 'denied'
  lastMorningNotifiedDate?: string; // 'YYYY-MM-DD'
  lastEveningNotifiedDate?: string; // 'YYYY-MM-DD'
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  morningReminderEnabled: true,
  morningTime: '08:00',
  eveningReminderEnabled: true,
  eveningTime: '20:00',
  permissionStatus: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
};
