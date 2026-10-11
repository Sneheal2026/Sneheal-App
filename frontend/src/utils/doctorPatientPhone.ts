import { formatPhoneNumber } from '@/utils';
import { toLocalPhone } from '@/utils/phone';

/** Prefer full phone from doctor API; fall back to masked legacy payloads. */
export function formatDoctorPatientPhone(patient: {
  phone?: string;
  phoneMasked?: string;
}): string {
  const raw = patient.phone?.trim();
  if (raw) {
    return formatPhoneNumber(toLocalPhone(raw));
  }
  return patient.phoneMasked?.trim() || '—';
}
