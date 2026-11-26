import React, { useState, useMemo } from 'react';
import { formatDateKey } from '../../hooks/useDashboardMetrics';
import { useAnalyticsWorker } from '../../hooks/useAnalyticsWorker';
import { triggerHaptic } from '../../utils/haptics';

export type HeatmapZoomLevel = 'week' | 'month' | 'quarter' | 'year';

interface YearInPixelsHeatmapProps {
  currentDate: Date;
  onChangeDate?: (newDate: Date) => void;
  isCompleted: (dateKey: string) => boolean;
  onToggleDate?: (dateKey: string) => void;
  habitColor?: string;
  habitName?: string;
  defaultZoom?: HeatmapZoomLevel;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const YearInPixelsHeatmap: React.FC<YearInPixelsHeatmapProps> = ({
  currentDate,
  onChangeDate,
  isCompleted,
  onToggleDate,
  habitColor = '#2D5A34',
  habitName,
  defaultZoom = 'year',
  className = '',
}) => {
  const [zoom, setZoom] = useState<HeatmapZoomLevel>(() => {
    return (localStorage.getItem('habitflow_heatmap_zoom') as HeatmapZoomLevel) || defaultZoom;
  });
  const [hoveredCell, setHoveredCell] = useState<{ dateKey: string; completed: boolean } | null>(null);
  const [filterState, setFilterState] = useState<'all' | 'completed' | 'missed'>('all');
  const [showStreakHighway, setShowStreakHighway] = useState(true);

  const handleZoomChange = (newZoom: HeatmapZoomLevel) => {
    setZoom(newZoom);
    localStorage.setItem('habitflow_heatmap_zoom', newZoom);
    triggerHaptic('selection');
  };

  const todayKey = formatDateKey(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers adjusted by zoom level
  const handleNavigate = (direction: -1 | 1) => {
    triggerHaptic('light');
    const newDate = new Date(currentDate);
    if (zoom === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (zoom === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (zoom === 'quarter') {
      newDate.setMonth(newDate.getMonth() + direction * 3);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    onChangeDate?.(newDate);
  };

  // 1. WEEK VIEW DATA (7 days centered around selected date or its week)
  const weekCells = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateKey = formatDateKey(d);
      return {
        date: d,
        dateKey,
        dayName: WEEKDAYS[d.getDay()],
        dayNum: d.getDate(),
        isToday: dateKey === todayKey,
        completed: isCompleted(dateKey),
      };
    });
  }, [currentDate, isCompleted, todayKey]);

  // 2. MONTH VIEW DATA (Traditional 7-column calendar)
  const monthCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dayNum?: number; dateKey?: string; isToday?: boolean; completed?: boolean }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({});
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateKey,
        isToday: dateKey === todayKey,
        completed: isCompleted(dateKey),
      });
    }
    return cells;
  }, [year, month, isCompleted, todayKey]);

  // 3. QUARTER VIEW DATA (3 months in current quarter)
  const quarterMonths = useMemo(() => {
    const currentQ = Math.floor(month / 3);
    const startMonth = currentQ * 3;
    return [startMonth, startMonth + 1, startMonth + 2].map((mIdx) => {
      const totalDays = new Date(year, mIdx + 1, 0).getDate();
      const firstDayIndex = new Date(year, mIdx, 1).getDay();
      let completedInMonth = 0;

      const days = Array.from({ length: totalDays }, (_, i) => {
        const d = i + 1;
        const dateKey = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const done = isCompleted(dateKey);
        if (done) completedInMonth++;
        return {
          dayNum: d,
          dateKey,
          isToday: dateKey === todayKey,
          completed: done,
        };
      });

      return {
        monthName: MONTH_NAMES[mIdx],
        monthIndex: mIdx,
        firstDayIndex,
        days,
        completedCount: completedInMonth,
        totalDays,
        completionRate: Math.round((completedInMonth / totalDays) * 100),
      };
    });
  }, [year, month, isCompleted, todayKey]);

  // Gather completed date keys for offloaded Web Worker computation
  const completedDateKeys = useMemo(() => {
    const keys: string[] = [];
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeap ? 366 : 365;
    const d = new Date(year, 0, 1);
    for (let i = 0; i < totalDays; i++) {
      const key = formatDateKey(d);
      if (isCompleted(key)) {
        keys.push(key);
      }
      d.setDate(d.getDate() + 1);
    }
    return keys;
  }, [year, isCompleted]);

  // 4. YEAR IN PIXELS (Offloaded to background Web Worker for guaranteed 60/120 FPS UI)
  const { yearGrid, yearStats } = useAnalyticsWorker(year, completedDateKeys, todayKey);

  // Longest streak highway in the year
  const streakHighwaySet = useMemo(() => {
    let longestChain: string[] = [];
    let currentChain: string[] = [];

    const allDaysInYear: { dateKey: string; completed: boolean }[] = [];
    yearGrid.forEach((week) => {
      week.forEach((cell) => {
        if (cell && cell.isCurrentYear) {
          allDaysInYear.push({ dateKey: cell.dateKey, completed: cell.completed });
        }
      });
    });
    allDaysInYear.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    for (const d of allDaysInYear) {
      if (d.completed) {
        currentChain.push(d.dateKey);
        if (currentChain.length > longestChain.length) {
          longestChain = [...currentChain];
        }
      } else {
        currentChain = [];
      }
    }
    return new Set(longestChain);
  }, [yearGrid]);

  // Title string depending on zoom
  const headerTitle = useMemo(() => {
    if (zoom === 'week') {
      const start = weekCells[0]?.date;
      const end = weekCells[6]?.date;
      return `${start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (zoom === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (zoom === 'quarter') {
      const q = Math.floor(month / 3) + 1;
      return `Q${q} ${year} (${MONTH_NAMES[Math.floor(month / 3) * 3]} – ${MONTH_NAMES[Math.floor(month / 3) * 3 + 2]})`;
    }
    return `Year ${year} in Pixels`;
  }, [zoom, weekCells, currentDate, month, year]);

  return (
    <div className={`bg-surface-container-lowest dark:bg-surface-container-lowest oled:!bg-[#0B0C0E] rounded-3xl p-4 sm:p-6 shadow-soft border border-outline-variant/20 oled:border-outline-variant/10 space-y-4 transition-colors ${className}`}>
      {/* Top Header: Title, Zoom Controls, Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              grain
            </span>
            <h3 className="font-section-header text-base sm:text-lg font-bold text-on-surface">
              {headerTitle}
            </h3>
          </div>
          <p className="font-body-text text-xs text-on-surface-variant mt-0.5">
            {zoom === 'year'
              ? `${yearStats.activeDays} of ${yearStats.totalDays} days checked in (${yearStats.percentage}%) • Longest streak: ${yearStats.longestStreak}d`
              : habitName
              ? `Tracking consistency for ${habitName}`
              : 'Interactive habit consistency timeline'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Streak Highway Highlight Toggle */}
          {zoom === 'year' && streakHighwaySet.size > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowStreakHighway((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-stat-label transition-all cursor-pointer ${
                showStreakHighway
                  ? 'bg-[#52995D]/15 text-[#2D5A34] dark:text-[#88C490] border border-[#52995D]/30 shadow-2xs'
                  : 'bg-surface-container-low dark:bg-surface-container-high/30 text-on-surface-variant border border-outline-variant/20 hover:text-on-surface'
              }`}
              title="Toggle Longest Streak Highway Highlight"
            >
              <span className="material-symbols-outlined text-[15px]">route</span>
              <span>Streak Highway ({streakHighwaySet.size}d)</span>
            </button>
          )}

          {/* Zoom Level Switcher Pills */}
          <div className="flex items-center bg-surface-container-low dark:bg-surface-container-high/30 p-1 rounded-full border border-outline-variant/20">
            {(['week', 'month', 'quarter', 'year'] as HeatmapZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => handleZoomChange(z)}
                className={`px-3 py-1 rounded-full text-xs font-stat-label font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  zoom === z
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Prev / Next Navigation Buttons */}
          <div className="flex items-center gap-1 bg-surface-container-low dark:bg-surface-container-high/30 p-1 rounded-full border border-outline-variant/20">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              title="Previous period"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              title="Next period"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: WEEK ZOOM (Tactile 7-Day Cards) */}
      {zoom === 'week' && (
        <div className="grid grid-cols-7 gap-2 pt-2 animate-fadeIn">
          {weekCells.map((cell) => (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleDate?.(cell.dateKey);
              }}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                cell.completed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                  : 'bg-surface-container-low dark:bg-surface-container-high/20 border-outline-variant/15 text-on-surface-variant hover:border-outline-variant/40'
              } ${cell.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider">{cell.dayName}</span>
              <span className="text-lg font-bold my-1">{cell.dayNum}</span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] material-symbols-outlined transition-all ${
                  cell.completed
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant/40 text-transparent'
                }`}
              >
                {cell.completed ? 'check' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* VIEW 2: MONTH ZOOM (Classic 7x5 Calendar) */}
      {zoom === 'month' && (
        <div className="space-y-2 pt-1 animate-fadeIn">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((cell, idx) => {
              if (!cell.dayNum || !cell.dateKey) {
                return <div key={`empty-${idx}`} className="h-11 rounded-xl" />;
              }
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    if (cell.dateKey) onToggleDate?.(cell.dateKey);
                  }}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    cell.completed
                      ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                      : 'bg-surface-container-low dark:bg-surface-container-high/20 border-outline-variant/15 text-on-surface hover:border-outline-variant/40'
                  } ${cell.isToday ? 'ring-2 ring-secondary ring-offset-1 ring-offset-background' : ''}`}
                >
                  <span className="text-xs font-semibold">{cell.dayNum}</span>
                  {cell.completed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: QUARTER ZOOM (3-Month Overview Cards) */}
      {zoom === 'quarter' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 animate-fadeIn">
          {quarterMonths.map((qm) => (
            <div
              key={qm.monthName}
              className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container-high/20 border border-outline-variant/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface">{qm.monthName}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {qm.completedCount}/{qm.totalDays} ({qm.completionRate}%)
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                {Array.from({ length: qm.firstDayIndex }, (_, i) => (
                  <div key={`blank-${i}`} className="h-5" />
                ))}
                {qm.days.map((d) => (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onToggleDate?.(d.dateKey);
                    }}
                    title={`${d.dateKey}: ${d.completed ? 'Completed' : 'Not completed'}`}
                    className={`h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      d.completed
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high'
                    } ${d.isToday ? 'ring-1 ring-secondary' : ''}`}
                  >
                    {d.dayNum}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 4: YEAR ZOOM (Interactive 52-Week Year-in-Pixels Matrix) */}
      {zoom === 'year' && (
        <div className="pt-2 animate-fadeIn space-y-3">
          {/* Scrollable / Scrubbable Pixel Canvas */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[700px] flex gap-1">
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between py-0.5 pr-2 select-none">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">S</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">M</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">T</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">W</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">T</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">F</span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase">S</span>
              </div>

              {/* 52 Week Columns */}
              <div className="flex gap-1 flex-1">
                {yearGrid.map((week, wIdx) => (
                  <div key={`w-${wIdx}`} className="flex flex-col gap-1 flex-1">
                    {week.map((cell, dIdx) => {
                      if (!cell) {
                        return <div key={`empty-${wIdx}-${dIdx}`} className="w-full aspect-square" />;
                      }
                      const { dateKey, completed, isToday, isCurrentYear } = cell;
                      const isHighway = showStreakHighway && streakHighwaySet.has(dateKey);
                      const isDimmed =
                        (filterState === 'completed' && !completed) ||
                        (filterState === 'missed' && completed);

                      return (
                        <div
                          key={dateKey}
                          onClick={() => {
                            triggerHaptic('light');
                            onToggleDate?.(dateKey);
                          }}
                          onMouseEnter={() => setHoveredCell({ dateKey, completed })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            backgroundColor: completed ? habitColor : undefined,
                          }}
                          className={`w-full aspect-square rounded-[3px] transition-all cursor-pointer relative ${
                            !isCurrentYear
                              ? 'opacity-15 bg-outline-variant/20'
                              : isDimmed
                              ? 'opacity-15 bg-outline-variant/15 scale-90'
                              : completed
                              ? 'shadow-[0_0_4px_rgba(82,153,93,0.4)]'
                              : 'bg-outline-variant/20 dark:bg-outline-variant/15 hover:bg-outline-variant/35'
                          } ${isToday ? 'ring-1.5 ring-secondary ring-offset-1' : ''} ${
                            isHighway
                              ? 'ring-2 ring-[#52995D] dark:ring-[#88C490] shadow-[0_0_8px_rgba(82,153,93,0.5)] z-10 scale-105'
                              : ''
                          }`}
                          title={`${dateKey}: ${completed ? 'Done' : 'Empty'}${isHighway ? ' • 🌟 Streak Highway' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Scrubbing Tooltip & Density Filter Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/15 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant font-medium">Scrubbing:</span>
              {hoveredCell ? (
                <span className="font-stat-label font-bold text-on-surface flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hoveredCell.completed ? 'bg-primary' : 'bg-outline-variant'}`} />
                  <span>{hoveredCell.dateKey}</span>
                  <span className={hoveredCell.completed ? 'text-primary font-bold' : 'text-on-surface-variant'}>
                    ({hoveredCell.completed ? 'Completed' : 'Missed'})
                  </span>
                  {showStreakHighway && streakHighwaySet.has(hoveredCell.dateKey) && (
                    <span className="text-[10px] font-bold text-[#2D5A34] dark:text-[#88C490] bg-[#52995D]/15 px-1.5 py-0.2 rounded-full">
                      Streak Highway 🔥
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-on-surface-variant italic">Hover or tap any pixel</span>
              )}
            </div>

            {/* Interactive Density / Status Filter Legend */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold mr-0.5">Filter:</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFilterState('all');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  filterState === 'all'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({yearStats.totalDays})
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFilterState(filterState === 'completed' ? 'all' : 'completed');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  filterState === 'completed'
                    ? 'bg-[#2D5A34] text-white shadow-2xs'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
                title="Filter completed pixels"
              >
                <span className="w-2 h-2 rounded-[2px] bg-[#2D5A34]" />
                <span>Done ({yearStats.activeDays})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFilterState(filterState === 'missed' ? 'all' : 'missed');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  filterState === 'missed'
                    ? 'bg-[#A65A42] text-white shadow-2xs'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'
                }`}
                title="Filter missed pixels"
              >
                <span className="w-2 h-2 rounded-[2px] bg-outline-variant/40" />
                <span>Missed ({Math.max(0, yearStats.totalDays - yearStats.activeDays)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
