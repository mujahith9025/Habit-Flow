import React, { useState } from 'react';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';
import { Button } from '../ui/Button';
import { triggerHaptic } from '../../utils/haptics';

interface ShareableMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  monthTitle: string;
  boardName: string;
  completionRate: number;
  longestStreak: number;
  totalChecks: number;
  totalHabits: number;
  peakDayName: string;
  onDownloadPDF?: () => void;
}

export const ShareableMilestoneModal: React.FC<ShareableMilestoneModalProps> = ({
  isOpen,
  onClose,
  userName,
  monthTitle,
  boardName,
  completionRate,
  longestStreak,
  totalChecks,
  totalHabits,
  peakDayName,
  onDownloadPDF,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = async () => {
    triggerHaptic('selection');
    const summaryText = `🌿 HabitFlow Monthly Milestone — ${monthTitle}
👤 ${userName || 'Mindful Builder'} • ${boardName}
━━━━━━━━━━━━━━━━━━━━
✨ Monthly Flow State: ${completionRate}%
🔥 Longest Streak: ${longestStreak} Days
✅ Total Check-ins: ${totalChecks} logged across ${totalHabits} habits
⚡ Peak Energy Day: ${peakDayName}s
━━━━━━━━━━━━━━━━━━━━
"Build what you love, one mindful day at a time."
🌱 Tracked with HabitFlow • https://habitflow-2a53e.web.app`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest dark:bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 space-y-5 animate-scaleUp relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Japandi botanical aura glow */}
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full bg-secondary/10 dark:bg-secondary/20 blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer z-10"
          title="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* 1:1 Aspect Milestone Shareable Canvas Card */}
        <div className="bg-gradient-to-br from-[#1C2C20] via-[#2D5A34] to-[#1E3A24] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-white/10 space-y-5 select-none">
          {/* Subtle watermarked rings */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <HabitFlowLogo size={28} />
              <span className="font-app-title font-bold text-sm tracking-tight text-white/90">
                HabitFlow
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 text-white/90">
              Milestone Card
            </span>
          </div>

          {/* Hero Flow Score with Concentric Ring */}
          <div className="flex items-center justify-between pt-2 relative z-10">
            <div>
              <span className="text-[11px] font-medium text-white/70 block uppercase tracking-wider">
                {monthTitle} • {boardName}
              </span>
              <h3 className="font-app-title text-2xl font-extrabold tracking-tight mt-0.5">
                {userName || 'Mindful Builder'}
              </h3>
              <p className="font-editorial italic text-xs text-white/80 mt-1">
                "Little habits, deep roots, calm flow."
              </p>
            </div>

            {/* Circular Rate Indicator */}
            <div className="w-20 h-20 rounded-full border-4 border-white/20 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md shadow-inner shrink-0">
              <span className="font-app-title text-xl font-black text-white">
                {completionRate}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">
                Flow
              </span>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15 relative z-10 text-center">
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Streak</span>
              <span className="font-app-title text-base font-bold text-white">{longestStreak}d 🔥</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Checks</span>
              <span className="font-app-title text-base font-bold text-white">{totalChecks} ✅</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Peak Day</span>
              <span className="font-app-title text-base font-bold text-white capitalize truncate block">
                {peakDayName.slice(0, 3)} ⚡
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={handleCopySummary}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'done' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Share Summary'}</span>
          </Button>

          {onDownloadPDF && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                onDownloadPDF();
              }}
              className="flex items-center justify-center gap-2 rounded-2xl"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Export PDF</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
