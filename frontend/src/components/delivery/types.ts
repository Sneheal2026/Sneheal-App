export type DeliveryStatus = 'ready' | 'transit' | 'delivered';

export interface DeliveryOrder {
  id: string;
  orderId: string;
  customer: string;
  address: string;
  items: number;
  distance: string;
  eta: string;
  status: DeliveryStatus;
  statusLabel: string;
}
