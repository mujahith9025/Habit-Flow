import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Badge } from '../components/ui/Badge';
import { triggerHaptic } from '../utils/haptics';
import { getNotificationSettings } from '../lib/notificationService';
import { NotificationSettings } from '../types/notification';
import { NotificationDetailsModal } from '../components/settings/NotificationDetailsModal';
import { ExportDataModal } from '../components/settings/ExportDataModal';
import { ImportBackupModal } from '../components/settings/ImportBackupModal';
import { DeleteAccountModal } from '../components/settings/DeleteAccountModal';
import { exportFullAccountBackup } from '../lib/firebase/backupService';
import { CloudSyncStatus } from '../components/ui/CloudSyncStatus';
import { DeviceManagerModal } from '../components/settings/DeviceManagerModal';
import { SecuritySettingsModal } from '../components/settings/SecuritySettingsModal';
import { HabitFlowLogo } from '../components/ui/HabitFlowLogo';

export type SettingsGroupKey =
  | 'profile'
  | 'preferences'
  | 'appearance'
  | 'habits'
  | 'notifications'
  | 'data'
  | 'security'
  | 'about'
  | 'account';

interface SettingsGroup {
  key: SettingsGroupKey;
  label: string;
  icon: string;
  description: string;
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  { key: 'profile', label: 'Profile', icon: 'person', description: 'Account identity and cloud synchronization' },
  { key: 'preferences', label: 'Preferences', icon: 'tune', description: 'Daily flow, haptics, and calendar display' },
  { key: 'appearance', label: 'Appearance', icon: 'palette', description: 'Warm organic theme and dark obsidian modes' },
  { key: 'habits', label: 'Habits', icon: 'task_alt', description: 'Habit tracking defaults and activity goals' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications', description: 'Morning kick-off and evening review reminders' },
  { key: 'data', label: 'Data & Privacy', icon: 'shield', description: 'Full backups, JSON export, and restore' },
  { key: 'security', label: 'Security', icon: 'lock', description: 'Active sessions, PIN lock, and encryption' },
  { key: 'about', label: 'About', icon: 'info', description: 'Version, PWA standalone status, and architecture' },
  { key: 'account', label: 'Account', icon: 'manage_accounts', description: 'Session sign-out and GDPR account erasure' },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { isDark, toggleTheme } = useTheme();
  const { user, firebaseUser, signOut } = useAuth();
  const { habits } = useHabits();
  const { isInstalled } = usePWAInstall();

  // Compact (mobile & tablet) vs wide desktop layout state
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [activeGroup, setActiveGroup] = useState<SettingsGroupKey | null>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? null : 'profile'
  );

  // Settings state
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'monday' | 'sunday'>('monday');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [showSavedPill, setShowSavedPill] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );

  const triggerSavedFeedback = () => {
    setShowSavedPill(true);
    setTimeout(() => setShowSavedPill(false), 1600);
  };

  // Modals state
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isExportingFullBackup, setIsExportingFullBackup] = useState(false);

  // Sync profile display name
  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
  }, [profile?.name]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth < 1024;
      setIsCompact(compact);
      if (!compact && activeGroup === null) {
        setActiveGroup('profile');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeGroup]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      navigate('/login');
    }
  };

  const handleExportFullBackup = async () => {
    if (!user?.uid || isExportingFullBackup) return;
    try {
      setIsExportingFullBackup(true);
      triggerHaptic('success');
      await exportFullAccountBackup(user.uid);
    } catch (err) {
      console.error('Failed to export full account backup:', err);
    } finally {
      setIsExportingFullBackup(false);
    }
  };

  const isPushActive =
    notifSettings.enabled && notifSettings.permissionStatus === 'granted';

  // -------------------------------------------------------------
  // GROUP DETAIL CONTENT RENDERER
  // -------------------------------------------------------------
  const renderGroupDetail = (groupKey: SettingsGroupKey) => {
    switch (groupKey) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <div>
                <h3 className="font-section-header text-xl font-bold text-on-surface">Profile</h3>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                  Your personal identity, cloud sync status, and account credentials
                </p>
              </div>
              {showSavedPill && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-stat-label animate-fadeIn flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Saved
                </span>
              )}
            </div>

            {/* Profile Avatar Card */}
            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xl font-app-title shadow-sm ring-4 ring-primary/10 shrink-0">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={displayName || 'User Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-section-header text-base font-bold text-on-surface truncate">
                  {displayName || 'HabitFlow Explorer'}
                </h4>
                <p className="font-body-text text-xs text-on-surface-variant truncate">
                  {user?.email || 'Guest Session'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary" className="text-[10px] font-stat-label">
                    {profile?.authProvider === 'google' ? 'Google Account' : 'Standard Member'}
                  </Badge>
                  {isInstalled && (
                    <Badge variant="secondary" className="text-[10px] font-stat-label">
                      PWA Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form Fields */}
            <div className="space-y-4 bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft">
              <div>
                <label htmlFor="settings-display-name" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Display Name
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    triggerSavedFeedback();
                  }}
                  className="block w-full px-4 py-2.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/25 text-on-surface font-body-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label htmlFor="settings-email-readonly" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Email Address
                </label>
                <input
                  id="settings-email-readonly"
                  type="email"
                  disabled
                  readOnly
                  value={user?.email || 'Guest Mode (No cloud email connected)'}
                  className="block w-full px-4 py-2.5 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/15 text-on-surface-variant font-body-text text-sm cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* Cloud Sync Status */}
            <div>
              <CloudSyncStatus variant="full" />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <div>
                <h3 className="font-section-header text-xl font-bold text-on-surface">Preferences</h3>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                  Customize weekly start days, interaction feedback, and habits workflow
                </p>
              </div>
              {showSavedPill && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-stat-label animate-fadeIn flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Saved
                </span>
              )}
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft divide-y divide-outline-variant/15 space-y-4">
              {/* Start Day of Week */}
              <div className="pt-1 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">First Day of Week</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Start calendar heatmaps and weekly graphs on Monday or Sunday
                  </p>
                </div>
                <div className="inline-flex p-1 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setFirstDayOfWeek('monday');
                      triggerSavedFeedback();
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      firstDayOfWeek === 'monday'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Monday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setFirstDayOfWeek('sunday');
                      triggerSavedFeedback();
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      firstDayOfWeek === 'sunday'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Sunday
                  </button>
                </div>
              </div>

              {/* Haptic Vibration Feedback */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Haptic Vibration</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Physical vibration tap when completing tasks or toggling days
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !hapticsEnabled;
                    setHapticsEnabled(next);
                    if (next) triggerHaptic('success');
                    triggerSavedFeedback();
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    hapticsEnabled ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Appearance</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Clean Japandi minimalist theme calibrated for long focus sessions
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Theme Mode</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Currently using {isDark ? 'Dark Obsidian' : 'Warm Linen'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isDark ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
                </button>
              </div>

              {/* Theme Palette Preview Swatches */}
              <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/15 space-y-2.5">
                <span className="text-[11px] font-stat-label font-bold text-on-surface-variant uppercase tracking-wider block">
                  Active Palette Tokens
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#F7F6F2] dark:bg-[#141517] border border-outline-variant/30 text-center">
                    <span className="text-[11px] font-bold block text-on-surface">Canvas</span>
                    <span className="text-[10px] text-on-surface-variant">{isDark ? '#141517' : '#F7F6F2'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#18191B] text-white text-center">
                    <span className="text-[11px] font-bold block">Charcoal</span>
                    <span className="text-[10px] text-white/70">#18191B</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#E8EFE8] dark:bg-[#1E2E20] text-center border border-emerald-500/20">
                    <span className="text-[11px] font-bold block text-emerald-800 dark:text-emerald-300">Sage</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">#2D5A34</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high text-center border border-outline-variant/20">
                    <span className="text-[11px] font-bold block text-on-surface">Card</span>
                    <span className="text-[10px] text-on-surface-variant">Squircle 24px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'habits': {
        const activeCount = habits.filter((h) => !h.archived).length;
        const archivedCount = habits.filter((h) => h.archived).length;

        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Habits</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Overview of active trackers, goal consistency, and data logging
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft">
                <span className="text-[11px] font-stat-label text-on-surface-variant uppercase font-bold">
                  Active Habits
                </span>
                <div className="font-app-title text-3xl font-extrabold text-on-surface mt-1">
                  {activeCount}
                </div>
                <p className="font-body-text text-xs text-on-surface-variant mt-1">
                  Currently tracked daily and weekly
                </p>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft">
                <span className="text-[11px] font-stat-label text-on-surface-variant uppercase font-bold">
                  Archived Records
                </span>
                <div className="font-app-title text-3xl font-extrabold text-on-surface mt-1">
                  {archivedCount}
                </div>
                <p className="font-body-text text-xs text-on-surface-variant mt-1">
                  Preserved historical streaks & completions
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft flex items-center justify-between">
              <div>
                <h4 className="font-habit-name text-sm font-bold text-on-surface">Manage Habits & Boards</h4>
                <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                  Create new habits, edit categories, or view historical records
                </p>
              </div>
              <Link
                to="/habit"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant transition-all"
              >
                Go to Habit View &rarr;
              </Link>
            </div>
          </div>
        );
      }

      case 'notifications':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Notifications</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Configure morning kick-off and evening task review prompts
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">notifications_active</span>
                  </div>
                  <div>
                    <h4 className="font-habit-name text-sm font-bold text-on-surface">
                      Push Notifications & Schedule
                    </h4>
                    <p className="font-body-text text-xs text-on-surface-variant">
                      {isPushActive
                        ? `Morning (${notifSettings.morningTime}) • Evening (${notifSettings.eveningTime})`
                        : 'Currently inactive or permission pending'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsNotifModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant transition-all"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Data and Privacy</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Download local backups, import archive files, and preserve storage sovereignty
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-3 divide-y divide-outline-variant/15">
              {/* Full JSON Backup */}
              <div className="pt-1 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Download Full Account Backup</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Complete offline JSON snapshot containing all habits and check-in history
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  disabled={isExportingFullBackup}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant transition-all shrink-0 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>{isExportingFullBackup ? 'Exporting...' : 'Export JSON'}</span>
                </button>
              </div>

              {/* Restore JSON Backup */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Restore from Backup</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Import a previous HabitFlow JSON backup into your active account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsImportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  <span>Import JSON</span>
                </button>
              </div>

              {/* PDF / Excel / CSV Reports */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Export Executive PDF & Spreadsheets</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Formatted analytics reports with charts, completion tables, and metrics
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsExportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  <span>Reports</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Security & Sessions</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Zero-knowledge encryption, PIN protections, and active device management
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-3 divide-y divide-outline-variant/15">
              {/* Active Devices */}
              <div className="pt-1 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Active Devices & Sessions</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    View active phone, tablet, and PC sessions with remote revocation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsDeviceModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant transition-all shrink-0"
                >
                  Manage
                </button>
              </div>

              {/* Zero Knowledge Encryption */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-habit-name text-sm font-bold text-on-surface">Zero-Knowledge Cloud Encryption</h4>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      AES-GCM 256
                    </span>
                  </div>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    End-to-end passphrase encryption for personal reflections and notes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsSecurityModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all shrink-0"
                >
                  Security Key
                </button>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">About HabitFlow</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Distraction-free personal habit and consistency platform
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/15">
                <div className="shrink-0">
                  <HabitFlowLogo size={46} />
                </div>
                <div>
                  <h4 className="font-app-title text-base font-bold text-on-surface">HabitFlow v0.1.0</h4>
                  <p className="font-body-text text-xs text-on-surface-variant">
                    Gentle persistence • Built with React 18, Vite & Firebase
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-body-text text-on-surface-variant">
                <p>
                  <strong>Architecture:</strong> Local-first IndexedDB cache + Real-time Firestore Cloud sync.
                </p>
                <p>
                  <strong>Security:</strong> AES-GCM 256-bit Web Crypto encryption, client-side session hashing.
                </p>
                <p>
                  <strong>Offline Ready:</strong> Progressive Web App (PWA) with Workbox service worker precaching.
                </p>
              </div>

              {!isInstalled && (
                <div className="pt-2">
                  <Link
                    to="/install"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                    <span>How to Install on Phone / Desktop</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-section-header text-xl font-bold text-on-surface">Account Management</h3>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Sign out of this session or exercise GDPR Right to Erasure
              </p>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 shadow-soft space-y-4">
              {/* Sign Out */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
                <div>
                  <h4 className="font-habit-name text-sm font-bold text-on-surface">Sign Out</h4>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Log out of this device safely. Your cloud records remain synced.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-5 py-2.5 rounded-full text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Sign Out
                </button>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-habit-name text-sm font-bold text-error">Permanently Delete Account</h4>
                    <span className="px-2 py-0.2 rounded-full bg-error/15 text-error text-[10px] font-bold">
                      GDPR Erasure
                    </span>
                  </div>
                  <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    Permanently delete your account, habits, and all historical records from cloud servers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('warning');
                    setIsDeleteAccountModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-full text-xs font-bold font-stat-label bg-error/10 hover:bg-error/20 text-error border border-error/30 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto pb-24 animate-fadeIn">
      {/* ========================================================= */}
      {/* COMPACT VIEW (Mobile & Tablet drill-down list navigation)  */}
      {/* ========================================================= */}
      {isCompact && !activeGroup && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-outline-variant/15 flex items-center gap-3">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <h2 className="font-app-title text-2xl font-bold text-on-surface">Settings</h2>
              <p className="font-body-text text-xs text-on-surface-variant">Preferences, security, and account controls</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-soft overflow-hidden divide-y divide-outline-variant/15">
            {SETTINGS_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveGroup(group.key);
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface group-hover:text-primary transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{group.icon}</span>
                  </div>
                  <div>
                    <span className="font-habit-name text-sm font-bold text-on-surface block">
                      {group.label}
                    </span>
                    <span className="font-body-text text-[11px] text-on-surface-variant">
                      {group.description}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMPACT DETAIL VIEW (Subpage with Back to Settings)       */}
      {/* ========================================================= */}
      {isCompact && activeGroup && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveGroup(null)}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:opacity-80 py-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Settings</span>
          </button>
          <div>{renderGroupDetail(activeGroup)}</div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP TWO-COLUMN MASTER-DETAIL LAYOUT (>= 1024px)       */}
      {/* ========================================================= */}
      {!isCompact && (
        <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-soft overflow-hidden flex min-h-[580px]">
          {/* Left Column: Navigation Pane (240px) */}
          <nav className="w-64 p-4 border-r border-outline-variant/15 flex flex-col justify-between shrink-0 bg-surface-container-low/40 dark:bg-surface-container-high/20">
            <div className="space-y-1">
              <div className="px-3 py-3 mb-2">
                <h2 className="font-app-title text-lg font-bold text-on-surface tracking-tight">
                  Settings
                </h2>
                <p className="font-body-text text-[11px] text-on-surface-variant">
                  Personalize HabitFlow
                </p>
              </div>

              {SETTINGS_GROUPS.map((group) => {
                const isActive = activeGroup === group.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveGroup(group.key);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-habit-name font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-soft font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{group.icon}</span>
                    <span>{group.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Sign Out at bottom of nav */}
            <div className="pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Right Column: Active Group Detail Pane (flex-1) */}
          <div className="flex-1 p-6 lg:p-8 min-w-0 max-w-2xl overflow-y-auto">
            {renderGroupDetail(activeGroup || 'profile')}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}
      <NotificationDetailsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        settings={notifSettings}
        onUpdateSettings={(updated) => setNotifSettings(updated)}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        profile={profile}
        habits={habits}
      />

      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <DeviceManagerModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

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

export default SettingsPage;
