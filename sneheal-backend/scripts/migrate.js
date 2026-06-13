require('dotenv').config();
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
  await db.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
