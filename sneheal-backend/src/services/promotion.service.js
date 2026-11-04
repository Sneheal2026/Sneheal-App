const AppError = require('../utils/AppError');

const isWithinWindow = (promo, now) => {
  if (promo.startsAt && now < new Date(promo.startsAt)) return false;
  if (promo.endsAt && now > new Date(promo.endsAt)) return false;
  return true;
};

const calcCartDiscountPaise = (promo, itemSellingPaise) => {
  if (promo.promoType === 'percent_off') {
    let discount = Math.round((itemSellingPaise * promo.value) / 100);
    if (promo.maxDiscountPaise != null) {
      discount = Math.min(discount, promo.maxDiscountPaise);
    }
    return Math.min(discount, itemSellingPaise);
  }
  if (promo.promoType === 'flat_off') {
    return Math.min(promo.value, itemSellingPaise);
  }
  return 0;
};

const pickBestCartPromo = (candidates, itemSellingPaise) => {
  let best = null;
  let bestDiscount = 0;
  for (const promo of candidates) {
    const discount = calcCartDiscountPaise(promo, itemSellingPaise);
    if (
      discount > bestDiscount ||
      (discount === bestDiscount && promo.priority > (best?.priority ?? 0))
    ) {
      best = promo;
      bestDiscount = discount;
    }
  }
  return best;
};

const normalizeCouponCode = (raw) => {
  const trimmed = String(raw ?? '').trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

/**
 * One cart-stack promo at a time; delivery promos stack independently.
 * @param {{ strictCoupon?: boolean }} options - strictCoupon: throw on bad code (checkout)
 */
const evaluatePromotions = (
  promotions,
  itemSellingPaise,
  requestedCodeRaw,
  options = {},
) => {
  const strictCoupon = options.strictCoupon === true;
  const now = new Date();
  const active = promotions.filter((promo) => isWithinWindow(promo, now));

  const deliveryEligible = active.filter(
    (promo) =>
      promo.stackGroup === 'delivery' &&
      promo.promoType === 'free_delivery' &&
      itemSellingPaise >= promo.minCartPaise,
  );
  const appliedDelivery =
    deliveryEligible.sort((a, b) => b.priority - a.priority)[0] ?? null;

  const cartPool = active.filter(
    (promo) =>
      promo.stackGroup === 'cart' &&
      (promo.promoType === 'percent_off' || promo.promoType === 'flat_off'),
  );

  const eligibleCart = cartPool.filter(
    (promo) => itemSellingPaise >= promo.minCartPaise,
  );
  const autoCartPromo = pickBestCartPromo(eligibleCart, itemSellingPaise);

  const requestedCode = normalizeCouponCode(requestedCodeRaw);
  let appliedCart = null;
  let couponError = null;

  if (requestedCode) {
    const match = cartPool.find(
      (promo) => promo.code && promo.code.toUpperCase() === requestedCode,
    );
    if (!match) {
      const message = 'This coupon code is not valid';
      if (strictCoupon) {
        throw new AppError(400, message);
      }
      couponError = message;
      appliedCart = autoCartPromo;
    } else if (itemSellingPaise < match.minCartPaise) {
      const gap = match.minCartPaise - itemSellingPaise;
      const message = `Add ₹${(gap / 100).toFixed(0)} more to use this coupon`;
      if (strictCoupon) {
        throw new AppError(400, message);
      }
      couponError = message;
      appliedCart = autoCartPromo;
    } else {
      appliedCart = match;
    }
  } else {
    appliedCart = autoCartPromo;
  }

  const cartPromoPaise = appliedCart
    ? calcCartDiscountPaise(appliedCart, itemSellingPaise)
    : 0;

  return {
    cartPromoPaise,
    deliveryFree: Boolean(appliedDelivery),
    appliedCart,
    appliedDelivery,
    requestedCode,
    couponError,
  };
};

const toPublicPromo = (promo) => ({
  id: promo.id,
  code: promo.code,
  title: promo.title,
  subtitle: promo.subtitle,
  promoType: promo.promoType,
  stackGroup: promo.stackGroup,
  minCartPaise: promo.minCartPaise,
  sortOrder: promo.sortOrder,
});

const buildOfferViews = (promotions, itemSellingPaise, evaluation) => {
  const now = new Date();
  return promotions
    .filter((promo) => isWithinWindow(promo, now))
    .map((promo) => {
      const eligible = itemSellingPaise >= promo.minCartPaise;
      const gapPaise = eligible ? 0 : promo.minCartPaise - itemSellingPaise;
      const applied =
        (evaluation.appliedCart && evaluation.appliedCart.id === promo.id) ||
        (evaluation.appliedDelivery &&
          evaluation.appliedDelivery.id === promo.id);

      let discountPaise = 0;
      if (applied && promo.stackGroup === 'cart') {
        discountPaise = evaluation.cartPromoPaise;
      }

      return {
        ...toPublicPromo(promo),
        eligible,
        applied,
        gapPaise,
        discountPaise,
        stacksWithOthers: promo.stackGroup === 'delivery',
      };
    });
};

module.exports = {
  evaluatePromotions,
  buildOfferViews,
  toPublicPromo,
  calcCartDiscountPaise,
};
