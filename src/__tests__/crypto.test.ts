import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, isEncrypted, deriveKeyFromPassphrase } from '../utils/crypto';

describe('Zero-Knowledge Client-Side AES-GCM 256-bit Encryption Suite', () => {
  const samplePassphrase = 'MyUltraSecretHabitFlowPassword!2026';
  const sampleNote = 'Feeling really centered today. Practiced 20 minutes of mindful breathwork.';
  const sampleExpenseDesc = 'Private health consultation fee ₹1,500';

  it('correctly encrypts plain text into AES-GCM 256-bit formatted ciphertext', async () => {
    const encrypted = await encryptText(sampleNote, samplePassphrase);

    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toBe(sampleNote);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);
  });

  it('correctly decrypts ciphertext back into the original plain text', async () => {
    const encrypted = await encryptText(sampleNote, samplePassphrase);
    const decrypted = await decryptText(encrypted, samplePassphrase);

    expect(decrypted).toBe(sampleNote);
  });

  it('encrypts and decrypts sensitive expense item descriptions accurately', async () => {
    const encrypted = await encryptText(sampleExpenseDesc, samplePassphrase);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = await decryptText(encrypted, samplePassphrase);
    expect(decrypted).toBe(sampleExpenseDesc);
  });

  it('prevents double encryption on already encrypted payloads', async () => {
    const encrypted1 = await encryptText(sampleNote, samplePassphrase);
    const encrypted2 = await encryptText(encrypted1, samplePassphrase);

    expect(encrypted2).toBe(encrypted1);
  });

  it('works identically with pre-derived CryptoKey instances', async () => {
    const key = await deriveKeyFromPassphrase(samplePassphrase);
    const encrypted = await encryptText(sampleNote, key);
    const decrypted = await decryptText(encrypted, key);

    expect(decrypted).toBe(sampleNote);
  });

  it('returns fallback safely when decryption is attempted with incorrect passphrase', async () => {
    const encrypted = await encryptText(sampleNote, samplePassphrase);
    const decryptedWithWrongKey = await decryptText(encrypted, 'WrongPassword123');

    // Should gracefully return ciphertext or fallback without unhandled exception
    expect(decryptedWithWrongKey).toBe(encrypted);
  });
});
