/**
 * Keep fee rules in sync with frontend/src/utils/cartBilling.ts
 * Cart/delivery promos come from the promotions table (promotion.service.js).
 */
const HANDLING_FEE = 9;
const DELIVERY_FEE = 29;
const GST_RATE = 0.18;

const toPaise = (amount) => Math.round(Number(amount) * 100);
const fromPaise = (paise) => Number(paise) / 100;

/**
 * @param {Array} lines priced cart lines
 * @param {{ cartPromoPaise?: number, deliveryFree?: boolean }} promoResult
 */
const computeCartBill = (lines, promoResult = {}) => {
  let itemMrpPaise = 0;
  let itemSellingPaise = 0;

  for (const line of lines) {
    const selling = toPaise(line.price) * line.quantity;
    const mrp = toPaise(line.originalPrice ?? line.price) * line.quantity;
    itemSellingPaise += selling;
    itemMrpPaise += mrp;
  }

  const itemDiscountPaise = Math.max(0, itemMrpPaise - itemSellingPaise);
  const cartPromoPaise = Math.max(0, Number(promoResult.cartPromoPaise) || 0);
  const cappedCartPromoPaise = Math.min(cartPromoPaise, itemSellingPaise);

  const afterPromoPaise = Math.max(0, itemSellingPaise - cappedCartPromoPaise);
  const deliveryFree = promoResult.deliveryFree === true;
  const deliveryOriginalPaise = toPaise(DELIVERY_FEE);
  const deliveryPaise = deliveryFree ? 0 : deliveryOriginalPaise;
  const handlingPaise = toPaise(HANDLING_FEE);
  const gstPaise = Math.round((handlingPaise + deliveryPaise) * GST_RATE);

  const grandTotalPaise =
    afterPromoPaise + handlingPaise + deliveryPaise + gstPaise;
  const savingsPaise =
    itemDiscountPaise +
    cappedCartPromoPaise +
    (deliveryFree ? deliveryOriginalPaise : 0);

  return {
    itemMrpPaise,
    itemSellingPaise,
    itemDiscountPaise,
    promoPaise: cappedCartPromoPaise,
    handlingPaise,
    deliveryPaise,
    deliveryOriginalPaise,
    deliveryFree,
    gstPaise,
    grandTotalPaise,
    savingsPaise,
    itemMrp: fromPaise(itemMrpPaise),
    itemSelling: fromPaise(itemSellingPaise),
    itemDiscount: fromPaise(itemDiscountPaise),
    promoDiscount: fromPaise(cappedCartPromoPaise),
    handlingFee: fromPaise(handlingPaise),
    deliveryFee: fromPaise(deliveryPaise),
    deliveryOriginal: fromPaise(deliveryOriginalPaise),
    gstOnFees: fromPaise(gstPaise),
    grandTotal: fromPaise(grandTotalPaise),
    savings: fromPaise(savingsPaise),
    appliedCartPromotion: promoResult.appliedCart
      ? {
          id: promoResult.appliedCart.id,
          code: promoResult.appliedCart.code,
          title: promoResult.appliedCart.title,
        }
      : null,
    appliedDeliveryPromotion: promoResult.appliedDelivery
      ? {
          id: promoResult.appliedDelivery.id,
          code: promoResult.appliedDelivery.code,
          title: promoResult.appliedDelivery.title,
        }
      : null,
  };
};

module.exports = {
  toPaise,
  fromPaise,
  computeCartBill,
};
