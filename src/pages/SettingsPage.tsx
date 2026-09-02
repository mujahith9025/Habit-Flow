import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { useExpenseTracker } from '../hooks/useExpenseTracker';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Badge } from '../components/ui/Badge';
import { triggerHaptic } from '../utils/haptics';
import { getNotificationSettings } from '../lib/notificationService';
import { NotificationSettings } from '../types/notification';
import { NotificationDetailsModal } from '../components/settings/NotificationDetailsModal';
import { ExportDataModal } from '../components/settings/ExportDataModal';
import { DeleteAccountModal } from '../components/settings/DeleteAccountModal';

export const SettingsPage: React.FC = () => {
  const { profile } = useUserProfile();
  const { isDark, toggleTheme } = useTheme();
  const { user, firebaseUser, signOut } = useAuth();
  const { habits } = useHabits();
  const {
    allLedgerRows,
    monthSummaries,
    totalCurrentBalance,
    settings: expenseSettings,
  } = useExpenseTracker();
  const { isInstalled } = usePWAInstall();
  const navigate = useNavigate();

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleManualSync = () => {
    setIsSyncing(true);
    triggerHaptic('light');
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const isPushActive =
    notifSettings.enabled && notifSettings.permissionStatus === 'granted';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/15">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
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

      {/* 2. Preferences & Features */}
      <section className="space-y-3">
        <h3 className="font-section-header text-base font-bold text-on-surface px-1">
          Preferences & Reminders
        </h3>

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/10">
          {/* Reminders & Notifications Clickable Section */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsNotifModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low/60 dark:hover:bg-surface-container-high/30 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">notifications_active</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-habit-name text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                    Reminders & Push Notifications
                  </h4>
                  {isPushActive ? (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold font-stat-label flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold font-stat-label">
                      Setup
                    </span>
                  )}
                </div>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5 truncate">
                  {isPushActive
                    ? `☀️ Morning (${notifSettings.morningTime}) • 🌙 Evening (${notifSettings.eveningTime}) • Tap for details`
                    : 'Configure morning kick-off and evening task completion alerts'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
              <span className="text-xs font-semibold hidden sm:inline">Details</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </button>

          {/* Theme Mode Toggle Row */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div>
                <h4 className="font-habit-name text-sm sm:text-base font-bold text-on-surface">
                  Theme Appearance
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                  Currently using {isDark ? 'Dark Theme' : 'Light Theme'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-stat-label bg-surface-container-low dark:bg-surface-container-high hover:bg-surface-container text-primary border border-outline-variant/20 transition-all active:scale-95 cursor-pointer"
            >
              {isDark ? 'Switch to Light ☀️' : 'Switch to Dark 🌙'}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Account Management & Data */}
      <section className="space-y-3">
        <h3 className="font-section-header text-base font-bold text-on-surface px-1">
          Account & Data
        </h3>

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-soft border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/10">
          {/* Export Data Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsExportModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface group-hover:text-primary transition-colors shrink-0">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-habit-name text-sm font-bold text-on-surface block">
                    Export Habit Data
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-stat-label">
                    PDF / Excel / JSON
                  </span>
                </div>
                <span className="font-body-text text-xs text-on-surface-variant">
                  Download reports & spreadsheets as PDF, Excel, or JSON
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              chevron_right
            </span>
          </button>

          <Link
            to="/debug"
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface group-hover:text-primary transition-colors shrink-0">
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

          {/* GDPR / CCPA Right to Erasure Account Deletion */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('warning');
              setIsDeleteAccountModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-error-container/10 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-habit-name text-sm font-bold text-error block">
                    Erase All Data & Delete Account
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-error/15 text-error text-[10px] font-bold font-stat-label uppercase">
                    GDPR Erasure
                  </span>
                </div>
                <span className="font-body-text text-xs text-on-surface-variant">
                  Permanently destroy all habits, history, financial ledger, and account
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-error/60 group-hover:text-error transition-colors">
              chevron_right
            </span>
          </button>
        </div>
      </section>

      {/* 4. Action: Sign Out */}
      <section className="pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-stat-label text-sm font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] border border-outline-variant/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </section>

      {/* 5. Reminders & Notifications Details Modal */}
      <NotificationDetailsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        settings={notifSettings}
        onUpdateSettings={(updated) => setNotifSettings(updated)}
      />

      {/* 6. Export Data Format Choice Modal (PDF / Excel / JSON) */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        profile={profile}
        habits={habits}
        expenseRows={allLedgerRows}
        monthSummaries={monthSummaries}
        totalCumulativeSavings={totalCurrentBalance}
        expenseSettings={expenseSettings}
      />

      {/* 7. GDPR / CCPA Right to Erasure Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        firebaseUser={firebaseUser}
        userId={user?.uid}
        onSuccess={() => {
          navigate('/login');
        }}
      />
    </div>
  );
};
