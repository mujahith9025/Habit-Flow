import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  eraseUserAccountAndAllData,
  deleteAllFirestoreUserData,
} from '../../lib/firebase/accountDeletionService';
import { triggerHaptic } from '../../utils/haptics';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  userId?: string;
  onSuccess: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  userId,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDeleteAccount = async () => {
    if (!isConfirmed || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      triggerHaptic('warning');

      if (firebaseUser) {
        await eraseUserAccountAndAllData(firebaseUser);
      } else if (userId) {
        await deleteAllFirestoreUserData(userId);
        localStorage.clear();
        sessionStorage.clear();
      } else {
        localStorage.clear();
        sessionStorage.clear();
      }

      triggerHaptic('success');
      onSuccess();
    } catch (err: unknown) {
      console.error('Account deletion error:', err);
      const errorObj = err as { code?: string; message?: string };

      if (errorObj?.code === 'auth/requires-recent-login') {
        setErrorMessage(
          'Security checkpoint: Account deletion is sensitive. Please sign out, sign back in, and try deleting your account again.'
        );
      } else {
        setErrorMessage(
          errorObj?.message || 'Failed to erase all data and delete account. Please try again.'
        );
      }
      setLoading(false);
      triggerHaptic('warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-error/30 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">delete_forever</span>
          </div>
          <div>
            <h3 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
              Erase All Data & Delete Account
            </h3>
            <p className="text-xs font-body-text text-error font-semibold mt-0.5">
              GDPR Article 17 / CCPA Right to Erasure
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/25 text-xs space-y-2 text-on-surface">
          <p className="font-bold text-error flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>This action is permanent and irreversible.</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
            <li>All tracked <strong>Habits & Routines</strong> will be wiped</li>
            <li>All daily <strong>Check-in History & Streaks</strong> will be deleted</li>
            <li>All <strong>Daily Money Savings & Expense records</strong> will be destroyed</li>
            <li>Your <strong>User Profile & Authentication Account</strong> will be permanently removed</li>
          </ul>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-xs text-error font-medium">
            {errorMessage}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-on-surface font-stat-label">
            Type <span className="text-error uppercase tracking-wider font-mono">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={loading}
            placeholder="DELETE"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high dark:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-error font-mono"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-error text-on-error hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-soft cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-on-error border-t-transparent animate-spin" />
                <span>Erasing All Data...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Permanently Delete Everything</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
