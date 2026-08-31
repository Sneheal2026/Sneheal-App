const crypto = require('crypto');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const addressRepo = require('../repositories/address.repository');
const productRepo = require('../repositories/product.repository');
const orderRepo = require('../repositories/order.repository');
const paymentRepo = require('../repositories/payment.repository');
const { computeCartBill, fromPaise, toPaise } = require('./cartBilling.service');
const mailService = require('./mail.service');

const MAX_LINES = 50;
const MAX_QTY = 10;

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

const toDetailPayload = (order, items, payment) => ({
  id: order.id,
  publicId: order.publicId,
  status: order.status,
  paymentStatus: order.paymentStatus,
  currency: order.currency,
  createdAt: order.createdAt,
  deliveredAt: order.deliveredAt,
  coords: {
    latitude: order.latitude,
    longitude: order.longitude,
  },
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
    deliveredAt: order.deliveredAt,
  };
};

const toDeliveryPayload = (order, items) => {
  const list = toListPayload(order, items);
  return {
    ...list,
    receiverName: order.receiverName,
    mobile: order.mobile,
    addressLine: order.addressLine,
    flatNumber: order.flatNumber,
    landmark: order.landmark,
    coords: {
      latitude: order.latitude,
      longitude: order.longitude,
    },
  };
};

const hydrateDeliveryOrders = async (orders) => {
  const items = await orderRepo.findItemsByOrderIds(orders.map((order) => order.id));
  const byOrder = new Map();
  for (const item of items) {
    const list = byOrder.get(item.orderId) || [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }
  return orders.map((order) => toDeliveryPayload(order, byOrder.get(order.id) || []));
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
    throw new AppError(400, 'Order total is too low');
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
    await paymentRepo.create(
      {
        orderId: order.id,
        amountPaise: bill.grandTotalPaise,
      },
      connection,
    );

    await connection.commit();

    const [items, payment] = await Promise.all([
      orderRepo.findItemsByOrderId(order.id),
      paymentRepo.findByOrderId(order.id),
    ]);
    const detail = toDetailPayload(order, items, payment);
    setImmediate(() => {
      mailService.notifyOpsNewOrder(detail).catch((err) => {
        console.error('[mail] ops order email failed', err.message);
      });
    });
    return detail;
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

const getOrder = async (user, orderId) => {
  const order =
    user.role === 'delivery_agent'
      ? await orderRepo.findById(orderId)
      : await orderRepo.findByIdAndUserId(orderId, user.sub);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  const [items, payment] = await Promise.all([
    orderRepo.findItemsByOrderId(order.id),
    paymentRepo.findByOrderId(order.id),
  ]);
  return toDetailPayload(order, items, payment);
};

const getOrderByPublicId = async (publicId) => {
  const trimmed = String(publicId ?? '').trim();
  if (!trimmed) {
    throw new AppError(400, 'Order ID is required');
  }
  const order = await orderRepo.findByPublicId(trimmed);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  const [items, payment] = await Promise.all([
    orderRepo.findItemsByOrderId(order.id),
    paymentRepo.findByOrderId(order.id),
  ]);
  return toDetailPayload(order, items, payment);
};

const updateFulfillmentByPublicId = async (agentId, publicId, nextStatus) => {
  const trimmed = String(publicId ?? '').trim();
  if (!trimmed) {
    throw new AppError(400, 'Order ID is required');
  }
  const order = await orderRepo.findByPublicId(trimmed);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  return updateFulfillmentStatus(agentId, order.id, nextStatus);
};

const listDeliveryQueue = async () => {
  const [active, completed] = await Promise.all([
    orderRepo.findByStatuses(['confirmed', 'out_for_delivery']),
    orderRepo.findRecentByStatus('delivered', 20),
  ]);
  const [activeRows, completedRows] = await Promise.all([
    hydrateDeliveryOrders(active),
    hydrateDeliveryOrders(completed),
  ]);
  return { active: activeRows, completed: completedRows };
};

const ALLOWED_TRANSITIONS = {
  confirmed: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['delivered'],
};

const updateFulfillmentStatus = async (agentId, orderId, nextStatus) => {
  const status = String(nextStatus ?? '').trim();
  if (status !== 'out_for_delivery' && status !== 'delivered') {
    throw new AppError(400, 'Invalid delivery status');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const order = await orderRepo.findByIdForUpdate(orderId, connection);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }
    if (order.status === 'cancelled') {
      throw new AppError(400, 'Cancelled orders cannot be updated');
    }

    if (order.status === status) {
      await connection.commit();
      const [items, payment] = await Promise.all([
        orderRepo.findItemsByOrderId(order.id),
        paymentRepo.findByOrderId(order.id),
      ]);
      return toDetailPayload(order, items, payment);
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new AppError(400, `Cannot move order from ${order.status} to ${status}`);
    }

    if (
      order.assignedAgentId &&
      order.assignedAgentId !== String(agentId) &&
      order.status === 'out_for_delivery'
    ) {
      throw new AppError(409, 'This order is already assigned to another delivery partner');
    }

    const updated = await orderRepo.updateFulfillment(
      order.id,
      {
        status,
        assignedAgentId: agentId,
        paymentStatus: status === 'delivered' ? 'paid' : null,
      },
      connection,
    );

    if (status === 'delivered') {
      await paymentRepo.markCollectedByOrderId(order.id, connection);
    }

    await connection.commit();

    const [items, payment] = await Promise.all([
      orderRepo.findItemsByOrderId(updated.id),
      paymentRepo.findByOrderId(updated.id),
    ]);
    return toDetailPayload(updated, items, payment);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createCheckoutOrder,
  listOrders,
  getOrder,
  getOrderByPublicId,
  listDeliveryQueue,
  updateFulfillmentStatus,
  updateFulfillmentByPublicId,
};
