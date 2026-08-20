// Tactile mobile haptic vibration utility

export type HapticType = 'light' | 'medium' | 'success' | 'milestone' | 'warning';

/**
 * Triggers safe haptic vibration on mobile devices
 */
export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        // Crisp 12ms pulse for normal habit check-in
        navigator.vibrate(12);
        break;
      case 'medium':
        // 20ms pulse for unchecking or mode toggles
        navigator.vibrate(20);
        break;
      case 'success':
        // Satisfying double pulse for 100% daily completion
        navigator.vibrate([20, 40, 30]);
        break;
      case 'milestone':
        // Triple celebratory pulse for streaks / milestone achievements
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
