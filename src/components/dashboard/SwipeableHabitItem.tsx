import React, { useState, useRef, useCallback } from 'react';
import { Habit } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface SwipeableHabitItemProps {
  habit: Habit;
  done: boolean;
  streak: number;
  currentValue?: number;
  timerSecondsElapsed?: number;
  isRestDay?: boolean;
  isPaused?: boolean;
  isShieldActive?: boolean;
  hasNote?: boolean;
  onToggle: () => void;
  onOpenNote: () => void;
  onUpdateValue?: (newValue: number) => void;
  onOpenTimer?: () => void;
}

export const SwipeableHabitItem: React.FC<SwipeableHabitItemProps> = ({
  habit,
  done,
  streak,
  currentValue = 0,
  timerSecondsElapsed = 0,
  isRestDay = false,
  isPaused = false,
  isShieldActive,
  hasNote = false,
  onToggle,
  onOpenNote,
  onUpdateValue,
  onOpenTimer,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasTriggeredHapticRef = useRef(false);

  const SWIPE_THRESHOLD = 65;
  const MAX_SWIPE = 110;

  const isNumeric = habit.habitType === 'numeric';
  const isTimer = habit.habitType === 'timer';
  const targetVal = habit.targetValue || 1;
  const stepVal = habit.stepValue || 1;
  const unit = habit.unit || '';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Determine gesture direction on initial movement
      if (isHorizontalSwipeRef.current === null) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          isHorizontalSwipeRef.current = false;
          return;
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
          isHorizontalSwipeRef.current = true;
          setIsSwiping(true);
        }
      }

      if (!isHorizontalSwipeRef.current) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      currentXRef.current = touch.clientX;
      const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setOffsetX(clamped);

      if (Math.abs(clamped) >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        triggerHaptic('swipe');
      } else if (Math.abs(clamped) < SWIPE_THRESHOLD) {
        hasTriggeredHapticRef.current = false;
      }
    },
    [SWIPE_THRESHOLD, MAX_SWIPE]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isHorizontalSwipeRef.current) {
      setOffsetX(0);
      setIsSwiping(false);
      return;
    }

    const deltaX = currentXRef.current - startXRef.current;

    // Action 1: Swipe Right -> Complete / Check off habit
    if (deltaX >= SWIPE_THRESHOLD) {
      triggerHaptic('tick');
      onToggle();
    }
    // Action 2: Swipe Left -> Quick Reflection Note
    else if (deltaX <= -SWIPE_THRESHOLD) {
      triggerHaptic('note');
      onOpenNote();
    }

    setOffsetX(0);
    setIsSwiping(false);
    isHorizontalSwipeRef.current = null;
  }, [SWIPE_THRESHOLD, onToggle, onOpenNote]);

  const handleCardClick = () => {
    if (Math.abs(offsetX) > 5) return;
    onToggle();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tick');
    if (onUpdateValue) {
      onUpdateValue(currentValue + stepVal);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    if (onUpdateValue) {
      onUpdateValue(Math.max(0, currentValue - stepVal));
    }
  };

  // Timer minutes display
  const timerElapsedMins = Math.floor(timerSecondsElapsed / 60);

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group">
      {/* Background Action Indicators (Revealed during swipe) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-2xl pointer-events-none">
        {/* Left Side Reveal: Swipe Right -> Check-off Action */}
        <div
          style={{ opacity: offsetX > 15 ? Math.min(1, offsetX / SWIPE_THRESHOLD) : 0 }}
          className="flex items-center gap-2 text-white font-bold text-xs bg-[#2D5A34] absolute inset-y-0 left-0 right-1/2 pl-4 transition-opacity"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <span className="font-stat-label tracking-wide uppercase text-[11px]">
            {done ? 'Mark Incomplete' : 'Complete'}
          </span>
        </div>

        {/* Right Side Reveal: Swipe Left -> Reflection Note Action */}
        <div
          style={{ opacity: offsetX < -15 ? Math.min(1, Math.abs(offsetX) / SWIPE_THRESHOLD) : 0 }}
          className="flex items-center justify-end gap-2 text-white font-bold text-xs bg-[#A65A42] absolute inset-y-0 right-0 left-1/2 pr-4 transition-opacity"
        >
          <span className="font-stat-label tracking-wide uppercase text-[11px]">
            Add Reflection
          </span>
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            edit_note
          </span>
        </div>
      </div>

      {/* Foreground Swipeable Card Surface */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative z-10 p-3 rounded-2xl border transition-colors duration-150 cursor-pointer active:scale-[0.99] ${
          done
            ? 'bg-surface-container-low/70 dark:bg-surface-container-low/40 oled:!bg-[#101114] border-outline-variant/30'
            : isPaused
            ? 'bg-amber-500/5 border-amber-500/20'
            : isRestDay
            ? 'bg-surface-container-low/40 border-outline-variant/20 opacity-80'
            : 'bg-surface-container-lowest dark:bg-surface-container-low oled:!bg-[#141517] border-outline-variant/40 oled:border-outline-variant/20 hover:border-primary/40 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Checkbox + Habit Information */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Circular 1-tap Checkbox */}
            <button
              type="button"
              aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                done
                  ? 'bg-primary text-on-primary shadow-xs scale-105'
                  : 'border-2 border-outline-variant/70 hover:border-primary bg-transparent'
              }`}
            >
              {done && (
                <span className="material-symbols-outlined text-[15px] font-bold animate-scaleUp">
                  check
                </span>
              )}
            </button>

            {/* Habit Name & Metadata */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`font-habit-name text-xs sm:text-sm font-semibold truncate transition-colors ${
                    done
                      ? 'text-on-surface-variant line-through opacity-70'
                      : 'text-on-surface'
                  }`}
                >
                  {habit.name}
                </span>

                {/* Status Badges: Paused, Rest Day */}
                {isPaused && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[10px]">beach_access</span>
                    <span>Paused</span>
                  </span>
                )}
                {isRestDay && !isPaused && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-secondary-container/40 text-secondary text-[10px] font-bold">
                    <span>Rest Day 🌿</span>
                  </span>
                )}
              </div>

              {/* Sub-line metadata & Tags */}
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5 flex-wrap">
                <span className="capitalize">{habit.category || 'General'}</span>
                <span>•</span>
                <span className="capitalize">{habit.frequency}</span>

                {/* Custom Tags */}
                {habit.tags && habit.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {habit.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-primary/80 font-medium">
                          {t.startsWith('#') ? t : `#${t}`}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {hasNote && (
                  <span
                    title="Reflection note attached for today"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-secondary-container/60 text-secondary text-[10px] font-bold ml-1"
                  >
                    <span className="material-symbols-outlined text-[11px]">edit_note</span>
                    <span>Note</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle/Right: Numeric Stepper or Zen Timer Trigger */}
          <div className="flex items-center gap-2 shrink-0 ml-1">
            {/* Numeric Target Habits: Stepper & Count */}
            {isNumeric && (
              <div
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high/40 border border-outline-variant/30"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={currentValue <= 0}
                  className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-surface-container-high active:scale-90 disabled:opacity-30 cursor-pointer text-on-surface font-bold text-xs"
                >
                  −
                </button>
                <span className="text-[11px] font-mono font-bold text-on-surface px-1 min-w-[40px] text-center">
                  {currentValue.toLocaleString()}/{targetVal.toLocaleString()}
                  {unit ? ` ${unit}` : ''}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-surface-container-high active:scale-90 cursor-pointer text-on-surface font-bold text-xs"
                >
                  +
                </button>
              </div>
            )}

            {/* Zen Timer Habits: Timer Play Trigger */}
            {isTimer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('tick');
                  if (onOpenTimer) onOpenTimer();
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  done
                    ? 'bg-secondary-container/40 text-secondary border-secondary/30'
                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">timer</span>
                <span>
                  {timerElapsedMins > 0 ? `${timerElapsedMins}m / ` : ''}
                  {habit.timerDuration || 15}m
                </span>
              </button>
            )}

            {/* Streak Counter */}
            <div className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[15px] text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-stat-label text-xs font-bold text-on-surface">
                {streak}d
              </span>
              {isShieldActive && (
                <span
                  title="Protected by Streak Shield"
                  className="material-symbols-outlined text-[12px] text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield
                </span>
              )}
            </div>

            {/* Quick Note Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('note');
                onOpenNote();
              }}
              title="Add reflection note for today"
              className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">
                {hasNote ? 'sticky_note_2' : 'edit_note'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
