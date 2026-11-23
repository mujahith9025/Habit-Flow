import { Habit } from '../types/habit';
import { UserProfile } from '../types/auth';
import { DailyLedgerRow, MonthExpenseSummary, ExpenseTrackerSettings } from '../types/expense';

export interface HabitMetricDetail {
  streakCount?: number;
  longestStreak?: number;
  totalCompletions?: number;
  monthProgressPercent?: number;
  isShieldActive?: boolean;
}

export interface ExportData {
  profile?: UserProfile | null;
  habits: Habit[];
  habitMetricsMap?: Record<string, HabitMetricDetail>;
  expenseRows?: DailyLedgerRow[];
  monthSummaries?: MonthExpenseSummary[];
  totalCumulativeSavings?: number;
  expenseSettings?: ExpenseTrackerSettings;
}

/**
 * Dynamic Proxy for Executive PDF Document Exporter
 * Keeps jsPDF completely isolated in its own async chunk.
 */
export async function exportToPDF(data: ExportData): Promise<void> {
  const { exportToPDF: lazyExport } = await import('./pdfExport');
  return lazyExport(data);
}

/**
 * Advanced Multi-Section Excel / CSV Spreadsheet Exporter (UTF-8 BOM)
 */
export function exportToExcel(data: ExportData): void {
  const {
    profile,
    habits,
    habitMetricsMap = {},
    expenseRows = [],
    monthSummaries = [],
    totalCumulativeSavings = 0,
    expenseSettings,
  } = data;

  const userName = profile?.name || 'HabitFlow User';
  const userEmail = profile?.email || '';
  const exportDate = new Date().toISOString();
  const sym = expenseSettings?.currencySymbol || '₹';

  const csvLines: string[] = [];

  // ==========================================
  // SECTION 1: EXECUTIVE ACCOUNT OVERVIEW
  // ==========================================
  csvLines.push(`"=========================================================================="`);
  csvLines.push(`"HABITFLOW EXECUTIVE ANALYTICS & DATA EXPORT"`);
  csvLines.push(`"=========================================================================="`);
  csvLines.push(`"User Name","${userName.replace(/"/g, '""')}"`);
  csvLines.push(`"User Email","${userEmail.replace(/"/g, '""')}"`);
  csvLines.push(`"User ID","${profile?.uid || 'N/A'}"`);
  csvLines.push(`"Account Provider","${profile?.authProvider || 'Standard'}"`);
  csvLines.push(`"Export Timestamp","${exportDate}"`);
  csvLines.push(`"Total Habits Tracked","${habits.length}"`);
  csvLines.push(`"Total Cumulative Savings","${sym} ${totalCumulativeSavings}"`);
  csvLines.push('');

  // ==========================================
  // SECTION 2: CATEGORY BOARDS DISTRIBUTION
  // ==========================================
  csvLines.push(`"--------------------------------------------------------------------------"`);
  csvLines.push(`"1. CATEGORY BOARDS DISTRIBUTION & COMBINED STREAKS"`);
  csvLines.push(`"--------------------------------------------------------------------------"`);
  csvLines.push(`"Category Board","Habits Count","Combined Active Streaks (Days)","Routine Share (%)"`);

  const categoryStats: Record<string, { count: number; totalStreak: number }> = {};
  habits.forEach((h) => {
    const cat = h.category || 'General';
    const m = habitMetricsMap[h.id];
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, totalStreak: 0 };
    categoryStats[cat].count++;
    categoryStats[cat].totalStreak += m?.streakCount || 0;
  });

  Object.entries(categoryStats).forEach(([cat, stat]) => {
    const share = Math.round((stat.count / Math.max(habits.length, 1)) * 100);
    csvLines.push(`"${cat.replace(/"/g, '""')}","${stat.count}","${stat.totalStreak}","${share}%"`);
  });
  csvLines.push('');

  // ==========================================
  // SECTION 3: IN-DEPTH HABIT MASTER MATRIX
  // ==========================================
  csvLines.push(`"--------------------------------------------------------------------------"`);
  csvLines.push(`"2. IN-DEPTH HABIT MASTER PERFORMANCE MATRIX"`);
  csvLines.push(`"--------------------------------------------------------------------------"`);
  csvLines.push(
    [
      '"#"',
      '"Habit Name"',
      '"Category Board"',
      '"Frequency"',
      '"Daily Goal Target"',
      '"Current Active Streak (Days)"',
      '"Longest Lifetime Streak (Days)"',
      '"Total Lifetime Check-ins"',
      '"Streak Shield Active"',
      '"Creation Date"',
      '"Sort Order"',
      '"Status"',
    ].join(',')
  );

  habits.forEach((h, idx) => {
    const m = habitMetricsMap[h.id] || {
      streakCount: 0,
      longestStreak: 0,
      totalCompletions: 0,
      isShieldActive: false,
    };
    const streak = m.streakCount ?? 0;
    const longest = m.longestStreak ?? streak;
    const completions = m.totalCompletions ?? streak;
    const shield = m.isShieldActive ? 'YES' : 'NO';
    const freq = h.frequency ? h.frequency.toUpperCase() : 'DAILY';
    const goal = `${h.goalCount || 1} times/day`;
    const created = h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-US') : 'Active';
    const status = h.archived ? 'Archived' : 'Active';

    const row = [
      `"${idx + 1}"`,
      `"${h.name.replace(/"/g, '""')}"`,
      `"${(h.category || 'General').replace(/"/g, '""')}"`,
      `"${freq}"`,
      `"${goal}"`,
      `"${streak}"`,
      `"${longest}"`,
      `"${completions}"`,
      `"${shield}"`,
      `"${created}"`,
      `"${h.sortOrder || 0}"`,
      `"${status}"`,
    ];
    csvLines.push(row.join(','));
  });
  csvLines.push('');

  // ==========================================
  // SECTION 4: FINANCIAL MONTHLY PERFORMANCE
  // ==========================================
  if (monthSummaries.length > 0) {
    csvLines.push(`"--------------------------------------------------------------------------"`);
    csvLines.push(`"3. FINANCIAL SAVINGS — MONTH-BY-MONTH PERFORMANCE"`);
    csvLines.push(`"--------------------------------------------------------------------------"`);
    csvLines.push(
      [
        '"Month Period"',
        `"Starting Balance (${sym})"`,
        `"Total Savings Deposited (${sym})"`,
        `"Total Expense Deductions (${sym})"`,
        `"Net Monthly Growth (${sym})"`,
        `"Ending Cumulative Balance (${sym})"`,
      ].join(',')
    );

    monthSummaries.forEach((m) => {
      csvLines.push(
        [
          `"${m.monthTitle}"`,
          `"${m.startingBalance}"`,
          `"${m.totalSavings}"`,
          `"${m.totalExpenses}"`,
          `"${m.netSavings}"`,
          `"${m.endingBalance}"`,
        ].join(',')
      );
    });
    csvLines.push('');
  }

  // ==========================================
  // SECTION 5: DAILY FINANCIAL TRANSACTION LOG
  // ==========================================
  if (expenseRows.length > 0) {
    csvLines.push(`"--------------------------------------------------------------------------"`);
    csvLines.push(`"4. DAILY FINANCIAL SAVINGS & EXPENSE TRANSACTION LOG"`);
    csvLines.push(`"--------------------------------------------------------------------------"`);
    csvLines.push(
      [
        '"Date Key (YYYY-MM-DD)"',
        '"Display Date (DD/MM)"',
        `"Daily Savings Deposit (${sym})"`,
        `"Cumulative Running Balance (${sym})"`,
        `"Total Deductions (${sym})"`,
        '"Itemized Expense Deductions & Descriptions"',
      ].join(',')
    );

    expenseRows.forEach((r) => {
      const totalExp = (r.expenses || []).reduce((sum, e) => sum + e.amount, 0);
      const expItems =
        (r.expenses || [])
          .map((e) => `${sym}${e.amount} - ${e.description}`)
          .join(' | ')
          .replace(/"/g, '""') || 'None';

      csvLines.push(
        [
          `"${r.dateKey}"`,
          `"${r.displayDate}"`,
          `"${r.savingsAmount}"`,
          `"${r.cumulativeBalance}"`,
          `"${totalExp}"`,
          `"${expItems}"`,
        ].join(',')
      );
    });
  }

  // Build Blob with UTF-8 BOM prefix
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = userName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];

  if (typeof document !== 'undefined') {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `habitflow_advanced_analytics_${sanitizedName}_${dateStamp}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
  if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 1500);
  }
}

/**
 * Advanced JSON Raw Backup Exporter
 */
export function exportToJSON(data: ExportData): void {
  const {
    profile,
    habits,
    habitMetricsMap,
    expenseRows,
    monthSummaries,
    totalCumulativeSavings,
    expenseSettings,
  } = data;
  const userName = profile?.name || 'user';
  const exportPayload = {
    app: 'HabitFlow',
    version: '2.0.0',
    exportFormat: 'advanced_executive_backup',
    exportedAt: new Date().toISOString(),
    user: {
      uid: profile?.uid,
      name: profile?.name,
      email: profile?.email,
      authProvider: profile?.authProvider,
      createdAt: profile?.createdAt,
      lastLoginAt: profile?.lastLoginAt,
    },
    analyticsOverview: {
      totalHabitsTracked: habits.length,
      totalCumulativeSavings: totalCumulativeSavings ?? 0,
      totalRecordedExpenseDays: expenseRows?.length ?? 0,
      totalMonthsLogged: monthSummaries?.length ?? 0,
    },
    habits,
    habitMetrics: habitMetricsMap,
    financialLedger: {
      settings: expenseSettings,
      monthSummaries,
      dailyRows: expenseRows,
    },
  };

  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const sanitizedName = userName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];

  if (typeof document !== 'undefined') {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `habitflow_advanced_backup_${sanitizedName}_${dateStamp}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
