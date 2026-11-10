/**
 * Admin Verification Helper Tool
 *
 * Usage:
 *   node scripts/manage-verification.js list
 *   node scripts/manage-verification.js approve <userId or phone>
 *   node scripts/manage-verification.js reject <userId or phone>
 *   node scripts/manage-verification.js approve-all-existing
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/config/db');

const listUsers = async () => {
  console.log('\n--- Doctor & Delivery Partner Verification Status ---');

  const [doctors] = await db.execute(`
    SELECT u.id, u.phone, u.username, u.role, dp.verification_status, dp.city, dp.state, dp.created_at
    FROM users u
    JOIN doctor_profiles dp ON dp.user_id = u.id
    ORDER BY u.id DESC
  `);

  console.log(`\nDoctors (${doctors.length}):`);
  if (doctors.length === 0) {
    console.log('  No registered doctors.');
  } else {
    console.table(doctors);
  }

  const [agents] = await db.execute(`
    SELECT u.id, u.phone, u.username, u.role, dap.verification_status, dap.created_at
    FROM users u
    JOIN delivery_agent_profiles dap ON dap.user_id = u.id
    ORDER BY u.id DESC
  `);

  console.log(`\nDelivery Agents (${agents.length}):`);
  if (agents.length === 0) {
    console.log('  No registered delivery agents.');
  } else {
    console.table(agents);
  }
};

const resolveUserId = async (identifier) => {
  if (/^\d+$/.test(identifier) && identifier.length < 9) {
    return Number(identifier);
  }

  const cleanPhone = String(identifier).replace(/\D/g, '');
  const [rows] = await db.execute(
    'SELECT id FROM users WHERE phone LIKE ? LIMIT 1',
    [`%${cleanPhone.slice(-10)}`],
  );

  if (rows.length === 0) {
    throw new Error(`No user found matching "${identifier}"`);
  }
  return rows[0].id;
};

const setStatus = async (identifier, newStatus) => {
  const userId = await resolveUserId(identifier);

  const [userRows] = await db.execute(
    'SELECT id, phone, username, role FROM users WHERE id = ?',
    [userId],
  );

  if (userRows.length === 0) {
    console.error(`User with ID ${userId} not found.`);
    return;
  }

  const user = userRows[0];
  console.log(`Updating user ID ${user.id} (${user.username || 'No name'}, ${user.phone}, role: ${user.role}) to "${newStatus}"...`);

  let affected = 0;
  if (user.role === 'doctor') {
    const [res] = await db.execute(
      'UPDATE doctor_profiles SET verification_status = ? WHERE user_id = ?',
      [newStatus, userId],
    );
    affected = res.affectedRows;
  } else if (user.role === 'delivery_agent') {
    const [res] = await db.execute(
      'UPDATE delivery_agent_profiles SET verification_status = ? WHERE user_id = ?',
      [newStatus, userId],
    );
    affected = res.affectedRows;
  } else {
    console.error(`User role is "${user.role}". Verification only applies to "doctor" or "delivery_agent".`);
    return;
  }

  if (affected > 0) {
    console.log(`Successfully updated verification status to "${newStatus}".`);
  } else {
    console.log(`No profile row found for user ID ${userId} in ${user.role}_profiles.`);
  }
};

const approveAllExisting = async () => {
  console.log('Grandfathering / approving all existing doctor & delivery agent profiles...');

  const [docRes] = await db.execute(
    "UPDATE doctor_profiles SET verification_status = 'approved'",
  );
  console.log(`Approved ${docRes.affectedRows} doctor profile(s).`);

  const [agentRes] = await db.execute(
    "UPDATE delivery_agent_profiles SET verification_status = 'approved'",
  );
  console.log(`Approved ${agentRes.affectedRows} delivery agent profile(s).`);

  console.log('All existing profiles are now marked as "approved".');
};

const main = async () => {
  const [,, command, target] = process.argv;

  try {
    if (!command || command === 'list') {
      await listUsers();
    } else if (command === 'approve') {
      if (!target) throw new Error('Please provide user ID or phone number: node scripts/manage-verification.js approve <id|phone>');
      await setStatus(target, 'approved');
      await listUsers();
    } else if (command === 'reject') {
      if (!target) throw new Error('Please provide user ID or phone number: node scripts/manage-verification.js reject <id|phone>');
      await setStatus(target, 'rejected');
      await listUsers();
    } else if (command === 'approve-all-existing') {
      await approveAllExisting();
      await listUsers();
    } else {
      console.log('Unknown command. Valid options: list, approve <id|phone>, reject <id|phone>, approve-all-existing');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.end();
  }
};

main();
