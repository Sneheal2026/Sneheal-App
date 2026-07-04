const crypto = require('crypto');
const { GoogleGenAI, Type } = require('@google/genai');
const AppError = require('../utils/AppError');
const { correctMedicineEntry } = require('../utils/medicineDictionary');
const { isNonMedicineText } = require('../utils/prescriptionFilters');

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_VERSION = 'v4';
const CACHE_TTL_MS = 15 * 60 * 1000;

const scanCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCacheKey = (buffer) =>
  `${CACHE_VERSION}:${crypto.createHash('sha256').update(buffer).digest('hex')}`;

const getCachedResult = (cacheKey) => {
  const cached = scanCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    scanCache.delete(cacheKey);
    return null;
  }
  return cached.data;
};

const setCachedResult = (cacheKey, data) => {
  scanCache.set(cacheKey, { data, timestamp: Date.now() });
};

const isRetryableGeminiError = (message) => {
  const lower = message.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('resource_exhausted') ||
    lower.includes('overloaded') ||
    lower.includes('try again')
  );
};

const isModelMissingError = (message) => {
  const lower = message.toLowerCase();
  return (
    lower.includes('not found') ||
    lower.includes('not_found') ||
    lower.includes('is not supported')
  );
};

const GENERATION_CONFIG = {
  temperature: 0,
  topP: 1,
};

const EXTRACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    imageType: {
      type: Type.STRING,
      description: 'Type of image: "prescription", "medicine_pack", "medicine_strip", "medicine_bottle", "other"',
    },
    medicines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          detectedName: {
            type: Type.STRING,
            description: 'The EXACT medicine name as written/printed in the image, preserving brand names, abbreviations, and even misspellings.',
          },
          correctedName: {
            type: Type.STRING,
            description: 'The CORRECT proper medicine name after fixing any spelling mistakes. If detectedName is already correct, this should be the same as detectedName. For brand names, keep the brand name. For generics, keep the generic name.',
          },
          brandName: {
            type: Type.STRING,
            description: 'The Indian brand/trade name if identifiable (e.g. Dolo, Crocin, Augmentin, Pan-D). Empty string if only generic name is visible.',
          },
          genericName: {
            type: Type.STRING,
            description: 'The generic/salt name (e.g. Paracetamol, Amoxicillin + Clavulanic Acid). Always provide this.',
          },
          manufacturer: {
            type: Type.STRING,
            description: 'Manufacturer name if visible on medicine packaging. Empty string if not visible.',
          },
          strength: {
            type: Type.STRING,
            description: 'Dosage strength if visible, e.g. 500mg, 250mg, 650mg. Empty string if not visible.',
          },
          form: {
            type: Type.STRING,
            description: 'Dosage form if visible: Tablet, Capsule, Syrup, Injection, Drops, Cream, Ointment, Gel, Suspension, Inhaler, Sachet. Empty string if not visible.',
          },
          hasSpellingError: {
            type: Type.BOOLEAN,
            description: 'true if the detected name has a spelling mistake that was corrected.',
          },
          confidence: {
            type: Type.STRING,
            description: 'high, medium, or low — how clearly the medicine name is readable.',
          },
        },
        required: ['detectedName', 'correctedName', 'genericName', 'hasSpellingError', 'confidence'],
      },
    },
  },
  required: ['imageType', 'medicines'],
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError(500, 'Gemini API key not configured');
  return new GoogleGenAI({ apiKey });
};

const parseJsonResponse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new AppError(500, 'Could not read the image. Please try a clearer photo.');
  }

  try {
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError(500, 'Could not read the image. Please try a clearer photo.');
    }
    return JSON.parse(jsonMatch[0]);
  }
};

const callGemini = async (client, model, contents, schema) => {
  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      ...GENERATION_CONFIG,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  });

  return parseJsonResponse(response.text);
};

const extractPrompt = `You are an expert Indian pharmacist with deep knowledge of every medicine brand, generic drug, salt composition, and common prescription handwriting patterns used across India.

YOUR JOB: Analyze this image — it could be a PRESCRIPTION, a MEDICINE BOX/STRIP/BOTTLE photo, or any medicine-related image. Identify ALL medicines and return detailed, accurate information.

=== IMAGE TYPE DETECTION ===
First determine what kind of image this is:
- "prescription" — handwritten or printed doctor's prescription
- "medicine_pack" — photo of medicine box, carton, or outer packaging
- "medicine_strip" — photo of tablet/capsule strip or blister pack
- "medicine_bottle" — photo of syrup bottle, drops, injection vial
- "other" — any other medicine-related image

=== CRITICAL: PRESERVE THE ACTUAL NAME ===
DO NOT convert brand names to generic names in the "detectedName" or "correctedName" fields.
- If the prescription says "Dolo 650", detectedName = "Dolo 650", correctedName = "Dolo 650"
- If a medicine box says "Augmentin 625 Duo", detectedName = "Augmentin 625 Duo", correctedName = "Augmentin 625 Duo"
- If the prescription says "Crocin Advance", detectedName = "Crocin Advance", correctedName = "Crocin Advance"
- ONLY put the generic/salt name in the separate "genericName" field

=== SPELLING MISTAKE CORRECTION (BE INTELLIGENT) ===
Doctors have notoriously bad handwriting. You MUST intelligently correct misspellings:
- "Doloe 650" → correctedName: "Dolo 650" (hasSpellingError: true)
- "Paracetmol" → correctedName: "Paracetamol" (hasSpellingError: true)
- "Amoxycillin" → correctedName: "Amoxicillin" (hasSpellingError: true)
- "Augmnetin" → correctedName: "Augmentin" (hasSpellingError: true)
- "Azithrmycin" → correctedName: "Azithromycin" (hasSpellingError: true)
- "Pantaprazole" → correctedName: "Pantoprazole" (hasSpellingError: true)
- "Cetirizne" → correctedName: "Cetirizine" (hasSpellingError: true)
- "Montleukast" → correctedName: "Montelukast" (hasSpellingError: true)
- Use your pharmaceutical knowledge to identify the intended medicine even from badly written text

=== ABBREVIATION HANDLING ===
Common prescription abbreviations — detect and resolve them:
- PCM / Parac → correctedName: "Paracetamol", brandName: "", genericName: "Paracetamol"
- Amox → correctedName: "Amoxicillin", genericName: "Amoxicillin"
- Azithro → correctedName: "Azithromycin", genericName: "Azithromycin"
- Pantop → correctedName: "Pantoprazole", genericName: "Pantoprazole"
- Ceti → correctedName: "Cetirizine", genericName: "Cetirizine"
- Mont → correctedName: "Montelukast", genericName: "Montelukast"
- But if a full brand name is written (Dolo, Crocin, Augmentin), KEEP it as-is

=== COMMON INDIAN BRAND → GENERIC MAPPINGS (for genericName field only) ===
Dolo / Crocin / Calpol → Paracetamol
Combiflam → Ibuprofen + Paracetamol
Augmentin / Moxikind-CV → Amoxicillin + Clavulanic Acid
Azee / Azithral / Zithromax → Azithromycin
Pan / Pan-D / Pantocid → Pantoprazole (Pan-D = Pantoprazole + Domperidone)
Allegra → Fexofenadine
Montair / Telekast → Montelukast
Glycomet / Gluconorm → Metformin
Ecosprin → Aspirin
Atorva / Lipitor → Atorvastatin
Telma / Telmikind → Telmisartan
Thyronorm / Eltroxin → Levothyroxine
Taxim-O / Cefix → Cefixime
Rantac / Zinetac → Ranitidine
Shelcal → Calcium + Vitamin D3
Becosules → B-Complex + Vitamin C
Zifi → Cefixime
Monocef → Ceftriaxone
Cipro / Ciplox → Ciprofloxacin
Ceftas → Ceftazidime
Emeset → Ondansetron
Vomikind → Ondansetron
Ondem → Ondansetron
Meftal → Mefenamic Acid
Meftal-Spas → Mefenamic Acid + Dicyclomine
Flexon → Ibuprofen + Paracetamol
Aciloc → Ranitidine
Nexpro → Esomeprazole
Rablet → Rabeprazole
Oleanz → Olanzapine
Valparin → Sodium Valproate
Divaa → Divalproex Sodium
Encorate → Sodium Valproate
Folvite → Folic Acid
Dexona → Dexamethasone
Wysolone → Prednisolone
Deriphyllin → Theophylline + Etofylline
Asthalin → Salbutamol
Foracort → Formoterol + Budesonide
Seroflo → Salmeterol + Fluticasone
Budecort → Budesonide
Levolin → Levosalbutamol
T-Minic → Phenylephrine + Chlorpheniramine + Paracetamol
Alex → Dextromethorphan + Chlorpheniramine
Grilinctus → Dextromethorphan + Phenylephrine + Chlorpheniramine
Cheston Cold → Cetirizine + Phenylephrine + Paracetamol
Sinarest → Paracetamol + Phenylephrine + Chlorpheniramine + Caffeine

=== FOR MEDICINE PACKAGING PHOTOS ===
When scanning medicine box/strip/bottle photos:
- Read the BRAND NAME prominently displayed on the pack
- Read the GENERIC/SALT composition (usually printed smaller)
- Read the STRENGTH (e.g. 500mg, 650mg, 250mg/5ml)
- Read the FORM (Tablet, Capsule, Syrup, etc.)
- Read the MANUFACTURER name if visible
- Read batch number, expiry, MRP — but don't include these in medicine fields

=== WHAT IS NOT A MEDICINE — NEVER OUTPUT THESE ===
- Dosage instructions: BD, TDS, OD, SOS, HS, STAT, PRN, 1-0-1, 0-0-1
- Timing: after food, before food, morning, evening, night, bedtime
- Duration: 5 days, 1 month, x 7 days, for 2 weeks
- Patient/doctor details: name, age, date, address, signature, phone number, Reg. No.
- Advice text: follow up, review, rest, avoid, continue, diagnosis, complaints, Rx
- Pure numbers, dates, or prices

=== RULES ===
1. detectedName: EXACT text from image (preserve brand names, abbreviations, even typos)
2. correctedName: The CORRECT proper name after fixing any spelling errors. Keep brand names as brand names.
3. genericName: ALWAYS provide the generic/salt name, even if only a brand name is visible
4. If a medicine name is completely unreadable, skip it entirely
5. Do NOT invent medicines — only return what you can see in the image
6. Return {"imageType": "...", "medicines": []} if no medicines are found
7. For combination drugs, list the full combination (e.g. "Amoxicillin + Clavulanic Acid")`;

const withRetries = async (fn) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error instanceof AppError) throw error;

      const message = error?.message || String(error);
      if (isRetryableGeminiError(message) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

const extractWithModel = async (client, model, imageBuffer, mimeType) => {
  const result = await withRetries(() =>
    callGemini(
      client,
      model,
      [
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString('base64'),
          },
        },
        { text: extractPrompt },
      ],
      EXTRACT_SCHEMA,
    ),
  );

  const imageType = result.imageType || 'prescription';

  const medicines = (result.medicines || [])
    .filter((item) => item && typeof item === 'object')
    .filter((item) => String(item.correctedName || item.detectedName || '').trim().length >= 2)
    .filter((item) => !isNonMedicineText(item.correctedName || item.detectedName))
    .filter((item) => {
      const conf = String(item.confidence || 'medium').toLowerCase();
      return conf === 'high' || conf === 'medium';
    });

  const processed = medicines.map((item) => {
    const entry = correctMedicineEntry({
      detectedName: String(item.detectedName || '').trim(),
      correctedName: String(item.correctedName || item.detectedName || '').trim(),
      brandName: String(item.brandName || '').trim(),
      genericName: String(item.genericName || '').trim(),
      manufacturer: String(item.manufacturer || '').trim(),
      strength: String(item.strength || '').trim(),
      form: String(item.form || '').trim(),
      hasSpellingError: Boolean(item.hasSpellingError),
    });

    return entry;
  });

  const seen = new Set();
  const deduped = processed.filter((entry) => {
    const key = entry.correctedName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Extracted ${deduped.length} medicine(s) from ${imageType} image`);

  return { imageType, medicines: deduped };
};

/**
 * Intelligent extraction: image → structured medicine data with brand names,
 * spelling correction, and generic name resolution.
 */
const extractMedicineNames = async (imageBuffer, mimeType) => {
  const cacheKey = getCacheKey(imageBuffer);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log('Returning cached scan result');
    return cached;
  }

  const client = getClient();
  let lastError = null;
  let sawRetryableError = false;

  for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
    try {
      const data = await extractWithModel(client, model, imageBuffer, mimeType);

      if (data.medicines.length > 0) {
        setCachedResult(cacheKey, data);
        return data;
      }

      lastError = new Error(`Model ${model} returned no medicines`);
    } catch (error) {
      lastError = error;
      if (error instanceof AppError) throw error;

      const message = error?.message || String(error);
      console.error(`Scan failed on ${model}:`, message);

      if (isRetryableGeminiError(message)) sawRetryableError = true;
      if (!isModelMissingError(message) && !isRetryableGeminiError(message)) break;
    }
  }

  const message = lastError?.message || 'Unknown Gemini error';

  if (message.includes('API key') || message.includes('API_KEY_INVALID')) {
    throw new AppError(500, 'AI service configuration error');
  }

  if (sawRetryableError) {
    throw new AppError(503, 'AI service is busy right now. Please wait a few seconds and try again.');
  }

  throw new AppError(
    500,
    'Could not read medicines clearly. Try a clearer photo with good lighting.',
  );
};

module.exports = {
  extractMedicineNames,
};
