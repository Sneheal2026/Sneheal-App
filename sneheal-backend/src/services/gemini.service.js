const crypto = require('crypto');
const { GoogleGenAI, Type } = require('@google/genai');
const AppError = require('../utils/AppError');
const { correctMedicineLabels } = require('../utils/medicineDictionary');
const { isNonMedicineText } = require('../utils/prescriptionFilters');

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_VERSION = 'v3';
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
  return cached.medicineNames;
};

const setCachedResult = (cacheKey, medicineNames) => {
  scanCache.set(cacheKey, { medicineNames, timestamp: Date.now() });
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
    medicines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Generic medicine name only, e.g. Paracetamol, Amoxicillin.',
          },
          strength: {
            type: Type.STRING,
            description: 'Dosage strength if visible, e.g. 500mg, 250mg. Empty string if not visible.',
          },
          form: {
            type: Type.STRING,
            description: 'Dosage form if visible: Tablet, Capsule, Syrup, Injection, Drops, Cream, Ointment, Suspension. Empty string if not visible.',
          },
          confidence: {
            type: Type.STRING,
            description: 'high, medium, or low — how clearly the medicine name is readable.',
          },
        },
        required: ['name', 'confidence'],
      },
    },
  },
  required: ['medicines'],
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError(500, 'Gemini API key not configured');
  return new GoogleGenAI({ apiKey });
};

const parseJsonResponse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new AppError(500, 'Could not parse prescription. Please try a clearer photo.');
  }

  try {
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError(500, 'Could not parse prescription. Please try a clearer photo.');
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

const extractPrompt = `You are a pharmacist reading an Indian prescription image.

YOUR ONLY JOB: Find medicine/drug names written in the prescription and return them.

WHAT IS A MEDICINE:
- Pharmaceutical drug names like Paracetamol, Amoxicillin, Pantoprazole, Cetirizine, Metformin
- Indian brand names like Dolo, Crocin, Augmentin, Pan-D, Montair, Azee, Combiflam, Glycomet
- Abbreviated names like Parac, PCM, Amox, Azithro, Pantop, Ceti, Mont

CONVERT ABBREVIATIONS TO GENERIC NAMES:
Dolo/Crocin/Calpol/PCM/Parac -> Paracetamol
Amox/Moxikind -> Amoxicillin
Augmentin -> Amoxicillin Clavulanate
Azee/Azithro -> Azithromycin
Pantop/Pan -> Pantoprazole
Pan-D -> Pantoprazole Domperidone
Ceti -> Cetirizine
Mont/Montair/Telekast -> Montelukast
Metform/Glycomet -> Metformin
Allegra -> Fexofenadine
Combiflam -> Ibuprofen Paracetamol
Ecosprin -> Aspirin
Atorva -> Atorvastatin
Telma -> Telmisartan
Thyronorm/Thyrox -> Levothyroxine
Taxim -> Cefixime
Rantac -> Ranitidine

WHAT IS NOT A MEDICINE — NEVER OUTPUT THESE:
- Dosage instructions: BD, TDS, OD, SOS, HS, STAT, PRN
- Timing: after food, before food, after breakfast, morning, evening, night, bedtime
- Duration: 5 days, 1 month, x 7 days, for 2 weeks
- Patient/doctor details: name, age, date, address, signature, phone number
- Advice text: follow up, review, rest, avoid, continue, diagnosis, complaints
- Pure numbers or dates

RULES:
1. Output ONLY the generic medicine name in the "name" field — nothing else.
2. Include strength (e.g. 500mg) and form (e.g. Tablet) in their separate fields ONLY if clearly visible.
3. If the medicine name is not readable at all, skip it entirely.
4. Do NOT invent medicines — only return what you can see written in the image.
5. Return {"medicines": []} if no medicines are found.`;

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

  const medicines = (result.medicines || [])
    .filter((item) => item && typeof item === 'object')
    .filter((item) => String(item.name || '').trim().length >= 3)
    .filter((item) => !isNonMedicineText(item.name))
    .filter((item) => {
      const conf = String(item.confidence || 'medium').toLowerCase();
      return conf === 'high' || conf === 'medium';
    });

  const names = medicines.map((item) => {
    const parts = [String(item.name).trim()];
    const strength = String(item.strength || '').trim();
    const form = String(item.form || '').trim();
    if (strength) parts.push(strength);
    if (form) parts.push(form);
    return parts.join(' ');
  });

  console.log(`Extracted ${names.length} medicine(s) from image`);

  return correctMedicineLabels(names);
};

/**
 * Single-pass extraction: image -> structured medicine names -> dictionary correction.
 */
const extractMedicineNames = async (imageBuffer, mimeType) => {
  const cacheKey = getCacheKey(imageBuffer);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log('Returning cached prescription scan result');
    return cached;
  }

  const client = getClient();
  let lastError = null;
  let sawRetryableError = false;

  for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
    try {
      const names = await extractWithModel(client, model, imageBuffer, mimeType);

      if (names.length > 0) {
        setCachedResult(cacheKey, names);
        return names;
      }

      lastError = new Error(`Model ${model} returned no medicines`);
    } catch (error) {
      lastError = error;
      if (error instanceof AppError) throw error;

      const message = error?.message || String(error);
      console.error(`Prescription scan failed on ${model}:`, message);

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
