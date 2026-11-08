import { APP_CONFIG } from '@/constants';

const OTP_LENGTH = APP_CONFIG.OTP_LENGTH;
// Realistic SMS autofill timing: ~1.8s initial delay mimics SMS arrival and OS detection,
// followed by a natural ~140ms cadence per digit.
export const DEFAULT_INITIAL_DELAY_MS = 1800;
export const DEFAULT_DIGIT_DELAY_MS = 140;

export const splitOtpDigits = (otp: string): string[] | null => {
  const digits = otp.replace(/\D/g, '');
  if (digits.length !== OTP_LENGTH) return null;
  return digits.split('');
};

export interface FillOtpOptions {
  initialDelayMs?: number;
  digitDelayMs?: number;
}

export const fillOtpSmoothly = (
  otp: string,
  onDigit: (index: number, digit: string) => void,
  onComplete?: () => void,
  options?: FillOtpOptions,
): (() => void) => {
  const digits = splitOtpDigits(otp);
  if (!digits) {
    onComplete?.();
    return () => {};
  }

  const initialDelay = options?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const digitDelay = options?.digitDelayMs ?? DEFAULT_DIGIT_DELAY_MS;
  const timers: ReturnType<typeof setTimeout>[] = [];

  digits.forEach((digit, index) => {
    const timer = setTimeout(() => {
      onDigit(index, digit);
      if (index === digits.length - 1) {
        onComplete?.();
      }
    }, initialDelay + index * digitDelay);
    timers.push(timer);
  });

  return () => timers.forEach(clearTimeout);
};
