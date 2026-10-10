const healthReportService = require('../services/healthReport.service');
const { success } = require('../utils/response');

const listReports = async (req, res) => {
  const reports = await healthReportService.listReports(req.user.sub);
  return success(res, 'Reports fetched successfully', reports);
};

const saveReport = async (req, res) => {
  const report = await healthReportService.saveReport(req.user.sub, req.file, req.body?.title);
  return success(res, 'Report saved successfully', report, 201);
};

const deleteReport = async (req, res) => {
  const result = await healthReportService.deleteReport(req.user.sub, req.params.id);
  return success(res, 'Report deleted successfully', result);
};

module.exports = {
  listReports,
  saveReport,
  deleteReport,
};
