import { useState, useEffect, useRef, useMemo } from 'react';
import {
  YearGridWorkerInput,
  YearGridWorkerResult,
  SparklineWorkerResult,
  catmullRomToSvgPath,
} from '../workers/analyticsWorker';
import { getCachedSparkline, setCachedSparkline } from '../utils/analyticsCache';

export interface YearGridOutput {
  yearGrid: Array<Array<{
    dateKey: string;
    completed: boolean;
    isToday: boolean;
    isCurrentYear: boolean;
  } | null>>;
  yearStats: {
    activeDays: number;
    totalDays: number;
    percentage: number;
    longestStreak: number;
    streakHighwayKeys: string[];
  };
  isComputing: boolean;
}

export interface SparklineOutput {
  completedCount: number;
  ratePercent: number;
  delta: number;
  momentum: 'rising' | 'slowing' | 'steady';
  sparkPoints: number[];
  smoothLinePath: string;
  smoothAreaPath: string;
}

function computeYearSynchronously(
  year: number,
  completedDateKeys: string[],
  todayKey: string
): Omit<YearGridOutput, 'isComputing'> {
  const completedSet = new Set(completedDateKeys);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDaysInYear = isLeap ? 366 : 365;

  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay();

  const grid: Array<Array<{
    dateKey: string;
    completed: boolean;
    isToday: boolean;
    isCurrentYear: boolean;
  } | null>> = [];

  let activeDaysCount = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let longestChain: string[] = [];
  let currentChain: string[] = [];

  const runningDate = new Date(startDate);
  runningDate.setDate(runningDate.getDate() - startDayOfWeek);

  for (let w = 0; w < 53; w++) {
    const weekCol: Array<{
      dateKey: string;
      completed: boolean;
      isToday: boolean;
      isCurrentYear: boolean;
    } | null> = [];

    for (let day = 0; day < 7; day++) {
      const isCurrentYear = runningDate.getFullYear() === year;
      const y = runningDate.getFullYear();
      const m = String(runningDate.getMonth() + 1).padStart(2, '0');
      const d = String(runningDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      const completed = completedSet.has(dateKey);

      if (isCurrentYear) {
        if (completed) {
          activeDaysCount++;
          currentStreak++;
          currentChain.push(dateKey);
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            longestChain = [...currentChain];
          }
        } else {
          currentStreak = 0;
          currentChain = [];
        }
      }

      weekCol.push({
        dateKey,
        completed,
        isToday: dateKey === todayKey,
        isCurrentYear,
      });

      runningDate.setDate(runningDate.getDate() + 1);
    }
    grid.push(weekCol);
  }

  return {
    yearGrid: grid,
    yearStats: {
      activeDays: activeDaysCount,
      totalDays: totalDaysInYear,
      percentage: Math.round((activeDaysCount / totalDaysInYear) * 100),
      longestStreak,
      streakHighwayKeys: longestChain,
    },
  };
}

export function computeSmoothSparklineSync(
  days: Array<{ dateKey: string; completed: boolean }>,
  width = 300,
  height = 44
): SparklineOutput {
  const completedCount = days.filter((d) => d.completed).length;
  const totalDays = Math.max(days.length, 1);
  const ratePercent = Math.round((completedCount / totalDays) * 100);

  const mid = Math.floor(days.length / 2);
  const firstHalfDone = days.slice(0, mid).filter((d) => d.completed).length;
  const secondHalfDone = days.slice(mid).filter((d) => d.completed).length;
  const delta = secondHalfDone - firstHalfDone;

  let momentum: 'rising' | 'slowing' | 'steady' = 'steady';
  if (delta >= 2) momentum = 'rising';
  else if (delta <= -2) momentum = 'slowing';

  const sparkPoints: number[] = [];
  for (let i = 0; i < days.length; i++) {
    const windowStart = Math.max(0, i - 4);
    const windowSlice = days.slice(windowStart, i + 1);
    const windowDone = windowSlice.filter((d) => d.completed).length;
    const pct = Math.round((windowDone / windowSlice.length) * 100);
    sparkPoints.push(pct);
  }

  const pointsCoord: Array<[number, number]> = sparkPoints.map((pct, idx) => {
    const x = (idx / Math.max(days.length - 1, 1)) * width;
    const y = (height - 4) - (pct / 100) * (height - 8);
    return [x, y];
  });

  const smoothLinePath = catmullRomToSvgPath(pointsCoord, 0.25);
  const smoothAreaPath = `${smoothLinePath} L ${width},${height} L 0,${height} Z`;

  return {
    completedCount,
    ratePercent,
    delta,
    momentum,
    sparkPoints,
    smoothLinePath,
    smoothAreaPath,
  };
}

export function useAnalyticsWorker(
  year: number,
  completedDateKeys: string[],
  todayKey: string
): YearGridOutput {
  const [data, setData] = useState<YearGridOutput>(() => {
    const initial = computeYearSynchronously(year, completedDateKeys, todayKey);
    return { ...initial, isComputing: false };
  });

  const workerRef = useRef<Worker | null>(null);
  const currentReqId = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      const result = computeYearSynchronously(year, completedDateKeys, todayKey);
      setData({ ...result, isComputing: false });
      return;
    }

    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/analyticsWorker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<YearGridWorkerResult | SparklineWorkerResult>) => {
          if (event.data && event.data.type === 'YEAR_GRID_RESULT') {
            if (event.data.id === currentReqId.current) {
              setData({
                yearGrid: event.data.yearGrid,
                yearStats: event.data.yearStats,
                isComputing: false,
              });
            }
          }
        };

        workerRef.current.onerror = () => {
          const fallback = computeYearSynchronously(year, completedDateKeys, todayKey);
          setData({ ...fallback, isComputing: false });
        };
      }

      const reqId = `${year}_${Date.now()}`;
      currentReqId.current = reqId;

      const input: YearGridWorkerInput = {
        type: 'CALCULATE_YEAR_GRID',
        id: reqId,
        year,
        completedDateKeys,
        todayKey,
      };

      workerRef.current.postMessage(input);
    } catch {
      const fallback = computeYearSynchronously(year, completedDateKeys, todayKey);
      setData({ ...fallback, isComputing: false });
    }
  }, [year, completedDateKeys, todayKey]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return data;
}

/**
 * Hook for generating high-performance smooth Catmull-Rom sparklines with memory caching
 */
export function useSmoothSparkline(
  habitId: string,
  days: Array<{ dateKey: string; label: string; completed: boolean }>,
  baseDateKey: string,
  width = 300,
  height = 44
): SparklineOutput {
  return useMemo(() => {
    const cached = getCachedSparkline<SparklineOutput>(habitId, baseDateKey);
    if (cached) return cached;

    const computed = computeSmoothSparklineSync(days, width, height);
    setCachedSparkline(habitId, baseDateKey, computed);
    return computed;
  }, [habitId, days, baseDateKey, width, height]);
}
