import { useCallback, useEffect, useState } from 'react';
import { fetchLiveLocation } from '@/services/locationService';
import type { LiveLocation, LocationStatus } from '@/types/location.types';

export function useLiveLocation(autoFetch = false) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchLiveLocation();
      setLocation(result);
      setStatus('success');
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to get location';
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      void refresh();
    }
  }, [autoFetch, refresh]);

  return { status, location, error, refresh };
}
