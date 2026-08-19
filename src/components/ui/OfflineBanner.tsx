import React, { useState, useEffect } from 'react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="bg-tertiary text-on-tertiary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-fadeIn sticky top-0 z-50 select-none"
    >
      <span className="material-symbols-outlined text-[16px] animate-pulse">cloud_off</span>
      <span>
        Working Offline — Check-ins are saved in IndexedDB and will sync automatically when reconnected.
      </span>
    </aside>
  );
};
