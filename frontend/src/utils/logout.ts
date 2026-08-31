import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { invalidateOrdersCache } from '@/services/orderService';
import { clearProfilePhoto } from '@/services/profilePhotoStorage';
import { devLog } from '@/utils/devLogger';

/**
 * Wipes every piece of locally persisted user data on logout:
 * auth session, addresses, cart, reminders, family members, search history,
 * theme/language preferences, and any other AsyncStorage keys. Also cancels
 * pending medicine-reminder notifications and clears in-memory caches so the
 * next user starts from a clean slate.
 */
export const clearAllUserData = async (): Promise<void> => {
  invalidateOrdersCache();

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    devLog('Logout', 'Failed to cancel scheduled notifications', error);
  }

  try {
    await clearProfilePhoto();
  } catch (error) {
    devLog('Logout', 'Failed to clear profile photo file', error);
  }

  await AsyncStorage.clear();
  devLog('Logout', 'Cleared all local user data');
};
