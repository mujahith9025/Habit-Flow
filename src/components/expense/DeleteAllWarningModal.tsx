import React, { useState } from 'react';

interface DeleteAllWarningModalProps {
  isOpen: boolean;
  entryCount: number;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteAllWarningModal: React.FC<DeleteAllWarningModalProps> = ({
  isOpen,
  entryCount,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err) {
      console.error('Failed to delete all entries:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md bg-surface-container-lowest dark:bg-surface-container rounded-3xl shadow-2xl border border-error/30 overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon & Header */}
        <div className="p-6 pb-4 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-error-container/20 border border-error/30 text-error flex items-center justify-center mx-auto shadow-sm">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-error-container/30 text-error border border-error/20 text-[10px] font-black uppercase tracking-wider">
              Irreversible Action
            </span>
            <h3 className="font-app-title text-lg sm:text-xl font-black text-on-surface mt-2">
              Delete All Money Savings Entries?
            </h3>
          </div>
        </div>

        {/* Warning Body Content */}
        <div className="px-6 py-2 text-center space-y-3">
          <p className="text-sm font-body-text text-on-surface-variant leading-relaxed">
            Are you sure you want to permanently delete all{' '}
            <strong className="text-error font-bold">{entryCount} daily records</strong> from your Expense Tracker?
          </p>

          <div className="p-3.5 rounded-2xl bg-error-container/10 border border-error/20 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-error">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>What will happen:</span>
            </div>
            <ul className="list-disc list-inside text-on-surface-variant space-y-1 pl-1 text-[11px]">
              <li>All logged daily savings deposits will be wiped</li>
              <li>All itemized expense deductions will be removed</li>
              <li>Your cumulative savings balance will reset to <strong>0</strong></li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-5 flex items-center gap-3 justify-end border-t border-outline-variant/15 mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-error text-on-error hover:bg-error/90 transition-all shadow-soft flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>Yes, Delete All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
