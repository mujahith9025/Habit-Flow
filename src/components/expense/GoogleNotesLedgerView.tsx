import React, { useState } from 'react';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings, NoteThemeType } from '../../types/expense';
import { formatMoney, formatExpensesSummary } from '../../lib/expenseCalculations';

interface GoogleNotesLedgerViewProps {
  rows: DailyLedgerRow[];
  monthSummaries: MonthExpenseSummary[];
  selectedMonthKey: string;
  onSelectMonthKey: (mKey: string) => void;
  settings: ExpenseTrackerSettings;
  onOpenAddModal: (prefillDate?: string) => void;
  onOpenSettingsModal: () => void;
  onSeedSampleData: () => void;
  onAutoFillMonth: (year: number, month: number) => void;
  onUpdateTheme: (theme: NoteThemeType) => void;
}

// Background themes inspired by Google Keep
const THEME_STYLES: Record<NoteThemeType, {
  container: string;
  headerBg: string;
  textColor: string;
  accentColor: string;
  borderDashed: string;
  rowHover: string;
}> = {
  night_sky: {
    container: 'bg-[#0e213e] text-slate-100 border-[#1e3a66]',
    headerBg: 'bg-[#152a4e]/70',
    textColor: 'text-slate-200',
    accentColor: 'text-cyan-300',
    borderDashed: 'border-cyan-500/30',
    rowHover: 'hover:bg-cyan-500/10',
  },
  deep_blue: {
    container: 'bg-[#132f58] text-white border-[#24477c]',
    headerBg: 'bg-[#1c3e70]/70',
    textColor: 'text-blue-100',
    accentColor: 'text-sky-300',
    borderDashed: 'border-sky-400/30',
    rowHover: 'hover:bg-sky-500/10',
  },
  charcoal_dark: {
    container: 'bg-[#1e1f22] text-zinc-100 border-zinc-800',
    headerBg: 'bg-[#2b2d31]/70',
    textColor: 'text-zinc-200',
    accentColor: 'text-amber-300',
    borderDashed: 'border-zinc-700',
    rowHover: 'hover:bg-zinc-800/60',
  },
  emerald_oasis: {
    container: 'bg-[#0f2c23] text-emerald-100 border-[#1c483b]',
    headerBg: 'bg-[#163f33]/70',
    textColor: 'text-emerald-200',
    accentColor: 'text-emerald-300',
    borderDashed: 'border-emerald-500/30',
    rowHover: 'hover:bg-emerald-500/10',
  },
  warm_sand: {
    container: 'bg-[#2b241c] text-amber-100 border-[#42382c]',
    headerBg: 'bg-[#3b3226]/70',
    textColor: 'text-amber-200',
    accentColor: 'text-amber-300',
    borderDashed: 'border-amber-500/30',
    rowHover: 'hover:bg-amber-500/10',
  },
};

export const GoogleNotesLedgerView: React.FC<GoogleNotesLedgerViewProps> = ({
  rows,
  monthSummaries,
  selectedMonthKey,
  onSelectMonthKey,
  settings,
  onOpenAddModal,
  onOpenSettingsModal,
  onSeedSampleData,
  onAutoFillMonth,
  onUpdateTheme,
}) => {
  const sym = settings.currencySymbol || '₹';
  const currentTheme = settings.noteTheme || 'night_sky';
  const theme = THEME_STYLES[currentTheme] || THEME_STYLES.night_sky;

  const [isPinned, setIsPinned] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Copy note as plain text (Google Notes style export)
  const handleCopyNoteText = () => {
    let text = `${settings.title || 'MONEY SAVINGS'}\n\n`;
    text += `DATE       SAVINGS    CUMULATIVE   EXPENSES\n`;
    text += `---------------------------------------------------------\n`;

    rows.forEach((r) => {
      const expStr = formatExpensesSummary(r.expenses, sym);
      text += `${r.displayDate.padEnd(10)} ${formatMoney(r.savingsAmount, sym).padEnd(10)} ${formatMoney(r.cumulativeBalance, sym).padEnd(12)} ${expStr}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div
      className={`rounded-3xl shadow-2xl border transition-all duration-300 overflow-hidden relative flex flex-col min-h-[620px] ${theme.container}`}
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Decorative Starry & Pool Illustration Artwork (Google Keep style) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        {/* Subtle Stars */}
        <div className="absolute top-12 left-10 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        <div className="absolute top-24 left-1/3 w-1 h-1 bg-cyan-200 rounded-full" />
        <div className="absolute top-8 right-20 w-2 h-2 bg-blue-100 rounded-full" />
        <div className="absolute top-40 right-1/4 w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-64 left-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full" />

        {/* Pool Umbrella & Palm silhouette watermark in bottom right */}
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-t from-cyan-900/30 to-transparent rounded-tl-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 text-cyan-600/15 select-none text-[160px] leading-none pointer-events-none">
          ⛱️
        </div>
      </div>

      {/* Top Google Keep Action Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 relative z-20 backdrop-blur-xs">
        {/* Left: Back / Home Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Google Notes View
          </span>
        </div>

        {/* Right: Keep Actions (Pin, Reminder, Theme, Add, Options) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Pin */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin note' : 'Pin note'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPinned ? 'bg-white/25 text-amber-300' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}
            >
              push_pin
            </span>
          </button>

          {/* Reminder */}
          <button
            type="button"
            title="Daily savings reminder"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
          </button>

          {/* Theme Palette Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Change note background theme"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">palette</span>
            </button>

            {/* Theme Picker Dropdown */}
            {showThemePicker && (
              <div className="absolute right-0 top-10 w-44 bg-slate-900/95 border border-white/20 rounded-xl p-2 shadow-2xl z-50 backdrop-blur-md space-y-1 animate-scaleUp">
                <span className="text-[10px] uppercase font-bold text-white/50 px-2 block tracking-wider">
                  Note Color Theme
                </span>
                {(
                  [
                    { key: 'night_sky', name: 'Night Sky (Reference)', color: '#0e213e' },
                    { key: 'deep_blue', name: 'Ocean Blue', color: '#132f58' },
                    { key: 'charcoal_dark', name: 'Charcoal Dark', color: '#1e1f22' },
                    { key: 'emerald_oasis', name: 'Emerald Oasis', color: '#0f2c23' },
                    { key: 'warm_sand', name: 'Warm Sand', color: '#2b241c' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      onUpdateTheme(t.key);
                      setShowThemePicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      currentTheme === t.key ? 'bg-white/20 text-white font-bold' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick 1-Tap Add Entry */}
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            title="Add date savings or expense"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-all active:scale-95 shadow-xs"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
          </button>

          {/* Options Menu (3-dots) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              title="More actions"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-10 w-56 bg-slate-900/95 border border-white/20 rounded-xl p-2 shadow-2xl z-50 backdrop-blur-md space-y-1 animate-scaleUp">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyNoteText();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-cyan-400">content_copy</span>
                  <span>Copy Note Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    onAutoFillMonth(d.getFullYear(), d.getMonth());
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">auto_fix_high</span>
                  <span>Auto-Fill Current Month</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSeedSampleData();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">history_edu</span>
                  <span>Load Screenshot Sample Data</span>
                </button>

                <div className="border-t border-white/10 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    onOpenSettingsModal();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 text-left"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Tracker Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold flex items-center justify-between animate-fadeIn z-30">
          <span>📋 Note text copied to clipboard successfully!</span>
        </div>
      )}

      {/* Month Filter Selector Pills */}
      <div className="px-5 sm:px-8 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-none relative z-10">
        <button
          type="button"
          onClick={() => onSelectMonthKey('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedMonthKey === 'all'
              ? 'bg-white text-slate-900 shadow-md scale-105'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          All Months Ledger
        </button>

        {monthSummaries.map((m) => (
          <button
            key={m.monthKey}
            type="button"
            onClick={() => onSelectMonthKey(m.monthKey)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedMonthKey === m.monthKey
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <span>{m.monthShortTitle}</span>
            <span className="text-[10px] opacity-80">({formatMoney(m.endingBalance, sym)})</span>
          </button>
        ))}
      </div>

      {/* Note Main Content Body */}
      <div className="p-5 sm:p-8 flex-1 relative z-10 space-y-4">
        {/* Note Title: "MONEY SAVINGS" */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase select-none">
            {settings.title || 'MONEY SAVINGS'}
          </h1>
        </div>

        {/* Dashed Separator Top Line */}
        <div className={`border-b-2 border-dashed ${theme.borderDashed}`} />

        {/* Ledger Table Header */}
        <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm font-bold tracking-widest text-white/90 uppercase select-none py-1">
          <div className="col-span-2 sm:col-span-2 text-left">DATE</div>
          <div className="col-span-2 sm:col-span-2 text-center">SAVINGS</div>
          <div className="col-span-3 sm:col-span-3 text-center">CUMULATIVE</div>
          <div className="col-span-5 sm:col-span-5 text-left pl-2">EXPENSES</div>
        </div>

        {/* Dashed Separator Header Line */}
        <div className={`border-b-2 border-dashed ${theme.borderDashed}`} />

        {/* Empty State */}
        {rows.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-white/40">note_alt</span>
            <p className="text-sm text-white/70">No money savings entries recorded yet.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  onAutoFillMonth(d.getFullYear(), d.getMonth());
                }}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                <span>Auto-Fill This Month</span>
              </button>

              <button
                type="button"
                onClick={onSeedSampleData}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">history_edu</span>
                <span>Load Google Notes Reference</span>
              </button>
            </div>
          </div>
        ) : (
          /* Ledger Rows List */
          <div className="space-y-1.5 pt-1">
            {rows.map((row, index) => {
              const prevRow = index > 0 ? rows[index - 1] : null;
              const isMonthBreak = prevRow && prevRow.monthKey !== row.monthKey;
              const monthName = monthSummaries.find((m) => m.monthKey === row.monthKey)?.monthTitle || 'MONTH';
              const expSummaryStr = formatExpensesSummary(row.expenses, sym);

              return (
                <React.Fragment key={row.dateKey}>
                  {/* Month Break Header (e.g. "JULY MONTH") */}
                  {isMonthBreak && (
                    <div className="py-5 text-center">
                      <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-white font-black text-xs sm:text-sm tracking-widest uppercase border border-white/15 shadow-sm">
                        {monthName}
                      </div>
                    </div>
                  )}

                  {/* Single Date Ledger Row */}
                  <div
                    onClick={() => onOpenAddModal(row.dateKey)}
                    className={`grid grid-cols-12 gap-2 py-2 px-2 rounded-xl transition-all cursor-pointer select-none items-center group font-mono text-xs sm:text-sm ${
                      theme.rowHover
                    } ${row.isToday ? 'bg-white/10 ring-1 ring-white/30 font-bold' : ''}`}
                  >
                    {/* 1. DATE (e.g. 01/08) */}
                    <div className="col-span-2 sm:col-span-2 font-semibold text-white/90 flex items-center gap-1.5">
                      <span>{row.displayDate}</span>
                      {row.isToday && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400 text-slate-900 font-black uppercase font-sans">
                          Today
                        </span>
                      )}
                    </div>

                    {/* 2. SAVINGS (e.g. ₹25) */}
                    <div className="col-span-2 sm:col-span-2 text-center text-white/80 font-medium">
                      {formatMoney(row.savingsAmount, sym)}
                    </div>

                    {/* 3. CUMULATIVE (e.g. ₹100, ₹300) */}
                    <div className={`col-span-3 sm:col-span-3 text-center font-bold tracking-tight ${theme.accentColor}`}>
                      {formatMoney(row.cumulativeBalance, sym)}
                    </div>

                    {/* 4. EXPENSES (e.g. "( ₹ 100 - Cloth Alter & Other )") */}
                    <div className="col-span-5 sm:col-span-5 text-left pl-2 truncate text-white/95">
                      {row.expenses && row.expenses.length > 0 ? (
                        <span className="text-amber-300 font-medium text-[11px] sm:text-xs">
                          {expSummaryStr}
                        </span>
                      ) : (
                        <span className="text-white/20 text-[11px] group-hover:text-white/50 transition-colors font-sans">
                          + Add expense
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer Bar (Google Keep style: [+] [🎨] [A] [⋮]) */}
      <div className="px-5 sm:px-8 py-3.5 border-t border-white/10 bg-black/20 flex items-center justify-between text-white/70 relative z-20 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 text-white transition-all"
            title="Add entry"
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
          </button>

          <button
            type="button"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 text-white transition-all"
            title="Note background color"
          >
            <span className="material-symbols-outlined text-[20px]">palette</span>
          </button>

          <button
            type="button"
            onClick={handleCopyNoteText}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 text-white transition-all"
            title="Copy / Export text"
          >
            <span className="material-symbols-outlined text-[20px]">text_fields</span>
          </button>
        </div>

        <span className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
          {rows.length} Dates Logged • {sym}{settings.defaultDailySavings}/day
        </span>
      </div>
    </div>
  );
};
