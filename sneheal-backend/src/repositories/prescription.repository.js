const db = require('../config/db');

const mapPrescription = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    imageUrl: row.image_url,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
};

const mapPrescriptionInternal = (row) => {
  if (!row) return null;

  return {
    ...mapPrescription(row),
    cloudinaryPublicId: row.cloudinary_public_id ?? null,
  };
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, image_url, cloudinary_public_id, created_at
     FROM prescriptions
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows.map(mapPrescription);
};

const findByIdAndUserId = async (id, userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, image_url, cloudinary_public_id, created_at
     FROM prescriptions
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId],
  );

  return mapPrescriptionInternal(rows[0]);
};

const create = async (userId, { imageUrl, cloudinaryPublicId }, connection = db) => {
  const [result] = await connection.execute(
    `INSERT INTO prescriptions (user_id, image_url, cloudinary_public_id)
     VALUES (?, ?, ?)`,
    [userId, imageUrl, cloudinaryPublicId ?? null],
  );

  const [rows] = await connection.execute(
    `SELECT id, user_id, image_url, cloudinary_public_id, created_at
     FROM prescriptions
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [result.insertId, userId],
  );

  return mapPrescription(rows[0]);
};

const remove = async (id, userId, connection = db) => {
  const [result] = await connection.execute(
    'DELETE FROM prescriptions WHERE id = ? AND user_id = ?',
    [id, userId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  findByUserId,
  findByIdAndUserId,
  create,
  remove,
};
