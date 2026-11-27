import React, { useState } from 'react';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';
import { Button } from '../ui/Button';
import { triggerHaptic } from '../../utils/haptics';
import { getBotanicalRank } from '../../utils/botanicalRank';

export type ShareAspectFormat = '1:1' | '9:16' | '16:9';

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
  const [aspectFormat, setAspectFormat] = useState<ShareAspectFormat>('1:1');
  const [isPrivacyMaskActive, setIsPrivacyMaskActive] = useState(false);

  if (!isOpen) return null;

  const botanicalRank = getBotanicalRank(longestStreak);

  const displayName = isPrivacyMaskActive
    ? 'Mindful Builder'
    : userName || 'Mindful Builder';

  const displayBoard = isPrivacyMaskActive
    ? 'Private Routine'
    : boardName;

  const handleCopySummary = async () => {
    triggerHaptic('selection');
    const summaryText = `🌿 HabitFlow Monthly Milestone — ${monthTitle}
👤 ${displayName} • ${displayBoard}
━━━━━━━━━━━━━━━━━━━━
✨ Monthly Flow State: ${completionRate}%
🌱 Botanical Rank: ${botanicalRank.icon} ${botanicalRank.label} (${botanicalRank.stageTitle})
🔥 Longest Streak: ${longestStreak} Days
✅ Total Check-ins: ${totalChecks} logged across ${totalHabits} habit${totalHabits === 1 ? '' : 's'}
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

  // Modal max-width based on selected format
  const modalContainerClass =
    aspectFormat === '9:16'
      ? 'max-w-sm'
      : aspectFormat === '16:9'
      ? 'max-w-xl'
      : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${modalContainerClass} bg-surface-container-lowest dark:bg-stone-900 rounded-3xl border border-outline-variant/30 shadow-2xl p-5 sm:p-6 space-y-4 animate-scaleUp relative overflow-hidden my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Japandi botanical aura glow */}
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full bg-secondary/10 dark:bg-secondary/20 blur-3xl pointer-events-none" />

        {/* Modal Header & Controls */}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="font-app-title font-bold text-base sm:text-lg text-on-surface">
              Share Milestone Card
            </h3>
            <p className="text-xs text-on-surface-variant">
              Format for stories, feeds, or team updates
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Format Selector Pills + Privacy Mask Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/15 relative z-10 text-xs">
          {/* Aspect Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                setAspectFormat('1:1');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspectFormat === '1:1'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              1:1 Square
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                setAspectFormat('9:16');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspectFormat === '9:16'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              9:16 Story
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                setAspectFormat('16:9');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspectFormat === '16:9'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              16:9 Banner
            </button>
          </div>

          {/* Privacy Mask Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              setIsPrivacyMaskActive((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
              isPrivacyMaskActive
                ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface border-outline-variant/20'
            }`}
            title="Mask personal habit titles & name for private sharing"
          >
            <span className="material-symbols-outlined text-[15px]">
              {isPrivacyMaskActive ? 'visibility_off' : 'visibility'}
            </span>
            <span>{isPrivacyMaskActive ? 'Privacy Active' : 'Privacy Mask'}</span>
          </button>
        </div>

        {/* Dynamic Aspect Milestone Shareable Canvas Card */}
        <div
          className={`bg-gradient-to-br from-[#1C2C20] via-[#2D5A34] to-[#1E3A24] text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-white/10 select-none transition-all flex flex-col justify-between ${
            aspectFormat === '9:16'
              ? 'min-h-[440px] space-y-6'
              : aspectFormat === '16:9'
              ? 'min-h-[220px] space-y-4'
              : 'min-h-[300px] space-y-5'
          }`}
        >
          {/* Subtle watermarked rings */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <HabitFlowLogo size={26} />
              <span className="font-app-title font-bold text-sm tracking-tight text-white/90">
                HabitFlow
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 text-white/90">
                {aspectFormat} Card
              </span>
              {isPrivacyMaskActive && (
                <span className="text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Protected
                </span>
              )}
            </div>
          </div>

          {/* Hero Flow Score with Concentric Ring & Botanical Rank */}
          <div className="flex items-center justify-between gap-3 pt-2 relative z-10">
            <div className="min-w-0">
              <span
                className={`text-[11px] font-medium text-white/70 block uppercase tracking-wider truncate ${
                  isPrivacyMaskActive ? 'blur-[4px]' : ''
                }`}
              >
                {monthTitle} • {displayBoard}
              </span>
              <h3
                className={`font-app-title text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 truncate ${
                  isPrivacyMaskActive ? 'blur-[4px]' : ''
                }`}
              >
                {displayName}
              </h3>

              {/* Botanical Rank Pill inside card */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-base">{botanicalRank.icon}</span>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  {botanicalRank.label}
                </span>
                <span className="text-[10px] text-white/60 font-medium">
                  ({botanicalRank.stageTitle})
                </span>
              </div>

              <p className="font-editorial italic text-xs text-white/80 mt-1 hidden sm:block">
                "Little habits, deep roots, calm flow."
              </p>
            </div>

            {/* Circular Rate Indicator */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white/20 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md shadow-inner shrink-0">
              <span className="font-app-title text-xl font-black text-white font-tnum">
                {completionRate}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">
                Flow
              </span>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 relative z-10 text-center">
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Streak</span>
              <span className="font-app-title text-sm sm:text-base font-bold text-white font-tnum">
                {longestStreak}d 🔥
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Checks</span>
              <span className="font-app-title text-sm sm:text-base font-bold text-white font-tnum">
                {totalChecks} ✅
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <span className="text-[9.5px] uppercase font-bold text-white/70 block">Peak Day</span>
              <span className="font-app-title text-sm sm:text-base font-bold text-white capitalize truncate block">
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
