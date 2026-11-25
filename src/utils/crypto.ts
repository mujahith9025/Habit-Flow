/**
 * Zero-Knowledge Client-Side Encryption Utilities (AES-GCM 256-bit)
 * Uses native Web Crypto API (`crypto.subtle`) for maximum performance and security.
 */

const ENCRYPTION_PREFIX = 'enc:v1:';
const PBKDF2_ITERATIONS = 100000;
const SALT_DEFAULT = 'habitflow_zero_knowledge_salt_v1';

/**
 * Checks if a string is already encrypted with HabitFlow AES-GCM
 */
export function isEncrypted(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return text.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a passphrase and salt using PBKDF2
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: string = SALT_DEFAULT
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
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
 * Encrypts plain text with AES-GCM 256-bit
 * Returns payload formatted as `enc:v1:<base64-iv>:<base64-ciphertext>`
 */
export async function encryptText(
  plainText: string,
  keyOrPassphrase: CryptoKey | string,
  salt: string = SALT_DEFAULT
): Promise<string> {
  if (!plainText) return plainText;
  if (isEncrypted(plainText)) return plainText; // Prevent double encryption

  const key =
    typeof keyOrPassphrase === 'string'
      ? await deriveKeyFromPassphrase(keyOrPassphrase, salt)
      : keyOrPassphrase;

  const enc = new TextEncoder();
  // 12-byte random IV for AES-GCM
  const ivBuffer = new ArrayBuffer(12);
  const iv = new Uint8Array(ivBuffer);
  crypto.getRandomValues(iv);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    enc.encode(plainText)
  );

  const ivBase64 = bufferToBase64(iv);
  const cipherBase64 = bufferToBase64(encryptedBuffer);

  return `${ENCRYPTION_PREFIX}${ivBase64}:${cipherBase64}`;
}

/**
 * Decrypts AES-GCM 256-bit encrypted text
 * Returns the decrypted plain text or fallback if decryption fails
 */
export async function decryptText(
  encryptedPayload: string,
  keyOrPassphrase: CryptoKey | string,
  salt: string = SALT_DEFAULT
): Promise<string> {
  if (!encryptedPayload || !isEncrypted(encryptedPayload)) {
    return encryptedPayload;
  }

  try {
    const raw = encryptedPayload.slice(ENCRYPTION_PREFIX.length);
    const [ivBase64, cipherBase64] = raw.split(':');

    if (!ivBase64 || !cipherBase64) {
      return encryptedPayload;
    }

    const iv = base64ToBuffer(ivBase64);
    const cipherBytes = base64ToBuffer(cipherBase64);

    const key =
      typeof keyOrPassphrase === 'string'
        ? await deriveKeyFromPassphrase(keyOrPassphrase, salt)
        : keyOrPassphrase;

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer,
      },
      key,
      cipherBytes.buffer as ArrayBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Zero-knowledge decryption notice (invalid key or unencrypted content):', err);
    return encryptedPayload; // Return raw payload on key mismatch
  }
}

export const ZK_PASSPHRASE_KEY = 'habitflow_zk_passphrase';
export const ZK_ENABLED_KEY = 'habitflow_zk_enabled';

/**
 * Checks whether expanded zero-knowledge encryption is active
 */
export function isZeroKnowledgeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(ZK_ENABLED_KEY) === 'true' ||
      Boolean(localStorage.getItem(ZK_PASSPHRASE_KEY))
    );
  } catch {
    return false;
  }
}

/**
 * Enables or disables expanded zero-knowledge encryption
 */
export function setZeroKnowledgeEnabled(enabled: boolean, passphrase?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ZK_ENABLED_KEY, enabled ? 'true' : 'false');
    if (passphrase !== undefined) {
      if (passphrase.trim()) {
        localStorage.setItem(ZK_PASSPHRASE_KEY, passphrase.trim());
      } else {
        localStorage.removeItem(ZK_PASSPHRASE_KEY);
      }
    }
  } catch (err) {
    console.error('Failed to update zero knowledge preferences:', err);
  }
}

/**
 * Gets effective passphrase (configured custom passphrase or device-derived key)
 */
export function getEffectivePassphrase(fallbackUid?: string): string {
  if (typeof window === 'undefined') return 'habitflow_server_vault';
  try {
    const custom = localStorage.getItem(ZK_PASSPHRASE_KEY);
    if (custom && custom.trim()) return custom.trim();
    if (fallbackUid) return `${fallbackUid}_habitflow_zk_vault`;
    return 'habitflow_default_zk_vault';
  } catch {
    return 'habitflow_default_zk_vault';
  }
}

/**
 * Encrypts sensitive habit metadata fields (title, unit, pauseReason)
 */
export async function encryptHabitData<
  T extends { name?: string; unit?: string; pauseReason?: string }
>(habitData: T, passphrase: string): Promise<T> {
  const result = { ...habitData };

  if (result.name && !isEncrypted(result.name)) {
    result.name = await encryptText(result.name, passphrase);
  }
  if (result.unit && !isEncrypted(result.unit)) {
    result.unit = await encryptText(result.unit, passphrase);
  }
  if (result.pauseReason && !isEncrypted(result.pauseReason)) {
    result.pauseReason = await encryptText(result.pauseReason, passphrase);
  }

  return result;
}

/**
 * Decrypts sensitive habit metadata fields (title, unit, pauseReason)
 */
export async function decryptHabitData<
  T extends { name: string; unit?: string; pauseReason?: string }
>(habit: T, passphrase: string): Promise<T> {
  const result = { ...habit };

  if (result.name && isEncrypted(result.name)) {
    result.name = await decryptText(result.name, passphrase);
  }
  if (result.unit && isEncrypted(result.unit)) {
    result.unit = await decryptText(result.unit, passphrase);
  }
  if (result.pauseReason && isEncrypted(result.pauseReason)) {
    result.pauseReason = await decryptText(result.pauseReason, passphrase);
  }

  return result;
}

/**
 * Encrypts an individual habit entry reflection note
 */
export async function encryptEntryNote(note: string, passphrase: string): Promise<string> {
  if (!note || isEncrypted(note)) return note;
  return await encryptText(note, passphrase);
}

/**
 * Decrypts an individual habit entry reflection note
 */
export async function decryptEntryNote(
  note?: string | null,
  passphrase?: string
): Promise<string> {
  if (!note || !isEncrypted(note)) return note || '';
  const key = passphrase || getEffectivePassphrase();
  return await decryptText(note, key);
}
