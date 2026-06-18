const { isNonMedicineText } = require('./prescriptionFilters');

const FORM_WORDS = new Set([
  'tablet',
  'tablets',
  'tab',
  'capsule',
  'capsules',
  'cap',
  'syrup',
  'syp',
  'injection',
  'inj',
  'cream',
  'ointment',
  'gel',
  'drops',
  'suspension',
  'susp',
]);

const SKIP_VALUES = new Set([
  'bd',
  'tds',
  'od',
  'sos',
  'hs',
  'stat',
  'prn',
  'ac',
  'pc',
  'before food',
  'after food',
  'tablet',
  'tablets',
  'capsule',
  'capsules',
  'syrup',
  'days',
  'day',
]);

// Only expand abbreviations that are unlikely to map to the wrong drug
const GENERIC_ALIASES = {
  parac: 'Paracetamol',
  paracetamol: 'Paracetamol',
  pcm: 'Paracetamol',
  acetaminophen: 'Paracetamol',
  dolo: 'Paracetamol',
  dolo650: 'Paracetamol',
  amox: 'Amoxicillin',
  amoxi: 'Amoxicillin',
  amoxicillin: 'Amoxicillin',
  azithro: 'Azithromycin',
  azithromycin: 'Azithromycin',
  azee: 'Azithromycin',
  cetirizine: 'Cetirizine',
  cetrizine: 'Cetirizine',
  montelukast: 'Montelukast',
  montel: 'Montelukast',
  pantoprazole: 'Pantoprazole',
  pantop: 'Pantoprazole',
  panto: 'Pantoprazole',
  omeprazole: 'Omeprazole',
  omep: 'Omeprazole',
  rabeprazole: 'Rabeprazole',
  rabep: 'Rabeprazole',
  metformin: 'Metformin',
  metform: 'Metformin',
  atorvastatin: 'Atorvastatin',
  ator: 'Atorvastatin',
  amlodipine: 'Amlodipine',
  amlo: 'Amlodipine',
  telmisartan: 'Telmisartan',
  telma: 'Telmisartan',
  levocetirizine: 'Levocetirizine',
  combiflam: 'Ibuprofen Paracetamol',
  ibuprofen: 'Ibuprofen',
  ibupro: 'Ibuprofen',
  diclofenac: 'Diclofenac',
  diclo: 'Diclofenac',
  aceclofenac: 'Aceclofenac',
  cefixime: 'Cefixime',
  cefix: 'Cefixime',
  ofloxacin: 'Ofloxacin',
  oflox: 'Ofloxacin',
  ciprofloxacin: 'Ciprofloxacin',
  cipro: 'Ciprofloxacin',
  metronidazole: 'Metronidazole',
  metro: 'Metronidazole',
  doxycycline: 'Doxycycline',
  doxy: 'Doxycycline',
  prednisolone: 'Prednisolone',
  predni: 'Prednisolone',
  pred: 'Prednisolone',
  dexamethasone: 'Dexamethasone',
  dexa: 'Dexamethasone',
  salbutamol: 'Salbutamol',
  salbut: 'Salbutamol',
  levothyroxine: 'Levothyroxine',
  thyrox: 'Levothyroxine',
  thyro: 'Levothyroxine',
};

const CONFIDENCE_RANK = {
  high: 3,
  medium: 2,
  low: 1,
};

const cleanText = (value) =>
  String(value || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+$/g, '')
    .trim();

const compactKey = (value) => cleanText(value).toLowerCase().replace(/[^a-z0-9]/g, '');

const capitalizeWords = (value) =>
  value
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (/^\d/.test(word) || /mg|ml|mcg|g|iu|%$/i.test(word)) {
        return word.replace(/mg/i, 'mg').replace(/ml/i, 'ml').replace(/mcg/i, 'mcg');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

const extractStrength = (value) => {
  const match = value.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%))\b/i);
  return match ? match[1].replace(/\s+/g, '') : null;
};

const extractForm = (value) => {
  const lower = value.toLowerCase();
  if (/\btab(?:let)?s?\b/.test(lower)) return 'Tablet';
  if (/\bcap(?:sule)?s?\b/.test(lower)) return 'Capsule';
  if (/\bsyr(?:up)?|syp\b/.test(lower)) return 'Syrup';
  if (/\binj(?:ection)?\b/.test(lower)) return 'Injection';
  if (/\bdrop?s?\b/.test(lower)) return 'Drops';
  if (/\boint(?:ment)?\b/.test(lower)) return 'Ointment';
  if (/\bcream\b/.test(lower)) return 'Cream';
  if (/\bsusp(?:ension)?\b/.test(lower)) return 'Suspension';
  return null;
};

const stripFormAndStrength = (value) =>
  cleanText(value)
    .replace(/\b(?:after|before)\s+(?:breakfast|lunch|dinner|food|meal|meals)\b/gi, '')
    .replace(/\b(?:for|x)\s*\d+\s*(?:days?|weeks?|months?|years?)\b/gi, '')
    .replace(/\b\d+\s*(?:days?|weeks?|months?|years?)\b/gi, '')
    .replace(/\b(?:in\s+the\s+)?(?:morning|evening|night|afternoon|bedtime)\b/gi, '')
    .replace(/\b(?:empty\s+stomach|with\s+food|with\s+milk|with\s+water)\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b/gi, '')
    .replace(/\b(?:tab(?:let)?s?|cap(?:sule)?s?|syr(?:up)?|syp|inj(?:ection)?|drops?|cream|ointment|susp(?:ension)?)\b\.?/gi, '')
    .replace(/\b(?:bd|tds|od|sos|hs|x|for)\b\.?/gi, '')
    .trim();

const resolveFromRawText = (rawText) => {
  const raw = cleanText(rawText);
  if (!raw) return null;

  const medicineToken = stripFormAndStrength(raw);
  const aliasKey = compactKey(medicineToken);

  if (GENERIC_ALIASES[aliasKey]) {
    return GENERIC_ALIASES[aliasKey];
  }

  // Try first word only for compound lines like "Tab Parac 500"
  const firstWord = compactKey(medicineToken.split(/\s+/)[0] || '');
  if (GENERIC_ALIASES[firstWord]) {
    return GENERIC_ALIASES[firstWord];
  }

  if (medicineToken.length >= 4) {
    return capitalizeWords(medicineToken);
  }

  return null;
};

const aiGenericMatchesRaw = (genericName, rawText) => {
  const generic = compactKey(genericName);
  const raw = compactKey(stripFormAndStrength(rawText));

  if (!generic || !raw) return false;
  if (raw.includes(generic) || generic.includes(raw)) return true;

  return Boolean(GENERIC_ALIASES[raw] && GENERIC_ALIASES[raw] === capitalizeWords(genericName));
};

const resolveGenericName = (item) => {
  const rawText = cleanText(item.rawText);
  const fromRaw = resolveFromRawText(rawText);

  if (fromRaw) {
    return fromRaw;
  }

  const aiGeneric = cleanText(item.genericName);
  const confidence = String(item.confidence || 'medium').toLowerCase();

  if (confidence === 'high' && aiGeneric && aiGenericMatchesRaw(aiGeneric, rawText)) {
    return capitalizeWords(aiGeneric);
  }

  return null;
};

const buildFullName = (item) => {
  const rawText = cleanText(item.rawText);
  const generic = resolveGenericName(item);

  if (!generic) {
    return null;
  }

  const strength =
    cleanText(item.strength) || extractStrength(rawText) || extractStrength(item.fullName || '');
  const form = cleanText(item.form) || extractForm(rawText) || extractForm(item.fullName || '');

  const parts = [generic];
  if (strength) parts.push(strength);
  if (form) parts.push(form);

  return parts.join(' ');
};

const isValidMedicineName = (name) => {
  const cleaned = cleanText(name);
  if (!cleaned || cleaned.length < 4) return false;
  if (isNonMedicineText(cleaned)) return false;

  const lower = cleaned.toLowerCase();
  if (SKIP_VALUES.has(lower)) return false;
  if (/^\d+(?:\.\d+)?(?:mg|ml|mcg|g)?$/i.test(cleaned)) return false;
  if (/^(?:after|before)\s+(?:food|meals)$/i.test(cleaned)) return false;
  if (FORM_WORDS.has(lower)) return false;

  return /[a-zA-Z]{3,}/.test(cleaned);
};

const hasMinimumConfidence = (confidence) =>
  (CONFIDENCE_RANK[String(confidence || 'medium').toLowerCase()] || 0) >= CONFIDENCE_RANK.medium;

const dedupeMedicines = (names) => {
  const seen = new Set();
  const result = [];

  for (const name of names) {
    const key = name.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }

  return result;
};

const normalizeMedicineList = (medicines) => {
  if (!Array.isArray(medicines)) return [];

  const normalized = medicines
    .filter((item) => item && typeof item === 'object')
    .filter((item) => hasMinimumConfidence(item.confidence))
    .filter((item) => cleanText(item.rawText).length > 0)
    .filter((item) => !isNonMedicineText(item.rawText))
    .filter((item) => !isNonMedicineText(item.genericName))
    .map((item) => buildFullName(item))
    .filter(isValidMedicineName);

  return dedupeMedicines(normalized).slice(0, 20);
};

module.exports = {
  normalizeMedicineList,
};
