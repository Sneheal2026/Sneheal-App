/**
 * Seeds the product catalog (categories + products).
 * Runs the SQL in migrations/007_seed_catalog.sql.
 *
 * Usage: node scripts/seed-catalog.js
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
  const sqlPath = path.join(__dirname, '..', 'migrations', '007_seed_catalog.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sneheal',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);

    const [[categories]] = await connection.query(
      'SELECT COUNT(*) AS count FROM categories',
    );
    const [[products]] = await connection.query(
      'SELECT COUNT(*) AS count FROM products',
    );

    console.log(
      `Catalog seeded: ${categories.count} categories, ${products.count} products`,
    );
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
