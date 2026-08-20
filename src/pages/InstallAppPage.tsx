import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallAppPage: React.FC = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();

  // Detect user platform for smart pre-selection
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/15">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors active:scale-95"
          aria-label="Go Back"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-app-title text-2xl sm:text-3xl font-bold text-on-surface">
            How to Install HabitFlow
          </h1>
          <p className="font-body-text text-xs sm:text-sm text-on-surface-variant">
            Run HabitFlow as a standalone, distraction-free mobile or desktop app
          </p>
        </div>
      </div>

      {/* Hero Banner with Direct Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-surface-container-lowest to-secondary/15 dark:from-primary/20 dark:via-surface-container dark:to-secondary/20 p-6 sm:p-8 border border-outline-variant/20 shadow-soft">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-stat-label">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Progressive Web App (PWA)
            </div>
            <h2 className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight">
              Get the Full App Experience
            </h2>
            <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-xl">
              Install HabitFlow directly to your home screen. No app store downloads, zero ads, instant offline tracking, and automatic cloud sync.
            </p>
          </div>

          {/* Quick Install Action Card */}
          <div className="shrink-0 w-full md:w-auto">
            {isInstalled ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary-container text-on-secondary-container font-semibold text-sm shadow-soft">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                <span>App Already Installed</span>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={installPWA}
                className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-soft hover:bg-on-primary-fixed-variant transition-all active:scale-95 hover:shadow-glow"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Install HabitFlow Now</span>
              </button>
            ) : (
              <div className="text-center md:text-right text-xs text-on-surface-variant bg-surface-container-low dark:bg-surface-container-high/40 px-4 py-3 rounded-2xl border border-outline-variant/20">
                <span>Follow the steps below to add to your home screen ⬇️</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Selector Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 p-1.5 bg-surface-container-low dark:bg-surface-container-high/40 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-habit-name text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
              activeTab === 'android'
                ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">android</span>
            <span>Android (Chrome)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-habit-name text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
              activeTab === 'ios'
                ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
            <span>iPhone / iPad (Safari)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-habit-name text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
              activeTab === 'desktop'
                ? 'bg-primary text-on-primary shadow-soft scale-[1.02]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">computer</span>
            <span>PC & Mac</span>
          </button>
        </div>

        {/* Tab 1: Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    1
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Open in Google Chrome
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Visit <strong className="text-primary dark:text-primary-fixed-dim">https://habitflow-2a53e.web.app</strong> on your Android device using Google Chrome, Brave, or Edge.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    2
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Tap the Three Dots Menu (⋮)
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Tap the three vertical dots <strong className="text-on-surface font-bold">(⋮)</strong> located at the top-right corner of the Chrome browser window.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    3
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Select "Install App" or "Add to Home"
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  In the menu list, tap <strong className="text-on-surface font-bold">"Install App"</strong> (or <strong className="text-on-surface font-bold">"Add to Home screen"</strong>).
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    4
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Confirm & Launch
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Tap <strong className="text-primary font-bold">Install</strong>. The HabitFlow app icon will appear instantly on your phone's home screen and app drawer!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary text-on-secondary font-bold text-sm flex items-center justify-center shadow-soft">
                    1
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Open in Apple Safari
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Navigate to <strong className="text-secondary font-bold">https://habitflow-2a53e.web.app</strong> on your iPhone or iPad using Safari.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary text-on-secondary font-bold text-sm flex items-center justify-center shadow-soft">
                    2
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Tap the Share Button (⎋)
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Tap the <strong className="text-on-surface font-bold">Share button</strong> (the square icon with an arrow pointing upwards) in Safari's bottom toolbar.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary text-on-secondary font-bold text-sm flex items-center justify-center shadow-soft">
                    3
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Tap "Add to Home Screen" (➕)
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Scroll down the share options list and select <strong className="text-on-surface font-bold">"Add to Home Screen" ➕</strong>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary text-on-secondary font-bold text-sm flex items-center justify-center shadow-soft">
                    4
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Tap "Add" in Top Right
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Tap <strong className="text-secondary font-bold">Add</strong> in the top-right corner. HabitFlow will now launch like a full native iOS app without browser address bars!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop Instructions */}
        {activeTab === 'desktop' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    1
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Open in Chrome or Edge
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Open <strong className="text-primary dark:text-primary-fixed-dim">https://habitflow-2a53e.web.app</strong> on your PC, Mac, or Chromebook.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    2
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Click the Install Icon in URL Bar
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Look at the right end of the browser address bar for the <strong className="text-on-surface font-bold">Install icon (computer with down arrow)</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    3
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Click "Install"
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  Click <strong className="text-primary font-bold">Install</strong> in the popup prompt to create a desktop shortcut.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-soft">
                    4
                  </div>
                  <h3 className="font-section-header text-sm sm:text-base font-bold text-on-surface">
                    Pin to Taskbar or Dock
                  </h3>
                </div>
                <p className="font-body-text text-xs text-on-surface-variant pl-11">
                  HabitFlow opens in a standalone window and can be pinned to your Windows Taskbar or macOS Dock!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Benefits Grid */}
      <div className="space-y-4">
        <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
          Why Install HabitFlow?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/15 shadow-soft space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">offline_bolt</span>
            </div>
            <h4 className="font-habit-name text-sm font-bold text-on-surface">
              100% Offline Ready
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant">
              Track habits on flights, underground, or without cellular signal. Everything syncs when you reconnect.
            </p>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/15 shadow-soft space-y-2">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">speed</span>
            </div>
            <h4 className="font-habit-name text-sm font-bold text-on-surface">
              Lightning Fast Launch
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant">
              Pre-cached service worker loads the app in milliseconds with zero loading spinners.
            </p>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/15 shadow-soft space-y-2">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">fullscreen</span>
            </div>
            <h4 className="font-habit-name text-sm font-bold text-on-surface">
              Fullscreen & Clean
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant">
              No browser address bars or navigation buttons—just your clean habit boards and metrics.
            </p>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/15 shadow-soft space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">memory</span>
            </div>
            <h4 className="font-habit-name text-sm font-bold text-on-surface">
              Ultra Lightweight (~1MB)
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant">
              Takes virtually zero storage on your phone compared to 100MB+ app store downloads.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
          Frequently Asked Questions
        </h3>

        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/15 shadow-soft divide-y divide-outline-variant/15 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-1.5">
            <h4 className="font-habit-name text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">help</span>
              Do I need to update the app from an App Store?
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant pl-6">
              No! HabitFlow updates automatically in the background every time new features or improvements are released.
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-1.5">
            <h4 className="font-habit-name text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">cloud_sync</span>
              Does my data stay safe if I switch devices?
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant pl-6">
              Yes! All your habits, streaks, and check-in history are secured in your cloud account and sync seamlessly across your phone, tablet, and PC.
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-1.5">
            <h4 className="font-habit-name text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">delete</span>
              How do I uninstall or remove the app?
            </h4>
            <p className="font-body-text text-xs text-on-surface-variant pl-6">
              Simply long-press the HabitFlow icon on your home screen and tap "Remove" or "Uninstall", just like any regular phone app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
