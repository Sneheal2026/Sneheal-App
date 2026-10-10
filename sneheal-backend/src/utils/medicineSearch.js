/**
 * Catalog search is by medicine name.
 * Strength, form, and spaces never decide whether a medicine is found.
 * "Thyronorm 75 mcg" and "Thyronorm 75mcg" both match the name Thyronorm.
 * The strength only moves the closest pack to the top.
 */

const FORM_WORDS = new Set([
  'tab',
  'tabs',
  'tablet',
  'tablets',
  'cap',
  'caps',
  'capsule',
  'capsules',
  'syrup',
  'syrups',
  'injection',
  'injections',
  'inj',
  'drop',
  'drops',
  'cream',
  'creams',
  'ointment',
  'ointments',
  'gel',
  'gels',
  'suspension',
  'suspensions',
  'inhaler',
  'inhalers',
  'sachet',
  'sachets',
  'bottle',
  'strip',
  'strips',
  'powder',
  'lotion',
  'spray',
]);

const FILLER_WORDS = new Set([
  'sodium',
  'hydrochloride',
  'hcl',
  'sulphate',
  'sulfate',
  'potassium',
  'chloride',
  'citrate',
  'maleate',
  'mesylate',
  'phosphate',
  'acetate',
  'dihydrate',
  'monohydrate',
  'anhydrous',
  'tartrate',
  'succinate',
  'besylate',
  'hydrobromide',
]);

const escapeLike = (value) => String(value).replace(/[\\%_]/g, '\\$&');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeMedicineQuery = (raw) => {
  let text = String(raw || '').toLowerCase().replace(/[µμ]/g, 'u');
  text = text.replace(/(\d+(?:\.\d+)?)\s*micrograms?\b/g, '$1mcg');
  text = text.replace(/(\d+(?:\.\d+)?)\s*milligrams?\b/g, '$1mg');
  text = text.replace(/(\d+(?:\.\d+)?)\s*millilit(?:re|er)s?\b/g, '$1ml');
  text = text.replace(/(\d+(?:\.\d+)?)\s*ugs?\b/g, '$1mcg');
  text = text.replace(/(\d+(?:\.\d+)?)\s*(?:grams?|gms|gm|g)\b/g, '$1g');
  text = text.replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|iu|%)/g, '$1$2');
  text = text.replace(/[^a-z0-9%/+.\-]+/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
};

const isStrengthToken = (token) => /^\d+(?:\.\d+)?(?:mg|mcg|g|ml|iu|%)/.test(token);

const splitTokens = (normalized) => {
  const parts = [];

  normalized.split(' ').forEach((part) => {
    if (!part) return;
    const pieces = part.split('-');
    const canSplit = pieces.length > 1 && pieces.every((piece) => piece.length >= 3);
    if (canSplit) {
      pieces.forEach((piece) => parts.push(piece));
      return;
    }
    parts.push(part);
  });

  return parts;
};

/**
 * Name words find the medicine. Strength words only rank it.
 */
const planMedicineSearch = (raw) => {
  const normalized = normalizeMedicineQuery(raw);
  if (normalized.length < 2) return null;

  const names = [];
  const strengths = [];

  splitTokens(normalized).forEach((token) => {
    if (token.length < 2 || FORM_WORDS.has(token)) return;
    if (isStrengthToken(token)) {
      strengths.push(token.replace(/[^a-z0-9.]/g, ''));
      return;
    }
    if (token.length >= 3 && /[a-z]/.test(token)) names.push(token);
  });

  const distinctive = names.filter((token) => !FILLER_WORDS.has(token));
  const chosen = (distinctive.length ? distinctive : names)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);

  return {
    normalized,
    names: chosen,
    strengths: strengths.slice(0, 2),
  };
};

const NAME_COMPACT = `REPLACE(REPLACE(REPLACE(LOWER(CONCAT_WS(' ', IFNULL(name,''), IFNULL(brand_name,''), IFNULL(generic_name,''))), ' ', ''), '-', ''), '/', '')`;

const NAME_TEXT = `LOWER(CONCAT_WS(' ', IFNULL(name,''), IFNULL(brand_name,''), IFNULL(generic_name,'')))`;

const STRENGTH_COMPACT = `REPLACE(REPLACE(REPLACE(LOWER(CONCAT_WS(' ', IFNULL(name,''), IFNULL(brand_name,''), IFNULL(generic_name,''), IFNULL(strength,''))), ' ', ''), '-', ''), '/', '')`;

const wordBoundary = (token) => `(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`;

const buildNameSearch = (plan) => {
  if (!plan) return null;

  const whereParts = [];
  const whereParams = [];
  const scoreParts = [];
  const scoreParams = [];

  plan.names.forEach((token) => {
    const compact = token.replace(/[^a-z0-9.]/g, '');
    const like = `%${escapeLike(compact)}%`;

    if (compact.length <= 4) {
      const pattern = wordBoundary(compact);
      whereParts.push(`${NAME_TEXT} REGEXP ?`);
      whereParams.push(pattern);
      scoreParts.push(
        `(CASE WHEN LOWER(CONCAT_WS(' ', IFNULL(name,''), IFNULL(brand_name,''))) REGEXP ? THEN 24
               WHEN ${NAME_TEXT} REGEXP ? THEN 12 ELSE 0 END)`,
      );
      scoreParams.push(pattern, pattern);
      return;
    }

    whereParts.push(`${NAME_COMPACT} LIKE ?`);
    whereParams.push(like);
    scoreParts.push(
      `(CASE WHEN REPLACE(REPLACE(REPLACE(LOWER(CONCAT_WS(' ', IFNULL(name,''), IFNULL(brand_name,''))), ' ', ''), '-', ''), '/', '') LIKE ? THEN ?
             WHEN ${NAME_COMPACT} LIKE ? THEN 10 ELSE 0 END)`,
    );
    scoreParams.push(like, 12 + compact.length, like);
  });

  if (!whereParts.length) {
    plan.strengths.forEach((token) => {
      const like = `%${escapeLike(token)}%`;
      whereParts.push(`${STRENGTH_COMPACT} LIKE ?`);
      whereParams.push(like);
      scoreParts.push(`(CASE WHEN ${STRENGTH_COMPACT} LIKE ? THEN 8 ELSE 0 END)`);
      scoreParams.push(like);
    });
  } else {
    plan.strengths.forEach((token) => {
      const like = `%${escapeLike(token)}%`;
      scoreParts.push(`(CASE WHEN ${STRENGTH_COMPACT} LIKE ? THEN 8 ELSE 0 END)`);
      scoreParams.push(like);
    });
  }

  if (!whereParts.length) return null;

  return {
    whereSql: whereParts.join(' OR '),
    whereParams,
    scoreSql: scoreParts.join(' + '),
    scoreParams,
  };
};

module.exports = {
  normalizeMedicineQuery,
  planMedicineSearch,
  buildNameSearch,
  escapeLike,
};
