/**
 * Screen Reader Accessibility (a11y) Announcer Engine
 * 
 * Delivers polite, clear vocal announcements to assistive technologies
 * (NVDA, VoiceOver, JAWS, TalkBack) when habits are checked off,
 * streaks update, themes switch, or actions complete.
 */

type Listener = (message: string, priority: 'polite' | 'assertive') => void;

const listeners: Set<Listener> = new Set();

/**
 * Announces a message to screen readers via ARIA live regions
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!message) return;
  listeners.forEach((listener) => {
    try {
      listener(message, priority);
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Subscribes to live announcements (used by AriaLiveAnnouncer component)
 */
export function subscribeToAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
