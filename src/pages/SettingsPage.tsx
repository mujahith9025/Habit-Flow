import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { updateDoc, getUserDocRef } from '../lib/firebase';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { profile } = useUserProfile();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { habits } = useHabits();
  const { isInstalled } = usePWAInstall();
  const navigate = useNavigate();

  const [dailyReminders, setDailyReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      navigate('/login');
    }
  };

  const handleToggleReminder = async () => {
    const nextVal = !dailyReminders;
    setDailyReminders(nextVal);
    if (profile?.uid) {
      try {
        await updateDoc(getUserDocRef(profile.uid), {
          dailyReminders: nextVal,
        });
      } catch (e) {
        console.warn('Could not persist preference:', e);
      }
    }
  };

  const handleTogglePush = async () => {
    const nextVal = !pushNotifications;
    setPushNotifications(nextVal);
    if (profile?.uid) {
      try {
        await updateDoc(getUserDocRef(profile.uid), {
          pushNotifications: nextVal,
        });
      } catch (e) {
        console.warn('Could not persist preference:', e);
      }
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
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

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `habitflow_export_${profile?.uid || 'user'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportMessage('Data exported successfully!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/15">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Back to Dashboard"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </Link>
        <h1 className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
          Settings & Account
        </h1>
      </div>

      {/* 1. Profile Section */}
      <section className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 shadow-soft border border-outline-variant/15 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        {/* Avatar */}
        <div className="relative shrink-0">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.name || 'User'}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-soft ring-4 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-app-title text-3xl font-bold ring-4 ring-primary/20 shadow-soft">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="font-section-header text-xl font-bold text-on-surface">
                {profile?.name || 'HabitFlow User'}
              </h2>
              <Badge variant="secondary" size="sm" className="capitalize">
                {profile?.authProvider || 'password'}
              </Badge>
            </div>
            <p className="font-body-text text-sm text-on-surface-variant mt-0.5">
              {profile?.email || 'user@example.com'}
            </p>
          </div>

          {/* Live Sync Status Pill */}
          <div className="flex items-center justify-center md:justify-start gap-2 bg-surface-container-low dark:bg-surface-container-high/40 rounded-xl px-4 py-2 border border-outline-variant/20 inline-flex w-full md:w-auto">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSyncing
                  ? 'bg-primary animate-ping'
                  : 'bg-secondary-fixed shadow-[0_0_8px_rgba(171,244,172,0.6)] animate-pulse'
              }`}
            />
            <span className="font-stat-label text-xs text-on-surface">
              {isSyncing ? 'Syncing with Firestore...' : 'Synced just now'}
            </span>

            <button
              onClick={handleManualSync}
              title="Refresh Sync"
              className="ml-auto md:ml-3 p-1 text-primary hover:bg-primary-fixed/20 rounded-full transition-colors"
            >
              <span
                className={`material-symbols-outlined text-[18px] block ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              >
                sync
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Dedicated "How to Install the App" Page Link */}
      <section className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden">
        <Link
          to="/install"
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low dark:hover:bg-surface-container-high/30 transition-colors text-left group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">install_mobile</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-habit-name text-sm sm:text-base font-semibold text-on-surface group-hover:text-primary transition-colors block">
                  How to Install the App
                </span>
                {isInstalled && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold font-stat-label">
                    Installed
                  </span>
                )}
              </div>
              <span className="font-body-text text-xs text-on-surface-variant block mt-0.5">
                Full step-by-step instructions for Android, iPhone, and PC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-primary font-stat-label hidden sm:inline group-hover:underline">
              View Guide
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low dark:bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>
        </Link>
      </section>

      {/* 3. Preferences Section */}
      <section className="space-y-3">
        <h3 className="font-section-header text-base font-bold text-on-surface px-1">
          Preferences
        </h3>

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/10">
          {/* Theme Selector */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                  Theme Appearance
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Current mode: {isDark ? 'Dark Theme' : 'Light Theme'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-stat-label bg-surface-container-low dark:bg-surface-container-high hover:bg-surface-container text-primary transition-colors"
            >
              {isDark ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>

          {/* Daily Reminders Toggle */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">notifications_active</span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                  Daily Reminders
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Morning check-in and evening reflection prompts
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={handleToggleReminder}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm font-semibold text-on-surface">
                  Push Notifications
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant">
                  Real-time alerts for consistency streaks
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={handleTogglePush}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
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
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low transition-colors text-left group"
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
          className="w-full bg-error-container/40 hover:bg-error-container text-on-error-container font-stat-label text-sm font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
};
