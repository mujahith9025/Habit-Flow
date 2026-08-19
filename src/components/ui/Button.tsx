import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-habit-name transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-full';

    const variants = {
      primary:
        'bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant hover:shadow-glow-primary',
      secondary:
        'bg-secondary text-on-secondary shadow-soft hover:bg-on-secondary-fixed-variant hover:shadow-glow-secondary',
      outline:
        'border border-outline-variant text-on-surface bg-transparent hover:bg-surface-container-low dark:hover:bg-surface-container-high',
      ghost:
        'text-on-surface bg-transparent hover:bg-surface-container-low dark:hover:bg-surface-container-high',
      danger:
        'bg-error text-on-error hover:bg-on-error-container',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            className
          )
        )}
        {...props}
      >
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
