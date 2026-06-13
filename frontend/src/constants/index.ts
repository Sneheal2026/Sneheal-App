// App-level constants
// Add API URLs, config values, feature flags, etc.

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const APP_CONFIG = {
  APP_NAME: 'Sneheal',
  COUNTRY_CODE: '+91',
  OTP_LENGTH: 6,
  OTP_RESEND_SECONDS: 30,
  API_BASE_URL: getApiBaseUrl(),
} as const;
