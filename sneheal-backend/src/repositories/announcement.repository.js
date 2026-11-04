const db = require('../config/db');

const mapRow = (row) => ({
  id: String(row.id),
  kind: row.kind,
  title: String(row.title),
  body: String(row.body),
  targetAndroidVersionCode:
    row.target_android_version_code == null
      ? null
      : Number(row.target_android_version_code),
  actionUrl: row.action_url ? String(row.action_url) : null,
  createdAt: row.created_at,
  readAt: row.read_at ?? null,
});

const findActiveForUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT a.id, a.kind, a.title, a.body, a.target_android_version_code,
            a.action_url, a.created_at, r.read_at
     FROM in_app_announcements a
     LEFT JOIN user_announcement_reads r
       ON r.announcement_id = a.id AND r.user_id = ?
     WHERE a.is_active = 1
       AND (a.starts_at IS NULL OR a.starts_at <= NOW())
       AND (a.ends_at IS NULL OR a.ends_at >= NOW())
     ORDER BY a.created_at DESC, a.id DESC`,
    [userId],
  );
  return rows.map(mapRow);
};

const markRead = async (userId, announcementId) => {
  await db.execute(
    `INSERT IGNORE INTO user_announcement_reads (user_id, announcement_id)
     VALUES (?, ?)`,
    [userId, announcementId],
  );
};

const markManyRead = async (userId, announcementIds) => {
  if (!announcementIds.length) return;

  const placeholders = announcementIds.map(() => '(?, ?)').join(', ');
  const values = announcementIds.flatMap((id) => [userId, id]);

  await db.execute(
    `INSERT IGNORE INTO user_announcement_reads (user_id, announcement_id)
     VALUES ${placeholders}`,
    values,
  );
};

const existsForUser = async (userId, announcementId) => {
  const [rows] = await db.execute(
    `SELECT id FROM in_app_announcements WHERE id = ? AND is_active = 1 LIMIT 1`,
    [announcementId],
  );
  if (rows.length === 0) {
    return { exists: false, alreadyRead: false };
  }

  const [readRows] = await db.execute(
    `SELECT 1 FROM user_announcement_reads
     WHERE user_id = ? AND announcement_id = ? LIMIT 1`,
    [userId, announcementId],
  );
  return { exists: true, alreadyRead: readRows.length > 0 };
};

module.exports = {
  findActiveForUser,
  markRead,
  markManyRead,
  existsForUser,
};
