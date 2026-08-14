/**
 * Keep fee rules in sync with frontend/src/utils/cartBilling.ts
 */
const HANDLING_FEE = 9;
const DELIVERY_FEE = 29;
const PROMO_DISCOUNT = 10;
const FREE_DELIVERY_MIN = 199;
const GST_RATE = 0.18;

const toPaise = (amount) => Math.round(Number(amount) * 100);
const fromPaise = (paise) => Number(paise) / 100;

const computeCartBill = (lines) => {
  let itemMrpPaise = 0;
  let itemSellingPaise = 0;

  for (const line of lines) {
    const selling = toPaise(line.price) * line.quantity;
    const mrp = toPaise(line.originalPrice ?? line.price) * line.quantity;
    itemSellingPaise += selling;
    itemMrpPaise += mrp;
  }

  const itemDiscountPaise = Math.max(0, itemMrpPaise - itemSellingPaise);
  const promoPaise =
    itemSellingPaise >= toPaise(50) ? toPaise(PROMO_DISCOUNT) : 0;

  const afterPromoPaise = Math.max(0, itemSellingPaise - promoPaise);
  const deliveryFree = afterPromoPaise >= toPaise(FREE_DELIVERY_MIN);
  const deliveryOriginalPaise = toPaise(DELIVERY_FEE);
  const deliveryPaise = deliveryFree ? 0 : deliveryOriginalPaise;
  const handlingPaise = toPaise(HANDLING_FEE);
  const gstPaise = Math.round((handlingPaise + deliveryPaise) * GST_RATE);

  const grandTotalPaise =
    afterPromoPaise + handlingPaise + deliveryPaise + gstPaise;
  const savingsPaise =
    itemDiscountPaise + promoPaise + (deliveryFree ? deliveryOriginalPaise : 0);

  return {
    itemMrpPaise,
    itemSellingPaise,
    itemDiscountPaise,
    promoPaise,
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
    promoDiscount: fromPaise(promoPaise),
    handlingFee: fromPaise(handlingPaise),
    deliveryFee: fromPaise(deliveryPaise),
    deliveryOriginal: fromPaise(deliveryOriginalPaise),
    gstOnFees: fromPaise(gstPaise),
    grandTotal: fromPaise(grandTotalPaise),
    savings: fromPaise(savingsPaise),
  };
};

module.exports = {
  toPaise,
  fromPaise,
  computeCartBill,
};
