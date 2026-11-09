const familyMemberRepo = require('../repositories/familyMember.repository');
const AppError = require('../utils/AppError');

const VALID_RELATIONSHIPS = new Set([
  'self',
  'spouse',
  'parent',
  'child',
  'sibling',
  'other',
]);

const VALID_GENDERS = new Set([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
]);

const VALID_BLOOD_GROUPS = new Set([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'unknown',
]);

const normalizePayload = (body = {}) => {
  const ageYears =
    body.ageYears != null && body.ageYears !== ''
      ? Number(body.ageYears)
      : null;

  return {
    name: String(body.name ?? '').trim(),
    relationship: body.relationship ? String(body.relationship).trim().toLowerCase() : 'other',
    gender: body.gender ? String(body.gender).trim().toLowerCase() : null,
    ageYears: ageYears != null && !Number.isNaN(ageYears) ? ageYears : null,
    bloodGroup: body.bloodGroup ? String(body.bloodGroup).trim() : null,
    allergies: Array.isArray(body.allergies)
      ? body.allergies.map(String).map((s) => s.trim()).filter(Boolean)
      : [],
    conditions: Array.isArray(body.conditions)
      ? body.conditions.map(String).map((s) => s.trim()).filter(Boolean)
      : [],
    currentMedicines: String(body.currentMedicines ?? '').trim(),
  };
};

const validatePayload = (data) => {
  if (!data.name || data.name.length < 1) {
    throw new AppError(400, 'Member name is required');
  }

  if (data.relationship && !VALID_RELATIONSHIPS.has(data.relationship)) {
    throw new AppError(400, `Invalid relationship: ${data.relationship}`);
  }

  if (data.gender && !VALID_GENDERS.has(data.gender)) {
    throw new AppError(400, `Invalid gender: ${data.gender}`);
  }

  if (data.bloodGroup && !VALID_BLOOD_GROUPS.has(data.bloodGroup)) {
    throw new AppError(400, `Invalid blood group: ${data.bloodGroup}`);
  }

  if (data.ageYears != null) {
    if (Number.isNaN(data.ageYears) || data.ageYears < 0 || data.ageYears > 130) {
      throw new AppError(400, 'Age must be between 0 and 130');
    }
  }
};

const listFamilyMembers = async (userId) => {
  return familyMemberRepo.findByUserId(userId);
};

const createFamilyMember = async (userId, body) => {
  const data = normalizePayload(body);
  validatePayload(data);
  return familyMemberRepo.create(userId, data);
};

const updateFamilyMember = async (userId, id, body) => {
  const existing = await familyMemberRepo.findByIdAndUserId(id, userId);
  if (!existing) {
    throw new AppError(404, 'Family member not found');
  }

  const data = normalizePayload(body);
  validatePayload(data);

  const updated = await familyMemberRepo.update(id, userId, data);
  if (!updated) {
    throw new AppError(404, 'Family member not found');
  }

  return updated;
};

module.exports = {
  listFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
};
