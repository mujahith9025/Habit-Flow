import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-slideUp pointer-events-none"
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 pointer-events-auto">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Offline Mode — Changes are queued and will sync automatically</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/90 text-emerald-100 text-xs font-semibold backdrop-blur-md shadow-lg border border-emerald-400/20 pointer-events-auto animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back online — Changes synchronized with Cloud</span>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncBanner;
