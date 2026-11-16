const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminRepo = require('../repositories/admin.repository');
const AppError = require('../utils/AppError');

/**
 * Sign an admin JWT token
 */
const signAdminToken = (admin) => {
  return jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: 'admin',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * Admin login verification
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const admin = await adminRepo.findByUsername(username);
  if (!admin) {
    throw new AppError('Invalid admin credentials', 401);
  }

  if (!admin.isActive) {
    throw new AppError('Admin account is inactive. Please contact support.', 403);
  }

  const storedPassword = admin.password;
  let isMatch = false;

  const isBcrypt =
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$');

  if (isBcrypt) {
    isMatch = await bcrypt.compare(password, storedPassword);
  } else {
    // If entered directly into database as plaintext
    isMatch = storedPassword === password;
    // Automatically upgrade to bcrypt hash
    if (isMatch) {
      try {
        const hash = await bcrypt.hash(password, 10);
        await adminRepo.updatePasswordHash(admin.id, hash);
      } catch (_) {}
    }
  }

  if (!isMatch) {
    throw new AppError('Invalid admin credentials', 401);
  }

  await adminRepo.recordLoginSuccess(admin.id);

  const token = signAdminToken(admin);

  return {
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: 'admin',
    },
  };
};

/**
 * Retrieve system metrics
 */
const getOverviewStats = async () => {
  return await adminRepo.getOverviewStats();
};

module.exports = {
  login,
  getOverviewStats,
};
