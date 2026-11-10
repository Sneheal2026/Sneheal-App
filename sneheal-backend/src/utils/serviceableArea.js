// Solapur & Akkalkot Hub coordinates
const SOLAPUR_HUB = { latitude: 17.6599, longitude: 75.9064 };
const AKKALKOT_HUB = { latitude: 17.5256, longitude: 76.2052 };

const SOLAPUR_RADIUS_KM = 50;
const AKKALKOT_RADIUS_KM = 35;

const SERVICEABLE_BOUNDS = {
  minLat: 17.10,
  maxLat: 18.25,
  minLng: 75.25,
  maxLng: 76.55,
};

const SERVICEABLE_KEYWORDS = [
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

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

function areCoordinatesServiceable(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }

  const distToSolapur = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    SOLAPUR_HUB.latitude,
    SOLAPUR_HUB.longitude,
  );
  if (distToSolapur <= SOLAPUR_RADIUS_KM) return true;

  const distToAkkalkot = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    AKKALKOT_HUB.latitude,
    AKKALKOT_HUB.longitude,
  );
  if (distToAkkalkot <= AKKALKOT_RADIUS_KM) return true;

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

function isAddressTextServiceable(addressText) {
  if (!addressText || typeof addressText !== 'string') return false;
  const lower = addressText.toLowerCase();

  if (SERVICEABLE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return true;
  }

  const pincodeMatch = lower.match(/\b(413\d{3})\b/);
  if (pincodeMatch) {
    return true;
  }

  return false;
}

function isLocationServiceable({ latitude, longitude, addressLine }) {
  if (areCoordinatesServiceable(Number(latitude), Number(longitude))) {
    return true;
  }
  if (isAddressTextServiceable(addressLine)) {
    return true;
  }
  return false;
}

module.exports = {
  isLocationServiceable,
  areCoordinatesServiceable,
  isAddressTextServiceable,
  SOLAPUR_HUB,
  AKKALKOT_HUB,
};
