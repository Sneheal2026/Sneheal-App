import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatedRegion } from 'react-native-maps';
import {
  subscribeToAgentLocation,
  type AgentLocation,
} from '@/services/firebase';

export interface AgentTrackingState {
  coords: { latitude: number; longitude: number } | null;
  heading: number;
  phase: 'to_hub' | 'to_customer';
  /** True while agent is actively publishing location */
  isActive: boolean;
  /** True when we are still waiting for the first location ping */
  isWaiting: boolean;
  isStale: boolean;
  animatedCoord: AnimatedRegion;
}

const STALE_THRESHOLD = 30_000;
const INTERPOLATION_MS = 1200;

export function useAgentTracking(orderId: string): AgentTrackingState {
  const animatedCoord = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    }),
  ).current;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [phase, setPhase] = useState<'to_hub' | 'to_customer'>('to_hub');
  const [isActive, setIsActive] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const hasReceivedLocation = useRef(false);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetStaleTimer = useCallback((updatedAt: number) => {
    if (staleTimer.current) clearTimeout(staleTimer.current);

    const age = Date.now() - updatedAt;
    setIsStale(age > STALE_THRESHOLD);

    const remaining = Math.max(0, STALE_THRESHOLD - age);
    staleTimer.current = setTimeout(() => setIsStale(true), remaining);
  }, []);

  useEffect(() => {
    hasReceivedLocation.current = false;
    setCoords(null);
    setIsActive(false);
    setIsWaiting(true);
    setIsStale(false);

    if (__DEV__) {
      console.log('[Tracking] Subscribing to order:', orderId);
    }

    const unsubscribe = subscribeToAgentLocation(orderId, (location: AgentLocation | null) => {
      if (__DEV__) {
        console.log('[Tracking] Firebase update:', location);
      }

      // No data yet — agent hasn't started (or wrong orderId)
      if (!location) {
        if (hasReceivedLocation.current) {
          // Had location before, now cleared = delivered
          setIsActive(false);
          setIsWaiting(false);
        } else {
          setIsWaiting(true);
          setIsActive(false);
        }
        return;
      }

      const newCoords = { latitude: location.lat, longitude: location.lng };

      if (!hasReceivedLocation.current) {
        animatedCoord.setValue({
          ...newCoords,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        });
        hasReceivedLocation.current = true;
      } else {
        (animatedCoord as any)
          .timing({
            ...newCoords,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
            duration: INTERPOLATION_MS,
            useNativeDriver: false,
            toValue: 0,
          })
          .start();
      }

      setCoords(newCoords);
      setHeading(location.heading ?? 0);
      setPhase(location.phase ?? 'to_hub');
      setIsActive(true);
      setIsWaiting(false);
      resetStaleTimer(location.updatedAt ?? Date.now());
    });

    return () => {
      unsubscribe();
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [orderId, animatedCoord, resetStaleTimer]);

  return { coords, heading, phase, isActive, isWaiting, isStale, animatedCoord };
}
