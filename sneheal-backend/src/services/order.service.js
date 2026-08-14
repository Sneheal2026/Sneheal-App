const crypto = require('crypto');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const addressRepo = require('../repositories/address.repository');
const productRepo = require('../repositories/product.repository');
const orderRepo = require('../repositories/order.repository');
const paymentRepo = require('../repositories/payment.repository');
const { computeCartBill, fromPaise, toPaise } = require('./cartBilling.service');
const razorpayService = require('./razorpay.service');

const MAX_LINES = 50;
const MAX_QTY = 10;

const itemSignature = (items) => {
  const normalized = items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const makePublicId = () => {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SNH-${Date.now().toString(36).toUpperCase()}${rand}`.slice(0, 24);
};

const billFromOrder = (order) => ({
  itemMrp: fromPaise(order.itemMrpPaise),
  itemSelling: fromPaise(order.itemSellingPaise),
  itemDiscount: fromPaise(order.discountPaise),
  promoDiscount: fromPaise(order.promoPaise),
  handlingFee: fromPaise(order.handlingPaise),
  deliveryFee: fromPaise(order.deliveryPaise),
  deliveryOriginal: fromPaise(order.deliveryOriginalPaise),
  deliveryFree: order.deliveryPaise === 0 && order.deliveryOriginalPaise > 0,
  gstOnFees: fromPaise(order.gstPaise),
  grandTotal: fromPaise(order.grandTotalPaise),
  savings: fromPaise(
    order.discountPaise +
      order.promoPaise +
      (order.deliveryPaise === 0 ? order.deliveryOriginalPaise : 0),
  ),
});

const toCheckoutPayload = (order) => ({
  id: order.id,
  publicId: order.publicId,
  amountPaise: order.grandTotalPaise,
  currency: order.currency,
  razorpayOrderId: order.razorpayOrderId,
  keyId: razorpayService.getKeyId(),
  bill: billFromOrder(order),
});

const toDetailPayload = (order, items, payment) => ({
  id: order.id,
  publicId: order.publicId,
  status: order.status,
  paymentStatus: order.paymentStatus,
  currency: order.currency,
  createdAt: order.createdAt,
  address: {
    receiverName: order.receiverName,
    mobile: order.mobile,
    addressLine: order.addressLine,
    flatNumber: order.flatNumber,
    landmark: order.landmark,
  },
  bill: billFromOrder(order),
  grandTotal: fromPaise(order.grandTotalPaise),
  items: items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    unit: item.unit,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPrice: fromPaise(item.unitPricePaise),
    mrp: fromPaise(item.mrpPaise),
    lineTotal: fromPaise(item.lineTotalPaise),
  })),
  payment: payment
    ? {
        status: payment.status,
        method: payment.method,
        razorpayPaymentId: payment.razorpayPaymentId,
      }
    : null,
});

const toListPayload = (order, items) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: order.id,
    publicId: order.publicId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    grandTotal: fromPaise(order.grandTotalPaise),
    itemCount,
    firstItemName: items[0]?.name ?? null,
    createdAt: order.createdAt,
  };
};

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

const createCheckoutOrder = async (userId, body) => {
  const addressId = String(body.addressId ?? '').trim();
  if (!addressId) {
    throw new AppError(400, 'Delivery address is required');
  }

  const requested = normalizeItems(body.items);
  const address = await addressRepo.findByIdAndUserId(addressId, userId);
  if (!address) {
    throw new AppError(400, 'Delivery address not found');
  }

  const products = await productRepo.findByIds(requested.map((item) => item.productId));
  const productMap = new Map(products.map((product) => [product.id, product]));

  const pricedLines = requested.map((item) => {
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

  const bill = computeCartBill(pricedLines);
  if (bill.grandTotalPaise < 100) {
    throw new AppError(400, 'Order total is too low to pay');
  }

  const signature = itemSignature(pricedLines);
  const pending = await orderRepo.findPendingReusable({
    userId,
    addressId,
    grandTotalPaise: bill.grandTotalPaise,
  });

  for (const candidate of pending) {
    const existingItems = await orderRepo.findItemsByOrderId(candidate.id);
    const existingSignature = itemSignature(
      existingItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
    if (existingSignature === signature && candidate.razorpayOrderId) {
      return toCheckoutPayload(candidate);
    }
  }

  const snapshotItems = pricedLines.map((line) => ({
    productId: line.productId,
    name: line.name,
    unit: line.unit,
    imageUrl: line.imageUrl,
    unitPricePaise: toPaise(line.price),
    mrpPaise: toPaise(line.originalPrice ?? line.price),
    quantity: line.quantity,
    lineTotalPaise: toPaise(line.price) * line.quantity,
    prescriptionRequired: line.prescriptionRequired,
  }));

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const order = await orderRepo.create(
      {
        publicId: makePublicId(),
        userId,
        addressId: address.id,
        receiverName: address.receiverName,
        mobile: address.mobile,
        addressLine: address.addressLine,
        flatNumber: address.flatNumber,
        landmark: address.landmark ?? '',
        latitude: address.coords.latitude,
        longitude: address.coords.longitude,
        itemMrpPaise: bill.itemMrpPaise,
        itemSellingPaise: bill.itemSellingPaise,
        discountPaise: bill.itemDiscountPaise,
        promoPaise: bill.promoPaise,
        handlingPaise: bill.handlingPaise,
        deliveryPaise: bill.deliveryPaise,
        deliveryOriginalPaise: bill.deliveryOriginalPaise,
        gstPaise: bill.gstPaise,
        grandTotalPaise: bill.grandTotalPaise,
      },
      connection,
    );

    await orderRepo.insertItems(order.id, snapshotItems, connection);

    let rzpOrder;
    try {
      rzpOrder = await razorpayService.createRazorpayOrder({
        amountPaise: bill.grandTotalPaise,
        receipt: order.publicId,
        notes: { orderId: order.id, publicId: order.publicId },
      });
    } catch (error) {
      throw new AppError(502, 'Could not start payment. Please try again.');
    }

    await orderRepo.setRazorpayOrderId(order.id, rzpOrder.id, connection);
    await paymentRepo.create(
      {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amountPaise: bill.grandTotalPaise,
      },
      connection,
    );

    await connection.commit();

    return toCheckoutPayload({
      ...order,
      razorpayOrderId: rzpOrder.id,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const listOrders = async (userId) => {
  const orders = await orderRepo.findByUserId(userId);
  const items = await orderRepo.findItemsByOrderIds(orders.map((order) => order.id));
  const byOrder = new Map();
  for (const item of items) {
    const list = byOrder.get(item.orderId) || [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }
  return orders.map((order) => toListPayload(order, byOrder.get(order.id) || []));
};

const getOrder = async (userId, orderId) => {
  const order = await orderRepo.findByIdAndUserId(orderId, userId);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  const [items, payment] = await Promise.all([
    orderRepo.findItemsByOrderId(order.id),
    paymentRepo.findByOrderId(order.id),
  ]);
  return toDetailPayload(order, items, payment);
};

const applyPaid = async ({
  order,
  razorpayPaymentId,
  razorpaySignature,
  method,
  rawPayload,
  status,
}) => {
  if (order.paymentStatus === 'paid') {
    const [items, payment] = await Promise.all([
      orderRepo.findItemsByOrderId(order.id),
      paymentRepo.findByOrderId(order.id),
    ]);
    return toDetailPayload(order, items, payment);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await paymentRepo.markCaptured(
      {
        orderId: order.id,
        razorpayPaymentId,
        razorpaySignature,
        method,
        rawPayload,
        status: status || 'captured',
      },
      connection,
    );
    const paid = await orderRepo.markPaid(order.id, connection);
    await connection.commit();
    const [items, payment] = await Promise.all([
      orderRepo.findItemsByOrderId(paid.id),
      paymentRepo.findByOrderId(paid.id),
    ]);
    return toDetailPayload(paid, items, payment);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const verifyPayment = async (userId, body) => {
  const orderId = String(body.orderId ?? '').trim();
  const razorpayOrderId = String(body.razorpay_order_id ?? '').trim();
  const razorpayPaymentId = String(body.razorpay_payment_id ?? '').trim();
  const razorpaySignature = String(body.razorpay_signature ?? '').trim();

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError(400, 'Payment verification details are required');
  }

  const order = await orderRepo.findByIdAndUserId(orderId, userId);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  if (order.razorpayOrderId !== razorpayOrderId) {
    throw new AppError(400, 'Payment does not match this order');
  }

  razorpayService.verifyCheckoutSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  const gatewayPayment = await razorpayService.fetchPayment(razorpayPaymentId);
  if (gatewayPayment.order_id !== razorpayOrderId) {
    throw new AppError(400, 'Payment does not match this order');
  }
  if (Number(gatewayPayment.amount) !== order.grandTotalPaise) {
    throw new AppError(400, 'Payment amount does not match the order');
  }
  if (!['captured', 'authorized'].includes(gatewayPayment.status)) {
    throw new AppError(400, 'Payment is not complete');
  }

  return applyPaid({
    order,
    razorpayPaymentId,
    razorpaySignature,
    method: gatewayPayment.method,
    rawPayload: gatewayPayment,
    status: gatewayPayment.status === 'authorized' ? 'authorized' : 'captured',
  });
};

const handleWebhook = async ({ eventId, event, payload }) => {
  const inserted = await paymentRepo.insertWebhookEvent({
    eventId,
    event,
    payload,
  });
  if (!inserted) {
    return { ignored: true };
  }

  const paymentEntity =
    payload?.payload?.payment?.entity || payload?.payment?.entity || null;
  const orderEntity = payload?.payload?.order?.entity || null;
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  if (!razorpayOrderId) {
    return { ignored: true };
  }

  const order = await orderRepo.findByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    return { ignored: true };
  }

  if (event === 'payment.failed') {
    if (order.paymentStatus === 'paid') {
      return { ignored: true };
    }
    await paymentRepo.markFailed({ orderId: order.id, rawPayload: payload });
    await orderRepo.markPaymentFailed(order.id);
    return { ok: true };
  }

  if (event === 'payment.captured' || event === 'order.paid') {
    if (paymentEntity && Number(paymentEntity.amount) !== order.grandTotalPaise) {
      return { ignored: true };
    }
    await applyPaid({
      order,
      razorpayPaymentId: paymentEntity?.id || null,
      razorpaySignature: null,
      method: paymentEntity?.method || null,
      rawPayload: payload,
      status: 'captured',
    });
  }

  return { ok: true };
};

module.exports = {
  createCheckoutOrder,
  listOrders,
  getOrder,
  verifyPayment,
  handleWebhook,
};
