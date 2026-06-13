const db = require('../config/db');

const invalidatePreviousOtps = async (phone, connection = db) => {
  await connection.execute(
    'UPDATE otp_verifications SET is_used = TRUE WHERE phone = ? AND is_used = FALSE',
    [phone]
  );
};

const createOtp = async (phone, hashedOtp, expiresAt, connection = db) => {
  const [result] = await connection.execute(
    'INSERT INTO otp_verifications (phone, otp, expires_at) VALUES (?, ?, ?)',
    [phone, hashedOtp, expiresAt]
  );
  return result.insertId;
};

const findActiveOtp = async (phone, connection = db) => {
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
  const [rows] = await connection.execute(
    `SELECT id, otp, expires_at, attempts
     FROM otp_verifications
     WHERE phone = ? AND is_used = FALSE AND expires_at > NOW() AND attempts < ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, maxAttempts]
  );
  return rows[0] || null;
};

const incrementAttempts = async (id, connection = db) => {
  await connection.execute(
    'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
    [id]
  );
};

const markUsed = async (id, connection = db) => {
  await connection.execute(
    'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
    [id]
  );
};

const getLastSentAt = async (phone, connection = db) => {
  const [rows] = await connection.execute(
    'SELECT created_at FROM otp_verifications WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
    [phone]
  );
  return rows[0]?.created_at || null;
};

module.exports = {
  invalidatePreviousOtps,
  createOtp,
  findActiveOtp,
  incrementAttempts,
  markUsed,
  getLastSentAt,
};
