require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  console.log('HOST=', process.env.DB_HOST);
  console.log('PORT=', process.env.DB_PORT || 3306);
  console.log('USER=', process.env.DB_USER);
  console.log('DB_NAME=', process.env.DB_NAME);

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sneheal',
  });

  const [dbs] = await c.query('SELECT DATABASE() AS current_db');
  console.log('CONNECTED TO=', dbs[0].current_db);

  const [tables] = await c.query("SHOW TABLES LIKE 'products'");
  console.log('products table exists=', tables.length > 0);

  const [count] = await c.query('SELECT COUNT(*) AS total FROM products');
  console.log('product count=', count[0].total);

  const [rows] = await c.query(
    'SELECT id, name, price, unit FROM products ORDER BY id',
  );
  console.table(rows);

  await c.end();
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
