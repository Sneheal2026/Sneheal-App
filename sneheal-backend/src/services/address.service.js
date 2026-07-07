const addressRepo = require('../repositories/address.repository');
const AppError = require('../utils/AppError');
const { PHONE_REGEX } = require('../utils/phone');

const ADDRESS_TYPES = new Set(['home', 'work', 'other']);

const normalizePayload = (body = {}) => {
  const latitude = body.latitude ?? body.coords?.latitude;
  const longitude = body.longitude ?? body.coords?.longitude;

  return {
    addressLine: String(body.addressLine ?? '').trim(),
    flatNumber: String(body.flatNumber ?? '').trim(),
    landmark: String(body.landmark ?? '').trim(),
    receiverName: String(body.receiverName ?? '').trim(),
    mobile: String(body.mobile ?? '').trim(),
    type: body.type ?? 'home',
    customTypeLabel: String(body.customTypeLabel ?? '').trim(),
    latitude: latitude != null ? Number(latitude) : null,
    longitude: longitude != null ? Number(longitude) : null,
    isDefault: Boolean(body.isDefault),
  };
};

const validatePayload = (data) => {
  if (!data.addressLine) {
    throw new AppError(400, 'Address line is required');
  }

  if (!data.flatNumber) {
    throw new AppError(400, 'Flat or house number is required');
  }

  if (!data.receiverName || data.receiverName.length < 2) {
    throw new AppError(400, 'Receiver name must be at least 2 characters');
  }

  if (!PHONE_REGEX.test(data.mobile)) {
    throw new AppError(400, 'Valid 10-digit Indian mobile number is required');
  }

  if (!ADDRESS_TYPES.has(data.type)) {
    throw new AppError(400, 'Address type must be home, work, or other');
  }

  if (data.type === 'other' && !data.customTypeLabel) {
    throw new AppError(400, 'Custom label is required for other address type');
  }

  if (
    data.latitude == null ||
    data.longitude == null ||
    Number.isNaN(data.latitude) ||
    Number.isNaN(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    throw new AppError(400, 'Valid latitude and longitude are required');
  }
};

const applyDefaultRules = async (userId, data, connection) => {
  const count = await addressRepo.countByUserId(userId, connection);

  if (count === 0) {
    data.isDefault = true;
    return;
  }

  if (data.isDefault) {
    await addressRepo.clearDefaultForUser(userId, connection);
  }
};

const listAddresses = async (userId) => {
  return addressRepo.findByUserId(userId);
};

const createAddress = async (userId, body) => {
  const data = normalizePayload(body);
  validatePayload(data);
  await applyDefaultRules(userId, data);

  return addressRepo.create(userId, data);
};

const updateAddress = async (userId, addressId, body) => {
  const existing = await addressRepo.findByIdAndUserId(addressId, userId);

  if (!existing) {
    throw new AppError(404, 'Address not found');
  }

  const data = normalizePayload(body);
  validatePayload(data);

  const all = await addressRepo.findByUserId(userId);
  const isOnlyAddress = all.length <= 1;

  if (isOnlyAddress) {
    data.isDefault = true;
  } else if (data.isDefault) {
    await addressRepo.clearDefaultForUser(userId);
  } else if (existing.isDefault) {
    const other = all.find((item) => item.id !== String(addressId));

    if (other) {
      await addressRepo.clearDefaultForUser(userId);
      await addressRepo.update(other.id, userId, {
        addressLine: other.addressLine,
        flatNumber: other.flatNumber,
        landmark: other.landmark,
        receiverName: other.receiverName,
        mobile: other.mobile,
        type: other.type,
        customTypeLabel: other.customTypeLabel,
        latitude: other.coords.latitude,
        longitude: other.coords.longitude,
        isDefault: true,
      });
    }
  }

  const updated = await addressRepo.update(addressId, userId, data);

  if (!updated) {
    throw new AppError(404, 'Address not found');
  }

  return updated;
};

const deleteAddress = async (userId, addressId) => {
  const existing = await addressRepo.findByIdAndUserId(addressId, userId);

  if (!existing) {
    throw new AppError(404, 'Address not found');
  }

  const wasDefault = existing.isDefault;
  const deleted = await addressRepo.deleteById(addressId, userId);

  if (!deleted) {
    throw new AppError(404, 'Address not found');
  }

  if (wasDefault) {
    await addressRepo.promoteFirstAsDefault(userId);
  }

  return { deleted: true };
};

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
