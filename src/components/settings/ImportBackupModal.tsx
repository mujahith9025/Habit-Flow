import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FullAccountBackupPayload, importFullAccountBackup } from '../../lib/firebase/backupService';
import { triggerHaptic } from '../../utils/haptics';
import { BottomSheetModal } from '../ui/BottomSheetModal';

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

      await importFullAccountBackup(user.uid, backupData, (progress) => {
        setProgressText(progress);
      });

      triggerHaptic('success');
      setSuccessMessage('Backup restored successfully! Refreshing data...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore backup.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
          </div>
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Restore Account Backup
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Upload a HabitFlow JSON backup file
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
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
          className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer hover:bg-surface-container-low/40 transition-all group active:scale-98"
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

        {/* Validation Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Backup Summary if parsed successfully */}
        {backupData && (
          <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20 space-y-2">
            <h4 className="font-habit-name text-xs font-bold text-on-surface uppercase tracking-wider">
              Backup Contents Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15">
                <span className="text-on-surface-variant text-[11px] block">Habits Count</span>
                <span className="font-bold text-on-surface text-base">{backupData.habits?.length || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15">
                <span className="text-on-surface-variant text-[11px] block">Logs & Entries</span>
                <span className="font-bold text-on-surface text-base">
                  {backupData.summary?.totalHabitEntries || 0}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant pt-1">
              Exported on: {new Date(backupData.exportedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Progress Bar when importing */}
        {isImporting && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span>Restoring your habits...</span>
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">{progressText}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/15">
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
    </BottomSheetModal>
  );
};
