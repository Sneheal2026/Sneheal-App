import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'loading';

interface UseLocationPermissionResult {
  status: PermissionStatus;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Location.LocationObject | null>;
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

  const getCurrentLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
    try {
      if (statusRef.current !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
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
