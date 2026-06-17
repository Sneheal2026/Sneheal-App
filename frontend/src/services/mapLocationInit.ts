import * as Location from 'expo-location';
import { getDeliveryAddress } from '@/services/addressStorage';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Smaller delta = tighter zoom. ~0.002 ≈ close street-level for delivery pin placement. */
export const MAP_ZOOM_DELTA = 0.0007;

export const FALLBACK_REGION: MapRegion = {
  latitude: 17.385044,
  longitude: 78.486671,
  latitudeDelta: MAP_ZOOM_DELTA,
  longitudeDelta: MAP_ZOOM_DELTA,
};

export type MapInitSource = 'saved' | 'gps' | 'fallback';

export interface MapLocationInitResult {
  region: MapRegion;
  source: MapInitSource;
  permissionDenied: boolean;
}

const STARTUP_GPS_TIMEOUT_MS = 5000;
const STARTUP_LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const STARTUP_LAST_KNOWN_MAX_ACCURACY_M = 120;

export function buildRegion(latitude: number, longitude: number): MapRegion {
  return {
    latitude,
    longitude,
    latitudeDelta: MAP_ZOOM_DELTA,
    longitudeDelta: MAP_ZOOM_DELTA,
  };
}

function isUsablePosition(position: Location.LocationObject | null): position is Location.LocationObject {
  if (!position) return false;
  const accuracy = position.coords.accuracy ?? Number.POSITIVE_INFINITY;
  const ageMs = Date.now() - position.timestamp;
  return accuracy <= STARTUP_LAST_KNOWN_MAX_ACCURACY_M && ageMs <= STARTUP_LAST_KNOWN_MAX_AGE_MS;
}

async function ensureLocationPermission(): Promise<boolean> {
  const { status: existing } = await Location.getForegroundPermissionsAsync();
  if (existing === 'granted') return true;
  if (existing === 'denied') return false;

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

async function resolveLivePosition(): Promise<{
  position: Location.LocationObject | null;
  permissionDenied: boolean;
}> {
  const granted = await ensureLocationPermission();
  if (!granted) {
    return { position: null, permissionDenied: true };
  }

  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: STARTUP_LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: STARTUP_LAST_KNOWN_MAX_ACCURACY_M,
    });

    if (isUsablePosition(lastKnown)) {
      return { position: lastKnown, permissionDenied: false };
    }

    const currentPosition = await Promise.race<Location.LocationObject | null>([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      }),
      new Promise<Location.LocationObject | null>((resolve) =>
        setTimeout(() => resolve(null), STARTUP_GPS_TIMEOUT_MS),
      ),
    ]);

    if (currentPosition) {
      return { position: currentPosition, permissionDenied: false };
    }

    return { position: lastKnown, permissionDenied: false };
  } catch {
    return { position: null, permissionDenied: false };
  }
}

/**
 * Resolves the map's first region before the map is shown.
 * Saved address → use it. Otherwise wait for a real GPS fix so the map
 * does not flash a default city and then jump to the user.
 */
export async function resolveInitialMapRegion(): Promise<MapLocationInitResult> {
  const saved = await getDeliveryAddress();
  if (saved) {
    return {
      region: buildRegion(saved.latitude, saved.longitude),
      source: 'saved',
      permissionDenied: false,
    };
  }

  const { position, permissionDenied } = await resolveLivePosition();
  if (position) {
    return {
      region: buildRegion(position.coords.latitude, position.coords.longitude),
      source: 'gps',
      permissionDenied: false,
    };
  }

  return {
    region: FALLBACK_REGION,
    source: 'fallback',
    permissionDenied,
  };
}
