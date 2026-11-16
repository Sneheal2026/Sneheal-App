const adminService = require('../services/admin.service');
const { success } = require('../utils/response');

const login = async (req, res) => {
  const { username, password } = req.body;
  const result = await adminService.login(username, password);
  return success(res, 'Admin authentication successful', result);
};

const me = async (req, res) => {
  return success(res, 'Admin profile retrieved', {
    user: {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role,
    },
  });
};

const getOverviewStats = async (_req, res) => {
  const stats = await adminService.getOverviewStats();
  return success(res, 'Admin stats retrieved', stats);
};

module.exports = {
  login,
  me,
  getOverviewStats,
};
