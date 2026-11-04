const AppError = require('../utils/AppError');
const productRepo = require('../repositories/product.repository');
const promotionRepo = require('../repositories/promotion.repository');
const {
  evaluatePromotions,
  buildOfferViews,
} = require('./promotion.service');
const { computeCartBill } = require('./cartBilling.service');

const MAX_LINES = 50;
const MAX_QTY = 10;

const normalizeItems = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError(400, 'Cart items are required');
  }
  if (rawItems.length > MAX_LINES) {
    throw new AppError(400, `Cart cannot have more than ${MAX_LINES} items`);
  }

  const merged = new Map();
  for (const raw of rawItems) {
    const productId = String(raw.productId ?? '').trim();
    const quantity = Number(raw.quantity);
    if (!productId) {
      throw new AppError(400, 'Each item needs a productId');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new AppError(400, `Quantity must be between 1 and ${MAX_QTY}`);
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(MAX_QTY, quantity),
  }));
};

const buildPricedLines = async (rawItems) => {
  const requested = normalizeItems(rawItems);
  const products = await productRepo.findByIds(requested.map((item) => item.productId));
  const productMap = new Map(products.map((product) => [product.id, product]));

  return requested.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(400, 'One or more products are unavailable');
    }
    return {
      productId: product.id,
      quantity: item.quantity,
      name: product.name,
      unit: product.unit,
      imageUrl: product.imageUrl,
      price: product.price,
      originalPrice: product.originalPrice ?? product.price,
      prescriptionRequired: product.prescriptionRequired,
    };
  });
};

const sumItemSellingPaise = (lines) => {
  const { itemSellingPaise } = computeCartBill(lines, {
    cartPromoPaise: 0,
    deliveryFree: false,
  });
  return itemSellingPaise;
};

const quoteCart = async (rawItems, couponCode) => {
  const pricedLines = await buildPricedLines(rawItems);
  const promotions = await promotionRepo.findActive();
  const itemSellingPaise = sumItemSellingPaise(pricedLines);
  const evaluation = evaluatePromotions(
    promotions,
    itemSellingPaise,
    couponCode,
  );
  const bill = computeCartBill(pricedLines, evaluation);
  const offers = buildOfferViews(promotions, itemSellingPaise, evaluation);

  return {
    bill: {
      itemMrp: bill.itemMrp,
      itemSelling: bill.itemSelling,
      itemDiscount: bill.itemDiscount,
      promoDiscount: bill.promoDiscount,
      handlingFee: bill.handlingFee,
      deliveryFee: bill.deliveryFee,
      deliveryOriginal: bill.deliveryOriginal,
      deliveryFree: bill.deliveryFree,
      gstOnFees: bill.gstOnFees,
      grandTotal: bill.grandTotal,
      savings: bill.savings,
      appliedCartPromotion: bill.appliedCartPromotion,
      appliedDeliveryPromotion: bill.appliedDeliveryPromotion,
    },
    offers,
    couponCode: evaluation.appliedCart?.code ?? evaluation.requestedCode ?? null,
  };
};

const listActivePromotions = async () => {
  const promotions = await promotionRepo.findActive();
  return promotions.map((promo) => ({
    id: promo.id,
    code: promo.code,
    title: promo.title,
    subtitle: promo.subtitle,
    promoType: promo.promoType,
    stackGroup: promo.stackGroup,
    minCartPaise: promo.minCartPaise,
    sortOrder: promo.sortOrder,
  }));
};

module.exports = {
  normalizeItems,
  buildPricedLines,
  quoteCart,
  listActivePromotions,
};
