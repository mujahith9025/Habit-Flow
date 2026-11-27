import React, { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface AnalyticalHelpTooltipProps {
  term: string;
  explanation: string;
  className?: string;
}

export const AnalyticalHelpTooltip: React.FC<AnalyticalHelpTooltipProps> = ({
  term,
  explanation,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic('tick');
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        className="w-4 h-4 rounded-full bg-surface-container-high/80 dark:bg-stone-800 hover:bg-primary hover:text-on-primary text-on-surface-variant text-[10px] font-mono font-bold inline-flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30 ml-1 shrink-0"
        aria-label={`Explain term: ${term}`}
        aria-expanded={isOpen}
      >
        ?
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-3 rounded-2xl bg-stone-900/95 dark:bg-stone-950/95 text-stone-100 text-xs shadow-2xl border border-stone-700/60 z-50 animate-scaleUp pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-800">
            <span className="font-bold text-emerald-400 font-stat-label">
              {term}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-0.5"
              aria-label="Close explanation"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed font-body-text">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};
