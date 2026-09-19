import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FullAccountBackupPayload, importFullAccountBackup } from '../../lib/firebase/backupService';
import { triggerHaptic } from '../../utils/haptics';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backupData, setBackupData] = useState<FullAccountBackupPayload | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.app !== 'HabitFlow') {
          throw new Error('This file is not a valid HabitFlow backup.');
        }
        setBackupData(parsed);
        triggerHaptic('light');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON backup file.');
        setBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user?.uid || !backupData) return;

    try {
      setIsImporting(true);
      setError(null);
      triggerHaptic('medium');

      const result = await importFullAccountBackup(user.uid, backupData, (msg) => {
        setProgressText(msg);
      });

      setSuccessMessage(
        `✅ Successfully restored ${result.importedHabits} habits, ${result.importedEntries} check-ins, and ${result.importedExpenses} financial records!`
      );
      triggerHaptic('success');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
      triggerHaptic('warning');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest dark:bg-surface-container rounded-3xl w-full max-w-lg shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <div>
              <h3 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
                Restore Account Backup
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant">
                Upload a HabitFlow JSON backup file
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer hover:bg-surface-container-low/40 transition-all group"
          >
            <span className="material-symbols-outlined text-[36px] text-primary mb-2 group-hover:scale-110 transition-transform">
              upload_file
            </span>
            <p className="font-habit-name text-sm font-bold text-on-surface">
              {fileName ? fileName : 'Choose JSON Backup File'}
            </p>
            <p className="font-body-text text-xs text-on-surface-variant mt-1">
              Supports full account archives (`habitflow_full_backup_*.json`)
            </p>
          </div>

          {/* Backup Preview Info */}
          {backupData && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2 animate-fadeIn">
              <h4 className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
                Backup Contents Overview
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high/40">
                  <span className="font-bold text-sm text-primary block">
                    {backupData.habits?.length || 0}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Habits</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high/40">
                  <span className="font-bold text-sm text-secondary block">
                    {Object.values(backupData.habitEntriesByHabit || {}).flat().length}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Check-ins</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high/40">
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400 block">
                    {backupData.expenseEntries?.length || 0}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Ledger Rows</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress / Error Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {isImporting && (
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary text-xs font-semibold flex items-center gap-2 animate-pulse">
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              <span>{progressText || 'Restoring your data...'}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-outline-variant/15 flex items-center justify-end gap-2 bg-surface-container-low/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!backupData || isImporting}
            className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-primary hover:bg-primary/90 text-white transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isImporting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Restoring...</span>
              </>
            ) : (
              <span>Restore Backup</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
