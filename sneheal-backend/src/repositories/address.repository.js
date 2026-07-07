const db = require('../config/db');

const mapAddress = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    coords: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    addressLine: row.address_line,
    flatNumber: row.flat_number,
    landmark: row.landmark ?? '',
    receiverName: row.receiver_name,
    mobile: row.mobile,
    type: row.type,
    customTypeLabel: row.custom_label ?? '',
    isDefault: Boolean(row.is_default),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, address_line, flat_number, landmark, receiver_name, mobile,
            type, custom_label, latitude, longitude, is_default, created_at
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );

  return rows.map(mapAddress);
};

const findByIdAndUserId = async (id, userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, address_line, flat_number, landmark, receiver_name, mobile,
            type, custom_label, latitude, longitude, is_default, created_at
     FROM user_addresses
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId],
  );

  return mapAddress(rows[0]);
};

const countByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) AS total FROM user_addresses WHERE user_id = ?',
    [userId],
  );

  return Number(rows[0]?.total ?? 0);
};

const clearDefaultForUser = async (userId, connection = db) => {
  await connection.execute(
    'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
    [userId],
  );
};

const create = async (userId, data, connection = db) => {
  const [result] = await connection.execute(
    `INSERT INTO user_addresses (
      user_id, address_line, flat_number, landmark, receiver_name, mobile,
      type, custom_label, latitude, longitude, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.addressLine,
      data.flatNumber,
      data.landmark ?? '',
      data.receiverName,
      data.mobile,
      data.type,
      data.customTypeLabel ?? '',
      data.latitude,
      data.longitude,
      data.isDefault ? 1 : 0,
    ],
  );

  return findByIdAndUserId(result.insertId, userId, connection);
};

const update = async (id, userId, data, connection = db) => {
  const [result] = await connection.execute(
    `UPDATE user_addresses
     SET address_line = ?, flat_number = ?, landmark = ?, receiver_name = ?, mobile = ?,
         type = ?, custom_label = ?, latitude = ?, longitude = ?, is_default = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.addressLine,
      data.flatNumber,
      data.landmark ?? '',
      data.receiverName,
      data.mobile,
      data.type,
      data.customTypeLabel ?? '',
      data.latitude,
      data.longitude,
      data.isDefault ? 1 : 0,
      id,
      userId,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findByIdAndUserId(id, userId, connection);
};

const deleteById = async (id, userId, connection = db) => {
  const [result] = await connection.execute(
    'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
    [id, userId],
  );

  return result.affectedRows > 0;
};

const promoteFirstAsDefault = async (userId, connection = db) => {
  await connection.execute(
    `UPDATE user_addresses
     SET is_default = TRUE
     WHERE user_id = ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [userId],
  );
};

module.exports = {
  mapAddress,
  findByUserId,
  findByIdAndUserId,
  countByUserId,
  clearDefaultForUser,
  create,
  update,
  deleteById,
  promoteFirstAsDefault,
};
