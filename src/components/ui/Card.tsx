import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'surface' | 'glass';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', interactive = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl p-md transition-all duration-200';

    const variants = {
      elevated:
        'bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 shadow-soft dark:shadow-custom-shadow-dark',
      surface:
        'bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/20',
      glass:
        'glass-panel dark:glass-panel-dark border border-white/40 dark:border-white/10 shadow-soft',
    };

    const interactiveStyles =
      interactive &&
      'cursor-pointer hover:shadow-soft-lg hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0';

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], interactiveStyles, className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
