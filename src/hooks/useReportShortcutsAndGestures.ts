import { useEffect, useRef } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseReportShortcutsOptions {
  onNextHabit?: () => void;
  onPrevHabit?: () => void;
  onOpenMonthPicker?: () => void;
  onExportPDF?: () => void;
  onToggleShortcutsModal?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useReportShortcutsAndGestures({
  onNextHabit,
  onPrevHabit,
  onOpenMonthPicker,
  onExportPDF,
  onToggleShortcutsModal,
  onSwipeLeft,
  onSwipeRight,
  containerRef,
  enabled = true,
}: UseReportShortcutsOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // 1. Desktop Hotkeys
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (e.key) {
        case '[':
          e.preventDefault();
          triggerHaptic('selection');
          onPrevHabit?.();
          break;

        case ']':
          e.preventDefault();
          triggerHaptic('selection');
          onNextHabit?.();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          triggerHaptic('selection');
          onOpenMonthPicker?.();
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          triggerHaptic('selection');
          onExportPDF?.();
          break;

        case '?':
          e.preventDefault();
          triggerHaptic('selection');
          onToggleShortcutsModal?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onNextHabit,
    onPrevHabit,
    onOpenMonthPicker,
    onExportPDF,
    onToggleShortcutsModal,
  ]);

  // 2. Mobile Touch Swipe Navigation
  useEffect(() => {
    if (!enabled) return;
    const targetElement = containerRef?.current || document;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartRef.current.x;
      const deltaY = touchEndY - touchStartRef.current.y;
      const elapsedTime = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      // Ensure horizontal swipe intent (min 60px horizontal, max 45px vertical, within 600ms)
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 45 && elapsedTime < 600) {
        if (deltaX < 0) {
          // Swiped Left -> advance to next month/period
          triggerHaptic('swipe');
          onSwipeLeft?.();
        } else {
          // Swiped Right -> return to previous month/period
          triggerHaptic('swipe');
          onSwipeRight?.();
        }
      }
    };

    targetElement.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: true,
    });
    targetElement.addEventListener('touchend', handleTouchEnd as EventListener, {
      passive: true,
    });

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart as EventListener);
      targetElement.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [enabled, onSwipeLeft, onSwipeRight, containerRef]);
}
