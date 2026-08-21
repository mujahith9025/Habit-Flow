import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

const DOUBLE_BACK_THRESHOLD_MS = 2000;

export function useBackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTimeRef = useRef<number>(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMainScreen = location.pathname === '/dashboard' || location.pathname === '/';

  // Track app navigation history depth in current session
  const hasInternalNavRef = useRef(false);

  useEffect(() => {
    if (!isMainScreen) {
      hasInternalNavRef.current = true;
    }
  }, [location.pathname, isMainScreen]);

  useEffect(() => {
    // Only arm the double-back exit guard when on the main dashboard screen
    if (!isMainScreen) {
      setShowExitToast(false);
      return;
    }

    // Push a guard state so that pressing Back triggers popstate on dashboard
    window.history.pushState({ isDashboardGuard: true }, '', location.pathname);

    const handlePopState = () => {
      const now = Date.now();
      const timeSinceLastPress = now - lastBackPressTimeRef.current;

      if (timeSinceLastPress < DOUBLE_BACK_THRESHOLD_MS) {
        // User pressed back again within 2 seconds -> Allow exit / close app
        setShowExitToast(false);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        // Let the browser pop state naturally
        window.history.back();
      } else {
        // First back press on dashboard: Intercept and warn
        lastBackPressTimeRef.current = now;

        // Re-arm guard state so next back can be caught
        window.history.pushState({ isDashboardGuard: true }, '', location.pathname);

        // Show "Press back again to exit" toast & play light haptic
        setShowExitToast(true);
        triggerHaptic('light');

        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
          setShowExitToast(false);
          lastBackPressTimeRef.current = 0;
        }, DOUBLE_BACK_THRESHOLD_MS);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [isMainScreen, location.pathname]);

  // Handle back from sub-screens if launched directly or if history is shallow
  useEffect(() => {
    if (isMainScreen) return;

    const handleSubScreenPopState = () => {
      // If user presses back from a sub-screen and there's no state, bring them to /dashboard
      if (!window.history.state) {
        navigate('/dashboard', { replace: true });
      }
    };

    window.addEventListener('popstate', handleSubScreenPopState);
    return () => {
      window.removeEventListener('popstate', handleSubScreenPopState);
    };
  }, [isMainScreen, navigate]);

  return {
    showExitToast,
  };
}
