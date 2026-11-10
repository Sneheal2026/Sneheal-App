const crypto = require('crypto');
const db = require('../config/db');

const makeUserPublicId = () => {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SNH-U${rand}`;
};

const USER_BASE_SELECT = `
  SELECT u.id, u.public_id, u.phone, u.username, u.language, u.role, u.profile_completed, u.created_at,
         COALESCE(dp.verification_status, dap.verification_status) AS verification_status
  FROM users u
  LEFT JOIN doctor_profiles dp ON dp.user_id = u.id AND u.role = 'doctor'
  LEFT JOIN delivery_agent_profiles dap ON dap.user_id = u.id AND u.role = 'delivery_agent'
`;

const mapUser = (row) => {
  if (!row) return null;
  let verificationStatus = null;
  if (row.role === 'customer') {
    verificationStatus = 'approved';
  } else if (row.role === 'doctor' || row.role === 'delivery_agent') {
    verificationStatus = row.verification_status || 'pending';
  }

  return {
    id: row.id,
    publicId: row.public_id || (row.id ? `SNH-U${String(row.id).padStart(6, '0')}` : null),
    phone: row.phone,
    username: row.username,
    language: row.language,
    role: row.role,
    profileCompleted: Boolean(row.profile_completed),
    verificationStatus,
    createdAt: row.created_at,
  };
};

const findByPhone = async (phone, connection = db) => {
  const [rows] = await connection.execute(
    `${USER_BASE_SELECT} WHERE u.phone = ? LIMIT 1`,
    [phone]
  );
  return mapUser(rows[0]);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `${USER_BASE_SELECT} WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return mapUser(rows[0]);
};

const findByPublicId = async (publicId, connection = db) => {
  const [rows] = await connection.execute(
    `${USER_BASE_SELECT} WHERE u.public_id = ? LIMIT 1`,
    [publicId]
  );
  return mapUser(rows[0]);
};

const findByIdOrPublicId = async (idOrPublicId, connection = db) => {
  const trimmed = String(idOrPublicId || '').trim();
  if (!trimmed) return null;
  if (/^\d{1,18}$/.test(trimmed)) {
    const user = await findById(trimmed, connection);
    if (user) return user;
  }
  return findByPublicId(trimmed, connection);
};

const createByPhone = async (phone, connection = db) => {
  const publicId = makeUserPublicId();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (phone, public_id) VALUES (?, ?)',
      [phone, publicId]
    );
    return findById(result.insertId, connection);
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      const [result] = await connection.execute(
        'INSERT INTO users (phone) VALUES (?)',
        [phone]
      );
      return findById(result.insertId, connection);
    }
    throw err;
  }
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

const isUserApproved = async (userId, role, connection = db) => {
  if (role === 'doctor') {
    const [rows] = await connection.execute(
      'SELECT verification_status FROM doctor_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows.length > 0 && rows[0].verification_status === 'approved';
  }
  if (role === 'delivery_agent') {
    const [rows] = await connection.execute(
      'SELECT verification_status FROM delivery_agent_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows.length > 0 && rows[0].verification_status === 'approved';
  }
  return true;
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
    publicId: row.public_id || (row.id ? `SNH-U${String(row.id).padStart(6, '0')}` : null),
    username: row.username || 'Customer',
    phone: row.phone || '',
    phoneMasked: maskPhone(row.phone),
  };
};

const searchCustomers = async ({ id, publicId, usernameLike }, connection = db) => {
  if (id) {
    const [rows] = await connection.execute(
      `SELECT id, public_id, phone, username
       FROM users
       WHERE role = 'customer' AND profile_completed = 1
         AND (id = ? OR public_id = ? OR username = ?)
       ORDER BY username ASC
       LIMIT 15`,
      [id, id, id],
    );
    return rows.map(mapCustomerSummary);
  }

  if (publicId) {
    const [rows] = await connection.execute(
      `SELECT id, public_id, phone, username
       FROM users
       WHERE role = 'customer' AND profile_completed = 1
         AND public_id = ?
       ORDER BY username ASC
       LIMIT 15`,
      [publicId],
    );
    return rows.map(mapCustomerSummary);
  }

  const [rows] = await connection.execute(
    `SELECT id, public_id, phone, username
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
  publicId: row.public_id || (row.id ? `SNH-U${String(row.id).padStart(6, '0')}` : null),
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
       u.public_id,
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
    `${USER_BASE_SELECT} WHERE u.id = ? FOR UPDATE`,
    [id]
  );
  return mapUser(rows[0]);
};

module.exports = {
  findByPhone,
  findById,
  findByPublicId,
  findByIdOrPublicId,
  searchCustomers,
  listEngagedPatients,
  findByIdForUpdate,
  createByPhone,
  completeProfile,
  isUserApproved,
  mapUser,
};
