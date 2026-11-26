const userRepo = require('../repositories/user.repository');
const { normalizePhone } = require('../utils/phone');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Sends a push notification payload via Expo Push API.
 * Free, standard HTTP POST request.
 */
const sendExpoPushNotification = async ({ to, title, body, data = {}, sound = 'default', channelId = 'orders-and-deliveries', priority = 'high' }) => {
  if (!to || typeof to !== 'string') {
    return { success: false, reason: 'invalid_token' };
  }

  const message = {
    to,
    sound,
    title,
    body,
    data,
    channelId,
    priority,
    color: '#2563EB',
    _displayInForeground: true,
  };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(5000),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn('[PushNotification] Expo API responded with HTTP error:', response.status, result);
      return { success: false, status: response.status, result };
    }

    // Expo returns { data: { status: 'ok' | 'error', message?: string } }
    const statusData = result?.data;
    if (statusData?.status === 'error') {
      console.warn('[PushNotification] Expo delivery error ticket:', statusData.message, statusData.details);
      return { success: false, details: statusData };
    }

    console.log(`[PushNotification] Successfully sent push notification to: ${to.slice(0, 20)}...`);
    return { success: true, result };
  } catch (error) {
    console.error('[PushNotification] Network error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends notification to the configured delivery agent when a new order is placed.
 * The delivery agent's phone is configured via DELIVERY_AGENT_PHONE in .env / Railway.
 */
const notifyDeliveryAgentNewOrder = async (orderDetail) => {
  try {
    const rawTargetPhone = process.env.DELIVERY_AGENT_PHONE;
    if (!rawTargetPhone || !rawTargetPhone.trim()) {
      console.log('[PushNotification] DELIVERY_AGENT_PHONE is not set. Skipping agent notification.');
      return;
    }

    const targetPhone = normalizePhone(rawTargetPhone.trim());
    if (!targetPhone) {
      console.warn(`[PushNotification] DELIVERY_AGENT_PHONE is not a valid 10-digit number: ${rawTargetPhone}`);
      return;
    }

    const agent = await userRepo.findPushTokenByPhone(targetPhone);
    if (!agent) {
      console.warn(`[PushNotification] No user account found in database for phone: ${targetPhone}`);
      return;
    }

    if (!agent.push_token) {
      console.warn(`[PushNotification] User ${targetPhone} has not registered a push token yet (app not opened or permission denied).`);
      return;
    }

    const paymentType = orderDetail.payment?.method === 'cod' ? 'Cash on Delivery' : 'Prepaid';
    const amountStr = orderDetail.grandTotal != null ? `₹${orderDetail.grandTotal}` : 'Order';
    const receiverName = orderDetail.address?.receiverName ? ` for ${orderDetail.address.receiverName}` : '';

    await sendExpoPushNotification({
      to: agent.push_token,
      title: '🛵 New Order for Delivery!',
      body: `Order #${orderDetail.publicId}${receiverName} · ${amountStr} (${paymentType}). Tap to view address.`,
      data: {
        screen: 'orders',
        orderId: orderDetail.id,
        publicId: orderDetail.publicId,
        type: 'new_order_delivery',
      },
      channelId: 'orders-and-deliveries',
      priority: 'high',
      sound: 'default',
    });
  } catch (err) {
    console.error('[PushNotification] Error in notifyDeliveryAgentNewOrder:', err.message);
  }
};

module.exports = {
  sendExpoPushNotification,
  notifyDeliveryAgentNewOrder,
};
