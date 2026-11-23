import type { CartBill } from '@/types/cartQuote.types';
import type { CartLine } from '@/types/cart.types';

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

export const estimateCartBill = (lines: CartLine[]): CartBill => {
  if (!lines || lines.length === 0) {
    return emptyCartBill();
  }

  let itemMrp = 0;
  let itemSelling = 0;

  for (const line of lines) {
    const qty = Math.max(1, line.quantity || 1);
    const price = typeof line.price === 'number' && !Number.isNaN(line.price) ? line.price : 0;
    const originalPrice =
      typeof line.originalPrice === 'number' && !Number.isNaN(line.originalPrice) && line.originalPrice > price
        ? line.originalPrice
        : price;

    itemSelling += price * qty;
    itemMrp += originalPrice * qty;
  }

  const itemDiscount = Math.max(0, itemMrp - itemSelling);

  return {
    itemMrp,
    itemSelling,
    itemDiscount,
    promoDiscount: 0,
    handlingFee: 0,
    deliveryFee: 0,
    deliveryOriginal: 0,
    deliveryFree: false,
    gstOnFees: 0,
    grandTotal: itemSelling,
    savings: itemDiscount,
  };
};
