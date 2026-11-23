import { useState, useEffect, useRef } from 'react';
import { YearGridWorkerInput, YearGridWorkerResult } from '../workers/analyticsWorker';

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
  };
  isComputing: boolean;
}

function computeSynchronously(
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
          if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else {
          currentStreak = 0;
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
    },
  };
}

export function useAnalyticsWorker(
  year: number,
  completedDateKeys: string[],
  todayKey: string
): YearGridOutput {
  const [data, setData] = useState<YearGridOutput>(() => {
    const initial = computeSynchronously(year, completedDateKeys, todayKey);
    return { ...initial, isComputing: false };
  });

  const workerRef = useRef<Worker | null>(null);
  const currentReqId = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      const result = computeSynchronously(year, completedDateKeys, todayKey);
      setData({ ...result, isComputing: false });
      return;
    }

    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/analyticsWorker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<YearGridWorkerResult>) => {
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
          // If worker fails, fallback to sync calculation
          const fallback = computeSynchronously(year, completedDateKeys, todayKey);
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
      // In case worker instantiation throws
      const fallback = computeSynchronously(year, completedDateKeys, todayKey);
      setData({ ...fallback, isComputing: false });
    }

    return () => {
      // Worker remains alive for subsequent requests
    };
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
