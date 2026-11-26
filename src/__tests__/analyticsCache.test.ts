import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedMonthlyReport,
  setCachedMonthlyReport,
  invalidateMonthlyReportCache,
  getCachedSparkline,
  setCachedSparkline,
  clearAllAnalyticsCache,
} from '../utils/analyticsCache';

describe('Analytics Cache Pipeline (Memory & IndexedDB)', () => {
  const mockUid = 'user_12345';
  const mockMonth = '2026-11';
  const mockCategory = 'Health & Vitality';

  beforeEach(async () => {
    await clearAllAnalyticsCache();
  });

  it('stores and retrieves monthly report data with 0ms fast-path memory lookup', async () => {
    const mockReport = {
      completionRate: 85,
      totalChecks: 120,
      streakCount: 14,
      peakDay: 'Wednesday',
    };

    await setCachedMonthlyReport(mockUid, mockMonth, mockCategory, mockReport);
    const retrieved = await getCachedMonthlyReport<typeof mockReport>(
      mockUid,
      mockMonth,
      mockCategory
    );

    expect(retrieved).not.toBeNull();
    expect(retrieved?.completionRate).toBe(85);
    expect(retrieved?.streakCount).toBe(14);
    expect(retrieved?.peakDay).toBe('Wednesday');
  });

  it('returns null for nonexistent cache entries', async () => {
    const result = await getCachedMonthlyReport(mockUid, '2024-01', 'Nonexistent');
    expect(result).toBeNull();
  });

  it('invalidates cache correctly when month data changes', async () => {
    const mockReport = { rate: 77 };
    await setCachedMonthlyReport(mockUid, mockMonth, mockCategory, mockReport);

    await invalidateMonthlyReportCache(mockUid, mockMonth);
    const afterInvalidation = await getCachedMonthlyReport(mockUid, mockMonth, mockCategory);

    expect(afterInvalidation).toBeNull();
  });

  it('caches and retrieves sparkline curve data synchronously in memory', () => {
    const habitId = 'habit_yoga_01';
    const dateKey = '2026-11-26';
    const mockSparkline = {
      ratePercent: 92,
      momentum: 'rising',
      linePath: 'M 0,20 C 10,15 20,10 30,5',
    };

    expect(getCachedSparkline(habitId, dateKey)).toBeNull();

    setCachedSparkline(habitId, dateKey, mockSparkline);
    const cached = getCachedSparkline<typeof mockSparkline>(habitId, dateKey);

    expect(cached).not.toBeNull();
    expect(cached?.ratePercent).toBe(92);
    expect(cached?.momentum).toBe('rising');
    expect(cached?.linePath).toContain('C');
  });

  it('evacuates expired entries when TTL is exceeded', async () => {
    const shortTtlMs = 1; // 1 millisecond
    await setCachedMonthlyReport(mockUid, mockMonth, 'Temporary', { foo: 'bar' }, shortTtlMs);

    // Wait 15ms for expiration
    await new Promise((r) => setTimeout(r, 15));

    const expired = await getCachedMonthlyReport(mockUid, mockMonth, 'Temporary');
    expect(expired).toBeNull();
  });
});
