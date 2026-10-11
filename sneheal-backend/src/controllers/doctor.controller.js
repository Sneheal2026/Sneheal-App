const doctorService = require('../services/doctor.service');
const { success } = require('../utils/response');

const searchCustomers = async (req, res) => {
  const customers = await doctorService.searchCustomers(req.query.q);
  return success(res, 'Customers fetched successfully', customers);
};

const listPatients = async (req, res) => {
  const patients = await doctorService.listEngagedPatients();
  return success(res, 'Patients fetched successfully', patients);
};

const getCustomer = async (req, res) => {
  const customer = await doctorService.getCustomer(req.params.userId);
  return success(res, 'Customer fetched successfully', customer);
};

const listOrders = async (req, res) => {
  const orders = await doctorService.listCustomerOrders(req.params.userId);
  return success(res, 'Orders fetched successfully', orders);
};

const listPrescriptions = async (req, res) => {
  const prescriptions = await doctorService.listCustomerPrescriptions(req.params.userId);
  return success(res, 'Prescriptions fetched successfully', prescriptions);
};

const listReports = async (req, res) => {
  const reports = await doctorService.listCustomerReports(req.params.userId);
  return success(res, 'Reports fetched successfully', reports);
};

const downloadReportFile = async (req, res) => {
  const file = await doctorService.getCustomerReportFile(
    req.params.userId,
    req.params.reportId,
  );
  const safeName = String(file.title || 'report').replace(/[^\w.\-]+/g, '_') || 'report';
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  return res.send(file.buffer);
};

module.exports = {
  searchCustomers,
  listPatients,
  getCustomer,
  listOrders,
  listPrescriptions,
  listReports,
  downloadReportFile,
};
