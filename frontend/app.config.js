/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

// Single source for native Maps SDK + Directions/Geocoding REST calls.
// Set EXPO_PUBLIC_GOOGLE_MAPS_KEY in .env (local) or eas.json / EAS secrets (CI builds).
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

module.exports = {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    config: {
      ...appJson.expo.ios?.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...appJson.expo.android,
    config: {
      ...appJson.expo.android?.config,
      googleMaps: {
        ...appJson.expo.android?.config?.googleMaps,
        apiKey: googleMapsApiKey,
      },
    },
  },
  extra: {
    ...appJson.expo.extra,
    googleMapsApiKey,
  },
};
