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

const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
};

const mapCustomerSummary = (row) => {
  if (!row) return null;
  return {
    id: String(row.id),
    username: row.username || 'Customer',
    phone: row.phone || '',
    phoneMasked: maskPhone(row.phone),
  };
};

const searchCustomers = async ({ id, usernameLike }, connection = db) => {
  if (id) {
    const [rows] = await connection.execute(
      `SELECT id, phone, username
       FROM users
       WHERE role = 'customer' AND profile_completed = 1
         AND (id = ? OR username = ?)
       ORDER BY username ASC
       LIMIT 15`,
      [id, id],
    );
    return rows.map(mapCustomerSummary);
  }

  const [rows] = await connection.execute(
    `SELECT id, phone, username
     FROM users
     WHERE role = 'customer' AND profile_completed = 1
       AND username LIKE ? ESCAPE '\\\\'
     ORDER BY username ASC
     LIMIT 15`,
    [usernameLike],
  );
  return rows.map(mapCustomerSummary);
};

const mapEngagedPatient = (row) => ({
  id: String(row.id),
  username: row.username || 'Customer',
  phone: row.phone || '',
  phoneMasked: maskPhone(row.phone),
  orderCount: Number(row.order_count) || 0,
  prescriptionCount: Number(row.prescription_count) || 0,
  lastActivityAt: row.last_activity,
});

/** Customers with at least one order, prescription, or uploaded lab report. */
const listEngagedPatients = async (connection = db) => {
  const [rows] = await connection.execute(
    `SELECT
       u.id,
       u.phone,
       u.username,
       COALESCE(o_stats.order_count, 0) AS order_count,
       COALESCE(p_stats.prescription_count, 0) AS prescription_count,
       GREATEST(
         COALESCE(o_stats.last_order_at, '1970-01-01 00:00:00'),
         COALESCE(p_stats.last_prescription_at, '1970-01-01 00:00:00'),
         COALESCE(r_stats.last_report_at, '1970-01-01 00:00:00')
       ) AS last_activity
     FROM users u
     INNER JOIN (
       SELECT user_id FROM orders
       UNION
       SELECT user_id FROM prescriptions
       UNION
       SELECT user_id FROM health_reports
     ) engaged ON engaged.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS order_count, MAX(created_at) AS last_order_at
       FROM orders
       GROUP BY user_id
     ) o_stats ON o_stats.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS prescription_count, MAX(created_at) AS last_prescription_at
       FROM prescriptions
       GROUP BY user_id
     ) p_stats ON p_stats.user_id = u.id
     LEFT JOIN (
       SELECT user_id, MAX(created_at) AS last_report_at
       FROM health_reports
       GROUP BY user_id
     ) r_stats ON r_stats.user_id = u.id
     WHERE u.role = 'customer' AND u.profile_completed = 1
     ORDER BY last_activity DESC, u.username ASC
     LIMIT 500`,
  );
  return rows.map(mapEngagedPatient);
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
  searchCustomers,
  listEngagedPatients,
  findByIdForUpdate,
  createByPhone,
  completeProfile,
  mapUser,
};
