import React, { useState } from 'react';
import { triggerHaptic } from '../../utils/haptics';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { useAppLock } from '../../context/AppLockContext';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import {
  isZeroKnowledgeEnabled,
  setZeroKnowledgeEnabled,
  getEffectivePassphrase,
  encryptHabitData,
  isEncrypted,
} from '../../utils/crypto';
import { registerBiometricCredential } from '../../utils/biometrics';
import { announce } from '../../utils/announcer';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { habits, updateHabit } = useHabits('all');
  const {
    isAppLockEnabled,
    isBiometricsSupported,
    hasPin,
    autoLockMinutes,
    privacyCurtainEnabled,
    enableAppLock,
    setupPin,
    removePin,
    changeAutoLockMinutes,
    togglePrivacyCurtain,
  } = useAppLock();

  const [activeTab, setActiveTab] = useState<
    'encryption' | 'biometrics' | 'privacy' | 'hardening'
  >('encryption');

  // Encryption states
  const [zkEnabled, setZkEnabled] = useState<boolean>(() => isZeroKnowledgeEnabled());
  const [encryptionPassphrase, setEncryptionPassphrase] = useState(() => {
    return localStorage.getItem('habitflow_zk_passphrase') || '';
  });
  const [isEncryptingAll, setIsEncryptingAll] = useState(false);
  const [encryptionStatusMsg, setEncryptionStatusMsg] = useState('');

  // PIN states
  const [newPin, setNewPin] = useState('');
  const [pinStatusMsg, setPinStatusMsg] = useState('');

  // Biometric registration state
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState('');

  if (!isOpen) return null;

  // Save Passphrase & ZK Toggle
  const handleSaveEncryption = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setZeroKnowledgeEnabled(zkEnabled, encryptionPassphrase);
      triggerHaptic('success');
      setEncryptionStatusMsg('Zero-knowledge encryption preferences saved!');
      announce('Zero-knowledge encryption preferences saved.');
      setTimeout(() => setEncryptionStatusMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save encryption passphrase:', err);
    }
  };

  // Encrypt All Existing Habits
  const handleBatchEncryptAllHabits = async () => {
    if (!user?.uid || isEncryptingAll) return;
    setIsEncryptingAll(true);
    setEncryptionStatusMsg('Encrypting habit metadata with AES-GCM 256-bit...');
    triggerHaptic('medium');

    try {
      const passphrase = getEffectivePassphrase(user.uid);
      let encryptedCount = 0;

      for (const habit of habits) {
        if (!isEncrypted(habit.name)) {
          const encrypted = await encryptHabitData(
            { name: habit.name, unit: habit.unit, pauseReason: habit.pauseReason },
            passphrase
          );
          await updateHabit(habit.id, encrypted);
          encryptedCount++;
        }
      }

      setZeroKnowledgeEnabled(true, encryptionPassphrase);
      setZkEnabled(true);
      triggerHaptic('success');
      setEncryptionStatusMsg(
        `Successfully encrypted ${encryptedCount} ${
          encryptedCount === 1 ? 'habit' : 'habits'
        } in database!`
      );
      announce(`Successfully encrypted ${encryptedCount} habits with AES-GCM 256-bit.`);
    } catch (err) {
      console.error('Failed to batch encrypt habits:', err);
      setEncryptionStatusMsg('Error during habit encryption.');
    } finally {
      setIsEncryptingAll(false);
      setTimeout(() => setEncryptionStatusMsg(''), 4000);
    }
  };

  // Register WebAuthn Passkey
  const handleRegisterBiometrics = async () => {
    if (!user) return;
    setIsRegisteringBiometric(true);
    setBiometricMsg('');

    try {
      const success = await registerBiometricCredential(user.uid, user.email || 'user');
      if (success) {
        triggerHaptic('success');
        enableAppLock(true);
        setBiometricMsg('Biometric passkey registered successfully! App lock enabled.');
        announce('Biometric passkey registered successfully.');
      } else {
        setBiometricMsg('Biometric registration was cancelled or unverified.');
      }
    } catch {
      setBiometricMsg('Failed to register biometric authenticator.');
    } finally {
      setIsRegisteringBiometric(false);
      setTimeout(() => setBiometricMsg(''), 4000);
    }
  };

  // Save PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinStatusMsg('PIN must be at least 4 digits');
      return;
    }
    try {
      await setupPin(newPin);
      setNewPin('');
      setPinStatusMsg('PIN protection enabled!');
      setTimeout(() => setPinStatusMsg(''), 3000);
    } catch (err: any) {
      setPinStatusMsg(err.message || 'Error saving PIN');
    }
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <h3 className="font-app-title text-base sm:text-lg font-bold text-on-surface">
              Data Privacy & Security
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Zero-Knowledge AES, Biometric App Lock & Privacy Shield
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('encryption');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'encryption'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Zero-Knowledge AES
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('biometrics');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'biometrics'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Biometric Lock
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('privacy');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Privacy Curtain
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('hardening');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'hardening'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hardening
          </button>
        </div>

        {/* Tab 1: Expanded Zero-Knowledge AES-GCM 256-bit Encryption */}
        {activeTab === 'encryption' && (
          <form onSubmit={handleSaveEncryption} className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                  <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                    Zero-Knowledge Habit & Target Vault
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  AES-GCM 256
                </span>
              </div>
              <p className="font-body-text text-xs text-on-surface-variant leading-relaxed">
                When active, your habit names, target metrics, and personal reflections are encrypted locally on your device with 256-bit Web Crypto. Firestore administrators and database dumps will only see scrambled ciphertexts.
              </p>
            </div>

            {/* Toggle: Expand Zero Knowledge to Habit Titles */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Encrypt Habit Titles & Personal Targets
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Protects habit names and quantitative goals from plain-text visibility
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setZkEnabled((prev) => !prev);
                }}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  zkEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    zkEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Passphrase Input */}
            <div className="space-y-1.5">
              <label className="font-habit-name text-xs font-bold text-on-surface block">
                Custom Master Passphrase (Optional)
              </label>
              <input
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                placeholder="Leave blank for automatic device key, or enter custom secret..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
              <p className="font-body-text text-[11px] text-on-surface-variant">
                If custom secret is configured, ensure you store it safely. Forgotten passphrases cannot be recovered by server administrators.
              </p>
            </div>

            {/* Batch Encrypt Action */}
            <div className="p-3 rounded-2xl border border-outline-variant/25 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Migrate Existing Habits
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Encrypt all currently plain-text habits in your active board ({habits.length} habits)
                </span>
              </div>
              <button
                type="button"
                disabled={isEncryptingAll || habits.length === 0}
                onClick={handleBatchEncryptAllHabits}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isEncryptingAll ? 'Encrypting...' : 'Encrypt All'}
              </button>
            </div>

            {encryptionStatusMsg && (
              <div className="p-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{encryptionStatusMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Save Preferences
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Biometric App Lock & Inactivity Timer */}
        {activeTab === 'biometrics' && (
          <div className="space-y-4 pt-1 text-xs">
            {/* Status Card */}
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    fingerprint
                  </span>
                  <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                    WebAuthn Hardware Lock
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isBiometricsSupported
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isBiometricsSupported ? 'Biometrics Supported' : 'PIN Mode Only'}
                </span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Unlock HabitFlow using Touch ID, Face ID, or Windows Hello. Fallback to a secure PIN whenever biometrics are unavailable.
              </p>
            </div>

            {/* Toggle App Lock */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">Enable App Lock</span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Requires authentication to access HabitFlow
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  enableAppLock(!isAppLockEnabled);
                }}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  isAppLockEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isAppLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Inactivity Auto-Lock Timeout Dropdown */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Inactivity Auto-Lock Timer
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Automatically lock after period of idle time
                </span>
              </div>
              <select
                value={autoLockMinutes}
                onChange={(e) => {
                  triggerHaptic('selection');
                  changeAutoLockMinutes(parseInt(e.target.value, 10));
                }}
                className="px-3 py-1.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-primary outline-hidden cursor-pointer"
              >
                <option value={0}>Immediately</option>
                <option value={2}>2 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={-1}>Disabled</option>
              </select>
            </div>

            {/* Register Biometric Passkey */}
            {isBiometricsSupported && (
              <div className="p-3 rounded-2xl border border-outline-variant/25 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Touch ID / Face ID / Windows Hello
                  </span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Register this device&apos;s biometric sensor
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isRegisteringBiometric}
                  onClick={handleRegisterBiometrics}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isRegisteringBiometric ? 'Prompting...' : 'Register'}
                </button>
              </div>
            )}

            {/* PIN Protection Fallback Form */}
            <form
              onSubmit={handleSavePin}
              className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/20 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface block">
                  {hasPin ? 'Change Security PIN' : 'Set 4-Digit Fallback PIN'}
                </span>
                {hasPin && (
                  <button
                    type="button"
                    onClick={() => removePin()}
                    className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
                  >
                    Remove PIN
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-6 digit PIN..."
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs text-on-surface tracking-widest placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-hidden"
                />
                <button
                  type="submit"
                  disabled={newPin.length < 4}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-40"
                >
                  Save PIN
                </button>
              </div>
            </form>

            {(biometricMsg || pinStatusMsg) && (
              <div className="p-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{biometricMsg || pinStatusMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: App Switcher Privacy Curtain */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  visibility_off
                </span>
                <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                  Mobile App Switcher Curtain
                </span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Prevents shoulder surfing and multi-tasking thumbnail leakage. Whenever you swipe up to view the app switcher or minimize HabitFlow, a high-blur privacy curtain automatically covers your habits and personal reflections.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/30 border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  App Switcher Privacy Curtain
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Blur screen when app is minimized or backgrounded
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  togglePrivacyCurtain(!privacyCurtainEnabled);
                }}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  privacyCurtainEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    privacyCurtainEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Firebase App Check & API Hardening */}
        {activeTab === 'hardening' && (
          <div className="space-y-3 pt-1 text-xs text-on-surface-variant leading-relaxed">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                  gshield
                </span>
                <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                  reCAPTCHA Enterprise & App Check
                </span>
              </div>
              <p>
                HabitFlow implements Google reCAPTCHA Enterprise verification to ensure only legitimate browser sessions access backend database endpoints.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Automatic token generation on app launch.</li>
              <li>Protects Firestore database write quotas from automated bots and scraper attacks.</li>
              <li>Continuous background token refresh every 30 minutes.</li>
              <li>Allowed Origins: <code>habitflow-2a53e.web.app</code> and <code>localhost</code>.</li>
              <li>Strict Content-Security-Policy headers enabled on Firebase Hosting.</li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </BottomSheetModal>
  );
};

export default SecuritySettingsModal;
