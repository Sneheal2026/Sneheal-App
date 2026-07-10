import { Alert, Linking, Platform } from 'react-native';
import {
  ensureLocationPermission,
  getCurrentCoordinates,
} from '@/services/locationService';

const HOSPITALS_QUERY = 'hospitals';

function buildWebSearchUrl(lat?: number, lng?: number): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/${encodeURIComponent(HOSPITALS_QUERY)}/@${lat},${lng},14z`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${HOSPITALS_QUERY} near me`)}`;
}

function buildNativeSearchUrl(lat?: number, lng?: number): string | null {
  if (Platform.OS === 'ios') {
    if (lat != null && lng != null) {
      return `comgooglemaps://?q=${encodeURIComponent(HOSPITALS_QUERY)}&center=${lat},${lng}&zoom=14`;
    }
    return `comgooglemaps://?q=${encodeURIComponent(HOSPITALS_QUERY)}`;
  }

  if (Platform.OS === 'android') {
    if (lat != null && lng != null) {
      return `geo:${lat},${lng}?q=${encodeURIComponent(HOSPITALS_QUERY)}`;
    }
    return `geo:0,0?q=${encodeURIComponent(HOSPITALS_QUERY)}`;
  }

  return null;
}

/**
 * Opens Google Maps with a hospitals search near the user.
 * Uses device location when permitted; falls back to a "near me" web search.
 * Works on iOS and Android (native Maps app when available, otherwise browser).
 */
export async function openNearestHospitalsInMaps(): Promise<void> {
  let lat: number | undefined;
  let lng: number | undefined;

  try {
    const granted = await ensureLocationPermission();
    if (granted) {
      const coords = await getCurrentCoordinates();
      lat = coords.latitude;
      lng = coords.longitude;
    }
  } catch {
    // Continue without coords — Maps still opens with a near-me search.
  }

  const webUrl = buildWebSearchUrl(lat, lng);
  const nativeUrl = buildNativeSearchUrl(lat, lng);

  try {
    if (nativeUrl) {
      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      if (canOpenNative) {
        await Linking.openURL(nativeUrl);
        return;
      }
    }

    await Linking.openURL(webUrl);
  } catch {
    Alert.alert(
      'Unable to open maps',
      'Please install Google Maps or try again.',
    );
  }
}
