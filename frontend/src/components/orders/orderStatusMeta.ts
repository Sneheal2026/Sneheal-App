import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { OrderStatus } from '@/types/order.types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type OrderStatusMeta = {
  icon: IoniconName;
  accent: string;
  chipText: string;
  chipBg: string;
  hint: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  awaiting_payment: {
    icon: 'time-outline',
    accent: '#D97706',
    chipText: '#92400E',
    chipBg: '#FEF3C7',
    hint: 'Payment pending',
  },
  confirmed: {
    icon: 'cube-outline',
    accent: '#111152',
    chipText: '#111152',
    chipBg: '#EEF0FF',
    hint: 'Being prepared',
  },
  out_for_delivery: {
    icon: 'bicycle-outline',
    accent: '#1D4ED8',
    chipText: '#1E40AF',
    chipBg: '#DBEAFE',
    hint: 'On the way to you',
  },
  delivered: {
    icon: 'checkmark-circle-outline',
    accent: '#059669',
    chipText: '#047857',
    chipBg: '#D1FAE5',
    hint: 'Delivered successfully',
  },
  cancelled: {
    icon: 'close-circle-outline',
    accent: '#6B7280',
    chipText: '#4B5563',
    chipBg: '#F3F4F6',
    hint: 'Order cancelled',
  },
};

export const isActiveOrderStatus = (status: OrderStatus) =>
  status === 'awaiting_payment' || status === 'confirmed' || status === 'out_for_delivery';

export type OrderFilter = 'active' | 'delivered';

export const matchesOrderFilter = (status: OrderStatus, filter: OrderFilter) => {
  if (filter === 'active') return isActiveOrderStatus(status);
  return status === 'delivered';
};
