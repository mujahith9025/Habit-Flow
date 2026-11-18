import React, { useEffect, useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../../utils/haptics';

export interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-lg', 'max-w-xl'
  maxHeight?: string; // e.g. 'max-h-[90vh]'
  showDragHandle?: boolean;
  headerRight?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  maxHeight = 'max-h-[92vh]',
  showDragHandle = true,
  headerRight,
  className = '',
  bodyClassName = '',
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const startTimeRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasTriggeredSnapRef = useRef(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Reset drag on open/close
  useEffect(() => {
    if (!isOpen) {
      setDragY(0);
      setIsDragging(false);
      hasTriggeredSnapRef.current = false;
    }
  }, [isOpen]);

  // Touch handlers for swipe-down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only engage drag if content is scrolled to top
    if (contentRef.current && contentRef.current.scrollTop > 5) {
      return;
    }
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
    hasTriggeredSnapRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;

    // If dragged downward (positive deltaY)
    if (deltaY > 0) {
      // Smooth resistance curve
      const resistanceY = Math.pow(deltaY, 0.9);
      setDragY(resistanceY);
      currentYRef.current = touch.clientY;

      // Haptic tick when passing the dismiss notch
      if (resistanceY > 75 && !hasTriggeredSnapRef.current) {
        hasTriggeredSnapRef.current = true;
        triggerHaptic('swipe');
      } else if (resistanceY <= 75) {
        hasTriggeredSnapRef.current = false;
      }
    } else {
      // Upward drag: slight rubber band
      setDragY(deltaY * 0.15);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const distance = currentYRef.current - startYRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = distance / Math.max(1, duration);

    // Dismiss if dragged down > 80px or fast downward flick (velocity > 0.45)
    if (dragY > 80 || (velocity > 0.45 && distance > 30)) {
      triggerHaptic('light');
      onClose();
    } else {
      // Spring back to 0
      setDragY(0);
    }
  }, [isDragging, dragY, onClose]);

  if (!isOpen) return null;

  // Dim backdrop opacity proportionally to drag
  const backdropOpacity = Math.max(0.2, 1 - dragY / 300);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        style={{ opacity: backdropOpacity }}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal Container */}
      <div
        style={{
          transform: dragY !== 0 ? `translateY(${Math.max(0, dragY)}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative w-full ${maxWidth} ${maxHeight} bg-surface-container-lowest dark:bg-surface-container oled:!bg-[#0B0C0E] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-outline-variant/20 oled:border-outline-variant/10 flex flex-col z-10 transition-colors ${className}`}
      >
        {/* Mobile Swipe Drag Handle Header Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1 px-6 flex flex-col items-center select-none cursor-grab active:cursor-grabbing sm:cursor-default"
        >
          {showDragHandle && (
            <div className="sm:hidden w-12 h-1.5 bg-outline-variant/40 dark:bg-outline-variant/50 rounded-full mb-2 active:bg-primary transition-colors" />
          )}

          {/* Modal Header */}
          {(title || headerRight) && (
            <div className="w-full flex items-center justify-between pb-3 pt-1 border-b border-outline-variant/15">
              <div className="min-w-0 flex-1 pr-3">
                {typeof title === 'string' ? (
                  <h2 className="font-section-header text-lg sm:text-xl font-bold text-on-surface truncate">
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="font-body-text text-xs text-on-surface-variant mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 overflow-y-auto px-5 sm:px-6 py-4 scrollbar-thin pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
