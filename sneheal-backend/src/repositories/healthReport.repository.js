const db = require('../config/db');

const toIso = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

const mapReport = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    title: row.title,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    createdAt: toIso(row.created_at),
  };
};

const mapReportInternal = (row) => {
  if (!row) return null;

  return {
    ...mapReport(row),
    cloudinaryPublicId: row.cloudinary_public_id ?? null,
    resourceType: row.resource_type,
  };
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, title, file_url, cloudinary_public_id, resource_type, mime_type, created_at
     FROM health_reports
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows.map(mapReport);
};

const countByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) AS total FROM health_reports WHERE user_id = ?',
    [userId],
  );
  return Number(rows[0]?.total || 0);
};

const findByIdAndUserId = async (id, userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, title, file_url, cloudinary_public_id, resource_type, mime_type, created_at
     FROM health_reports
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId],
  );

  return mapReportInternal(rows[0]);
};

const create = async (
  userId,
  { title, fileUrl, cloudinaryPublicId, resourceType, mimeType },
  connection = db,
) => {
  const [result] = await connection.execute(
    `INSERT INTO health_reports
      (user_id, title, file_url, cloudinary_public_id, resource_type, mime_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, fileUrl, cloudinaryPublicId ?? null, resourceType, mimeType],
  );

  const [rows] = await connection.execute(
    `SELECT id, user_id, title, file_url, cloudinary_public_id, resource_type, mime_type, created_at
     FROM health_reports
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [result.insertId, userId],
  );

  return mapReport(rows[0]);
};

const remove = async (id, userId, connection = db) => {
  const [result] = await connection.execute(
    'DELETE FROM health_reports WHERE id = ? AND user_id = ?',
    [id, userId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  findByUserId,
  countByUserId,
  findByIdAndUserId,
  create,
  remove,
};
