import { Platform } from 'react-native';
import * as Application from 'expo-application';

export function getNativeVersionCode(): number {
  const raw = Application.nativeBuildVersion;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getAnnouncementPlatform(): 'android' | 'ios' {
  return Platform.OS === 'android' ? 'android' : 'ios';
}
