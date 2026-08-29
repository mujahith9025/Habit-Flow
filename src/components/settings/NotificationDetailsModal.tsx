import React, { useState } from 'react';
import { NotificationSettings } from '../../types/notification';
import {
  saveNotificationSettings,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../../lib/notificationService';
import { triggerHaptic } from '../../utils/haptics';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (updated: NotificationSettings) => void;
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  if (!isOpen) return null;

  const supported = isNotificationSupported();
  const isPermissionGranted = settings.permissionStatus === 'granted';

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    triggerHaptic('medium');
    const result = await requestNotificationPermission();
    setIsRequestingPermission(false);

    const updated = saveNotificationSettings({
      permissionStatus: result,
      enabled: result === 'granted',
    });
    onUpdateSettings(updated);

    if (result === 'granted') {
      triggerHaptic('success');
      setTestNotifMessage('✅ Notifications enabled! Morning and evening alerts are active.');
      setTimeout(() => setTestNotifMessage(null), 4000);
    }
  };

  const handleToggleMasterNotifications = async () => {
    if (settings.permissionStatus !== 'granted') {
      await handleRequestPermission();
      return;
    }

    const nextEnabled = !settings.enabled;
    const updated = saveNotificationSettings({ enabled: nextEnabled });
    onUpdateSettings(updated);
    triggerHaptic(nextEnabled ? 'light' : 'medium');
  };

  const handleToggleMorning = (enabled: boolean) => {
    const updated = saveNotificationSettings({ morningReminderEnabled: enabled });
    onUpdateSettings(updated);
    triggerHaptic('light');
  };

  const handleMorningTimeChange = (time: string) => {
    const updated = saveNotificationSettings({ morningTime: time });
    onUpdateSettings(updated);
  };

  const handleToggleEvening = (enabled: boolean) => {
    const updated = saveNotificationSettings({ eveningReminderEnabled: enabled });
    onUpdateSettings(updated);
    triggerHaptic('light');
  };

  const handleEveningTimeChange = (time: string) => {
    const updated = saveNotificationSettings({ eveningTime: time });
    onUpdateSettings(updated);
  };

  const handleSendTest = async () => {
    triggerHaptic('light');
    setTestNotifMessage('Sending test push alert to your device...');
    const sent = await sendTestNotification();

    if (sent) {
      triggerHaptic('success');
      setTestNotifMessage('🎉 Push alert delivered! Check your phone notification tray or desktop banner.');
    } else {
      triggerHaptic('warning');
      setTestNotifMessage('⚠️ Could not deliver alert. Please allow notifications in your browser/system settings.');
    }

    setTimeout(() => setTestNotifMessage(null), 5000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl w-full max-w-xl shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <div>
              <h3 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
                Reminders & Notifications
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant">
                Configure your morning kick-off and evening task completion alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin space-y-5 flex-1">
          {/* Feedback Message Toast */}
          {testNotifMessage && (
            <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
              <span>{testNotifMessage}</span>
              <button
                type="button"
                onClick={() => setTestNotifMessage(null)}
                className="text-on-secondary-container/70 hover:text-on-secondary-container"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Permission Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors ${
              isPermissionGranted
                ? 'bg-secondary-container/20 border-secondary/30 text-on-surface'
                : 'bg-primary/10 border-primary/20 text-on-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isPermissionGranted ? 'text-secondary' : 'text-primary'
                }`}
              >
                {isPermissionGranted ? 'verified' : 'notification_important'}
              </span>
              <div>
                <h4 className="font-habit-name text-xs sm:text-sm font-bold">
                  {isPermissionGranted
                    ? 'Mobile & Web Push Active'
                    : 'Notification Permission Required'}
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  {isPermissionGranted
                    ? 'Your phone and browser will deliver timely habit alerts.'
                    : 'Grant permission to receive automated morning and evening reminders.'}
                </p>
              </div>
            </div>

            {!isPermissionGranted && supported && (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={isRequestingPermission}
                className="px-4 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-soft active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isRequestingPermission ? 'Requesting...' : '🔔 Enable Alerts'}
              </button>
            )}
          </div>

          {/* Master Enable Switch */}
          <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">
                toggle_on
              </span>
              <div>
                <h4 className="font-habit-name text-sm font-bold text-on-surface">
                  Daily Habit Notifications
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Master switch to turn on/off all scheduled habit alerts
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled && isPermissionGranted}
                onChange={handleToggleMasterNotifications}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* 1. Morning Kick-off Reminder Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 shadow-soft space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
                </div>
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">
                    Morning Kick-off Reminder
                  </h4>
                  <p className="font-body-text text-xs text-on-surface-variant">
                    Motivates you to start your day with your habit checklist
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.morningReminderEnabled}
                  onChange={(e) => handleToggleMorning(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Time Picker & Preview */}
            {settings.morningReminderEnabled && (
              <div className="space-y-3 pt-2 border-t border-outline-variant/10">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold font-stat-label text-on-surface-variant">
                    Scheduled Delivery Time:
                  </span>
                  <input
                    type="time"
                    value={settings.morningTime}
                    onChange={(e) => handleMorningTimeChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/60 border border-outline-variant/25 text-on-surface text-xs font-bold font-stat-label focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Sample Notification Preview */}
                <div className="p-3 rounded-xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/10 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="material-symbols-outlined text-[15px]">notifications</span>
                    <span>Sample Notification Preview</span>
                  </div>
                  <p className="font-semibold text-on-surface">Morning Habit Kick-off ☀️</p>
                  <p className="text-on-surface-variant text-[11px]">
                    "Good morning! ☀️ You have 4 daily habits waiting today. Start strong!"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Evening Task Completion Reminder Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 shadow-soft space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">nights_stay</span>
                </div>
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">
                    Evening Task Completion Reminder
                  </h4>
                  <p className="font-body-text text-xs text-on-surface-variant">
                    Reminds you of remaining incomplete habits to protect your streak
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.eveningReminderEnabled}
                  onChange={(e) => handleToggleEvening(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Time Picker & Preview */}
            {settings.eveningReminderEnabled && (
              <div className="space-y-3 pt-2 border-t border-outline-variant/10">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold font-stat-label text-on-surface-variant">
                    Scheduled Delivery Time:
                  </span>
                  <input
                    type="time"
                    value={settings.eveningTime}
                    onChange={(e) => handleEveningTimeChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/60 border border-outline-variant/25 text-on-surface text-xs font-bold font-stat-label focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Sample Notification Preview */}
                <div className="p-3 rounded-xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/10 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="material-symbols-outlined text-[15px]">notifications</span>
                    <span>Sample Notification Preview</span>
                  </div>
                  <p className="font-semibold text-on-surface">Evening Habit Reminder 🌙</p>
                  <p className="text-on-surface-variant text-[11px]">
                    "You have 2 habits remaining today. 1-Tap to complete your streak! 🔥"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. How Reminders Work Info Box */}
          <div className="p-4 rounded-2xl bg-surface-container-low/50 dark:bg-surface-container-high/20 border border-outline-variant/15 space-y-2">
            <h4 className="font-habit-name text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span>How HabitFlow Reminders Work</span>
            </h4>
            <ul className="text-[11px] font-body-text text-on-surface-variant space-y-1 pl-1">
              <li>• 📱 <strong>Mobile PWA & Web</strong>: Alerts trigger directly in your system notification tray.</li>
              <li>• 🎯 <strong>Streak Guard</strong>: Evening reminders automatically calculate pending tasks so you never break a streak.</li>
              <li>• ⚡ <strong>1-Tap Navigation</strong>: Tapping any notification opens your HabitFlow dashboard instantly.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-outline-variant/15 flex items-center justify-between bg-surface-container-low/30">
          <button
            type="button"
            onClick={handleSendTest}
            className="px-4 py-2 rounded-xl text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/25 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Send Test Alert</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-soft active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
