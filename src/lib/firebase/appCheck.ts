import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  AppCheck,
} from 'firebase/app-check';
import { app } from './config';

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

let appCheckInstance: AppCheck | null = null;

/**
 * Initializes Firebase App Check (reCAPTCHA Enterprise / v3) to defend against bots, scraping, and unauthorized abuse.
 */
export function initAppCheck(): AppCheck | null {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  // In development/localhost mode, enable the debug provider token
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const siteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY ||
    '';

  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.info(
        'ℹ️ Firebase App Check: No VITE_RECAPTCHA_SITE_KEY defined yet in .env. App Check is ready for activation in Firebase Console.'
      );
    }
    return null;
  }

  try {
    // Attempt reCAPTCHA Enterprise provider first (Google recommended standard)
    const provider = new ReCaptchaEnterpriseProvider(siteKey);
    appCheckInstance = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
    console.info('🛡️ Firebase App Check (reCAPTCHA Enterprise) initialized successfully.');
    return appCheckInstance;
  } catch (err) {
    try {
      // Fallback to ReCaptchaV3Provider if enterprise initialization fails
      const fallbackProvider = new ReCaptchaV3Provider(siteKey);
      appCheckInstance = initializeAppCheck(app, {
        provider: fallbackProvider,
        isTokenAutoRefreshEnabled: true,
      });
      console.info('🛡️ Firebase App Check (reCAPTCHA v3) initialized successfully.');
      return appCheckInstance;
    } catch (e) {
      console.warn('Firebase App Check initialization note:', e);
      return null;
    }
  }
}
