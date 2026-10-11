const express = require('express');
const doctorController = require('../controllers/doctor.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, requireRole } = require('../middleware/validateAuth');

const router = express.Router();

router.use(authenticateToken, requireRole('doctor'));

router.get('/patients', asyncHandler(doctorController.listPatients));
router.get('/customers', asyncHandler(doctorController.searchCustomers));
router.get('/customers/:userId', asyncHandler(doctorController.getCustomer));
router.get('/customers/:userId/orders', asyncHandler(doctorController.listOrders));
router.get('/customers/:userId/prescriptions', asyncHandler(doctorController.listPrescriptions));
router.get('/customers/:userId/reports', asyncHandler(doctorController.listReports));
router.get(
  '/customers/:userId/reports/:reportId/file',
  asyncHandler(doctorController.downloadReportFile),
);

module.exports = router;
