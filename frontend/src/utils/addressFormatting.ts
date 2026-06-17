/**
 * Google Plus Codes (e.g. M39V+6GP) are machine-readable location codes.
 * Geocoders often return them in the `name` field when no street address exists.
 * Strip them so users see familiar place names instead.
 */
const PLUS_CODE_PATTERN = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}$/i;
const PLUS_CODE_PREFIX_PATTERN =
  /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}(\s*,\s*|\s+)/i;

export function isPlusCode(value: string): boolean {
  return PLUS_CODE_PATTERN.test(value.trim());
}

export function stripPlusCodeFromText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (isPlusCode(trimmed)) return '';

  return trimmed.replace(PLUS_CODE_PREFIX_PATTERN, '').trim();
}

export function sanitizeAddressPart(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const cleaned = stripPlusCodeFromText(value);
  if (!cleaned || isPlusCode(cleaned)) return null;

  return cleaned;
}

export function sanitizeDisplayAddress(value: string | null | undefined): string {
  if (!value?.trim()) return '';

  const parts = value
    .split(',')
    .map((part) => sanitizeAddressPart(part))
    .filter((part): part is string => Boolean(part));

  return parts.join(', ').trim();
}
