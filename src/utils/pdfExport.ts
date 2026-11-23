import { ExportData } from './exportUtils';

/**
 * Lazy loaded Executive PDF Document Exporter
 * Bundled separately from main app so jsPDF (390 KB) and jspdf-autotable (60 KB)
 * are only downloaded when user taps "Export PDF".
 */
export async function exportToPDF(data: ExportData): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default || autoTableModule;

  const {
    profile,
    habits,
    habitMetricsMap = {},
    expenseRows = [],
    monthSummaries = [],
    totalCumulativeSavings = 0,
    expenseSettings,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const userName = profile?.name || 'HabitFlow User';
  const userEmail = profile?.email || '';
  const exportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const sym = expenseSettings?.currencySymbol || '₹';

  // Total Lifetime Completions & Streak Metrics
  let totalLifetimeCompletions = 0;
  let highestStreak = 0;
  habits.forEach((h) => {
    const m = habitMetricsMap[h.id];
    totalLifetimeCompletions += m?.totalCompletions ?? 0;
    highestStreak = Math.max(highestStreak, m?.longestStreak ?? m?.streakCount ?? 0);
  });

  // 1. Executive Header Banner
  doc.setFillColor(45, 90, 52); // #2D5A34 Japandi Deep Forest
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('HabitFlow — Executive Performance Report', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Comprehensive Habit Analytics, Streaks & Consistency History', 14, 23);

  doc.setFontSize(8.5);
  doc.setTextColor(215, 235, 255);
  doc.text(`Generated: ${exportDate} at ${timeStamp} • Account: ${userEmail || userName}`, 14, 30);

  // 2. Executive KPI Overview Box (2x2 Grid)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 24, 2, 2, 'S');

  // KPI 1: Habits Tracked
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(45, 90, 52);
  doc.text(`${habits.length}`, 22, 53);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL HABITS', 22, 59);

  // KPI 2: Total Lifetime Check-ins
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(`${totalLifetimeCompletions}`, 68, 53);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('LIFETIME CHECK-INS', 68, 59);

  // KPI 3: Best Streak
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(217, 119, 6);
  doc.text(`${highestStreak}d`, 118, 53);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('PEAK STREAK', 118, 59);

  // KPI 4: Cumulative Savings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(124, 58, 237);
  doc.text(`${sym}${totalCumulativeSavings.toLocaleString('en-IN')}`, 160, 53);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CUMULATIVE SAVED', 160, 59);

  // 3. Category Distribution Matrix
  const categoryStats: Record<string, { count: number; totalStreak: number }> = {};
  habits.forEach((h) => {
    const cat = h.category || 'General';
    const m = habitMetricsMap[h.id];
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, totalStreak: 0 };
    }
    categoryStats[cat].count++;
    categoryStats[cat].totalStreak += m?.streakCount || 0;
  });

  const categoryRows = Object.entries(categoryStats).map(([cat, stat]) => [
    cat,
    `${stat.count} ${stat.count === 1 ? 'habit' : 'habits'}`,
    `${stat.totalStreak} days combined`,
    `${Math.round((stat.count / Math.max(habits.length, 1)) * 100)}% of total routine`,
  ]);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Category Board Distribution & Consistency', 14, 73);

  autoTable(doc, {
    startY: 76,
    head: [['Category Board', 'Habits Count', 'Combined Active Streaks', 'Routine Share']],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 4. In-Depth Habit-by-Habit Performance Matrix
  const afterCategoryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 110;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Comprehensive Habit-by-Habit Master Performance Matrix', 14, afterCategoryY + 10);

  const habitRows = habits.map((h, i) => {
    const m = habitMetricsMap[h.id] || {
      streakCount: 0,
      longestStreak: 0,
      totalCompletions: 0,
      isShieldActive: false,
    };
    const streak = m.streakCount ?? 0;
    const longest = m.longestStreak ?? streak;
    const completions = m.totalCompletions ?? streak;
    const shield = m.isShieldActive ? 'Active 🛡️' : 'None';
    const freq = h.frequency ? h.frequency.toUpperCase() : 'DAILY';
    const goal = `${h.goalCount || 1}x/d`;
    const created = h.createdAt
      ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Active';

    return [
      (i + 1).toString(),
      h.name,
      h.category || 'General',
      freq,
      goal,
      `${streak}d`,
      `${longest}d`,
      `${completions}`,
      shield,
      created,
    ];
  });

  autoTable(doc, {
    startY: afterCategoryY + 13,
    head: [['#', 'Habit Name', 'Category', 'Freq', 'Goal', 'Streak', 'Best', 'Total', 'Shield', 'Created']],
    body: habitRows,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 90, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 15 },
      4: { cellWidth: 14 },
      5: { cellWidth: 16, fontStyle: 'bold', textColor: [217, 119, 6] },
      6: { cellWidth: 16 },
      7: { cellWidth: 14, fontStyle: 'bold', textColor: [16, 185, 129] },
      8: { cellWidth: 15 },
      9: { cellWidth: 22 },
    },
  });

  // 5. Financial & Expense Ledger (If Records Exist)
  if (expenseRows.length > 0) {
    const afterHabitsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 180;

    // Check if we need a page break
    if (afterHabitsY > 210) {
      doc.addPage();
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. Financial Savings & Expense Ledger Breakdown', 14, 20);
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. Financial Savings & Expense Ledger Breakdown', 14, afterHabitsY + 10);
    }

    const currentTableStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY > 210
      ? 23
      : afterHabitsY + 13;

    // Monthly Performance Table
    const monthlyDataRows = monthSummaries.map((m) => [
      m.monthTitle,
      `${sym}${m.startingBalance.toLocaleString('en-IN')}`,
      `+${sym}${m.totalSavings.toLocaleString('en-IN')}`,
      `-${sym}${m.totalExpenses.toLocaleString('en-IN')}`,
      `+${sym}${m.netSavings.toLocaleString('en-IN')}`,
      `${sym}${m.endingBalance.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: currentTableStartY,
      head: [['Month Period', 'Starting Balance', 'Total Deposited', 'Total Deductions', 'Net Change', 'Ending Balance']],
      body: monthlyDataRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // Recent Transaction Rows (Last 15 days)
    const afterMonthlyY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100;
    
    if (afterMonthlyY > 220) {
      doc.addPage();
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('4. Recent Daily Ledger Transaction Log (Last 15 Entries)', 14, 20);
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('4. Recent Daily Ledger Transaction Log (Last 15 Entries)', 14, afterMonthlyY + 8);
    }

    const ledgerStart = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY > 220 ? 23 : afterMonthlyY + 11;
    const recentRows = expenseRows.slice(-15).reverse().map((r) => {
      const expItems = (r.expenses || []).map((e) => `${sym}${e.amount} (${e.description})`).join(', ') || 'None';
      return [
        r.displayDate,
        `${sym}${r.savingsAmount}`,
        `${sym}${r.cumulativeBalance}`,
        expItems,
      ];
    });

    autoTable(doc, {
      startY: ledgerStart,
      head: [['Date (DD/MM)', 'Daily Savings', 'Cumulative Balance', 'Expense Deductions Log']],
      body: recentRows,
      theme: 'grid',
      headStyles: {
        fillColor: [45, 90, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 25 },
        2: { cellWidth: 35, fontStyle: 'bold', textColor: [45, 90, 52] },
        3: { cellWidth: 95 },
      },
    });
  }

  // 6. Pagination Footer on All Pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generated by HabitFlow — Advanced Personal Analytics & Habit Tracker',
      14,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }

  // 7. Save & Download
  const sanitizedName = userName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`habitflow_executive_report_${sanitizedName}_${dateStamp}.pdf`);
}
