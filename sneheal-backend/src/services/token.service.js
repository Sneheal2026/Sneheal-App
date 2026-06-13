const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const refreshTokenRepo = require('../repositories/refreshToken.repository');

const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      profileCompleted: user.profileCompleted,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const getRefreshExpiry = () => {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

const issueTokens = async (user, connection) => {
  await refreshTokenRepo.deleteByUserId(user.id, connection);

  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshExpiry();

  await refreshTokenRepo.create(user.id, refreshToken, expiresAt, connection);

  return { accessToken, refreshToken };
};

module.exports = {
  signAccessToken,
  issueTokens,
};
