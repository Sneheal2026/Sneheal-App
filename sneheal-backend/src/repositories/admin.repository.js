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
  try {
    await pool.query(
      `UPDATE admin_users SET password_hash = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hash, id]
    );
  } catch (_) {
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
    safeCount(`SELECT COUNT(*) FROM doctor_profiles WHERE verification_status = 'pending'`),
    safeCount(`SELECT COUNT(*) FROM users WHERE role = 'delivery_agent'`),
    safeCount(`SELECT COUNT(*) FROM delivery_agent_profiles WHERE verification_status = 'pending'`),
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

/**
 * List all doctors with profile, clinic details, and verification status
 */
const listDoctors = async ({ status = 'all', search = '' } = {}) => {
  let sql = `
    SELECT 
      u.id,
      u.phone,
      u.username,
      u.language,
      u.profile_completed,
      u.created_at AS registered_at,
      dp.clinic_address_line,
      dp.city,
      dp.state,
      dp.pincode,
      dp.landmark,
      COALESCE(dp.verification_status, 'pending') AS verification_status,
      dp.updated_at AS verified_at
    FROM users u
    LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
    WHERE u.role = 'doctor'
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ` AND COALESCE(dp.verification_status, 'pending') = ?`;
    params.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    sql += ` AND (u.username LIKE ? OR u.phone LIKE ? OR dp.city LIKE ? OR dp.clinic_address_line LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += `
    ORDER BY 
      CASE WHEN COALESCE(dp.verification_status, 'pending') = 'pending' THEN 0 ELSE 1 END ASC,
      u.created_at DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: String(r.id),
    publicId: r.public_id || `SNH-D${String(r.id).padStart(5, '0')}`,
    username: r.username || 'Doctor',
    phone: r.phone || '',
    language: r.language || 'ENGLISH',
    profileCompleted: Boolean(r.profile_completed),
    registeredAt: r.registered_at,
    clinic: {
      addressLine: r.clinic_address_line || 'Not provided',
      city: r.city || '',
      state: r.state || '',
      pincode: r.pincode || '',
      landmark: r.landmark || '',
    },
    verificationStatus: r.verification_status,
    verifiedAt: r.verified_at,
  }));
};

/**
 * Update doctor verification status ('pending', 'approved', 'rejected')
 */
const updateDoctorVerificationStatus = async (userId, newStatus) => {
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(newStatus)) {
    throw new Error('Invalid verification status');
  }

  // Check if doctor profile exists
  const [existing] = await pool.query('SELECT user_id FROM doctor_profiles WHERE user_id = ?', [userId]);

  if (existing.length > 0) {
    await pool.query(
      `UPDATE doctor_profiles SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [newStatus, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO doctor_profiles (user_id, clinic_address_line, city, state, pincode, verification_status)
       VALUES (?, 'Address pending', '', '', '', ?)`,
      [userId, newStatus]
    );
  }

  return true;
};

/**
 * List all delivery agents WITHOUT heavy base64 columns for fast lightweight response
 */
const listDeliveryAgents = async ({ status = 'all', search = '' } = {}) => {
  let sql = `
    SELECT 
      u.id,
      u.phone,
      u.username,
      u.language,
      u.profile_completed,
      u.created_at AS registered_at,
      dap.aadhar_mime_type,
      dap.license_mime_type,
      (dap.aadhar_image_base64 IS NOT NULL AND dap.aadhar_image_base64 != '') AS has_aadhar,
      (dap.license_image_base64 IS NOT NULL AND dap.license_image_base64 != '') AS has_license,
      COALESCE(dap.verification_status, 'pending') AS verification_status,
      dap.updated_at AS verified_at
    FROM users u
    LEFT JOIN delivery_agent_profiles dap ON dap.user_id = u.id
    WHERE u.role = 'delivery_agent'
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ` AND COALESCE(dap.verification_status, 'pending') = ?`;
    params.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    sql += ` AND (u.username LIKE ? OR u.phone LIKE ?)`;
    params.push(term, term);
  }

  sql += `
    ORDER BY 
      CASE WHEN COALESCE(dap.verification_status, 'pending') = 'pending' THEN 0 ELSE 1 END ASC,
      u.created_at DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: String(r.id),
    publicId: `SNH-A${String(r.id).padStart(5, '0')}`,
    username: r.username || 'Delivery Agent',
    phone: r.phone || '',
    language: r.language || 'ENGLISH',
    profileCompleted: Boolean(r.profile_completed),
    registeredAt: r.registered_at,
    hasAadhar: Boolean(r.has_aadhar),
    hasLicense: Boolean(r.has_license),
    aadharMimeType: r.aadhar_mime_type || 'image/jpeg',
    licenseMimeType: r.license_mime_type || 'image/jpeg',
    verificationStatus: r.verification_status,
    verifiedAt: r.verified_at,
  }));
};

/**
 * Fetch a single document (Aadhar or License) on-demand
 */
const getDeliveryAgentDocument = async (userId, docType) => {
  const column = docType === 'license' ? 'license_image_base64' : 'aadhar_image_base64';
  const mimeColumn = docType === 'license' ? 'license_mime_type' : 'aadhar_mime_type';

  const [rows] = await pool.query(
    `SELECT ${column} AS image_base64, ${mimeColumn} AS mime_type FROM delivery_agent_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (rows.length === 0 || !rows[0].image_base64) {
    return null;
  }

  return {
    docType,
    mimeType: rows[0].mime_type || 'image/jpeg',
    imageBase64: rows[0].image_base64,
  };
};

/**
 * Update delivery agent verification status
 */
const updateDeliveryAgentVerificationStatus = async (userId, newStatus) => {
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(newStatus)) {
    throw new Error('Invalid verification status');
  }

  const [existing] = await pool.query('SELECT user_id FROM delivery_agent_profiles WHERE user_id = ?', [userId]);

  if (existing.length > 0) {
    await pool.query(
      `UPDATE delivery_agent_profiles SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [newStatus, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO delivery_agent_profiles (user_id, aadhar_image_base64, aadhar_mime_type, license_image_base64, license_mime_type, verification_status)
       VALUES (?, '', 'image/jpeg', '', 'image/jpeg', ?)`,
      [userId, newStatus]
    );
  }

  return true;
};

/**
 * List orders with customer info, agent info, payment details, and fulfillment status
 */
const listOrders = async ({ status = 'all', search = '' } = {}) => {
  let sql = `
    SELECT 
      o.id,
      o.public_id,
      o.user_id,
      COALESCE(u.username, o.receiver_name) AS customer_name,
      COALESCE(u.phone, o.mobile) AS customer_phone,
      o.receiver_name,
      o.mobile AS receiver_phone,
      o.address_line,
      o.flat_number,
      o.landmark,
      o.status,
      o.payment_status,
      o.grand_total_paise,
      o.item_mrp_paise,
      o.discount_paise,
      o.promo_paise,
      o.delivery_paise,
      o.currency,
      o.razorpay_order_id,
      o.created_at,
      o.delivered_at,
      o.assigned_agent_id,
      agent.username AS agent_name,
      agent.phone AS agent_phone,
      (SELECT provider FROM payments WHERE order_id = o.id ORDER BY id DESC LIMIT 1) AS payment_provider,
      (SELECT status FROM payments WHERE order_id = o.id ORDER BY id DESC LIMIT 1) AS payment_record_status
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN users agent ON agent.id = o.assigned_agent_id
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ` WHERE o.status = ?`;
    params.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const prefix = params.length > 0 ? ' AND' : ' WHERE';
    sql += `${prefix} (o.public_id LIKE ? OR o.receiver_name LIKE ? OR o.mobile LIKE ? OR u.username LIKE ? OR agent.username LIKE ?)`;
    params.push(term, term, term, term, term);
  }

  sql += ` ORDER BY o.created_at DESC`;

  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: String(r.id),
    publicId: r.public_id,
    userId: String(r.user_id),
    customer: {
      name: r.customer_name || 'Customer',
      phone: r.customer_phone || '',
    },
    receiver: {
      name: r.receiver_name,
      phone: r.receiver_phone,
      addressLine: r.address_line,
      flatNumber: r.flat_number,
      landmark: r.landmark,
    },
    pricing: {
      grandTotal: (Number(r.grand_total_paise) || 0) / 100,
      itemMrp: (Number(r.item_mrp_paise) || 0) / 100,
      discount: (Number(r.discount_paise) || 0) / 100,
      promoDiscount: (Number(r.promo_paise) || 0) / 100,
      deliveryFee: (Number(r.delivery_paise) || 0) / 100,
      currency: r.currency || 'INR',
    },
    status: r.status,
    payment: {
      status: r.payment_status,
      provider: r.payment_provider || (r.razorpay_order_id ? 'razorpay' : 'cod'),
      recordStatus: r.payment_record_status,
      razorpayOrderId: r.razorpay_order_id,
    },
    deliveryAgent: r.assigned_agent_id
      ? {
          id: String(r.assigned_agent_id),
          name: r.agent_name || 'Assigned Partner',
          phone: r.agent_phone || '',
          deliveredAt: r.delivered_at,
        }
      : null,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
  }));
};

/**
 * Fetch complete order details including order_items
 */
const getOrderDetails = async (orderId) => {
  const [orderRows] = await pool.query(
    `SELECT 
       o.*,
       u.username AS customer_name,
       u.phone AS customer_phone,
       agent.username AS agent_name,
       agent.phone AS agent_phone,
       pay.provider AS payment_provider
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN users agent ON agent.id = o.assigned_agent_id
     LEFT JOIN (
       SELECT order_id, provider FROM payments ORDER BY id DESC LIMIT 1
     ) pay ON pay.order_id = o.id
     WHERE o.id = ? OR o.public_id = ?
     LIMIT 1`,
    [orderId, orderId]
  );

  if (orderRows.length === 0) return null;
  const o = orderRows[0];

  const [itemRows] = await pool.query(
    `SELECT id, product_id, name, unit, image_url, unit_price_paise, mrp_paise, quantity, line_total_paise, prescription_required
     FROM order_items
     WHERE order_id = ?`,
    [o.id]
  );

  return {
    id: String(o.id),
    publicId: o.public_id,
    customer: {
      name: o.customer_name || o.receiver_name,
      phone: o.customer_phone || o.mobile,
    },
    receiver: {
      name: o.receiver_name,
      phone: o.mobile,
      addressLine: o.address_line,
      flatNumber: o.flat_number,
      landmark: o.landmark,
    },
    pricing: {
      grandTotal: (Number(o.grand_total_paise) || 0) / 100,
      itemMrp: (Number(o.item_mrp_paise) || 0) / 100,
      discount: (Number(o.discount_paise) || 0) / 100,
      promoDiscount: (Number(o.promo_paise) || 0) / 100,
      deliveryFee: (Number(o.delivery_paise) || 0) / 100,
      currency: o.currency || 'INR',
    },
    status: o.status,
    paymentStatus: o.payment_status,
    paymentProvider: o.payment_provider || (o.razorpay_order_id ? 'razorpay' : 'cod'),
    prescriptionId: o.prescription_id ? String(o.prescription_id) : null,
    prescriptionUrl: o.prescription_url || null,
    prescriptionStatus: o.prescription_status || 'not_required',
    prescriptionRejectedReason: o.prescription_rejected_reason || null,
    deliveryAgent: o.assigned_agent_id
      ? {
          id: String(o.assigned_agent_id),
          name: o.agent_name || 'Assigned Partner',
          phone: o.agent_phone || '',
          deliveredAt: o.delivered_at,
        }
      : null,
    items: itemRows.map((it) => ({
      id: String(it.id),
      productId: it.product_id ? String(it.product_id) : null,
      name: it.name,
      unit: it.unit,
      imageUrl: it.image_url,
      unitPrice: (Number(it.unit_price_paise) || 0) / 100,
      mrp: (Number(it.mrp_paise) || 0) / 100,
      quantity: Number(it.quantity) || 1,
      lineTotal: (Number(it.line_total_paise) || 0) / 100,
      prescriptionRequired: Boolean(it.prescription_required),
    })),
    createdAt: o.created_at,
    deliveredAt: o.delivered_at,
  };
};

/**
 * Update order fulfillment status
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const valid = ['awaiting_payment', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!valid.includes(newStatus)) {
    throw new Error('Invalid order status');
  }

  if (newStatus === 'delivered') {
    await pool.query(
      `UPDATE orders SET status = ?, delivered_at = CURRENT_TIMESTAMP WHERE id = ? OR public_id = ?`,
      [newStatus, orderId, orderId]
    );
  } else {
    await pool.query(
      `UPDATE orders SET status = ? WHERE id = ? OR public_id = ?`,
      [newStatus, orderId, orderId]
    );
  }

  return true;
};

const updateOrderPrescriptionStatus = async (orderId, newStatus, reason = null) => {
  const valid = ['not_required', 'pending_verification', 'verified', 'rejected'];
  if (!valid.includes(newStatus)) {
    throw new Error('Invalid prescription status');
  }

  await pool.query(
    `UPDATE orders
     SET prescription_status = ?,
         prescription_rejected_reason = ?
     WHERE id = ? OR public_id = ?`,
    [newStatus, reason ?? null, orderId, orderId]
  );

  return true;
};

/**
 * List customer uploaded prescriptions with full customer details
 */
const listPrescriptions = async ({ search = '' } = {}) => {
  let sql = `
    SELECT 
      p.id,
      p.user_id,
      p.image_url,
      p.cloudinary_public_id,
      p.created_at AS uploaded_at,
      u.username AS customer_name,
      u.phone AS customer_phone,
      u.created_at AS customer_registered_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = p.user_id) AS customer_order_count,
      (SELECT COUNT(*) FROM prescriptions WHERE user_id = p.user_id) AS total_customer_prescriptions,
      (SELECT CONCAT_WS(', ', flat_number, address_line) FROM user_addresses WHERE user_id = p.user_id ORDER BY is_default DESC, id DESC LIMIT 1) AS customer_primary_address
    FROM prescriptions p
    LEFT JOIN users u ON u.id = p.user_id
  `;
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    sql += ` WHERE (u.username LIKE ? OR u.phone LIKE ? OR p.id LIKE ?)`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: String(r.id),
    publicId: `SNH-RX${String(r.id).padStart(5, '0')}`,
    userId: String(r.user_id),
    imageUrl: r.image_url,
    cloudinaryPublicId: r.cloudinary_public_id,
    uploadedAt: r.uploaded_at,
    customer: {
      name: r.customer_name || 'Customer',
      phone: r.customer_phone || '',
      registeredAt: r.customer_registered_at,
      orderCount: Number(r.customer_order_count) || 0,
      totalPrescriptions: Number(r.total_customer_prescriptions) || 0,
      primaryAddress: r.customer_primary_address || 'No address saved yet',
    },
  }));
};

module.exports = {
  findByUsername,
  updatePasswordHash,
  recordLoginSuccess,
  getOverviewStats,
  listDoctors,
  updateDoctorVerificationStatus,
  listDeliveryAgents,
  getDeliveryAgentDocument,
  updateDeliveryAgentVerificationStatus,
  listOrders,
  getOrderDetails,
  updateOrderStatus,
  updateOrderPrescriptionStatus,
  listPrescriptions,
};
