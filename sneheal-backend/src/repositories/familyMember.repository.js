const db = require('../config/db');

const parseJsonField = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const mapFamilyMember = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    relationship: row.relationship,
    gender: row.gender ?? null,
    ageYears: row.age_years != null ? Number(row.age_years) : null,
    bloodGroup: row.blood_group ?? null,
    allergies: parseJsonField(row.allergies, []),
    conditions: parseJsonField(row.conditions, []),
    currentMedicines: row.current_medicines ?? '',
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
};

const findByUserId = async (userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, name, relationship, gender, age_years, blood_group,
            allergies, conditions, current_medicines, created_at, updated_at
     FROM family_members
     WHERE user_id = ?
     ORDER BY created_at ASC`,
    [userId],
  );

  return rows.map(mapFamilyMember);
};

const findByIdAndUserId = async (id, userId, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, user_id, name, relationship, gender, age_years, blood_group,
            allergies, conditions, current_medicines, created_at, updated_at
     FROM family_members
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId],
  );

  return mapFamilyMember(rows[0]);
};

const create = async (userId, data, connection = db) => {
  const allergiesJson = JSON.stringify(data.allergies || []);
  const conditionsJson = JSON.stringify(data.conditions || []);

  const [result] = await connection.execute(
    `INSERT INTO family_members (
      user_id, name, relationship, gender, age_years, blood_group,
      allergies, conditions, current_medicines
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name,
      data.relationship || 'other',
      data.gender || null,
      data.ageYears != null ? Number(data.ageYears) : null,
      data.bloodGroup || null,
      allergiesJson,
      conditionsJson,
      data.currentMedicines || '',
    ],
  );

  return findByIdAndUserId(result.insertId, userId, connection);
};

const update = async (id, userId, data, connection = db) => {
  const allergiesJson = JSON.stringify(data.allergies || []);
  const conditionsJson = JSON.stringify(data.conditions || []);

  const [result] = await connection.execute(
    `UPDATE family_members
     SET name = ?, relationship = ?, gender = ?, age_years = ?, blood_group = ?,
         allergies = ?, conditions = ?, current_medicines = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.name,
      data.relationship || 'other',
      data.gender || null,
      data.ageYears != null ? Number(data.ageYears) : null,
      data.bloodGroup || null,
      allergiesJson,
      conditionsJson,
      data.currentMedicines || '',
      id,
      userId,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findByIdAndUserId(id, userId, connection);
};

module.exports = {
  mapFamilyMember,
  findByUserId,
  findByIdAndUserId,
  create,
  update,
};
