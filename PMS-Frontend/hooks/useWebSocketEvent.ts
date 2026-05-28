'use client';

import { useEffect } from 'react';

export function useWebSocketEvent(targetEvent: string | string[], callback: () => void) {
  useEffect(() => {
    const handleEvent = (e: CustomEvent) => {
      const events = Array.isArray(targetEvent) ? targetEvent : [targetEvent];
      if (events.includes(e.detail?.event)) {
        callback();
      }
    };
    
    // @ts-ignore
    window.addEventListener('WS_UPDATE', handleEvent);
    // @ts-ignore
    return () => window.removeEventListener('WS_UPDATE', handleEvent);
  }, [targetEvent, callback]);
}
