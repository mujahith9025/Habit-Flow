import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const baseClasses =
    'animate-pulse bg-surface-container-high dark:bg-surface-container-highest/50';

  const variantClasses = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6 animate-fadeIn">
      {/* Top Date Navigator Skeleton */}
      <div className="flex justify-center">
        <Skeleton className="w-64 h-10 rounded-full" />
      </div>

      {/* Top Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <Skeleton className="lg:col-span-5 h-56 rounded-2xl" />
        <Skeleton className="lg:col-span-7 h-56 rounded-2xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex justify-center">
        <Skeleton className="w-72 h-10 rounded-full" />
      </div>

      {/* Grid Table Skeleton */}
      <div className="space-y-3">
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    </div>
  );
};
