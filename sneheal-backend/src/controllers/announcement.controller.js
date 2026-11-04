const announcementService = require('../services/announcement.service');
const { success, fail } = require('../utils/response');

const listAnnouncements = async (req, res) => {
  const platform = String(req.query.platform || 'android').toLowerCase();
  const versionCode = Number(req.query.version_code);

  if (!Number.isFinite(versionCode) || versionCode < 0) {
    return fail(res, 400, 'Query parameter version_code is required');
  }

  const items = await announcementService.listForUser(
    req.user.sub,
    platform,
    versionCode,
  );
  const unreadCount = items.filter((item) => item.unread).length;

  return success(res, 'Announcements fetched successfully', { items, unreadCount });
};

const markRead = async (req, res) => {
  const result = await announcementService.markAnnouncementRead(
    req.user.sub,
    req.params.id,
  );
  return success(res, 'Announcement marked as read', result);
};

const markAllRead = async (req, res) => {
  const platform = String(req.body.platform || 'android').toLowerCase();
  const versionCode = Number(req.body.version_code);

  if (!Number.isFinite(versionCode) || versionCode < 0) {
    return fail(res, 400, 'version_code is required');
  }

  const result = await announcementService.markAllRead(
    req.user.sub,
    platform,
    versionCode,
  );
  return success(res, 'All announcements marked as read', result);
};

module.exports = {
  listAnnouncements,
  markRead,
  markAllRead,
};
