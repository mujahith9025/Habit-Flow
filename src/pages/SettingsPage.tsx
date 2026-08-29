import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Badge } from '../components/ui/Badge';
import { triggerHaptic } from '../utils/haptics';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../lib/notificationService';
import { NotificationSettings } from '../types/notification';

export const SettingsPage: React.FC = () => {
  const { profile } = useUserProfile();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { habits } = useHabits();
  const { isInstalled } = usePWAInstall();
  const navigate = useNavigate();

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotifSettings(getNotificationSettings());
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      navigate('/login');
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    triggerHaptic('medium');
    const result = await requestNotificationPermission();
    setIsRequestingPermission(false);

    const updated = saveNotificationSettings({
      permissionStatus: result,
      enabled: result === 'granted',
    });
    setNotifSettings(updated);

    if (result === 'granted') {
      triggerHaptic('success');
      setTestNotifMessage('✅ Notifications enabled! Morning and evening alerts are active.');
      setTimeout(() => setTestNotifMessage(null), 4000);
    }
  };

  const handleToggleMasterNotifications = async () => {
    if (notifSettings.permissionStatus !== 'granted') {
      await handleRequestPermission();
      return;
    }

    const nextEnabled = !notifSettings.enabled;
    const updated = saveNotificationSettings({ enabled: nextEnabled });
    setNotifSettings(updated);
    triggerHaptic(nextEnabled ? 'light' : 'medium');
  };

  const handleToggleMorning = (enabled: boolean) => {
    const updated = saveNotificationSettings({ morningReminderEnabled: enabled });
    setNotifSettings(updated);
    triggerHaptic('light');
  };

  const handleMorningTimeChange = (time: string) => {
    const updated = saveNotificationSettings({ morningTime: time });
    setNotifSettings(updated);
  };

  const handleToggleEvening = (enabled: boolean) => {
    const updated = saveNotificationSettings({ eveningReminderEnabled: enabled });
    setNotifSettings(updated);
    triggerHaptic('light');
  };

  const handleEveningTimeChange = (time: string) => {
    const updated = saveNotificationSettings({ eveningTime: time });
    setNotifSettings(updated);
  };

  const handleSendTestNotification = async () => {
    triggerHaptic('light');
    setTestNotifMessage('Sending test push alert...');
    const sent = await sendTestNotification();

    if (sent) {
      triggerHaptic('success');
      setTestNotifMessage('🎉 Push notification delivered! Check your phone/browser banner.');
    } else {
      triggerHaptic('warning');
      setTestNotifMessage('⚠️ Could not deliver alert. Please allow notifications in your browser settings.');
    }

    setTimeout(() => setTestNotifMessage(null), 5000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    triggerHaptic('light');
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: {
        uid: profile?.uid,
        name: profile?.name,
        email: profile?.email,
        authProvider: profile?.authProvider,
      },
      habits,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `habitflow_export_${profile?.uid || 'user'}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportMessage('Data exported successfully!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  const supported = isNotificationSupported();
  const isPermissionGranted = notifSettings.permissionStatus === 'granted';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/15">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Back to Dashboard"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-section-header text-xl sm:text-2xl font-bold text-on-surface">
            Settings & Preferences
          </h2>
          <p className="font-body-text text-xs text-on-surface-variant">
            Manage your daily reminders, alerts, appearance, and account
          </p>
        </div>
      </div>

      {/* 1. Profile Overview */}
      <section className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 sm:p-6 shadow-soft border border-outline-variant/15 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xl font-app-title shadow-sm ring-2 ring-primary/20">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div className="text-center sm:text-left">
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              {profile?.name || 'HabitFlow Explorer'}
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">{profile?.email}</p>
            <div className="mt-1.5 flex items-center gap-2 justify-center sm:justify-start">
              <Badge variant="primary" className="text-[10px] font-stat-label">
                {profile?.authProvider === 'google' ? 'Google Account' : 'Standard Member'}
              </Badge>
              {isInstalled && (
                <Badge variant="secondary" className="text-[10px] font-stat-label">
                  PWA Installed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-4 py-2 rounded-xl text-xs font-semibold font-stat-label bg-surface-container-low dark:bg-surface-container-high hover:bg-surface-container text-on-surface border border-outline-variant/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[16px] text-primary ${
              isSyncing ? 'animate-spin' : ''
            }`}
          >
            sync
          </span>
          <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
        </button>
      </section>

      {/* 2. Push Notifications & Daily Reminders Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-section-header text-base font-bold text-on-surface">
            Reminders & Push Notifications
          </h3>
          {isPermissionGranted && (
            <span className="text-[11px] font-bold text-secondary flex items-center gap-1 font-stat-label">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>Mobile Push Active</span>
            </span>
          )}
        </div>

        {/* Feedback Alert Message Banner */}
        {testNotifMessage && (
          <div className="p-3.5 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
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

        {/* Notification Permission Request Card (if not yet granted) */}
        {!isPermissionGranted && supported && (
          <div className="bg-gradient-to-r from-primary/10 via-surface-container-low to-surface-container-lowest dark:from-primary/15 dark:via-surface-container-high/30 dark:to-surface-container p-4 sm:p-5 rounded-2xl border border-primary/20 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">notifications_active</span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-bold text-on-surface">
                  Enable Mobile & Web Notifications
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Receive your morning habit kick-off and evening completion reminders directly on your phone
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-4 py-2.5 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-soft shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isRequestingPermission ? 'Requesting...' : '🔔 Enable Notifications'}
            </button>
          </div>
        )}

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/10">
          {/* Master Push Switch */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                  Daily Habit Push Alerts
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Scheduled notifications for morning routine and evening task check-ins
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifSettings.enabled && isPermissionGranted}
                onChange={handleToggleMasterNotifications}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* 1. Morning Kick-Off Reminder Card */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
                </div>
                <div>
                  <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                    Morning Kick-off Reminder
                  </h4>
                  <p className="font-body-text text-xs text-on-surface-variant">
                    Starts your morning with habits count and positive momentum
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifSettings.morningReminderEnabled}
                  onChange={(e) => handleToggleMorning(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Time Picker */}
            {notifSettings.morningReminderEnabled && (
              <div className="pl-12 flex items-center gap-3">
                <span className="text-xs font-bold font-stat-label text-on-surface-variant">
                  Delivery Time:
                </span>
                <input
                  type="time"
                  value={notifSettings.morningTime}
                  onChange={(e) => handleMorningTimeChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/60 border border-outline-variant/25 text-on-surface text-xs font-bold font-stat-label focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-on-surface-variant italic">
                  (Default: 08:00 AM)
                </span>
              </div>
            )}
          </div>

          {/* 2. Evening Task Completion Reminder Card */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">nights_stay</span>
                </div>
                <div>
                  <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                    Evening Task Completion Reminder
                  </h4>
                  <p className="font-body-text text-xs text-on-surface-variant">
                    Alerts you with remaining incomplete habits to keep your streak alive
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifSettings.eveningReminderEnabled}
                  onChange={(e) => handleToggleEvening(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Time Picker */}
            {notifSettings.eveningReminderEnabled && (
              <div className="pl-12 flex items-center gap-3">
                <span className="text-xs font-bold font-stat-label text-on-surface-variant">
                  Delivery Time:
                </span>
                <input
                  type="time"
                  value={notifSettings.eveningTime}
                  onChange={(e) => handleEveningTimeChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/60 border border-outline-variant/25 text-on-surface text-xs font-bold font-stat-label focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-on-surface-variant italic">
                  (Default: 08:00 PM)
                </span>
              </div>
            )}
          </div>

          {/* 3. Send Test Notification Action */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-surface-container-low/30">
            <div>
              <h4 className="font-habit-name text-xs sm:text-sm font-bold text-on-surface">
                Verify Push Notification
              </h4>
              <p className="font-body-text text-xs text-on-surface-variant">
                Send an immediate test alert to your phone or desktop screen
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-3.5 py-2 rounded-xl text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/25 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Send Test</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Appearance & Theme */}
      <section className="space-y-3">
        <h3 className="font-section-header text-base font-bold text-on-surface px-1">
          Appearance
        </h3>

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                  Theme Mode
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Current mode: {isDark ? 'Dark Theme' : 'Light Theme'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-stat-label bg-surface-container-low dark:bg-surface-container-high hover:bg-surface-container text-primary transition-colors cursor-pointer"
            >
              {isDark ? 'Switch to Light ☀️' : 'Switch to Dark 🌙'}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Account Management & Data */}
      <section className="space-y-3">
        <h3 className="font-section-header text-base font-bold text-on-surface px-1">
          Account & Data
        </h3>

        {exportMessage && (
          <div className="p-3 rounded-xl bg-secondary-fixed/30 text-secondary text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{exportMessage}</span>
          </div>
        )}

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/10">
          <button
            type="button"
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div>
                <span className="font-habit-name text-sm font-semibold text-on-surface block">
                  Export Habit Data
                </span>
                <span className="font-body-text text-xs text-on-surface-variant">
                  Download all your habits and check-in history as JSON
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              chevron_right
            </span>
          </button>

          <Link
            to="/debug"
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[22px]">bug_report</span>
              </div>
              <div>
                <span className="font-habit-name text-sm font-semibold text-on-surface block">
                  Real-Time Sync Inspector
                </span>
                <span className="font-body-text text-xs text-on-surface-variant">
                  Inspect raw Firestore listeners and simulate multi-tab sync
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              chevron_right
            </span>
          </Link>
        </div>
      </section>

      {/* 5. Destructive Action: Sign Out */}
      <section className="pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-error-container/40 hover:bg-error-container text-on-error-container font-stat-label text-sm font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
};
