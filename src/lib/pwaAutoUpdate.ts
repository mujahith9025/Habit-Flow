import { registerSW } from 'virtual:pwa-register';

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Initializes PWA Service Worker for ultra-fast instant startup and background offline caching.
 * Performs silent background updates without aggressive reload loops.
 */
export function initPWAAutoUpdate() {
  if (typeof window === 'undefined') return;

  try {
    updateSWFn = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info('[PWA] New version pre-cached in background.');
        // Silently activate new service worker in background
        if (updateSWFn) {
          updateSWFn(false).catch(() => {});
        }
      },
      onOfflineReady() {
        console.info('[PWA] HabitFlow offline pre-cache ready.');
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          // Check for background updates periodically every 30 minutes without interrupting UI
          setInterval(() => {
            if (navigator.onLine) {
              registration.update().catch(() => {});
            }
          }, 30 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.debug('[PWA] Service worker registration notice:', error);
      },
    });
  } catch (err) {
    console.debug('[PWA] Service worker initialization skipped:', err);
  }
}

export default initPWAAutoUpdate;
