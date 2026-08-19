import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'streak';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-stat-label tracking-wide uppercase rounded-full transition-colors';

  const variants = {
    primary:
      'bg-primary-fixed text-on-primary-fixed border border-primary/20',
    secondary:
      'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20',
    tertiary:
      'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20',
    streak:
      'bg-primary-fixed/40 text-primary dark:text-primary-fixed border border-primary/20 font-bold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </span>
  );
};
