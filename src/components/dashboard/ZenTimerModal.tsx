import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Habit } from '../../types';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { triggerHaptic } from '../../utils/haptics';
import { playCheckChime, playCelebrationChime } from '../../utils/zenAudio';

interface ZenTimerModalProps {
  isOpen: boolean;
  habit: Habit | null;
  dateKey: string;
  initialElapsedSeconds?: number;
  onClose: () => void;
  onComplete: (habitId: string, dateKey: string, elapsedSeconds: number) => Promise<void>;
}

const PRESET_DURATIONS = [
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '15m (Mindful)', minutes: 15 },
  { label: '25m (Pomodoro)', minutes: 25 },
  { label: '45m (Deep Work)', minutes: 45 },
  { label: '60m', minutes: 60 },
];

export const ZenTimerModal: React.FC<ZenTimerModalProps> = ({
  isOpen,
  habit,
  dateKey,
  initialElapsedSeconds = 0,
  onClose,
  onComplete,
}) => {
  const targetMinutes = habit?.timerDuration || 15;
  const [durationMinutes, setDurationMinutes] = useState(targetMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(targetMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when habit changes or modal opens
  useEffect(() => {
    if (isOpen && habit) {
      const mins = habit.timerDuration || 15;
      setDurationMinutes(mins);
      setSecondsRemaining(mins * 60);
      setIsRunning(false);
      setIsCompleted(false);
      setElapsedSeconds(initialElapsedSeconds);
    }
  }, [isOpen, habit, initialElapsedSeconds]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const totalDurationSeconds = durationMinutes * 60;
  const progressFraction =
    totalDurationSeconds > 0
      ? Math.min(1, Math.max(0, 1 - secondsRemaining / totalDurationSeconds))
      : 0;

  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleFinish = useCallback(async () => {
    if (!habit) return;
    setIsRunning(false);
    setIsCompleted(true);
    triggerHaptic('ripple');
    playCelebrationChime();

    const finalLogged = Math.max(elapsedSeconds, totalDurationSeconds - secondsRemaining);
    await onComplete(habit.id, dateKey, finalLogged);
  }, [habit, dateKey, elapsedSeconds, totalDurationSeconds, secondsRemaining, onComplete]);

  // Timer Tick Engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleFinish]);

  const handleTogglePlay = () => {
    if (secondsRemaining <= 0) {
      // Restart
      setSecondsRemaining(durationMinutes * 60);
      setIsCompleted(false);
    }
    triggerHaptic('tick');
    if (!isRunning) {
      playCheckChime();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerHaptic('selection');
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsRemaining(durationMinutes * 60);
  };

  const handleSelectPreset = (minutes: number) => {
    if (isRunning) return;
    triggerHaptic('selection');
    setDurationMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsCompleted(false);
  };

  const handleAddMinutes = (extraMinutes: number) => {
    triggerHaptic('tick');
    setSecondsRemaining((prev) => prev + extraMinutes * 60);
    setDurationMinutes((prev) => prev + extraMinutes);
  };

  if (!habit) return null;

  // Circular SVG specs
  const radius = 95;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={() => {
        setIsRunning(false);
        onClose();
      }}
      title="Zen Timer & Pomodoro"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center justify-center p-2 text-center select-none space-y-5">
        {/* Habit Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high dark:bg-surface-container-high/60 border border-outline-variant/30">
          <span
            className="material-symbols-outlined text-[16px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {habit.icon || 'timer'}
          </span>
          <span className="font-habit-name text-xs font-semibold text-on-surface truncate max-w-[200px]">
            {habit.name}
          </span>
          <span className="text-[10px] text-on-surface-variant px-1.5 py-0.2 rounded-full bg-surface-container-lowest">
            {durationMinutes}m target
          </span>
        </div>

        {/* Circular Countdown Ring Display */}
        <div className="relative w-56 h-56 flex items-center justify-center my-2">
          {/* Subtle Ambient Pulse Background when running */}
          {isRunning && (
            <div
              className="absolute inset-4 rounded-full bg-primary/10 animate-ping pointer-events-none"
              style={{ animationDuration: '3s' }}
            />
          )}

          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            {/* Background Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-outline-variant/30"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={isCompleted ? '#52995D' : '#2D5A34'}
              strokeWidth={strokeWidth + 1}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Time & Status Center Labels */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-on-surface">
              {formattedTime}
            </span>
            <span className="text-[11px] font-stat-label uppercase tracking-widest text-on-surface-variant mt-1">
              {isCompleted
                ? 'Completed ✨'
                : isRunning
                ? 'Focusing...'
                : secondsRemaining === totalDurationSeconds
                ? 'Ready'
                : 'Paused'}
            </span>
          </div>
        </div>

        {/* Preset Selector Chips (disabled while running) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full max-w-sm">
          {PRESET_DURATIONS.map((preset) => {
            const isSelected = durationMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                disabled={isRunning}
                onClick={() => handleSelectPreset(preset.minutes)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface disabled:opacity-50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Main Controls: Play/Pause, Reset, +Min */}
        <div className="flex items-center justify-center gap-4 w-full pt-2">
          {/* Reset / Rewind Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset Timer"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">replay</span>
          </button>

          {/* Big Primary Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-on-primary shadow-soft hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              isRunning ? 'bg-secondary' : 'bg-primary'
            }`}
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* +1 Minute Quick Extender */}
          <button
            type="button"
            onClick={() => handleAddMinutes(1)}
            title="Add 1 minute"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xs font-bold font-stat-label">+1m</span>
          </button>
        </div>

        {/* Finish Early / Save Button */}
        {secondsRemaining < totalDurationSeconds && (
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer pt-2"
          >
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>Finish & Check Off Today</span>
          </button>
        )}
      </div>
    </BottomSheetModal>
  );
};
