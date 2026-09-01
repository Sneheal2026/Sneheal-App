/**
 * Keep 50 unique medicines (one per generic_name) and delete the rest.
 * Usage: node scripts/trim-catalog-to-50.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sneheal',
    multipleStatements: true,
  });

  try {
    const [[before]] = await connection.query('SELECT COUNT(*) AS c FROM products');
    const [[uniqueBefore]] = await connection.query(
      `SELECT COUNT(DISTINCT generic_name) AS c
       FROM products
       WHERE generic_name IS NOT NULL AND generic_name <> ''`,
    );
    console.log(`Before: ${before.c} products, ${uniqueBefore.c} unique generics`);

    await connection.query(`
      CREATE TEMPORARY TABLE keep_ids AS
      SELECT id FROM (
        SELECT MIN(id) AS id
        FROM products
        WHERE generic_name IS NOT NULL AND generic_name <> ''
        GROUP BY generic_name
        ORDER BY MIN(id)
        LIMIT 50
      ) t
    `);

    const [[keepers]] = await connection.query('SELECT COUNT(*) AS c FROM keep_ids');
    console.log(`Keeping ${keepers.c} unique products`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM products WHERE id NOT IN (SELECT id FROM keep_ids)');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.query('UPDATE products SET is_featured = 0');
    await connection.query(`
      UPDATE products SET is_featured = 1
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM products ORDER BY rating DESC, id ASC LIMIT 12
        ) t
      )
    `);

    const [[after]] = await connection.query('SELECT COUNT(*) AS c FROM products');
    const [[featured]] = await connection.query(
      'SELECT COUNT(*) AS c FROM products WHERE is_featured = 1',
    );
    const [rows] = await connection.query(
      'SELECT id, name, generic_name, price, unit FROM products ORDER BY id',
    );

    console.log(`After: ${after.c} products, featured=${featured.c}`);
    rows.forEach((row, i) => {
      console.log(
        `${String(i + 1).padStart(2, ' ')}. ${row.name} | ${row.generic_name} | ₹${row.price} | ${row.unit}`,
      );
    });
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error('Trim failed:', err.message);
  process.exit(1);
});
