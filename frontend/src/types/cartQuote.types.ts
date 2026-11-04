export type AppliedPromotion = {
  id: string;
  code: string | null;
  title: string;
};

export type CartBill = {
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
  appliedCartPromotion?: AppliedPromotion | null;
  appliedDeliveryPromotion?: AppliedPromotion | null;
};

export type CartOffer = {
  id: string;
  code: string | null;
  title: string;
  subtitle: string;
  promoType: 'percent_off' | 'flat_off' | 'free_delivery';
  stackGroup: 'cart' | 'delivery';
  minCartPaise: number;
  sortOrder: number;
  eligible: boolean;
  applied: boolean;
  gapPaise: number;
  discountPaise: number;
  stacksWithOthers: boolean;
};

export type CartQuote = {
  bill: CartBill;
  offers: CartOffer[];
  couponCode: string | null;
  attemptedCouponCode?: string | null;
  couponError?: string | null;
};
