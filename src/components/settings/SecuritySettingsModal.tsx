import React, { useState } from 'react';
import { triggerHaptic } from '../../utils/haptics';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'encryption' | 'appcheck' | 'apirestrict'>('encryption');
  const [encryptionPassphrase, setEncryptionPassphrase] = useState(() => {
    return localStorage.getItem('habitflow_zk_passphrase') || '';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSavePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (encryptionPassphrase.trim()) {
        localStorage.setItem('habitflow_zk_passphrase', encryptionPassphrase.trim());
      } else {
        localStorage.removeItem('habitflow_zk_passphrase');
      }
      triggerHaptic('success');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save encryption passphrase:', err);
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
              Zero-Knowledge Encryption, App Check, and API Hardening
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('encryption');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer ${
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
              setActiveTab('appcheck');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer ${
              activeTab === 'appcheck'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Firebase App Check
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('apirestrict');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer ${
              activeTab === 'apirestrict'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            API Hardening
          </button>
        </div>

        {/* Tab 1: Zero-Knowledge AES-GCM 256-bit Encryption */}
        {activeTab === 'encryption' && (
          <form onSubmit={handleSavePassphrase} className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                  Client-Side Passphrase
                </span>
              </div>
              <p className="font-body-text text-xs text-on-surface-variant leading-relaxed">
                When configured, private reflections, daily habit notes, and diary logs are encrypted locally via Web Crypto AES-GCM 256-bit before transmitting to Firestore.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-habit-name text-xs font-bold text-on-surface block">
                Master Encryption Passphrase
              </label>
              <input
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                placeholder="Leave blank for standard encryption, or enter custom secret..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
              <p className="font-body-text text-[11px] text-on-surface-variant">
                ⚠️ Store this passphrase safely. If lost, zero-knowledge encrypted notes cannot be recovered by server admins.
              </p>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Passphrase settings saved locally!</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Save Passphrase
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Firebase App Check */}
        {activeTab === 'appcheck' && (
          <div className="space-y-3 pt-1 text-xs text-on-surface-variant leading-relaxed">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">gshield</span>
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
            </ul>
          </div>
        )}

        {/* Tab 3: API Hardening */}
        {activeTab === 'apirestrict' && (
          <div className="space-y-3 pt-1 text-xs text-on-surface-variant leading-relaxed">
            <div className="p-4 rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">policy</span>
                <span className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                  Google Cloud Key Restrictions
                </span>
              </div>
              <p>
                Production Firebase API keys are locked with HTTP referrer whitelisting to prevent unauthorized third-party embedding.
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Allowed Origins: <code>habitflow-2a53e.web.app</code> and <code>localhost</code>.</li>
              <li>Disabled unneeded Google Cloud APIs.</li>
              <li>Strict Content-Security-Policy headers enabled on Firebase Hosting.</li>
            </ol>
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
