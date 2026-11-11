import React from 'react';

export interface HabitFlowLogoProps {
  size?: number;
  variant?: 'emblem' | 'light' | 'mark';
  className?: string;
  showText?: boolean;
  tagline?: string;
  onClick?: () => void;
}

export const HabitFlowLogo: React.FC<HabitFlowLogoProps> = ({
  size = 36,
  variant = 'emblem',
  className = '',
  showText = false,
  tagline,
  onClick,
}) => {
  const isLight = variant === 'light';
  const isMark = variant === 'mark';

  const svgContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`hfBg-${variant}-${size}`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E2024" />
          <stop offset="100%" stopColor="#141517" />
        </linearGradient>
        <linearGradient id={`hfRibbon-${variant}-${size}`} x1="24" y1="90" x2="96" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2D5A34" />
          <stop offset="50%" stopColor="#4E8A56" />
          <stop offset="100%" stopColor="#88C490" />
        </linearGradient>
        <linearGradient id={`hfRibbonLight-${variant}-${size}`} x1="24" y1="90" x2="96" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#18191B" />
          <stop offset="60%" stopColor="#2D5A34" />
          <stop offset="100%" stopColor="#3D7546" />
        </linearGradient>
        <linearGradient id={`hfGold-${variant}-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2D594" />
          <stop offset="100%" stopColor="#D4A373" />
        </linearGradient>
      </defs>

      {/* Squircle Badge Base */}
      {!isMark && (
        <>
          <rect
            width="120"
            height="120"
            rx="32"
            fill={isLight ? '#F7F6F2' : `url(#hfBg-${variant}-${size})`}
          />
          <rect
            x="0.75"
            y="0.75"
            width="118.5"
            height="118.5"
            rx="31.25"
            stroke={isLight ? 'rgba(24,25,27,0.08)' : 'rgba(255,255,255,0.08)'}
            strokeWidth="1.5"
          />
        </>
      )}

      {/* Continuous Habit Loop into Ascending Checkmark Streak */}
      <path
        d="M 32 60 C 32 46 44 36 58 36 C 72 36 80 46 76 60 C 72 74 60 84 48 84 C 36 84 28 74 34 62 L 52 80 C 56 84 62 84 66 80 L 96 42"
        stroke={isLight ? `url(#hfRibbonLight-${variant}-${size})` : `url(#hfRibbon-${variant}-${size})`}
        strokeWidth={size <= 24 ? '14' : size <= 36 ? '12' : '10.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Today Focus Streak Dot */}
      <circle
        cx="96"
        cy="42"
        r={size <= 24 ? 0 : 5.5}
        fill={isLight ? '#D4A373' : `url(#hfGold-${variant}-${size})`}
      />
    </svg>
  );

  if (!showText) {
    return svgContent;
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        {svgContent}
      </div>
      <div className="flex flex-col select-none">
        <span className="font-app-title text-lg font-bold text-on-surface tracking-tight leading-none">
          Habit<span className="text-secondary dark:text-secondary-fixed-dim">Flow</span>
        </span>
        {tagline && (
          <span className="font-body-text text-[11px] text-on-surface-variant mt-1 leading-none">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default HabitFlowLogo;
