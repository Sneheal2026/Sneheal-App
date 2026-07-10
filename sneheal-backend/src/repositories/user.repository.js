const db = require('../config/db');

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    username: row.username,
    language: row.language,
    role: row.role,
    profileCompleted: Boolean(row.profile_completed),
    createdAt: row.created_at,
  };
};

const findByPhone = async (phone, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT id, phone, username, language, role, profile_completed, created_at FROM users WHERE phone = ? LIMIT 1',
    [phone]
  );
  return mapUser(rows[0]);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT id, phone, username, language, role, profile_completed, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return mapUser(rows[0]);
};

const createByPhone = async (phone, connection = db) => {
  const [result] = await connection.execute(
    'INSERT INTO users (phone) VALUES (?)',
    [phone]
  );
  return findById(result.insertId, connection);
};

const completeProfile = async (userId, { username, language, role }, connection = db) => {
  await connection.execute(
    `UPDATE users 
     SET username = ?, language = ?, role = ?, profile_completed = TRUE 
     WHERE id = ?`,
    [username, language, role, userId]
  );
  return findById(userId, connection);
};

const findByIdForUpdate = async (id, connection) => {
  const [rows] = await connection.execute(
    'SELECT id, phone, username, language, role, profile_completed, created_at FROM users WHERE id = ? FOR UPDATE',
    [id]
  );
  return mapUser(rows[0]);
};

module.exports = {
  findByPhone,
  findById,
  findByIdForUpdate,
  createByPhone,
  completeProfile,
  mapUser,
};
