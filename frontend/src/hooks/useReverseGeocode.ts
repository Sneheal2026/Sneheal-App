import { useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '@/types/address';
import { sanitizeAddressPart } from '@/utils/addressFormatting';

export interface GeocodedAddress {
  areaName: string;
  locality: string;
  formattedAddress: string;
  postalCode?: string;
}

const DEBOUNCE_MS = 500;
const COORD_THRESHOLD = 0.00035;
const REQUEST_INTERVAL_MS = 700;
const CACHE_PRECISION = 4;

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

function buildLocationFallback(result: Location.LocationGeocodedAddress): string {
  const parts = uniqueParts([
    result.subregion,
    result.district,
    result.city,
    result.region,
    result.country,
  ]);

  return parts.join(', ') || 'Current location';
}

function scoreResult(result: Location.LocationGeocodedAddress): number {
  let score = 0;
  if (result.street) score += 4;
  if (result.name) score += 3;
  if (result.subregion) score += 3;
  if (result.district) score += 2;
  if (result.city) score += 2;
  if (result.region) score += 1;
  if (result.postalCode) score += 2;
  return score;
}

function pickBestResult(results: Location.LocationGeocodedAddress[]): Location.LocationGeocodedAddress {
  return [...results].sort((a, b) => scoreResult(b) - scoreResult(a))[0];
}

function parseResult(result: Location.LocationGeocodedAddress): GeocodedAddress {
  const areaName =
    sanitizeAddressPart(result.street) ||
    sanitizeAddressPart(result.subregion) ||
    sanitizeAddressPart(result.district) ||
    sanitizeAddressPart(result.city) ||
    sanitizeAddressPart(result.name) ||
    'Current location';

  const locality = result.district || result.city || result.region || '';

  const formattedAddress = uniqueParts([
    sanitizeAddressPart(result.street),
    sanitizeAddressPart(result.subregion),
    sanitizeAddressPart(result.district),
    sanitizeAddressPart(result.city),
    sanitizeAddressPart(result.region),
    sanitizeAddressPart(result.name),
    result.postalCode,
    result.country,
  ]).join(', ') || buildLocationFallback(result);

  return {
    areaName,
    locality,
    formattedAddress,
    postalCode: result.postalCode || undefined,
  };
}

function coordCacheKey(coords: Coordinates): string {
  return `${coords.latitude.toFixed(CACHE_PRECISION)},${coords.longitude.toFixed(CACHE_PRECISION)}`;
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
    return parseResult(pickBestResult(results));
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
  const lastRequestedAt = useRef(0);
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

  const queueGeocode = useCallback(
    (coords: Coordinates, options?: { immediate?: boolean }) => {
      const now = Date.now();
      const elapsed = now - lastRequestedAt.current;
      const waitForRateLimit = elapsed < REQUEST_INTERVAL_MS ? REQUEST_INTERVAL_MS - elapsed : 0;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const execute = () => {
        timerRef.current = null;
        lastRequestedAt.current = Date.now();
        void runGeocode(coords);
      };

      if (options?.immediate) {
        if (waitForRateLimit > 0) {
          timerRef.current = setTimeout(execute, waitForRateLimit);
          return;
        }
        execute();
        return;
      }

      timerRef.current = setTimeout(execute, DEBOUNCE_MS + waitForRateLimit);
    },
    [runGeocode],
  );

  const reverseGeocode = useCallback(
    (coords: Coordinates, options?: { immediate?: boolean }) => {
      const last = lastFetched.current;
      if (last && isSameCoords(coords, last) && !options?.immediate) {
        return;
      }
      queueGeocode(coords, options);
    },
    [queueGeocode],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { address, isGeocoding, reverseGeocode };
}
