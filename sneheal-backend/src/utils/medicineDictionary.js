/**
 * Common Indian prescription medicines (generic + frequent brands).
 * Used to correct OCR/AI typos via fuzzy matching.
 */
const { isNonMedicineText } = require('./prescriptionFilters');

const COMMON_MEDICINES = [
  'Paracetamol',
  'Amoxicillin',
  'Azithromycin',
  'Ciprofloxacin',
  'Ofloxacin',
  'Levofloxacin',
  'Metronidazole',
  'Doxycycline',
  'Cefixime',
  'Cefpodoxime',
  'Ceftriaxone',
  'Cephalexin',
  'Clarithromycin',
  'Erythromycin',
  'Linezolid',
  'Ibuprofen',
  'Diclofenac',
  'Aceclofenac',
  'Naproxen',
  'Tramadol',
  'Pantoprazole',
  'Omeprazole',
  'Rabeprazole',
  'Esomeprazole',
  'Domperidone',
  'Ondansetron',
  'Metoclopramide',
  'Cetirizine',
  'Levocetirizine',
  'Montelukast',
  'Fexofenadine',
  'Chlorpheniramine',
  'Dextromethorphan',
  'Ambroxol',
  'Salbutamol',
  'Theophylline',
  'Prednisolone',
  'Dexamethasone',
  'Hydrocortisone',
  'Metformin',
  'Glimepiride',
  'Sitagliptin',
  'Insulin',
  'Atorvastatin',
  'Rosuvastatin',
  'Amlodipine',
  'Telmisartan',
  'Losartan',
  'Enalapril',
  'Metoprolol',
  'Atenolol',
  'Clopidogrel',
  'Aspirin',
  'Warfarin',
  'Levothyroxine',
  'Thyroxine',
  'Albendazole',
  'Aluminium Hydroxide',
  'Sucralfate',
  'Lactulose',
  'Bisacodyl',
  'ORS',
  'Zinc',
  'Ferrous Sulfate',
  'Folic Acid',
  'Calcium Carbonate',
  'Vitamin D3',
  'Vitamin B12',
  'Multivitamin',
  'Cough Syrup',
  'Betahistine',
  'Propranolol',
  'Gabapentin',
  'Pregabalin',
  'Carbamazepine',
  'Phenytoin',
  'Sodium Valproate',
  'Clonazepam',
  'Alprazolam',
  'Sertraline',
  'Escitalopram',
  'Fluoxetine',
  'Amitriptyline',
  'Tamsulosin',
  'Finasteride',
  'Sildenafil',
  'Tadalafil',
  'Clotrimazole',
  'Fluconazole',
  'Ketoconazole',
  'Acyclovir',
  'Permethrin',
  'Hyoscine Butylbromide',
  'Dicyclomine',
  'Meftal Spas',
  'Combiflam',
  'Crocin',
  'Dolo',
  'Calpol',
  'Augmentin',
  'Moxikind',
  'Azee',
  'Azithro',
  'Taxim',
  'Parac',
  'PCM',
  'Pan',
  'Pan-D',
  'Rantac',
  'Allegra',
  'Telekast',
  'Montair',
  'Thyronorm',
  'Ecosprin',
  'Atorva',
  'Telma',
  'Glycomet',
];

const CANONICAL_NAMES = {
  Azithro: 'Azithromycin',
  Azee: 'Azithromycin',
  Parac: 'Paracetamol',
  PCM: 'Paracetamol',
  Dolo: 'Paracetamol',
  Calpol: 'Paracetamol',
  Crocin: 'Paracetamol',
  Amox: 'Amoxicillin',
  Augmentin: 'Amoxicillin Clavulanate',
  Moxikind: 'Amoxicillin',
  Pantop: 'Pantoprazole',
  Pan: 'Pantoprazole',
  'Pan-D': 'Pantoprazole Domperidone',
  Omep: 'Omeprazole',
  Rantac: 'Ranitidine',
  Ceti: 'Cetirizine',
  Allegra: 'Fexofenadine',
  Mont: 'Montelukast',
  Montair: 'Montelukast',
  Telekast: 'Montelukast',
  Metform: 'Metformin',
  Glycomet: 'Metformin',
  Atorva: 'Atorvastatin',
  Telma: 'Telmisartan',
  Thyronorm: 'Levothyroxine',
  Ecosprin: 'Aspirin',
  Combiflam: 'Ibuprofen Paracetamol',
  Taxim: 'Cefixime',
};

const toCanonical = (name) => CANONICAL_NAMES[name] || name;

const compact = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const levenshtein = (a, b) => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const similarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }

  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
};

const findBestMedicineMatch = (token) => {
  const key = compact(token);
  if (key.length < 3) return null;

  let bestName = null;
  let bestScore = 0;

  for (const medicine of COMMON_MEDICINES) {
    const candidate = compact(medicine);
    const score = similarity(key, candidate);

    if (score > bestScore) {
      bestScore = score;
      bestName = medicine;
    }
  }

  // Require strong similarity to avoid wrong substitutions
  if (bestScore >= 0.72) {
    return bestName;
  }

  // Prefix match for common truncated Rx shorthand (e.g. Azithro -> Azithromycin)
  if (key.length >= 4) {
    for (const medicine of COMMON_MEDICINES) {
      const candidate = compact(medicine);
      if (candidate.startsWith(key) || key.startsWith(candidate.slice(0, Math.max(4, key.length)))) {
        if (similarity(key, candidate) >= 0.55) {
          return medicine;
        }
      }
    }
  }

  return null;
};

/**
 * Correct the generic portion of a full medicine label using dictionary fuzzy match.
 * Keeps strength and form suffix intact.
 */
const correctMedicineLabel = (label) => {
  const cleaned = String(label || '').trim();
  if (!cleaned || isNonMedicineText(cleaned)) return null;

  const strengthMatch = cleaned.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%))\b/i);
  const formMatch = cleaned.match(
    /\b(Tablet|Tablets|Capsule|Capsules|Syrup|Injection|Drops|Cream|Ointment|Suspension)\b/i,
  );

  const strength = strengthMatch ? strengthMatch[1].replace(/\s+/g, '') : null;
  const form = formMatch ? formMatch[1].replace(/s$/i, '') : null;

  let genericPart = cleaned
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b/gi, '')
    .replace(
      /\b(?:Tablet|Tablets|Capsule|Capsules|Syrup|Injection|Drops|Cream|Ointment|Suspension)\b/gi,
      '',
    )
    .trim();

  const correctedGeneric = toCanonical(findBestMedicineMatch(genericPart) || genericPart);
  if (!correctedGeneric || correctedGeneric.length < 3) return null;

  const parts = [correctedGeneric];
  if (strength) parts.push(strength);
  if (form) {
    parts.push(form.charAt(0).toUpperCase() + form.slice(1).toLowerCase());
  }

  return parts.join(' ');
};

const correctMedicineLabels = (labels) => {
  const seen = new Set();
  const result = [];

  for (const label of labels) {
    const corrected = correctMedicineLabel(label);
    if (!corrected) continue;

    const key = corrected.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(corrected);
    }
  }

  return result;
};

module.exports = {
  COMMON_MEDICINES,
  findBestMedicineMatch,
  correctMedicineLabel,
  correctMedicineLabels,
};
