import * as Location from 'expo-location';
import type { Coordinates, LiveLocation } from '@/types/location.types';
import { GOOGLE_MAPS_KEY } from '@/constants/googleMaps';

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  if (__DEV__) {
    console.log('[Sneheal:Location] Detected coordinates:', coords);
  }

  return coords;
}

// ── Google Geocoding API (consistent on Android + iOS) ──────────

export async function reverseGeocodeGoogle(
  coords: Coordinates,
): Promise<string> {
  if (!GOOGLE_MAPS_KEY) {
    console.warn('[Sneheal:Location] Google Maps API key is not set');
    return fallbackReverseGeocode(coords);
  }

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${coords.latitude},${coords.longitude}` +
    `&key=${GOOGLE_MAPS_KEY}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (json.status === 'OK' && json.results?.length) {
      return json.results[0].formatted_address as string;
    }

    console.warn('[Sneheal:Location] Geocode response:', json.status, json.error_message);
    return fallbackReverseGeocode(coords);
  } catch (e) {
    console.warn('[Sneheal:Location] Geocode fetch failed:', e);
    return fallbackReverseGeocode(coords);
  }
}

async function fallbackReverseGeocode(coords: Coordinates): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    return formatAddress(results);
  } catch {
    return 'Unknown location';
  }
}

// ── Expo-based geocoding (fallback / initial load) ──────────────

function isPlusCode(value: string): boolean {
  return /^[2-9A-Z]{4,}\+[2-9A-Z]{2,}$/i.test(value.trim());
}

function uniqueParts(parts: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed || isPlusCode(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function formatAddress(results: Location.LocationGeocodedAddress[]): string {
  const [place] = results;
  if (!place) return 'Current location';

  const streetLine = [place.streetNumber, place.street].filter(Boolean).join(' ').trim();
  const name = place.name?.trim();
  const useName = name && !isPlusCode(name) && name !== streetLine;

  const parts = uniqueParts([
    useName ? name : null,
    streetLine || null,
    place.district,
    place.subregion,
    place.city,
    place.region,
    place.postalCode,
  ]);

  return parts.join(', ') || 'Current location';
}

export async function fetchLiveLocation(): Promise<LiveLocation> {
  const granted = await ensureLocationPermission();
  if (!granted) {
    throw new Error('Location permission denied');
  }

  const coords = await getCurrentCoordinates();

  const addressLine = GOOGLE_MAPS_KEY
    ? await reverseGeocodeGoogle(coords)
    : formatAddress(await Location.reverseGeocodeAsync(coords));

  return {
    coords,
    addressLine,
    shortLabel: 'Current',
  };
}
