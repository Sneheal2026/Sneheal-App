import type { Coordinates } from '@/types/location.types';

// Hub coordinates
export const SOLAPUR_HUB: Coordinates = {
  latitude: 17.6599,
  longitude: 75.9064,
};

export const AKKALKOT_HUB: Coordinates = {
  latitude: 17.5256,
  longitude: 76.2052,
};

// Maximum delivery radius from hub centers in Kilometers
export const SOLAPUR_RADIUS_KM = 50;
export const AKKALKOT_RADIUS_KM = 35;

// Combined bounding box covering Solapur district, Akkalkot & surrounding corridor
export const SERVICEABLE_BOUNDS = {
  minLat: 17.10,
  maxLat: 18.25,
  minLng: 75.25,
  maxLng: 76.55,
};

// Serviceable keywords in address text
export const SERVICEABLE_KEYWORDS = [
  'solapur',
  'sholapur',
  'akkalkot',
  'akalkot',
  'mohol',
  'barshi',
  'south solapur',
  'north solapur',
  'maindargi',
  'dudhani',
  'wagdari',
  'valsang',
  'hotgi',
  'kumbhari',
  'dindur',
];

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 * Pure arithmetic, executes in ~0.001ms with zero performance overhead.
 */
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Checks if the given coordinates fall within the Solapur or Akkalkot delivery zone.
 */
export function areCoordinatesServiceable(coords?: Coordinates | null): boolean {
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return false;
  }

  const { latitude, longitude } = coords;

  // 1. Check distance to Solapur hub
  const distToSolapur = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    SOLAPUR_HUB.latitude,
    SOLAPUR_HUB.longitude,
  );
  if (distToSolapur <= SOLAPUR_RADIUS_KM) {
    return true;
  }

  // 2. Check distance to Akkalkot hub
  const distToAkkalkot = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    AKKALKOT_HUB.latitude,
    AKKALKOT_HUB.longitude,
  );
  if (distToAkkalkot <= AKKALKOT_RADIUS_KM) {
    return true;
  }

  // 3. Check bounding box
  if (
    latitude >= SERVICEABLE_BOUNDS.minLat &&
    latitude <= SERVICEABLE_BOUNDS.maxLat &&
    longitude >= SERVICEABLE_BOUNDS.minLng &&
    longitude <= SERVICEABLE_BOUNDS.maxLng
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if an address text or pincode contains Solapur / Akkalkot references.
 */
export function isAddressTextServiceable(addressText?: string | null): boolean {
  if (!addressText || typeof addressText !== 'string') return false;
  const lower = addressText.toLowerCase();

  // Keyword check
  if (SERVICEABLE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return true;
  }

  // Solapur district pincode check (413xxx)
  const pincodeMatch = lower.match(/\b(413\d{3})\b/);
  if (pincodeMatch) {
    return true;
  }

  return false;
}

/**
 * Master check combining coordinates and address text.
 */
export function isLocationServiceable(
  coords?: Coordinates | null,
  addressText?: string | null,
): boolean {
  if (areCoordinatesServiceable(coords)) {
    return true;
  }
  if (isAddressTextServiceable(addressText)) {
    return true;
  }
  return false;
}
