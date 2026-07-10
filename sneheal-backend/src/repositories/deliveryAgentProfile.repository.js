const db = require('../config/db');

const mapProfileMeta = (row) => {
  if (!row) return null;
  return {
    userId: row.user_id,
    aadharMimeType: row.aadhar_mime_type,
    licenseMimeType: row.license_mime_type,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const create = async (userId, documents, connection = db) => {
  const {
    aadharImageBase64,
    aadharMimeType,
    licenseImageBase64,
    licenseMimeType,
  } = documents;

  await connection.execute(
    `INSERT INTO delivery_agent_profiles 
     (user_id, aadhar_image_base64, aadhar_mime_type, license_image_base64, license_mime_type) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, aadharImageBase64, aadharMimeType, licenseImageBase64, licenseMimeType]
  );

  return findByUserIdMeta(userId, connection);
};

const findByUserIdMeta = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT user_id, aadhar_mime_type, license_mime_type, 
            verification_status, created_at, updated_at 
     FROM delivery_agent_profiles 
     WHERE user_id = ?`,
    [userId]
  );
  return mapProfileMeta(rows[0]);
};

const existsByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM delivery_agent_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows.length > 0;
};

module.exports = {
  create,
  findByUserIdMeta,
  existsByUserId,
  mapProfileMeta,
};
