import React, { useId } from 'react';

export interface RadialOrbitGaugeProps {
  percentage: number;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  valueLabel?: string;
  sublabel?: string;
  gradientColors?: [string, string, string];
  trackColor?: string;
  showOrbitMarker?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const RadialOrbitGauge: React.FC<RadialOrbitGaugeProps> = ({
  percentage,
  size = 'md',
  strokeWidth,
  showValue = false,
  valueLabel,
  sublabel,
  gradientColors = ['#2D5A34', '#52995D', '#88C490'],
  trackColor,
  showOrbitMarker = true,
  className = '',
  children,
}) => {
  const gradientId = useId().replace(/:/g, '_');

  // Map size tokens to numeric pixel sizes
  const resolvedSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 36
      : size === 'sm'
      ? 52
      : size === 'md'
      ? 76
      : size === 'lg'
      ? 110
      : 144;

  const resolvedStroke =
    strokeWidth ??
    (resolvedSize <= 40 ? 3.5 : resolvedSize <= 60 ? 4.5 : resolvedSize <= 90 ? 6.5 : 9);

  const radius = (resolvedSize - resolvedStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Calculate tip orbit marker coordinates
  const angleDeg = -90 + (clamped / 100) * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  const center = resolvedSize / 2;
  const markerX = center + radius * Math.cos(angleRad);
  const markerY = center + radius * Math.sin(angleRad);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: resolvedSize, height: resolvedSize }}
    >
      <svg
        width={resolvedSize}
        height={resolvedSize}
        viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
        className="transform -rotate-90 origin-center"
      >
        <defs>
          {/* Japandi botanical kinetic gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="55%" stopColor={gradientColors[1]} />
            <stop offset="100%" stopColor={gradientColors[2]} />
          </linearGradient>

          {/* Marker glow filter */}
          <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor || 'currentColor'}
          strokeWidth={resolvedStroke}
          className="text-outline-variant/15 dark:text-outline-variant/20 transition-colors"
        />

        {/* Dynamic Progress Orbit Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={resolvedStroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Orbit Marker Tip (shows at active point when progress > 0 and < 100) */}
        {showOrbitMarker && clamped > 0 && (
          <g className="transition-all duration-700 ease-out">
            <circle
              cx={markerX}
              cy={markerY}
              r={resolvedStroke * 0.9}
              fill={gradientColors[2]}
              filter={`url(#${gradientId}-glow)`}
            />
            <circle
              cx={markerX}
              cy={markerY}
              r={resolvedStroke * 0.45}
              fill="#FFFFFF"
            />
          </g>
        )}
      </svg>

      {/* Center content or default value label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
        {children ? (
          children
        ) : showValue ? (
          <>
            <span
              className="font-stat-label font-bold text-on-surface tracking-tight"
              style={{ fontSize: Math.max(10, Math.round(resolvedSize * 0.24)) }}
            >
              {valueLabel ?? `${clamped}%`}
            </span>
            {sublabel && (
              <span
                className="font-body-text text-on-surface-variant leading-none"
                style={{ fontSize: Math.max(8, Math.round(resolvedSize * 0.12)) }}
              >
                {sublabel}
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
