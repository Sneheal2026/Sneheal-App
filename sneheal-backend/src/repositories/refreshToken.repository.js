const db = require('../config/db');

const create = async (userId, token, expiresAt, connection = db) => {
  await connection.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

const deleteByUserId = async (userId, connection = db) => {
  await connection.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

module.exports = {
  create,
  deleteByUserId,
};
