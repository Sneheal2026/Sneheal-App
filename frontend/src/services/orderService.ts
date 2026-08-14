import { authenticatedApiRequest } from './authTokenManager';
import type {
  CheckoutSession,
  OrderDetail,
  OrderListItem,
  RazorpaySuccessPayload,
} from '@/types/order.types';

export const createCheckoutOrder = (
  addressId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<CheckoutSession> =>
  authenticatedApiRequest<CheckoutSession>('/api/orders', {
    method: 'POST',
    body: { addressId, items },
  });

const ORDERS_STALE_MS = 90_000;

let ordersCache: { items: OrderListItem[]; fetchedAt: number } | null = null;
let ordersInflight: Promise<OrderListItem[]> | null = null;

export const peekOrdersCache = (): OrderListItem[] | null => ordersCache?.items ?? null;

export const invalidateOrdersCache = () => {
  ordersCache = null;
  ordersInflight = null;
};

export const seedOrderInCache = (order: OrderDetail) => {
  const row: OrderListItem = {
    id: order.id,
    publicId: order.publicId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    grandTotal: order.grandTotal,
    itemCount: order.items.length,
    firstItemName: order.items[0]?.name ?? null,
    createdAt: order.createdAt,
  };
  const prev = ordersCache?.items ?? [];
  ordersCache = {
    items: [row, ...prev.filter((item) => item.id !== row.id)],
    fetchedAt: Date.now(),
  };
};

export const fetchOrders = (options?: { force?: boolean }): Promise<OrderListItem[]> => {
  const force = options?.force === true;
  if (!force && ordersCache && Date.now() - ordersCache.fetchedAt < ORDERS_STALE_MS) {
    return Promise.resolve(ordersCache.items);
  }
  if (ordersInflight && !force) return ordersInflight;

  const request = authenticatedApiRequest<OrderListItem[]>('/api/orders')
    .then((items) => {
      ordersCache = { items, fetchedAt: Date.now() };
      return items;
    })
    .finally(() => {
      if (ordersInflight === request) ordersInflight = null;
    });

  ordersInflight = request;
  return request;
};

export const fetchOrderById = (orderId: string): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>(`/api/orders/${orderId}`);

export const verifyPayment = (
  orderId: string,
  payload: RazorpaySuccessPayload,
): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>('/api/payments/verify', {
    method: 'POST',
    body: {
      orderId,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    },
  });
