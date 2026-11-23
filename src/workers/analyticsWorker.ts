/**
 * Web Worker for Offloading Heavy Habit Analytics & Heatmap Grid Computations
 * Keeps main thread locked at 60/120 FPS during navigation and calendar rendering.
 */

export interface YearGridWorkerInput {
  type: 'CALCULATE_YEAR_GRID';
  id: string;
  year: number;
  completedDateKeys: string[];
  todayKey: string;
}

export interface YearGridWorkerResult {
  type: 'YEAR_GRID_RESULT';
  id: string;
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
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

self.onmessage = (event: MessageEvent<YearGridWorkerInput>) => {
  const data = event.data;
  if (!data || data.type !== 'CALCULATE_YEAR_GRID') return;

  const { id, year, completedDateKeys, todayKey } = data;
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
      const dateKey = formatDateKey(runningDate);
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

  const result: YearGridWorkerResult = {
    type: 'YEAR_GRID_RESULT',
    id,
    yearGrid: grid,
    yearStats: {
      activeDays: activeDaysCount,
      totalDays: totalDaysInYear,
      percentage: Math.round((activeDaysCount / totalDaysInYear) * 100),
      longestStreak,
    },
  };

  self.postMessage(result);
};
