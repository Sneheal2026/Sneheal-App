import { useEffect, useState } from 'react';
import { subscribeToOrderStatus } from '@/services/firebase';
import type { OrderStatus } from '@/types/order.types';

/**
 * Watches Firebase for a live fulfillment-status push on this order and returns
 * the most advanced status seen. MySQL stays the source of truth; this only
 * lets an open customer screen flip (e.g. to "Delivered") without a manual
 * refresh once a delivery agent confirms.
 */
const RANK: Record<string, number> = {
  awaiting_payment: 0,
  confirmed: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: 3,
};

export function useLiveOrderStatus(
  orderId: string | undefined,
  fallbackStatus: OrderStatus,
): OrderStatus {
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    setLiveStatus(null);
    if (!orderId) return;
    const unsubscribe = subscribeToOrderStatus(orderId, (payload) => {
      setLiveStatus(payload ? (payload.status as OrderStatus) : null);
    });
    return unsubscribe;
  }, [orderId]);

  if (!liveStatus) return fallbackStatus;
  // Never let a live push move the UI backwards from what the API already told us.
  return (RANK[liveStatus] ?? 0) >= (RANK[fallbackStatus] ?? 0)
    ? liveStatus
    : fallbackStatus;
}
