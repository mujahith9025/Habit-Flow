import { useState, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseVimNavigationOptions {
  totalItems: number;
  onToggleItem: (index: number) => void | Promise<void>;
  isEnabled?: boolean;
}

export interface UseVimNavigationResult {
  focusedIndex: number | null;
  setFocusedIndex: (index: number | null) => void;
  isFocused: (index: number) => boolean;
}

/**
 * Vim (J/K) and Arrow Key Navigation Hook
 * 
 * - J / ArrowDown: Move selection to next habit
 * - K / ArrowUp: Move selection to previous habit
 * - Space / Enter: Toggle completion of focused habit
 * - 1–9 Keys: Instant toggle of top habits
 */
export function useVimNavigation({
  totalItems,
  onToggleItem,
  isEnabled = true,
}: UseVimNavigationOptions): UseVimNavigationResult {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const isFocused = useCallback(
    (index: number) => focusedIndex === index,
    [focusedIndex]
  );

  useEffect(() => {
    if (!isEnabled || totalItems === 0) {
      setFocusedIndex(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
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

      // Ignore if modifier keys (Cmd, Ctrl, Alt) are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key;

      // 1. Vim Down ('j') or ArrowDown
      if (key === 'j' || key === 'ArrowDown') {
        e.preventDefault();
        triggerHaptic('selection');
        setFocusedIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, totalItems - 1);
        });
        return;
      }

      // 2. Vim Up ('k') or ArrowUp
      if (key === 'k' || key === 'ArrowUp') {
        e.preventDefault();
        triggerHaptic('selection');
        setFocusedIndex((prev) => {
          if (prev === null) return 0;
          return Math.max(prev - 1, 0);
        });
        return;
      }

      // 3. Space or Enter: Toggle focused habit
      if ((key === ' ' || key === 'Enter') && focusedIndex !== null) {
        e.preventDefault();
        onToggleItem(focusedIndex);
        return;
      }

      // 4. Number keys 1-9: Instant toggle corresponding top habit
      if (/^[1-9]$/.test(key)) {
        const targetIdx = parseInt(key, 10) - 1;
        if (targetIdx < totalItems) {
          e.preventDefault();
          setFocusedIndex(targetIdx);
          onToggleItem(targetIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, totalItems, focusedIndex, onToggleItem]);

  return {
    focusedIndex,
    setFocusedIndex,
    isFocused,
  };
}
