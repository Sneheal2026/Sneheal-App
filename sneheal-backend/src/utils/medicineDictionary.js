/**
 * Comprehensive Indian medicine dictionary — brands, generics, and brand→generic mappings.
 * Used for fuzzy-matching AI output, correcting typos, and enriching entries.
 */
const { isNonMedicineText } = require('./prescriptionFilters');

const KNOWN_BRANDS = [
  'Dolo', 'Crocin', 'Calpol', 'Combiflam', 'Flexon', 'Meftal', 'Meftal-Spas',
  'Augmentin', 'Moxikind', 'Moxikind-CV', 'Azee', 'Azithral', 'Zithromax',
  'Taxim', 'Taxim-O', 'Cefix', 'Zifi', 'Monocef', 'Cipro', 'Ciplox',
  'Pan', 'Pan-D', 'Pantocid', 'Rantac', 'Zinetac', 'Aciloc', 'Nexpro', 'Rablet',
  'Allegra', 'Montair', 'Telekast', 'Alex', 'Grilinctus', 'Cheston Cold', 'Sinarest',
  'T-Minic', 'Levolin', 'Asthalin', 'Foracort', 'Seroflo', 'Budecort', 'Deriphyllin',
  'Glycomet', 'Gluconorm', 'Ecosprin', 'Atorva', 'Telma', 'Telmikind',
  'Thyronorm', 'Eltroxin', 'Shelcal', 'Becosules', 'Folvite', 'Autrin',
  'Dexona', 'Wysolone', 'Oleanz', 'Valparin', 'Divaa', 'Encorate',
  'Emeset', 'Vomikind', 'Ondem', 'Perinorm',
  'Saridon', 'Disprin', 'Brufen', 'Voveran', 'Hifenac',
  'Amlokind', 'Stamlo', 'Amlong', 'Metolar', 'Concor', 'Betaloc',
  'Losar', 'Losacar', 'Tazloc', 'Ramipril', 'Envas',
  'Clavix', 'Deplatt', 'Eliquis', 'Xarelto',
  'Gemer', 'Amaryl', 'Jalra', 'Galvus', 'Januvia', 'Trajenta',
  'Mixtard', 'Lantus', 'Novorapid', 'Humalog', 'Actrapid',
  'Gabapin', 'Pregabalin', 'Pregalin', 'Tegrital', 'Eptoin',
  'Restyl', 'Alprax', 'Clonotril', 'Rivotril',
  'Serta', 'Nexito', 'Stalopam', 'Tryptomer', 'Prodep',
  'Urimax', 'Silodal', 'Finpecia', 'Fincar',
  'Candid', 'Zocon', 'Nizral', 'Zovirax',
  'Buscopan', 'Cyclopam', 'Spasmo Proxyvon', 'Drotin',
  'Duphaston', 'Deviry', 'Progynova', 'Susten',
  'Betadine', 'Soframycin', 'Mupirocin', 'Fucidin',
  'Avil', 'Cetcip', 'Levorid', 'Okacet',
  'Gelusil', 'Digene', 'Mucaine', 'Sucrafil',
  'Cremaffin', 'Dulcoflex', 'Looz', 'Duphalac',
  'Electral', 'Enerzal',
  'Calcimax', 'Gemcal', 'Cipcal', 'Uprise-D3', 'D-Rise',
  'Neurobion', 'Methylcobal', 'Meconerv',
  'Zenflox', 'Oflomac', 'Levoflox', 'Lquin',
  'Norflox', 'Nitrofurantoin', 'Furadantin',
  'Benadryl', 'Honitus', 'Kofarest', 'Ascoril', 'Ambrodil',
];

const KNOWN_GENERICS = [
  'Paracetamol', 'Ibuprofen', 'Diclofenac', 'Aceclofenac', 'Naproxen', 'Tramadol',
  'Mefenamic Acid', 'Piroxicam', 'Etoricoxib',
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Ofloxacin', 'Levofloxacin',
  'Metronidazole', 'Doxycycline', 'Cefixime', 'Cefpodoxime', 'Ceftriaxone',
  'Cephalexin', 'Clarithromycin', 'Erythromycin', 'Linezolid', 'Norfloxacin',
  'Nitrofurantoin', 'Ceftazidime', 'Cefuroxime',
  'Pantoprazole', 'Omeprazole', 'Rabeprazole', 'Esomeprazole', 'Ranitidine', 'Famotidine',
  'Domperidone', 'Ondansetron', 'Metoclopramide', 'Sucralfate',
  'Cetirizine', 'Levocetirizine', 'Fexofenadine', 'Chlorpheniramine', 'Pheniramine',
  'Montelukast', 'Dextromethorphan', 'Ambroxol', 'Guaifenesin', 'Bromhexine',
  'Salbutamol', 'Levosalbutamol', 'Theophylline', 'Budesonide', 'Fluticasone',
  'Formoterol', 'Salmeterol', 'Ipratropium', 'Tiotropium',
  'Prednisolone', 'Dexamethasone', 'Hydrocortisone', 'Methylprednisolone', 'Betamethasone',
  'Metformin', 'Glimepiride', 'Glipizide', 'Sitagliptin', 'Vildagliptin',
  'Linagliptin', 'Insulin', 'Pioglitazone', 'Dapagliflozin', 'Empagliflozin',
  'Atorvastatin', 'Rosuvastatin', 'Fenofibrate',
  'Amlodipine', 'Telmisartan', 'Losartan', 'Enalapril', 'Ramipril', 'Olmesartan',
  'Metoprolol', 'Atenolol', 'Bisoprolol', 'Propranolol', 'Carvedilol',
  'Clopidogrel', 'Aspirin', 'Warfarin', 'Apixaban', 'Rivaroxaban',
  'Levothyroxine', 'Thyroxine',
  'Gabapentin', 'Pregabalin', 'Carbamazepine', 'Phenytoin', 'Sodium Valproate',
  'Divalproex Sodium', 'Levetiracetam', 'Oxcarbazepine', 'Topiramate',
  'Clonazepam', 'Alprazolam', 'Lorazepam', 'Diazepam',
  'Sertraline', 'Escitalopram', 'Fluoxetine', 'Amitriptyline', 'Olanzapine',
  'Quetiapine', 'Risperidone', 'Aripiprazole',
  'Tamsulosin', 'Silodosin', 'Finasteride', 'Dutasteride',
  'Sildenafil', 'Tadalafil',
  'Clotrimazole', 'Fluconazole', 'Ketoconazole', 'Itraconazole', 'Terbinafine',
  'Acyclovir', 'Valacyclovir',
  'Permethrin', 'Ivermectin',
  'Hyoscine Butylbromide', 'Dicyclomine', 'Drotaverine', 'Mebeverine',
  'Albendazole', 'Mebendazole',
  'Folic Acid', 'Ferrous Sulfate', 'Ferrous Fumarate',
  'Calcium Carbonate', 'Calcium Citrate', 'Vitamin D3', 'Cholecalciferol',
  'Vitamin B12', 'Methylcobalamin', 'Multivitamin',
  'Lactulose', 'Bisacodyl', 'Polyethylene Glycol',
  'Aluminium Hydroxide', 'Magnesium Hydroxide',
  'ORS', 'Zinc',
  'Betahistine', 'Cinnarizine',
  'Mupirocin', 'Fusidic Acid', 'Silver Sulfadiazine',
  'Progesterone', 'Dydrogesterone',
  'Phenylephrine',
];

const ALL_MEDICINES = [...KNOWN_BRANDS, ...KNOWN_GENERICS];

const BRAND_TO_GENERIC = {
  'Dolo': 'Paracetamol',
  'Crocin': 'Paracetamol',
  'Calpol': 'Paracetamol',
  'Combiflam': 'Ibuprofen + Paracetamol',
  'Flexon': 'Ibuprofen + Paracetamol',
  'Meftal': 'Mefenamic Acid',
  'Meftal-Spas': 'Mefenamic Acid + Dicyclomine',
  'Saridon': 'Paracetamol + Propyphenazone + Caffeine',
  'Disprin': 'Aspirin',
  'Brufen': 'Ibuprofen',
  'Voveran': 'Diclofenac',
  'Hifenac': 'Aceclofenac',
  'Augmentin': 'Amoxicillin + Clavulanic Acid',
  'Moxikind': 'Amoxicillin',
  'Moxikind-CV': 'Amoxicillin + Clavulanic Acid',
  'Azee': 'Azithromycin',
  'Azithral': 'Azithromycin',
  'Zithromax': 'Azithromycin',
  'Taxim': 'Cefixime',
  'Taxim-O': 'Cefixime',
  'Cefix': 'Cefixime',
  'Zifi': 'Cefixime',
  'Monocef': 'Ceftriaxone',
  'Cipro': 'Ciprofloxacin',
  'Ciplox': 'Ciprofloxacin',
  'Zenflox': 'Ofloxacin',
  'Oflomac': 'Ofloxacin',
  'Levoflox': 'Levofloxacin',
  'Lquin': 'Levofloxacin',
  'Norflox': 'Norfloxacin',
  'Pan': 'Pantoprazole',
  'Pan-D': 'Pantoprazole + Domperidone',
  'Pantocid': 'Pantoprazole',
  'Rantac': 'Ranitidine',
  'Zinetac': 'Ranitidine',
  'Aciloc': 'Ranitidine',
  'Nexpro': 'Esomeprazole',
  'Rablet': 'Rabeprazole',
  'Allegra': 'Fexofenadine',
  'Montair': 'Montelukast',
  'Telekast': 'Montelukast',
  'Avil': 'Pheniramine',
  'Cetcip': 'Cetirizine',
  'Levorid': 'Levocetirizine',
  'Okacet': 'Cetirizine',
  'Alex': 'Dextromethorphan + Chlorpheniramine',
  'Grilinctus': 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
  'Ascoril': 'Salbutamol + Bromhexine + Guaifenesin',
  'Ambrodil': 'Ambroxol',
  'Benadryl': 'Diphenhydramine',
  'Cheston Cold': 'Cetirizine + Phenylephrine + Paracetamol',
  'Sinarest': 'Paracetamol + Phenylephrine + Chlorpheniramine + Caffeine',
  'T-Minic': 'Phenylephrine + Chlorpheniramine + Paracetamol',
  'Levolin': 'Levosalbutamol',
  'Asthalin': 'Salbutamol',
  'Foracort': 'Formoterol + Budesonide',
  'Seroflo': 'Salmeterol + Fluticasone',
  'Budecort': 'Budesonide',
  'Deriphyllin': 'Theophylline + Etofylline',
  'Glycomet': 'Metformin',
  'Gluconorm': 'Metformin',
  'Gemer': 'Glimepiride + Metformin',
  'Amaryl': 'Glimepiride',
  'Jalra': 'Vildagliptin',
  'Galvus': 'Vildagliptin',
  'Januvia': 'Sitagliptin',
  'Trajenta': 'Linagliptin',
  'Ecosprin': 'Aspirin',
  'Atorva': 'Atorvastatin',
  'Telma': 'Telmisartan',
  'Telmikind': 'Telmisartan',
  'Amlokind': 'Amlodipine',
  'Stamlo': 'Amlodipine',
  'Amlong': 'Amlodipine',
  'Metolar': 'Metoprolol',
  'Concor': 'Bisoprolol',
  'Betaloc': 'Metoprolol',
  'Losar': 'Losartan',
  'Losacar': 'Losartan',
  'Tazloc': 'Telmisartan + Amlodipine',
  'Envas': 'Enalapril',
  'Clavix': 'Clopidogrel',
  'Deplatt': 'Clopidogrel',
  'Eliquis': 'Apixaban',
  'Xarelto': 'Rivaroxaban',
  'Thyronorm': 'Levothyroxine',
  'Eltroxin': 'Levothyroxine',
  'Shelcal': 'Calcium + Vitamin D3',
  'Becosules': 'B-Complex + Vitamin C',
  'Folvite': 'Folic Acid',
  'Calcimax': 'Calcium + Vitamin D3',
  'Gemcal': 'Calcium + Vitamin D3',
  'Cipcal': 'Calcium + Vitamin D3',
  'Uprise-D3': 'Cholecalciferol',
  'D-Rise': 'Cholecalciferol',
  'Neurobion': 'Vitamin B1 + B6 + B12',
  'Methylcobal': 'Methylcobalamin',
  'Meconerv': 'Methylcobalamin',
  'Dexona': 'Dexamethasone',
  'Wysolone': 'Prednisolone',
  'Oleanz': 'Olanzapine',
  'Valparin': 'Sodium Valproate',
  'Divaa': 'Divalproex Sodium',
  'Encorate': 'Sodium Valproate',
  'Gabapin': 'Gabapentin',
  'Pregalin': 'Pregabalin',
  'Tegrital': 'Carbamazepine',
  'Eptoin': 'Phenytoin',
  'Restyl': 'Alprazolam',
  'Alprax': 'Alprazolam',
  'Clonotril': 'Clonazepam',
  'Rivotril': 'Clonazepam',
  'Serta': 'Sertraline',
  'Nexito': 'Escitalopram',
  'Stalopam': 'Escitalopram',
  'Tryptomer': 'Amitriptyline',
  'Prodep': 'Fluoxetine',
  'Emeset': 'Ondansetron',
  'Vomikind': 'Ondansetron',
  'Ondem': 'Ondansetron',
  'Perinorm': 'Metoclopramide',
  'Urimax': 'Tamsulosin',
  'Silodal': 'Silodosin',
  'Finpecia': 'Finasteride',
  'Fincar': 'Finasteride',
  'Candid': 'Clotrimazole',
  'Zocon': 'Fluconazole',
  'Nizral': 'Ketoconazole',
  'Zovirax': 'Acyclovir',
  'Buscopan': 'Hyoscine Butylbromide',
  'Cyclopam': 'Dicyclomine',
  'Drotin': 'Drotaverine',
  'Gelusil': 'Aluminium Hydroxide + Magnesium Hydroxide',
  'Digene': 'Aluminium Hydroxide + Magnesium Hydroxide',
  'Mucaine': 'Aluminium Hydroxide + Magnesium Hydroxide + Oxetacaine',
  'Sucrafil': 'Sucralfate',
  'Cremaffin': 'Liquid Paraffin + Milk of Magnesia',
  'Dulcoflex': 'Bisacodyl',
  'Looz': 'Lactulose',
  'Duphalac': 'Lactulose',
  'Duphaston': 'Dydrogesterone',
  'Deviry': 'Medroxyprogesterone',
  'Susten': 'Progesterone',
};

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

const findBestMatch = (token) => {
  const key = compact(token);
  if (key.length < 2) return null;

  let bestName = null;
  let bestScore = 0;

  for (const medicine of ALL_MEDICINES) {
    const candidate = compact(medicine);
    const score = similarity(key, candidate);

    if (score > bestScore) {
      bestScore = score;
      bestName = medicine;
    }
  }

  if (bestScore >= 0.72) return bestName;

  if (key.length >= 4) {
    for (const medicine of ALL_MEDICINES) {
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

const resolveGeneric = (name) => {
  if (!name) return '';
  if (BRAND_TO_GENERIC[name]) return BRAND_TO_GENERIC[name];
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (compact(brand) === compact(name)) return generic;
  }
  return '';
};

/**
 * Validate and enrich a medicine entry from Gemini output using
 * fuzzy matching against our dictionary.
 */
const correctMedicineEntry = (entry) => {
  const { detectedName, correctedName, strength, form, manufacturer } = entry;
  let { brandName, genericName, hasSpellingError } = entry;

  const namePart = correctedName
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b/gi, '')
    .replace(
      /\b(?:Tablet|Tablets|Capsule|Capsules|Syrup|Injection|Drops|Cream|Ointment|Gel|Suspension|Inhaler|Sachet)\b/gi,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const dictMatch = findBestMatch(namePart);

  let finalCorrected = correctedName;

  if (dictMatch && compact(dictMatch) !== compact(namePart)) {
    if (similarity(compact(namePart), compact(dictMatch)) >= 0.72) {
      finalCorrected = correctedName.replace(
        new RegExp(namePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        dictMatch,
      );
      if (compact(detectedName) !== compact(finalCorrected)) {
        hasSpellingError = true;
      }
    }
  }

  if (!brandName && dictMatch && BRAND_TO_GENERIC[dictMatch]) {
    brandName = dictMatch;
  }

  if (!genericName || genericName.length < 3) {
    const resolved = resolveGeneric(brandName || dictMatch || namePart);
    if (resolved) genericName = resolved;
  }

  if (!genericName && dictMatch && !BRAND_TO_GENERIC[dictMatch]) {
    genericName = dictMatch;
  }

  const parts = [finalCorrected];
  const hasStrengthInName = /\b\d+\s*(?:mg|mcg|g|ml|iu|%)\b/i.test(finalCorrected);
  if (strength && !hasStrengthInName) parts.push(strength);

  const displayName = parts.join(' ');

  return {
    detectedName,
    correctedName: displayName,
    brandName: brandName || '',
    genericName: genericName || '',
    manufacturer: manufacturer || '',
    strength: strength || '',
    form: form || '',
    hasSpellingError,
  };
};

module.exports = {
  KNOWN_BRANDS,
  KNOWN_GENERICS,
  BRAND_TO_GENERIC,
  findBestMatch,
  correctMedicineEntry,
};
