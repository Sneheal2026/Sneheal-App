/**
 * Detect prescription instruction/duration/date text that is NOT a medicine name.
 */

const INSTRUCTION_PHRASES = [
  'after breakfast',
  'before breakfast',
  'after lunch',
  'before lunch',
  'after dinner',
  'before dinner',
  'after food',
  'before food',
  'after meal',
  'before meal',
  'after meals',
  'before meals',
  'empty stomach',
  'empty stomache',
  'with food',
  'with milk',
  'with water',
  'at bedtime',
  'at night',
  'in morning',
  'in the morning',
  'in evening',
  'in the evening',
  'take rest',
  'follow up',
  'follow-up',
  'review after',
  'as needed',
  'as directed',
  'as advised',
];

const INSTRUCTION_PATTERNS = [
  /^(?:after|before)\s+(?:breakfast|lunch|dinner|food|meal|meals)\b/i,
  /^(?:for|x)\s*\d+\s*(?:day|days|week|weeks|month|months|year|years)\b/i,
  /^\d+\s*(?:day|days|week|weeks|month|months|year|years)\b/i,
  /^(?:one|two|three|four|five|six|\d+)\s*(?:month|months|week|weeks|day|days)\b/i,
  /^(?:morning|evening|night|noon|bedtime|afternoon)\b/i,
  /^(?:bd|tds|od|sos|hs|stat|prn|ac|pc)\b\.?$/i,
  /^(?:tab|cap|syr|inj|syp)\.?$/i,
  /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/,
  /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
  /^review\b/i,
  /^advice\b/i,
  /^diagnosis\b/i,
  /^complaints?\b/i,
  /^patient\b/i,
  /^doctor\b/i,
  /^dr\.?\s/i,
  /^age\b/i,
  /^date\b/i,
  /^rx\b/i,
  /^take\b/i,
  /^continue\b/i,
  /^stop\b/i,
  /^avoid\b/i,
];

const hasMedicineSignal = (text) => {
  const lower = text.toLowerCase();

  return (
    /\b\d+\s*(?:mg|mcg|g|ml|iu|%)\b/i.test(text) ||
    /\b(?:tab(?:let)?s?|cap(?:sule)?s?|syr(?:up)?|syp|inj(?:ection)?|drops?|cream|ointment|susp(?:ension)?)\b/i.test(
      lower,
    ) ||
    /\b(?:paracetamol|amoxicillin|azithromycin|pantoprazole|omeprazole|cetirizine|metformin|ibuprofen|diclofenac)\b/i.test(
      lower,
    ) ||
    /\b(?:parac|pcm|amox|azithro|pantop|dolo|crocin|allegra|montair|glycomet|taxim)\b/i.test(lower)
  );
};

const isNonMedicineText = (text) => {
  const cleaned = String(text || '').trim();
  if (!cleaned) return true;

  const lower = cleaned.toLowerCase();

  if (INSTRUCTION_PHRASES.some((phrase) => lower.includes(phrase))) {
    return !hasMedicineSignal(cleaned);
  }

  if (INSTRUCTION_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    return !hasMedicineSignal(cleaned);
  }

  // Pure duration like "1 month" or "5 days"
  if (/^\d+\s*(?:day|days|week|weeks|month|months|year|years)$/i.test(cleaned)) {
    return true;
  }

  // Words only, no medicine-like token, very short instruction
  if (!hasMedicineSignal(cleaned) && cleaned.split(/\s+/).length <= 4) {
    if (
      /^(?:after|before|for|x|take|continue|review|follow)\b/i.test(cleaned) &&
      !/[a-z]{5,}/i.test(cleaned.replace(/\b(?:after|before|for|take|breakfast|lunch|dinner|food|meal|month|months|week|weeks|day|days)\b/gi, ''))
    ) {
      return true;
    }
  }

  return false;
};

module.exports = {
  isNonMedicineText,
  hasMedicineSignal,
};
