const AppError = require('../utils/AppError');
const announcementRepo = require('../repositories/announcement.repository');

const DEFAULT_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.sneheal.app';

const isApplicable = (row, platform, versionCode) => {
  if (row.kind === 'app_update') {
    if (platform !== 'android') return false;
    if (row.targetAndroidVersionCode == null) return false;
    return versionCode < row.targetAndroidVersionCode;
  }
  return true;
};

const toClientItem = (row) => {
  const unread = row.readAt == null;
  let actionUrl = row.actionUrl;

  if (row.kind === 'app_update' && !actionUrl) {
    actionUrl = DEFAULT_PLAY_STORE_URL;
  }

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    actionUrl,
    targetAndroidVersionCode: row.targetAndroidVersionCode,
    unread,
    createdAt: row.createdAt,
  };
};

const listForUser = async (userId, platform, versionCode) => {
  const rows = await announcementRepo.findActiveForUser(userId);
  return rows
    .filter((row) => isApplicable(row, platform, versionCode))
    .map(toClientItem);
};

const markAnnouncementRead = async (userId, announcementId) => {
  const id = Number(announcementId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError(400, 'Invalid announcement id');
  }

  const check = await announcementRepo.existsForUser(userId, id);
  if (!check.exists) {
    throw new AppError(404, 'Announcement not found');
  }

  await announcementRepo.markRead(userId, id);
  return { id: String(id), unread: false };
};

const markAllRead = async (userId, platform, versionCode) => {
  const items = await listForUser(userId, platform, versionCode);
  const unreadIds = items.filter((item) => item.unread).map((item) => Number(item.id));
  await announcementRepo.markManyRead(userId, unreadIds);
  return { marked: unreadIds.length };
};

module.exports = {
  listForUser,
  markAnnouncementRead,
  markAllRead,
};
