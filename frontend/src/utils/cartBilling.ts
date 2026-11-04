import type { CartBill } from '@/types/cartQuote.types';

/** Display-only helpers; totals come from POST /api/cart/quote. */
export const formatInr = (amount: number) => `₹${amount.toFixed(2)}`;

export type { CartBill };

export const emptyCartBill = (): CartBill => ({
  itemMrp: 0,
  itemSelling: 0,
  itemDiscount: 0,
  promoDiscount: 0,
  handlingFee: 0,
  deliveryFee: 0,
  deliveryOriginal: 0,
  deliveryFree: false,
  gstOnFees: 0,
  grandTotal: 0,
  savings: 0,
});
