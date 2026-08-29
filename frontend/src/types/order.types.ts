export type OrderStatus =
  | 'awaiting_payment'
  | 'confirmed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'cod';

export type OrderBill = {
  itemMrp: number;
  itemSelling: number;
  itemDiscount: number;
  promoDiscount: number;
  handlingFee: number;
  deliveryFee: number;
  deliveryOriginal: number;
  deliveryFree: boolean;
  gstOnFees: number;
  grandTotal: number;
  savings: number;
};

export type OrderListItem = {
  id: string;
  publicId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: number;
  itemCount: number;
  firstItemName: string | null;
  createdAt: string;
  deliveredAt?: string | null;
};

export type OrderDetailItem = {
  id: string;
  productId: string | null;
  name: string;
  unit: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
};

export type OrderDetail = {
  id: string;
  publicId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  createdAt: string;
  deliveredAt?: string | null;
  grandTotal: number;
  coords?: {
    latitude: number;
    longitude: number;
  };
  address: {
    receiverName: string;
    mobile: string;
    addressLine: string;
    flatNumber: string;
    landmark: string;
  };
  bill: OrderBill;
  items: OrderDetailItem[];
  payment: {
    status: string;
    method: PaymentMethod | string | null;
  } | null;
};

export type DeliveryQueueOrder = OrderListItem & {
  receiverName: string;
  mobile: string;
  addressLine: string;
  flatNumber: string;
  landmark: string;
  coords: {
    latitude: number;
    longitude: number;
  };
};

export type DeliveryQueue = {
  active: DeliveryQueueOrder[];
  completed: DeliveryQueueOrder[];
};
