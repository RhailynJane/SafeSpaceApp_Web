'use client';
import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function PresencePinger() {
  const timerRef = useRef(null);
  const heartbeat = useMutation(api.presence.heartbeat);

  const ping = async () => {
    try {
      await heartbeat({ status: 'online' });
    } catch (err) {
      // Silently ignore auth errors (e.g., not logged in)
    }
  };

  useEffect(() => {
    ping();

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    const onFocus = () => ping();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    timerRef.current = window.setInterval(ping, 3 * 60 * 1000); // every 3 minutes

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return null;
}
