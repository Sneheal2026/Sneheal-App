const crypto = require('crypto');
const { GoogleGenAI, Type } = require('@google/genai');
const AppError = require('../utils/AppError');
const { normalizeMedicineList } = require('../utils/medicineNormalizer');
const { correctMedicineLabels } = require('../utils/medicineDictionary');
const { isNonMedicineText } = require('../utils/prescriptionFilters');

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_VERSION = 'v2';
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

const TRANSCRIBE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: 'One prescription line copied exactly as written.',
      },
    },
  },
  required: ['lines'],
};

const PARSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    medicines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rawText: { type: Type.STRING },
          genericName: { type: Type.STRING },
          strength: { type: Type.STRING },
          form: { type: Type.STRING },
          confidence: { type: Type.STRING },
        },
        required: ['rawText', 'confidence'],
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

const transcribePrompt = `You are an OCR specialist for handwritten Indian prescriptions.

TASK: Read the prescription image and copy ONLY lines that contain MEDICINE NAMES.

INCLUDE:
- Lines with drug names (Parac, Amox, Pantop, etc.)
- Same line may include strength (500mg) and form (Tab/Cap)

DO NOT INCLUDE (skip these completely):
- After breakfast / before breakfast / before food / after food
- Before lunch / after lunch / before dinner / after dinner
- Duration only: 1 month, 5 days, x 7 days, for 2 weeks
- Dates, follow-up, review, advice, diagnosis
- Patient name, doctor name, address, signature
- Frequency-only lines: BD, TDS, OD, SOS, HS (without a medicine on that line)

Copy medicine lines exactly as written. Return {"lines": []} if none found.`;

const parsePrompt = (lines) => `You are a clinical pharmacist.

Below are medicine lines transcribed from a prescription:
${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}

TASK: Extract MEDICINE NAMES ONLY from the lines below.

STRICT RULES:
- Output medicines only. Never output instructions, timings, or durations as medicines.
- SKIP entirely: after breakfast, before breakfast, before food, after food, 1 month, 5 days, x 7 days, morning, evening, night.
- Use ONLY the lines provided. Never add medicines not present in the list.
- rawText must match a medicine line from the list (not an instruction line).
- genericName = drug name only (Paracetamol, Amoxicillin). Never "After Breakfast" or "1 Month".
- Expand common Indian abbreviations to full generic names when obvious:
  Parac/PCM/Dolo -> Paracetamol
  Amox -> Amoxicillin
  Azithro/Azee -> Azithromycin
  Pantop/Pan-D -> Pantoprazole
  Ceti -> Cetirizine
  Mont/Montair -> Montelukast
  Metform/Glycomet -> Metformin
- Include strength (500mg, 250mg) and form (Tablet, Capsule, Syrup) when present in the line.
- confidence = high if clearly readable, medium if partly unclear, low if mostly unclear.
- Exclude low-confidence items if the medicine name itself is not readable.

Return JSON only.`;

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

const transcribeLines = async (client, model, imageBuffer, mimeType) => {
  const result = await callGemini(
    client,
    model,
    [
      {
        inlineData: {
          mimeType,
          data: imageBuffer.toString('base64'),
        },
      },
      { text: transcribePrompt },
    ],
    TRANSCRIBE_SCHEMA,
  );

  return (result.lines || [])
    .map((line) => String(line || '').trim())
    .filter((line) => line.length > 2)
    .filter((line) => !isNonMedicineText(line));
};

const parseLinesToMedicines = async (client, model, lines) => {
  if (lines.length === 0) return [];

  const result = await callGemini(client, model, parsePrompt(lines), PARSE_SCHEMA);
  return normalizeMedicineList(result.medicines || []);
};

const extractWithModel = async (client, model, imageBuffer, mimeType) => {
  const lines = await withRetries(() => transcribeLines(client, model, imageBuffer, mimeType));

  console.log(`Transcribed ${lines.length} prescription line(s)`);

  if (lines.length === 0) {
    return [];
  }

  const medicines = await withRetries(() => parseLinesToMedicines(client, model, lines));
  return correctMedicineLabels(medicines);
};

/**
 * Two-pass extraction:
 * 1) Vision OCR -> exact lines
 * 2) Text parsing -> structured medicines
 * 3) Dictionary fuzzy correction
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
