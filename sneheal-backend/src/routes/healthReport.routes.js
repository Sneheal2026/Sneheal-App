const express = require('express');
const healthReportController = require('../controllers/healthReport.controller');
const { uploadHealthReport } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

router.get('/', authenticateToken, asyncHandler(healthReportController.listReports));

router.post(
  '/',
  authenticateToken,
  uploadHealthReport,
  asyncHandler(healthReportController.saveReport),
);

router.delete('/:id', authenticateToken, asyncHandler(healthReportController.deleteReport));

module.exports = router;
