import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEncrypted,
  encryptHabitData,
  decryptHabitData,
  encryptEntryNote,
  decryptEntryNote,
  getEffectivePassphrase,
  setZeroKnowledgeEnabled,
  isZeroKnowledgeEnabled,
} from '../utils/crypto';
import {
  hashPin,
  setAppPin,
  verifyAppPin,
  hasAppPin,
  clearAppPin,
  getAutoLockMinutes,
  setAutoLockMinutes,
  isPrivacyCurtainEnabled,
  setPrivacyCurtainEnabled,
  isAppLockEnabled,
  setAppLockEnabled,
} from '../utils/biometrics';

// Setup in-memory mock localStorage and window for Node test environment
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

if (typeof (globalThis as any).window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
  });
}

describe('Expanded Zero-Knowledge Encryption (Habit Titles & Metrics)', () => {
  const samplePassphrase = 'my_super_secret_master_key_2026';

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('encrypts habit title, unit, and pause reason with AES-GCM 256-bit', async () => {
    const rawHabit = {
      name: 'Morning Cold Shower',
      category: 'Health',
      icon: 'water_drop',
      unit: 'minutes',
      pauseReason: 'Travelling to Tokyo',
    };

    const encrypted = await encryptHabitData(rawHabit, samplePassphrase);

    expect(isEncrypted(encrypted.name)).toBe(true);
    expect(isEncrypted(encrypted.unit)).toBe(true);
    expect(isEncrypted(encrypted.pauseReason)).toBe(true);
    expect(encrypted.name).not.toBe(rawHabit.name);
    expect(encrypted.category).toBe('Health'); // Non-sensitive remains unencrypted
    expect(encrypted.icon).toBe('water_drop');
  });

  it('decrypts encrypted habit fields accurately back to original plain text', async () => {
    const rawHabit = {
      name: 'Private Meditation & Wim Hof Breathing',
      unit: 'breaths',
      pauseReason: 'Recovering from marathon',
    };

    const encrypted = await encryptHabitData(rawHabit, samplePassphrase);
    const decrypted = await decryptHabitData(encrypted, samplePassphrase);

    expect(decrypted.name).toBe(rawHabit.name);
    expect(decrypted.unit).toBe(rawHabit.unit);
    expect(decrypted.pauseReason).toBe(rawHabit.pauseReason);
  });

  it('prevents double encryption on already encrypted habit objects', async () => {
    const rawHabit = {
      name: 'Read 20 Pages',
      unit: 'pages',
    };

    const encrypted1 = await encryptHabitData(rawHabit, samplePassphrase);
    const encrypted2 = await encryptHabitData(encrypted1, samplePassphrase);

    expect(encrypted1.name).toBe(encrypted2.name);
    expect(encrypted1.unit).toBe(encrypted2.unit);
  });

  it('encrypts and decrypts reflection notes seamlessly', async () => {
    const note = 'Felt deeply energized and had great focus throughout the afternoon.';
    const encrypted = await encryptEntryNote(note, samplePassphrase);

    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toBe(note);

    const decrypted = await decryptEntryNote(encrypted, samplePassphrase);
    expect(decrypted).toBe(note);
  });

  it('manages zero knowledge enablement preferences and passphrase keys', () => {
    expect(isZeroKnowledgeEnabled()).toBe(false);

    setZeroKnowledgeEnabled(true, 'custom_secret_123');
    expect(isZeroKnowledgeEnabled()).toBe(true);
    expect(getEffectivePassphrase()).toBe('custom_secret_123');

    setZeroKnowledgeEnabled(false, '');
    expect(isZeroKnowledgeEnabled()).toBe(false);
  });
});

describe('Biometric App Lock, PIN & Privacy Shield', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('hashes PIN with SHA-256 and verifies correct PIN', async () => {
    const pin = '4829';
    const computedHash = await hashPin(pin);
    expect(computedHash).toBeTruthy();

    await setAppPin(pin);

    expect(hasAppPin()).toBe(true);
    const isValid = await verifyAppPin('4829');
    expect(isValid).toBe(true);

    const isWrong = await verifyAppPin('1234');
    expect(isWrong).toBe(false);

    clearAppPin();
    expect(hasAppPin()).toBe(false);
  });

  it('rejects PINs shorter than 4 digits', async () => {
    await expect(setAppPin('123')).rejects.toThrow('PIN must be at least 4 digits');
  });

  it('manages inactivity auto-lock timeout intervals correctly', () => {
    expect(getAutoLockMinutes()).toBe(5); // Default is 5 minutes

    setAutoLockMinutes(2);
    expect(getAutoLockMinutes()).toBe(2);

    setAutoLockMinutes(0); // Immediately
    expect(getAutoLockMinutes()).toBe(0);

    setAutoLockMinutes(15);
    expect(getAutoLockMinutes()).toBe(15);

    setAutoLockMinutes(-1); // Disabled
    expect(getAutoLockMinutes()).toBe(-1);
  });

  it('manages App Switcher Privacy Curtain preferences', () => {
    expect(isPrivacyCurtainEnabled()).toBe(true); // Enabled by default

    setPrivacyCurtainEnabled(false);
    expect(isPrivacyCurtainEnabled()).toBe(false);

    setPrivacyCurtainEnabled(true);
    expect(isPrivacyCurtainEnabled()).toBe(true);
  });

  it('manages App Lock state transitions', () => {
    expect(isAppLockEnabled()).toBe(false);

    setAppLockEnabled(true);
    expect(isAppLockEnabled()).toBe(true);

    setAppLockEnabled(false);
    expect(isAppLockEnabled()).toBe(false);
  });
});
