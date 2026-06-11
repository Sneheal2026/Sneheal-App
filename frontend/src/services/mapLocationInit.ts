import * as Location from 'expo-location';
import { getDeliveryAddress } from '@/services/addressStorage';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const FALLBACK_REGION: MapRegion = {
  latitude: 17.385044,
  longitude: 78.486671,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export type MapInitSource = 'saved' | 'gps' | 'fallback';

export interface MapLocationInitResult {
  region: MapRegion;
  permissionDenied: boolean;
  source: MapInitSource;
}

export async function resolveInitialMapRegion(): Promise<MapLocationInitResult> {
  const saved = await getDeliveryAddress();
  if (saved) {
    return {
      region: {
        latitude: saved.latitude,
        longitude: saved.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      permissionDenied: false,
      source: 'saved',
    };
  }

  const { status: existing } = await Location.getForegroundPermissionsAsync();
  let granted = existing === 'granted';

  if (existing === 'undetermined') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    granted = status === 'granted';
  }

  if (!granted) {
    return {
      region: FALLBACK_REGION,
      permissionDenied: true,
      source: 'fallback',
    };
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      region: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      permissionDenied: false,
      source: 'gps',
    };
  } catch {
    return {
      region: FALLBACK_REGION,
      permissionDenied: false,
      source: 'fallback',
    };
  }
}
