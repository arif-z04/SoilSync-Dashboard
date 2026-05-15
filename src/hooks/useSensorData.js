'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSensorData() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);

  const mergeLatestHistory = (nextItem) => {
    if (!nextItem) return;

    setHistory((current) => {
      const key = `${nextItem.timestamp ?? ''}-${nextItem.soilRaw ?? ''}-${nextItem.batteryVoltage ?? ''}-${nextItem.solarVoltage ?? ''}`;
      const deduped = (current || []).filter((item) => {
        const itemKey = `${item?.timestamp ?? ''}-${item?.soilRaw ?? ''}-${item?.batteryVoltage ?? ''}-${item?.solarVoltage ?? ''}`;
        return itemKey !== key;
      });

      return [nextItem, ...deduped].slice(0, 1000);
    });
  };

  const resetLocalState = () => {
    setData(null);
    setHistory([]);
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([fetch('/api/latest'), fetch('/api/history')])
      .then(async ([latestResponse, historyResponse]) => {
        const latestData = latestResponse.ok
          ? await latestResponse.json()
          : null;
        const historyData = historyResponse.ok
          ? await historyResponse.json()
          : [];

        if (!mounted) return;

        if (latestData) {
          setData(latestData);
        }

        if (Array.isArray(historyData)) {
          setHistory(historyData.slice(0, 1000));
        } else if (latestData) {
          setHistory([latestData]);
        }
      })
      .catch((e) => {
        console.warn('Initial fetch failed', e);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // connect to socket server
    let latestInterval;
    let historyInterval;
    try {
      const SOCKET_URL =
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      socket.on('status', (s) => {
        if (s && s.connected === false) setConnected(false);
        if (s && s.connected === true) setConnected(true);
        if (s && s.error) setError(s.error);
      });

      socket.on('data', (packet) => {
        if (!mounted || !packet) return;

        setData(packet);
        mergeLatestHistory(packet);
      });

      // Poll latest every 5s and history every 10s
      latestInterval = setInterval(async () => {
        try {
          const resp = await fetch('/api/latest');
          if (!resp.ok) return;
          const latest = await resp.json();
          if (!mounted) return;
          setData(latest);
        } catch (e) {
          console.warn('Latest poll failed', e);
        }
      }, 5000);

      historyInterval = setInterval(async () => {
        try {
          const resp = await fetch('/api/history');
          if (!resp.ok) return;
          const hist = await resp.json();
          if (!mounted) return;
          if (Array.isArray(hist)) setHistory(hist.slice(0, 1000));
        } catch (e) {
          console.warn('History poll failed', e);
        }
      }, 10000);

      socket.on('connect_error', (err) => {
        console.warn('Socket connect error', err.message);
        setError(err.message);
      });
    } catch (e) {
      console.warn('Socket init failed', e.message);
      queueMicrotask(() => setError(e.message));
    }

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
      if (latestInterval) clearInterval(latestInterval);
      if (historyInterval) clearInterval(historyInterval);
    };
  }, []);

  return { data, history, loading, error, connected, resetLocalState };
}
