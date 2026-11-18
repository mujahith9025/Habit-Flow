import React from 'react';
import { HabitFlowLogo } from './HabitFlowLogo';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 animate-fadeIn select-none"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient botanical pulse glow */}
        <div className="absolute w-16 h-16 rounded-3xl bg-secondary/15 dark:bg-secondary/25 animate-ping opacity-50 pointer-events-none" />
        
        {/* Core HabitFlow brand emblem */}
        <div className="relative z-10 transition-transform duration-300 hover:scale-105 drop-shadow-md">
          <HabitFlowLogo size={52} />
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm font-semibold text-on-surface tracking-tight">
          Habit<span className="text-secondary dark:text-secondary-fixed-dim">Flow</span>
        </p>
        <p className="text-xs text-on-surface-variant/80 mt-0.5 font-medium">
          Preparing your mindful space...
        </p>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
