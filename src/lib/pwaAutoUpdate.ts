import { registerSW } from 'virtual:pwa-register';

declare const __APP_VERSION__: string;

let isRefreshing = false;

/**
 * Hard reload the app and clear outdated service worker caches
 */
export async function forceHardRefresh() {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.warn('[AutoUpdate] Cache clearing notice during hard refresh:', err);
  }

  // Force clean reload bypassing browser cache
  window.location.reload();
}

/**
 * Checks server for latest version.json and triggers hard refresh if updated version is found
 */
export async function checkServerForNewVersion(currentVersion: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  try {
    const response = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.version && data.version !== currentVersion) {
        console.log(
          `[AutoUpdate] New version detected (Current: ${currentVersion}, Server: ${data.version}). Executing auto hard-refresh...`
        );
        sessionStorage.setItem('habitflow_last_synced_version', data.version);
        await forceHardRefresh();
        return true;
      }
    }
  } catch (err) {
    // Network or offline check failure, silently ignore
  }
  return false;
}

/**
 * Initializes automatic PWA Service Worker updates and hard-refresh triggers
 * on every app/website open, tab switch, focus, or resume in mobile & desktop.
 */
export function initPWAAutoUpdate() {
  if (typeof window === 'undefined') return;

  const currentVersion =
    typeof __APP_VERSION__ !== 'undefined'
      ? __APP_VERSION__
      : sessionStorage.getItem('habitflow_last_synced_version') || '1.0.0';

  // 1. Controller change listener: when SW activates a new version, reload immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing) {
        isRefreshing = true;
        window.location.reload();
      }
    });
  }

  // 2. Register Service Worker with instant autoUpdate
  let swRegistration: ServiceWorkerRegistration | undefined;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[AutoUpdate] Service Worker has new update ready. Applying update...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[AutoUpdate] HabitFlow offline cache ready.');
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        swRegistration = registration;
        // Check for SW update immediately
        registration.update().catch(() => {});
      }
    },
  });

  // 3. Auto update trigger function: runs whenever the app opens, tab becomes visible, or window gains focus
  const triggerAutoUpdateCheck = async () => {
    // A. Check Service Worker update
    if (swRegistration) {
      swRegistration.update().catch(() => {});
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }

    // B. Check version.json on server
    await checkServerForNewVersion(currentVersion);
  };

  // Check immediately on startup
  triggerAutoUpdateCheck();

  // Check whenever user switches to the app or brings it to the foreground (mobile resume / desktop focus)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerAutoUpdateCheck();
    }
  });

  window.addEventListener('focus', () => {
    triggerAutoUpdateCheck();
  });

  window.addEventListener('pageshow', (event) => {
    // Triggers when page is restored from bfcache or reopened
    if (event.persisted || document.visibilityState === 'visible') {
      triggerAutoUpdateCheck();
    }
  });

  // Also periodic check every 10 minutes while app stays open
  setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      triggerAutoUpdateCheck();
    }
  }, 10 * 60 * 1000);
}
