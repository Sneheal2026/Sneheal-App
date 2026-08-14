const db = require('../config/db');

const toIso = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

const mapOrder = (row) => {
  if (!row) return null;
  return {
    id: String(row.id),
    publicId: row.public_id,
    userId: String(row.user_id),
    addressId: row.address_id != null ? String(row.address_id) : null,
    receiverName: row.receiver_name,
    mobile: row.mobile,
    addressLine: row.address_line,
    flatNumber: row.flat_number,
    landmark: row.landmark ?? '',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    status: row.status,
    paymentStatus: row.payment_status,
    itemMrpPaise: Number(row.item_mrp_paise),
    itemSellingPaise: Number(row.item_selling_paise),
    discountPaise: Number(row.discount_paise),
    promoPaise: Number(row.promo_paise),
    handlingPaise: Number(row.handling_paise),
    deliveryPaise: Number(row.delivery_paise),
    deliveryOriginalPaise: Number(row.delivery_original_paise),
    gstPaise: Number(row.gst_paise),
    grandTotalPaise: Number(row.grand_total_paise),
    currency: row.currency,
    razorpayOrderId: row.razorpay_order_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
};

const mapItem = (row) => {
  if (!row) return null;
  return {
    id: String(row.id),
    productId: row.product_id != null ? String(row.product_id) : null,
    name: row.name,
    unit: row.unit,
    imageUrl: row.image_url ?? null,
    unitPricePaise: Number(row.unit_price_paise),
    mrpPaise: Number(row.mrp_paise),
    quantity: Number(row.quantity),
    lineTotalPaise: Number(row.line_total_paise),
    prescriptionRequired: Boolean(row.prescription_required),
  };
};

const ORDER_SELECT = `
  id, public_id, user_id, address_id, receiver_name, mobile, address_line,
  flat_number, landmark, latitude, longitude, status, payment_status,
  item_mrp_paise, item_selling_paise, discount_paise, promo_paise,
  handling_paise, delivery_paise, delivery_original_paise, gst_paise,
  grand_total_paise, currency, razorpay_order_id, created_at, updated_at
`;

const create = async (data, connection = db) => {
  const [result] = await connection.execute(
    `INSERT INTO orders (
      public_id, user_id, address_id, receiver_name, mobile, address_line,
      flat_number, landmark, latitude, longitude, status, payment_status,
      item_mrp_paise, item_selling_paise, discount_paise, promo_paise,
      handling_paise, delivery_paise, delivery_original_paise, gst_paise,
      grand_total_paise, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR')`,
    [
      data.publicId,
      data.userId,
      data.addressId,
      data.receiverName,
      data.mobile,
      data.addressLine,
      data.flatNumber,
      data.landmark ?? '',
      data.latitude,
      data.longitude,
      data.itemMrpPaise,
      data.itemSellingPaise,
      data.discountPaise,
      data.promoPaise,
      data.handlingPaise,
      data.deliveryPaise,
      data.deliveryOriginalPaise,
      data.gstPaise,
      data.grandTotalPaise,
    ],
  );
  return findById(result.insertId, connection);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT ${ORDER_SELECT} FROM orders WHERE id = ? LIMIT 1`,
    [id],
  );
  return mapOrder(rows[0]);
};

const findByIdAndUserId = async (id, userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT ${ORDER_SELECT} FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId],
  );
  return mapOrder(rows[0]);
};

const findByRazorpayOrderId = async (razorpayOrderId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT ${ORDER_SELECT} FROM orders WHERE razorpay_order_id = ? LIMIT 1`,
    [razorpayOrderId],
  );
  return mapOrder(rows[0]);
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT ${ORDER_SELECT} FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(mapOrder);
};

const findPendingReusable = async (
  { userId, addressId, grandTotalPaise },
  connection = db,
) => {
  const [rows] = await connection.execute(
    `SELECT ${ORDER_SELECT}
     FROM orders
     WHERE user_id = ?
       AND address_id = ?
       AND grand_total_paise = ?
       AND status = 'awaiting_payment'
       AND payment_status = 'pending'
       AND razorpay_order_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 8`,
    [userId, addressId, grandTotalPaise],
  );
  return rows.map(mapOrder);
};

const setRazorpayOrderId = async (orderId, razorpayOrderId, connection = db) => {
  await connection.execute(
    'UPDATE orders SET razorpay_order_id = ? WHERE id = ?',
    [razorpayOrderId, orderId],
  );
};

const markPaid = async (orderId, connection = db) => {
  await connection.execute(
    `UPDATE orders
     SET status = 'confirmed', payment_status = 'paid'
     WHERE id = ? AND payment_status <> 'paid'`,
    [orderId],
  );
  return findById(orderId, connection);
};

const markPaymentFailed = async (orderId, connection = db) => {
  await connection.execute(
    `UPDATE orders
     SET payment_status = 'failed'
     WHERE id = ? AND payment_status = 'pending'`,
    [orderId],
  );
  return findById(orderId, connection);
};

const insertItems = async (orderId, items, connection = db) => {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO order_items (
        order_id, product_id, name, unit, image_url, unit_price_paise,
        mrp_paise, quantity, line_total_paise, prescription_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.productId,
        item.name,
        item.unit,
        item.imageUrl,
        item.unitPricePaise,
        item.mrpPaise,
        item.quantity,
        item.lineTotalPaise,
        item.prescriptionRequired ? 1 : 0,
      ],
    );
  }
};

const findItemsByOrderId = async (orderId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, product_id, name, unit, image_url, unit_price_paise, mrp_paise,
            quantity, line_total_paise, prescription_required
     FROM order_items
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId],
  );
  return rows.map(mapItem);
};

const findItemsByOrderIds = async (orderIds, connection = db) => {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => '?').join(',');
  const [rows] = await connection.execute(
    `SELECT id, order_id, product_id, name, unit, image_url, unit_price_paise, mrp_paise,
            quantity, line_total_paise, prescription_required
     FROM order_items
     WHERE order_id IN (${placeholders})
     ORDER BY id ASC`,
    orderIds,
  );
  return rows.map((row) => ({
    orderId: String(row.order_id),
    ...mapItem(row),
  }));
};

module.exports = {
  mapOrder,
  create,
  findById,
  findByIdAndUserId,
  findByRazorpayOrderId,
  findByUserId,
  findPendingReusable,
  setRazorpayOrderId,
  markPaid,
  markPaymentFailed,
  insertItems,
  findItemsByOrderId,
  findItemsByOrderIds,
};
