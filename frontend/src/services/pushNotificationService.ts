import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { navigate } from '@/navigation/navigationRef';

export const PROMO_CHANNEL_ID = 'offers-and-promotions';

let pushServiceInitialized = false;

/**
 * Creates the high-priority notification channel for offers, discounts, and order updates on Android.
 */
export async function setupPromoNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(PROMO_CHANNEL_ID, {
      name: 'Offers & Discounts',
      description: 'Exclusive discounts, festival coupon codes, and health offers',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#CA2164',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('[PushNotification] Failed to set promo channel:', error);
  }
}

/**
 * Requests push notification permissions (required for Android 13+ / iOS).
 */
export async function requestPushPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await setupPromoNotificationChannel();
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[PushNotification] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Handles user tapping on a push notification (deep linking).
 * Supported data parameters:
 * - { screen: 'Cart' } or { actionUrl: '/cart' }
 * - { screen: 'Notifications' }
 * - { screen: 'Orders' }
 * - { screen: 'Search', query: 'Paracetamol' }
 */
export function handleNotificationTap(data: Record<string, any> | undefined): void {
  if (!data) return;

  // Medicine reminder actions are handled separately by reminderNotificationService
  if (data.type === 'medicine_reminder') {
    return;
  }

  const screen = String(data.screen || data.target || '').toLowerCase();
  const actionUrl = String(data.actionUrl || data.url || '').toLowerCase();

  try {
    if (screen === 'cart' || actionUrl.includes('cart')) {
      navigate('Main', { screen: 'Cart' });
    } else if (screen === 'notifications' || screen === 'announcements' || actionUrl.includes('notification')) {
      navigate('Notifications');
    } else if (screen === 'orders' || actionUrl.includes('order')) {
      navigate('Main', { screen: 'Orders' });
    } else if (screen === 'search') {
      navigate('Main', {
        screen: 'Search',
        params: data.query ? { query: String(data.query) } : undefined,
      });
    } else if (screen === 'product' && data.productId) {
      navigate('ProductDetails', { productId: String(data.productId) });
    } else if (screen === 'home') {
      navigate('Main', { screen: 'Home' });
    }
  } catch (error) {
    console.warn('[PushNotification] Deep link navigation failed:', error);
  }
}

/**
 * Initializes push notification channels, registers response listeners for user taps,
 * and handles cold-boot notification launches.
 */
export async function initializePushNotifications(): Promise<void> {
  if (pushServiceInitialized) return;
  pushServiceInitialized = true;

  try {
    // 1. Setup channel on Android
    await setupPromoNotificationChannel();

    // 2. Request permission if not already granted
    await requestPushPermissions();

    // 3. Handle cold-boot (app was completely closed and opened by tapping a notification)
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as Record<string, any> | undefined;
      handleNotificationTap(data);
    }
  } catch (error) {
    console.warn('[PushNotification] Initialization error:', error);
  }
}

/**
 * Registers the listener for notification clicks while the app is running in background or foreground.
 */
export function addPushNotificationTapListener(): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, any> | undefined;
    handleNotificationTap(data);
  });
}
