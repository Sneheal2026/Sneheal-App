require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const migrations = [
  {
    name: 'idx_otp_active_lookup',
    sql: 'CREATE INDEX idx_otp_active_lookup ON otp_verifications (phone, is_used, expires_at)',
    skipCode: 'ER_DUP_KEYNAME',
  },
  {
    name: 'otp_column_hash',
    sql: 'ALTER TABLE otp_verifications MODIFY otp VARCHAR(64) NOT NULL',
    skipCode: null,
  },
];

const SQL_FILES = [
  '009_orders_payments.sql',
  '010_cod_payments.sql',
  '011_delete_unpaid_razorpay_drafts.sql',
];

const splitStatements = (sql) =>
  sql
    .split(';')
    .map((part) =>
      part
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(Boolean);

async function runSqlFile(filename) {
  const filePath = path.join(__dirname, '..', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitStatements(sql);

  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log(`Migration ${filename}: applied statement`);
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
        console.log(`Migration ${filename}: already applied (${err.code})`);
        continue;
      }
      throw err;
    }
  }
}

async function migrate() {
  for (const migration of migrations) {
    try {
      await db.execute(migration.sql);
      console.log(`Migration ${migration.name} applied`);
    } catch (err) {
      if (migration.skipCode && err.code === migration.skipCode) {
        console.log(`Migration ${migration.name} already applied`);
      } else {
        throw err;
      }
    }
  }

  for (const file of SQL_FILES) {
    await runSqlFile(file);
  }

  await db.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
