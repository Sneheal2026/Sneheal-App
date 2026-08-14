export type OrderStatus = 'awaiting_payment' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

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

export type CheckoutSession = {
  id: string;
  publicId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  keyId: string;
  bill: OrderBill;
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
  grandTotal: number;
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
    method: string | null;
    razorpayPaymentId: string | null;
  } | null;
};

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
