import { authenticatedApiRequest } from './authTokenManager';
import type { OrderDetail, OrderListItem, DeliveryQueuePage, AgentDeliveredOrdersPage } from '@/types/order.types';

export const createCheckoutOrder = (
  addressId: string,
  items: Array<{ productId: string; quantity: number }>,
  couponCode?: string | null,
): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>('/api/orders', {
    method: 'POST',
    body: {
      addressId,
      items,
      ...(couponCode ? { couponCode } : {}),
    },
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

export const fetchOrderByPublicId = (publicId: string): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>(
    `/api/orders/public/${encodeURIComponent(publicId)}`,
  );

export const markOrderDeliveredByPublicId = (
  publicId: string,
): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>(
    `/api/orders/public/${encodeURIComponent(publicId)}/status`,
    {
      method: 'PATCH',
      body: { status: 'delivered' },
    },
  );

export const DELIVERY_QUEUE_PAGE_SIZE = 5;

export const fetchDeliveryQueuePage = (
  options: { limit?: number; offset?: number } = {},
): Promise<DeliveryQueuePage> => {
  const limit = options.limit ?? DELIVERY_QUEUE_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return authenticatedApiRequest<DeliveryQueuePage>(
    `/api/orders/delivery/queue?${query.toString()}`,
  );
};

/** @deprecated Use fetchDeliveryQueuePage — clears any legacy cache hook. */
export const invalidateDeliveryQueueCache = () => {};

export const fetchDeliveryQueue = (options?: {
  limit?: number;
  offset?: number;
}): Promise<DeliveryQueuePage> => fetchDeliveryQueuePage(options);

export const fetchAgentDeliveredOrdersPage = (
  options: { limit?: number; offset?: number } = {},
): Promise<AgentDeliveredOrdersPage> => {
  const limit = options.limit ?? DELIVERY_QUEUE_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return authenticatedApiRequest<AgentDeliveredOrdersPage>(
    `/api/orders/delivery/mine/delivered?${query.toString()}`,
  );
};

export const updateOrderStatus = (
  orderId: string,
  status: Extract<OrderDetail['status'], 'out_for_delivery' | 'delivered'>,
): Promise<OrderDetail> =>
  authenticatedApiRequest<OrderDetail>(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status },
  });
