const pool = require('../config/db');

/**
 * Find admin record by username from admin_users (and fallback to admin_credentials)
 */
const findByUsername = async (username) => {
  const cleanUsername = String(username || '').trim();
  if (!cleanUsername) return null;

  // 1. First priority: admin_users table
  try {
    const [rows] = await pool.query(
      `SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) LIMIT 1`,
      [cleanUsername]
    );
    if (rows.length > 0) return normalizeAdminRecord(rows[0]);
  } catch (_) {}

  // 2. Fallback: admin_credentials table
  try {
    const [rows] = await pool.query(
      `SELECT * FROM admin_credentials WHERE LOWER(username) = LOWER(?) LIMIT 1`,
      [cleanUsername]
    );
    if (rows.length > 0) return normalizeAdminRecord(rows[0]);
  } catch (_) {}

  return null;
};

/**
 * Standardize admin field names regardless of table column casing
 */
const normalizeAdminRecord = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.Id ?? 1,
    username: raw.username ?? raw.UserName ?? 'admin',
    password: raw.password_hash ?? raw.password ?? raw.Password ?? raw.PasswordHash ?? '',
    role: raw.role ?? raw.Role ?? 'admin',
    isActive: raw.is_active ?? raw.isActive ?? 1,
    email: raw.email ?? null,
    createdAt: raw.created_at ?? null,
  };
};

/**
 * Update password to bcrypt hash (for transparent plaintext -> hash upgrade)
 * and update last_login_at timestamp
 */
const updatePasswordHash = async (id, hash) => {
  // Update in admin_users
  try {
    await pool.query(
      `UPDATE admin_users SET password_hash = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hash, id]
    );
  } catch (_) {
    // Or in admin_credentials
    try {
      await pool.query(
        `UPDATE admin_credentials SET password = ? WHERE id = ?`,
        [hash, id]
      );
    } catch (_) {}
  }
};

/**
 * Record last login timestamp
 */
const recordLoginSuccess = async (id) => {
  try {
    await pool.query(
      `UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  } catch (_) {}
};

/**
 * Fetch platform overview counts efficiently in parallel
 */
const getOverviewStats = async () => {
  const safeCount = async (sql, params = []) => {
    try {
      const [rows] = await pool.query(sql, params);
      return Number(Object.values(rows[0] || {})[0] || 0);
    } catch {
      return 0;
    }
  };

  const [
    totalCustomers,
    totalDoctors,
    pendingDoctors,
    totalAgents,
    pendingAgents,
    totalOrders,
    totalPrescriptions,
    totalProducts,
  ] = await Promise.all([
    safeCount(`SELECT COUNT(*) FROM users WHERE role = 'customer'`),
    safeCount(`SELECT COUNT(*) FROM users WHERE role = 'doctor'`),
    safeCount(`SELECT COUNT(*) FROM doctor_profiles WHERE is_approved = 0`),
    safeCount(`SELECT COUNT(*) FROM users WHERE role = 'delivery_agent'`),
    safeCount(`SELECT COUNT(*) FROM delivery_agent_profiles WHERE is_approved = 0`),
    safeCount(`SELECT COUNT(*) FROM orders`),
    safeCount(`SELECT COUNT(*) FROM prescriptions`),
    safeCount(`SELECT COUNT(*) FROM products`),
  ]);

  return {
    customers: totalCustomers,
    doctors: {
      total: totalDoctors,
      pendingApproval: pendingDoctors,
    },
    deliveryAgents: {
      total: totalAgents,
      pendingApproval: pendingAgents,
    },
    orders: totalOrders,
    prescriptions: totalPrescriptions,
    catalogProducts: totalProducts,
  };
};

module.exports = {
  findByUsername,
  updatePasswordHash,
  recordLoginSuccess,
  getOverviewStats,
};
