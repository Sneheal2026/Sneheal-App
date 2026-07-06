import Constants from 'expo-constants';

/**
 * Google Maps key for Directions + Geocoding REST calls.
 * Falls back to app.config extra when EXPO_PUBLIC_* is not inlined (e.g. missing .env).
 */
export const GOOGLE_MAPS_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ??
  (Constants.expoConfig?.extra?.googleMapsApiKey as string | undefined) ??
  '';
