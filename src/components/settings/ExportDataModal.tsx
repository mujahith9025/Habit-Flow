import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { Habit } from '../../types/habit';
import { exportToPDF, exportToExcel, exportToJSON, HabitMetricDetail } from '../../utils/exportUtils';
import { triggerHaptic } from '../../utils/haptics';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  habits: Habit[];
  habitMetricsMap?: Record<string, HabitMetricDetail>;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  profile,
  habits,
  habitMetricsMap,
}) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!isOpen) return null;

  const exportPayload = {
    profile,
    habits,
    habitMetricsMap,
  };

  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    try {
      setIsExportingPDF(true);
      triggerHaptic('success');
      await exportToPDF(exportPayload);
      setDownloadSuccessMessage('✅ Executive PDF Performance Report downloaded successfully!');
      setTimeout(() => {
        setDownloadSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    triggerHaptic('success');
    exportToExcel(exportPayload);
    setDownloadSuccessMessage('✅ Habit Analytics Spreadsheet downloaded successfully!');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      onClose();
    }, 1500);
  };

  const handleExportJSON = () => {
    triggerHaptic('success');
    exportToJSON(exportPayload);
    setDownloadSuccessMessage('✅ Complete HabitFlow System Backup JSON downloaded!');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">download</span>
          </div>
          <div>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              Executive Data Export
            </h3>
            <p className="font-body-text text-xs text-on-surface-variant">
              Select your format ({habits.length} habits tracked across all boards)
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {downloadSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Option 1: PDF Document */}
        <div
          onClick={handleExportPDF}
          className="p-4 rounded-2xl border border-outline-variant/30 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/30 transition-all cursor-pointer flex items-start justify-between group active:scale-98"
        >
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[20px]">
                picture_as_pdf
              </span>
              <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                Printable PDF Performance Report
              </h4>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant">
              A beautifully formatted Japandi PDF summary with your completion heatmaps, streaks, and focus metrics.
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
            arrow_forward
          </span>
        </div>

        {/* Option 2: Excel / CSV Spreadsheet */}
        <div
          onClick={handleExportExcel}
          className="p-4 rounded-2xl border border-outline-variant/30 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/30 transition-all cursor-pointer flex items-start justify-between group active:scale-98"
        >
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                table_view
              </span>
              <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                CSV Data Spreadsheet
              </h4>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant">
              Raw comma-separated tabular values ready for import into Excel, Google Sheets, Notion, or Obsidian.
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
            arrow_forward
          </span>
        </div>

        {/* Option 3: JSON Full System Archive */}
        <div
          onClick={handleExportJSON}
          className="p-4 rounded-2xl border border-outline-variant/30 hover:border-primary/50 bg-surface-container-low/50 dark:bg-surface-container-high/30 transition-all cursor-pointer flex items-start justify-between group active:scale-98"
        >
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">
                data_object
              </span>
              <h4 className="font-habit-name text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                JSON Complete Backup Archive
              </h4>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant mt-1">
              Complete raw JSON archive including habit histories, category configs, streaks, and user preferences.
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mt-2">
            arrow_forward
          </span>
        </div>
      </div>
    </BottomSheetModal>
  );
};
