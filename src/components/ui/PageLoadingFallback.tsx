import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 animate-fadeIn"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient background glow ring */}
        <div className="absolute w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 animate-ping opacity-60 pointer-events-none" />
        
        {/* Core spinner icon */}
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high dark:bg-surface-container-highest shadow-soft flex items-center justify-center text-primary z-10 border border-outline-variant/30">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-on-surface dark:text-dark-text-primary tracking-wide">
          Loading view...
        </p>
        <p className="text-xs text-outline dark:text-dark-text-secondary mt-0.5">
          Preparing your mindful dashboard
        </p>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
