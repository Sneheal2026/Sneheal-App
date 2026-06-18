const db = require('../config/db');

const create = async (userId, token, expiresAt, connection = db) => {
  await connection.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

const findByToken = async (token, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT user_id, token, expires_at FROM refresh_tokens WHERE token = ? LIMIT 1',
    [token]
  );

  return rows[0] || null;
};

const deleteByUserId = async (userId, connection = db) => {
  await connection.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

const deleteByToken = async (token, connection = db) => {
  await connection.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

module.exports = {
  create,
  findByToken,
  deleteByUserId,
  deleteByToken,
};
