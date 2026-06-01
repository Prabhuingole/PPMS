'use client';

import { useEffect, useRef } from 'react';

export default function WebSocketProvider() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    const connect = () => {
      if (unmountedRef.current) return;

      try {
        const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          .replace(/^http/, 'ws');

        const ws = new WebSocket(`${wsUrl}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          retryCountRef.current = 0; // reset backoff on successful connection
          console.log('[WebSocket] Connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent('WS_UPDATE', {
              detail: { event: data.event }
            }));
          } catch {
            // silently ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (unmountedRef.current) return;
          // Exponential backoff: 2s, 4s, 8s ... capped at 30s
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        ws.onerror = () => {
          // onerror is always followed by onclose, which handles reconnection.
          // We close silently here; no console.error to avoid noisy logs when
          // the backend is temporarily unavailable.
          ws.close();
        };
      } catch {
        // WebSocket constructor can throw if the URL is malformed
      }
    };

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return null;
}
