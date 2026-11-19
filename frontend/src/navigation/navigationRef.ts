import { createNavigationContainerRef } from '@react-navigation/native';
import type { AuthStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AuthStackParamList>();

/**
 * Safely navigates to any route in the app from anywhere (outside React components,
 * such as notification tap handlers or background services).
 */
export function navigate<RouteName extends keyof AuthStackParamList>(
  name: RouteName,
  params?: AuthStackParamList[RouteName],
): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  } else {
    // If navigation isn't mounted yet, retry after a short delay
    const timer = setTimeout(() => {
      clearTimeout(timer);
      if (navigationRef.isReady()) {
        navigationRef.navigate(name as any, params as any);
      }
    }, 500);
  }
}
