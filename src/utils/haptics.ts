// Tactile mobile haptic vibration utility
// Provides multi-tiered physical feedback calibrated for gentle persistence.

export type HapticType =
  | 'light'
  | 'medium'
  | 'tick'
  | 'double'
  | 'ripple'
  | 'swipe'
  | 'note'
  | 'success'
  | 'milestone'
  | 'warning'
  | 'selection';

/**
 * Triggers safe, multi-tiered haptic vibration on mobile devices
 */
export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'tick':
      case 'selection':
        // Crisp 8ms micro-tick for tactile habit check-off or tab selection
        navigator.vibrate(8);
        break;

      case 'light':
        // Subtle 12ms pulse
        navigator.vibrate(12);
        break;

      case 'swipe':
        // 14ms notch snap when swipe gesture crosses actionable threshold
        navigator.vibrate(14);
        break;

      case 'note':
        // 16ms soft pulse when engaging quick reflection note
        navigator.vibrate(16);
        break;

      case 'medium':
        // 22ms pulse for unchecking or mode toggles
        navigator.vibrate(22);
        break;

      case 'double':
        // Satisfying double pulse for consecutive streaks
        navigator.vibrate([15, 30, 20]);
        break;

      case 'ripple':
      case 'success':
        // Harmonic ripple wave for 100% daily completion
        navigator.vibrate([12, 18, 16, 22, 24, 28, 40]);
        break;

      case 'milestone':
        // Celebratory multi-pulse for big milestone unlocks
        navigator.vibrate([30, 50, 30, 50, 40]);
        break;

      case 'warning':
        navigator.vibrate([40, 60, 40]);
        break;
    }
  } catch (err) {
    // Graceful fallback on devices where vibration is disabled or unpermitted
    console.debug('Haptics not supported or permitted', err);
  }
}
