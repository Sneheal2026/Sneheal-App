/**
 * Go-live cleanup: remove all user-related test data.
 * Keeps medicine catalog (products + categories).
 *
 * Usage: node scripts/wipe-user-data.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { v2: cloudinary } = require('cloudinary');

const USER_TABLES = [
  'payments',
  'payment_webhook_events',
  'order_items',
  'orders',
  'prescriptions',
  'user_addresses',
  'doctor_profiles',
  'delivery_agent_profiles',
  'refresh_tokens',
  'otp_verifications',
  'users',
];

const KEEP_TABLES = ['products', 'categories'];

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sneheal',
};

const count = async (connection, table) => {
  const [rows] = await connection.query('SELECT COUNT(*) AS c FROM ??', [table]);
  return Number(rows[0].c);
};

const printCounts = async (connection, label) => {
  console.log(label);
  for (const table of [...USER_TABLES, ...KEEP_TABLES]) {
    console.log(`  ${table}=${await count(connection, table)}`);
  }
};

const deleteCloudinaryImages = async (publicIds) => {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  const folder = String(process.env.CLOUDINARY_FOLDER || 'Sneheall').trim() || 'Sneheall';

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('Cloudinary not configured; skipped image cleanup');
    return;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  let deleted = 0;
  if (publicIds.length > 0) {
    for (let i = 0; i < publicIds.length; i += 100) {
      const batch = publicIds.slice(i, i + 100);
      const result = await cloudinary.api.delete_resources(batch, { resource_type: 'image' });
      deleted += Object.values(result.deleted || {}).filter((status) => status === 'deleted').length;
    }
  }

  try {
    await cloudinary.api.delete_resources_by_prefix(folder, { resource_type: 'image' });
  } catch (err) {
    console.log(`Cloudinary folder cleanup skipped: ${err.message}`);
  }

  console.log(`Cloudinary: removed ${deleted} prescription image(s)`);
};

(async () => {
  const connection = await mysql.createConnection(dbConfig);

  const productsBefore = await count(connection, 'products');
  const categoriesBefore = await count(connection, 'categories');

  if (productsBefore < 1 || categoriesBefore < 1) {
    throw new Error('Catalog looks empty; aborting wipe');
  }

  await printCounts(connection, 'BEFORE wipe');

  const [rxRows] = await connection.query(
    `SELECT cloudinary_public_id AS id
     FROM prescriptions
     WHERE cloudinary_public_id IS NOT NULL AND cloudinary_public_id != ''`,
  );
  const publicIds = rxRows.map((row) => row.id).filter(Boolean);

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of USER_TABLES) {
    await connection.query('TRUNCATE TABLE ??', [table]);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const productsAfter = await count(connection, 'products');
  const categoriesAfter = await count(connection, 'categories');

  await printCounts(connection, 'AFTER wipe');

  if (productsAfter !== productsBefore || categoriesAfter !== categoriesBefore) {
    throw new Error('Catalog counts changed; inspect immediately');
  }

  for (const table of USER_TABLES) {
    if ((await count(connection, table)) !== 0) {
      throw new Error(`${table} was not emptied`);
    }
  }

  await connection.end();
  await deleteCloudinaryImages(publicIds);

  console.log('Wipe complete. Catalog intact. Ready for a fresh login.');
})().catch(async (err) => {
  console.error('WIPE FAILED:', err.message);
  process.exit(1);
});
