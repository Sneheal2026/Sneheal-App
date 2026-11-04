import { Linking, Platform } from 'react-native';

type Coords = { latitude: number; longitude: number };

const MAPS_PACKAGE_ANDROID = 'com.google.android.apps.maps';

export const isValidMapCoord = (coords?: Coords | null): coords is Coords => {
  if (!coords) return false;
  const { latitude, longitude } = coords;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
};

/** Cross-platform URL — opens Google Maps app when installed; starts turn-by-turn when GPS is available. */
const buildUniversalNavigateUrl = (destinationParam: string): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=driving&dir_action=navigate`;

/** Android-only: launches turn-by-turn navigation from current location. */
const buildAndroidTurnByTurnUrl = (query: string): string =>
  `google.navigation:q=${query}&mode=d`;

const buildIosNativeDirectionsUrl = (daddr: string): string =>
  `comgooglemaps://?daddr=${daddr}&directionsmode=driving`;

type DestinationParts = {
  coordQuery: string | null;
  httpsParam: string | null;
};

const resolveDestination = (
  coords?: Coords | null,
  address?: string,
): DestinationParts | null => {
  if (isValidMapCoord(coords)) {
    const pair = `${coords.latitude},${coords.longitude}`;
    return { coordQuery: pair, httpsParam: pair };
  }
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return {
    coordQuery: encodeURIComponent(trimmed),
    httpsParam: encodeURIComponent(trimmed),
  };
};

const tryOpen = async (url: string): Promise<boolean> => {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Opens Google Maps with live driving navigation when possible.
 * - Android: `google.navigation:` intent (turn-by-turn), then universal URL.
 * - iOS: Universal Maps URL with `dir_action=navigate`, then `comgooglemaps://`.
 */
export const openGoogleMapsNavigation = async (options: {
  coords?: Coords | null;
  address?: string;
}): Promise<boolean> => {
  const dest = resolveDestination(options.coords, options.address);
  if (!dest) return false;

  const universalUrl = buildUniversalNavigateUrl(dest.httpsParam);
  const query = dest.coordQuery;

  if (Platform.OS === 'android') {
    const navUrl = buildAndroidTurnByTurnUrl(query);
    if (await tryOpen(navUrl)) return true;
    return tryOpen(universalUrl);
  }

  if (Platform.OS === 'ios') {
    if (await tryOpen(universalUrl)) return true;
    const nativeUrl = buildIosNativeDirectionsUrl(query);
    if (await Linking.canOpenURL(nativeUrl)) {
      return tryOpen(nativeUrl);
    }
    return tryOpen(universalUrl);
  }

  return tryOpen(universalUrl);
};

export const formatDeliveryAddress = (parts: {
  flatNumber?: string;
  addressLine?: string;
  landmark?: string;
}): string =>
  [parts.flatNumber, parts.addressLine, parts.landmark].filter(Boolean).join(', ');

/** @internal exposed for tests / manifest documentation */
export const MAPS_ANDROID_PACKAGE = MAPS_PACKAGE_ANDROID;
