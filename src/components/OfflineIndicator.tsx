import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <aside
      aria-label="Network status banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium flex items-center gap-2 max-w-[90vw] pointer-events-none"
      style={{
        backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
        borderColor: isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)',
        color: isOnline ? '#34d399' : '#f87171',
      }}
    >
      {isOnline ? (
        <>
          <Wifi size={14} className="shrink-0" />
          <span>Back online. All changes synchronized.</span>
        </>
      ) : (
        <>
          <WifiOff size={14} className="shrink-0" />
          <span>Working offline. Local changes saved securely.</span>
        </>
      )}
    </aside>
  );
};
