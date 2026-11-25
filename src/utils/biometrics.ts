/**
 * Biometric App Lock & Hardware Security Engine (WebAuthn / Passkeys)
 * 
 * Supports:
 * - Apple Touch ID / Face ID
 * - Windows Hello
 * - Android Biometric Prompt
 * - Secure SHA-256 Hashed PIN Fallback
 * - Customizable Inactivity Auto-Lock Timers (Immediate, 2m, 5m, 15m)
 * - Mobile App Switcher Privacy Curtain
 */

export const APP_LOCK_ENABLED_KEY = 'habitflow_app_lock_enabled';
export const APP_LOCK_PIN_HASH_KEY = 'habitflow_app_lock_pin_hash';
export const APP_LOCK_TIMEOUT_KEY = 'habitflow_app_lock_timeout_mins';
export const APP_LOCK_CREDENTIAL_ID_KEY = 'habitflow_biometric_credential_id';
export const PRIVACY_CURTAIN_KEY = 'habitflow_privacy_curtain_enabled';

/**
 * Checks if the user's device supports biometric / platform authenticators
 * (Touch ID, Face ID, Windows Hello, Android Biometrics)
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (!window.PublicKeyCredential) return false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    console.warn('Biometrics availability check error:', err);
    return false;
  }
}

/**
 * Helper to convert Uint8Array / ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to convert Base64 string to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Registers a WebAuthn biometric credential for HabitFlow
 */
export async function registerBiometricCredential(
  userId: string,
  userEmail: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.credentials) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const enc = new TextEncoder();
    const userHandle = enc.encode(userId || 'habitflow_user');

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: {
          name: 'HabitFlow',
          id: window.location.hostname,
        },
        user: {
          id: userHandle.buffer as ArrayBuffer,
          name: userEmail || 'user@habitflow.app',
          displayName: userEmail ? userEmail.split('@')[0] : 'HabitFlow User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.id) {
      localStorage.setItem(APP_LOCK_CREDENTIAL_ID_KEY, credential.id);
      return true;
    }
    return false;
  } catch (err: unknown) {
    console.warn('Biometric registration error or cancelled by user:', err);
    return false;
  }
}

/**
 * Prompts user for Touch ID, Face ID, or Windows Hello authentication
 */
export async function verifyBiometricCredential(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.credentials) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const savedCredId = localStorage.getItem(APP_LOCK_CREDENTIAL_ID_KEY);
    const allowCredentials = savedCredId
      ? [
          {
            id: base64ToBuffer(savedCredId).buffer as ArrayBuffer,
            type: 'public-key' as const,
            transports: ['internal' as const],
          },
        ]
      : undefined;

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rpId: window.location.hostname,
        userVerification: 'preferred',
        allowCredentials,
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (err: unknown) {
    // If WebAuthn fails or is cancelled, allow graceful fallback to PIN
    console.warn('Biometric verification prompt notice:', err);
    return false;
  }
}

/**
 * Computes SHA-256 hash of a numeric PIN string
 */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`habitflow_pin_salt_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

/**
 * Sets a new 4-digit to 6-digit App Lock PIN
 */
export async function setAppPin(pin: string): Promise<void> {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  const hashed = await hashPin(pin);
  localStorage.setItem(APP_LOCK_PIN_HASH_KEY, hashed);
}

/**
 * Verifies entered PIN against stored SHA-256 hash
 */
export async function verifyAppPin(pin: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(APP_LOCK_PIN_HASH_KEY);
    if (!storedHash) return false;
    const computedHash = await hashPin(pin);
    return storedHash === computedHash;
  } catch {
    return false;
  }
}

/**
 * Checks if a PIN has been created
 */
export function hasAppPin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(APP_LOCK_PIN_HASH_KEY));
  } catch {
    return false;
  }
}

/**
 * Removes the stored PIN
 */
export function clearAppPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(APP_LOCK_PIN_HASH_KEY);
}

/**
 * Checks whether App Lock is enabled
 */
export function isAppLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(APP_LOCK_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Enables or disables App Lock
 */
export function setAppLockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APP_LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to update app lock setting:', err);
  }
}

/**
 * Gets the inactivity auto-lock timeout in minutes
 * Options: 0 = Immediate upon tab switch, 2 = 2 mins, 5 = 5 mins, 15 = 15 mins, -1 = Disabled
 */
export function getAutoLockMinutes(): number {
  if (typeof window === 'undefined') return 5;
  try {
    const raw = localStorage.getItem(APP_LOCK_TIMEOUT_KEY);
    if (raw === null) return 5; // Default: 5 minutes
    const val = parseInt(raw, 10);
    return isNaN(val) ? 5 : val;
  } catch {
    return 5;
  }
}

/**
 * Sets the inactivity auto-lock timeout in minutes
 */
export function setAutoLockMinutes(minutes: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APP_LOCK_TIMEOUT_KEY, String(minutes));
  } catch (err) {
    console.error('Failed to update auto lock timeout:', err);
  }
}

/**
 * Checks whether the App Switcher Privacy Curtain is enabled
 * (Blurs screen when app is minimized or backgrounded)
 */
export function isPrivacyCurtainEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(PRIVACY_CURTAIN_KEY);
    return raw === null ? true : raw === 'true'; // Default: enabled
  } catch {
    return true;
  }
}

/**
 * Toggles the App Switcher Privacy Curtain
 */
export function setPrivacyCurtainEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRIVACY_CURTAIN_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to update privacy curtain setting:', err);
  }
}
