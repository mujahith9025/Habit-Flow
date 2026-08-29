import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { Habit } from '../../types/habit';
import { exportToPDF, exportToExcel, exportToJSON } from '../../utils/exportUtils';
import { triggerHaptic } from '../../utils/haptics';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  habits: Habit[];
  habitMetricsMap?: Record<string, { streakCount: number; longestStreak?: number; totalCompletions?: number }>;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  profile,
  habits,
  habitMetricsMap,
}) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    triggerHaptic('success');
    exportToPDF({ profile, habits, habitMetricsMap });
    setDownloadSuccessMessage('✅ PDF Report downloaded successfully!');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      onClose();
    }, 1500);
  };

  const handleExportExcel = () => {
    triggerHaptic('success');
    exportToExcel({ profile, habits, habitMetricsMap });
    setDownloadSuccessMessage('✅ Excel / CSV spreadsheet downloaded successfully!');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      onClose();
    }, 1500);
  };

  const handleExportJSON = () => {
    triggerHaptic('success');
    exportToJSON({ profile, habits, habitMetricsMap });
    setDownloadSuccessMessage('✅ JSON backup downloaded successfully!');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      onClose();
    }, 1500);
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
              <span className="material-symbols-outlined text-[24px]">download</span>
            </div>
            <div>
              <h3 className="font-section-header text-lg sm:text-xl font-bold text-on-surface">
                Export Habit Data
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant">
                Select your preferred export format ({habits.length} habits tracked)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {downloadSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{downloadSuccessMessage}</span>
            </div>
          )}

          {/* Option 1: PDF Document */}
          <div
            onClick={handleExportPDF}
            className="p-4.5 rounded-2xl border border-outline-variant/20 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/20 hover:bg-surface-container-low transition-all duration-200 cursor-pointer group active:scale-[0.99] flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  PDF Document (.pdf)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-bold font-stat-label">
                  Print & Share
                </span>
              </div>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Formatted progress report with category boards, streak scores, and completion stats.
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
              arrow_forward
            </span>
          </div>

          {/* Option 2: Excel / CSV Spreadsheet */}
          <div
            onClick={handleExportExcel}
            className="p-4.5 rounded-2xl border border-outline-variant/20 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/20 hover:bg-surface-container-low transition-all duration-200 cursor-pointer group active:scale-[0.99] flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[24px]">table_chart</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  Excel Spreadsheet (.csv)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold font-stat-label">
                  Spreadsheets
                </span>
              </div>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Microsoft Excel & Google Sheets compatible CSV with column headers and full habit parameters.
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
              arrow_forward
            </span>
          </div>

          {/* Option 3: JSON Data Backup */}
          <div
            onClick={handleExportJSON}
            className="p-4.5 rounded-2xl border border-outline-variant/20 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/20 hover:bg-surface-container-low transition-all duration-200 cursor-pointer group active:scale-[0.99] flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[24px]">data_object</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  JSON Raw Backup (.json)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold font-stat-label">
                  Developer
                </span>
              </div>
              <p className="font-body-text text-xs text-on-surface-variant mt-1">
                Raw structured JSON archive for full data portability and backup restore.
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-outline-variant/15 flex items-center justify-end bg-surface-container-low/30">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/25 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
