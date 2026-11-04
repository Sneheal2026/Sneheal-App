const express = require('express');
const announcementController = require('../controllers/announcement.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

router.get('/', authenticateToken, asyncHandler(announcementController.listAnnouncements));

router.post(
  '/read-all',
  authenticateToken,
  asyncHandler(announcementController.markAllRead),
);

router.post(
  '/:id/read',
  authenticateToken,
  asyncHandler(announcementController.markRead),
);

module.exports = router;
