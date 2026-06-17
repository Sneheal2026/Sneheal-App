import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'loading';

interface GetCurrentLocationOptions {
  timeoutMs?: number;
  accuracy?: Location.LocationAccuracy;
  maxLastKnownAgeMs?: number;
  maxLastKnownAccuracyM?: number;
}

interface UseLocationPermissionResult {
  status: PermissionStatus;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: (options?: GetCurrentLocationOptions) => Promise<Location.LocationObject | null>;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const statusRef = useRef<PermissionStatus>('undetermined');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        setStatus('granted');
      } else if (existingStatus === 'denied') {
        setStatus('denied');
      } else {
        setStatus('undetermined');
      }
    })();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setStatus('loading');
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

      if (newStatus === 'granted') {
        setStatus('granted');
        return true;
      }

      setStatus('denied');
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setStatus('denied');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (options?: GetCurrentLocationOptions): Promise<Location.LocationObject | null> => {
    const timeoutMs = options?.timeoutMs ?? 6000;
    const accuracy = options?.accuracy ?? Location.Accuracy.Balanced;
    const maxLastKnownAgeMs = options?.maxLastKnownAgeMs ?? 3 * 60 * 1000;
    const maxLastKnownAccuracyM = options?.maxLastKnownAccuracyM ?? 120;

    const isAcceptableLastKnown = (position: Location.LocationObject | null): position is Location.LocationObject => {
      if (!position) return false;
      const accuracyValue = position.coords.accuracy ?? Number.POSITIVE_INFINITY;
      const ageMs = Date.now() - position.timestamp;
      return accuracyValue <= maxLastKnownAccuracyM && ageMs <= maxLastKnownAgeMs;
    };

    try {
      if (statusRef.current !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: maxLastKnownAgeMs,
        requiredAccuracy: maxLastKnownAccuracyM,
      });

      if (isAcceptableLastKnown(lastKnown)) {
        return lastKnown;
      }

      const currentPosition = await Promise.race<Location.LocationObject | null>([
        Location.getCurrentPositionAsync({
          accuracy,
          mayShowUserSettingsDialog: true,
        }),
        new Promise<Location.LocationObject | null>((resolve) =>
          setTimeout(() => resolve(null), timeoutMs),
        ),
      ]);

      if (currentPosition) {
        return currentPosition;
      }

      return lastKnown ?? null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }, [requestPermission]);

  return {
    status,
    requestPermission,
    getCurrentLocation,
  };
}
