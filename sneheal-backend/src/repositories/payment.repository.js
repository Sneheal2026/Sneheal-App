const db = require('../config/db');

const mapPayment = (row) => {
  if (!row) return null;
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: row.provider,
    method: row.method,
    status: row.status,
    amountPaise: Number(row.amount_paise),
  };
};

const create = async (data, connection = db) => {
  const [result] = await connection.execute(
    `INSERT INTO payments (
      order_id, provider, amount_paise, method, status
    ) VALUES (?, 'cod', ?, 'cod', 'pending')`,
    [data.orderId, data.amountPaise],
  );
  return findById(result.insertId, connection);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, order_id, provider, amount_paise, method, status
     FROM payments WHERE id = ? LIMIT 1`,
    [id],
  );
  return mapPayment(rows[0]);
};

const findByOrderId = async (orderId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, order_id, provider, amount_paise, method, status
     FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [orderId],
  );
  return mapPayment(rows[0]);
};

const markCollectedByOrderId = async (orderId, connection = db) => {
  await connection.execute(
    `UPDATE payments SET status = 'captured' WHERE order_id = ? AND status IN ('pending', 'created')`,
    [orderId],
  );
};

module.exports = {
  create,
  findById,
  findByOrderId,
  markCollectedByOrderId,
};
