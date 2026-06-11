import { useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '@/types/address';

export interface GeocodedAddress {
  areaName: string;
  locality: string;
  formattedAddress: string;
  postalCode?: string;
}

const DEBOUNCE_MS = 400;
const COORD_THRESHOLD = 0.00015;

function uniqueParts(parts: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    if (!part?.trim()) return false;
    const key = part.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseResult(coords: Coordinates, result: Location.LocationGeocodedAddress): GeocodedAddress {
  const areaName =
    result.name ||
    result.street ||
    result.subregion ||
    result.district ||
    result.city ||
    'Selected area';

  const locality = result.district || result.city || result.region || '';

  const formattedAddress = uniqueParts([
    result.name,
    result.street,
    result.subregion,
    result.district,
    result.city,
    result.region,
    result.postalCode,
    result.country,
  ]).join(', ') || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

  return {
    areaName,
    locality,
    formattedAddress,
    postalCode: result.postalCode || undefined,
  };
}

function coordCacheKey(coords: Coordinates): string {
  return `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
}

function isSameCoords(a: Coordinates, b: Coordinates): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < COORD_THRESHOLD &&
    Math.abs(a.longitude - b.longitude) < COORD_THRESHOLD
  );
}

export async function reverseGeocodeCoordinates(coords: Coordinates): Promise<GeocodedAddress> {
  const results = await Location.reverseGeocodeAsync(coords);
  if (results.length > 0) {
    return parseResult(coords, results[0]);
  }
  return {
    areaName: 'Selected area',
    locality: '',
    formattedAddress: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
  };
}

export function useReverseGeocode() {
  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetched = useRef<Coordinates | null>(null);
  const requestId = useRef(0);
  const cacheRef = useRef(new Map<string, GeocodedAddress>());

  const runGeocode = useCallback(async (coords: Coordinates) => {
    const cacheKey = coordCacheKey(coords);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      lastFetched.current = coords;
      setAddress(cached);
      setIsGeocoding(false);
      return;
    }

    const id = ++requestId.current;
    setIsGeocoding(true);

    try {
      const parsed = await reverseGeocodeCoordinates(coords);
      if (id !== requestId.current) return;

      cacheRef.current.set(cacheKey, parsed);
      lastFetched.current = coords;
      setAddress(parsed);
    } catch {
      if (id !== requestId.current) return;
      setAddress({
        areaName: 'Selected area',
        locality: '',
        formattedAddress: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      });
    } finally {
      if (id === requestId.current) {
        setIsGeocoding(false);
      }
    }
  }, []);

  const reverseGeocode = useCallback(
    (coords: Coordinates, options?: { immediate?: boolean }) => {
      const last = lastFetched.current;
      if (last && isSameCoords(coords, last) && !options?.immediate) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (options?.immediate) {
        void runGeocode(coords);
        return;
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void runGeocode(coords);
      }, DEBOUNCE_MS);
    },
    [runGeocode],
  );

  const resetGeocodeCache = useCallback(() => {
    lastFetched.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { address, isGeocoding, reverseGeocode, resetGeocodeCache };
}
