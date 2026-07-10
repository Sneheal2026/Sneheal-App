const db = require('../config/db');

const mapProfile = (row) => {
  if (!row) return null;
  return {
    userId: row.user_id,
    clinicAddressLine: row.clinic_address_line,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    landmark: row.landmark,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const create = async (userId, clinicData, connection = db) => {
  const { addressLine, city, state, pincode, landmark = '' } = clinicData;

  await connection.execute(
    `INSERT INTO doctor_profiles 
     (user_id, clinic_address_line, city, state, pincode, landmark) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, addressLine, city, state, pincode, landmark]
  );

  return findByUserId(userId, connection);
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT user_id, clinic_address_line, city, state, pincode, landmark, 
            verification_status, created_at, updated_at 
     FROM doctor_profiles 
     WHERE user_id = ?`,
    [userId]
  );
  return mapProfile(rows[0]);
};

const existsByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT 1 FROM doctor_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows.length > 0;
};

module.exports = {
  create,
  findByUserId,
  existsByUserId,
  mapProfile,
};
