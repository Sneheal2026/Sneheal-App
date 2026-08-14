const db = require('../config/db');

const mapPayment = (row) => {
  if (!row) return null;
  let rawPayload = row.raw_payload;
  if (typeof rawPayload === 'string') {
    try {
      rawPayload = JSON.parse(rawPayload);
    } catch {
      rawPayload = null;
    }
  }

  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: row.provider,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    method: row.method,
    status: row.status,
    amountPaise: Number(row.amount_paise),
    rawPayload,
  };
};

const create = async (data, connection = db) => {
  const [result] = await connection.execute(
    `INSERT INTO payments (
      order_id, provider, razorpay_order_id, amount_paise, status
    ) VALUES (?, 'razorpay', ?, ?, 'created')`,
    [data.orderId, data.razorpayOrderId, data.amountPaise],
  );
  return findById(result.insertId, connection);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, order_id, provider, razorpay_order_id, razorpay_payment_id,
            razorpay_signature, amount_paise, method, status, raw_payload
     FROM payments WHERE id = ? LIMIT 1`,
    [id],
  );
  return mapPayment(rows[0]);
};

const findByOrderId = async (orderId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, order_id, provider, razorpay_order_id, razorpay_payment_id,
            razorpay_signature, amount_paise, method, status, raw_payload
     FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [orderId],
  );
  return mapPayment(rows[0]);
};

const markCaptured = async (
  { orderId, razorpayPaymentId, razorpaySignature, method, rawPayload, status },
  connection = db,
) => {
  await connection.execute(
    `UPDATE payments
     SET razorpay_payment_id = ?,
         razorpay_signature = ?,
         method = ?,
         status = ?,
         raw_payload = ?
     WHERE order_id = ?`,
    [
      razorpayPaymentId,
      razorpaySignature ?? null,
      method ?? null,
      status || 'captured',
      rawPayload ? JSON.stringify(rawPayload) : null,
      orderId,
    ],
  );
  return findByOrderId(orderId, connection);
};

const markFailed = async ({ orderId, rawPayload }, connection = db) => {
  await connection.execute(
    `UPDATE payments
     SET status = 'failed', raw_payload = ?
     WHERE order_id = ? AND status = 'created'`,
    [rawPayload ? JSON.stringify(rawPayload) : null, orderId],
  );
  return findByOrderId(orderId, connection);
};

const insertWebhookEvent = async ({ eventId, event, payload }, connection = db) => {
  try {
    await connection.execute(
      `INSERT INTO payment_webhook_events (event_id, event, payload)
       VALUES (?, ?, ?)`,
      [eventId, event, JSON.stringify(payload)],
    );
    return true;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return false;
    }
    throw err;
  }
};

module.exports = {
  create,
  findById,
  findByOrderId,
  markCaptured,
  markFailed,
  insertWebhookEvent,
};
