import { APP_CONFIG } from '@/constants';

const OTP_LENGTH = APP_CONFIG.OTP_LENGTH;
const DIGIT_DELAY_MS = 90;
const INITIAL_DELAY_MS = 350;

export const splitOtpDigits = (otp: string): string[] | null => {
  const digits = otp.replace(/\D/g, '');
  if (digits.length !== OTP_LENGTH) return null;
  return digits.split('');
};

export const fillOtpSmoothly = (
  otp: string,
  onDigit: (index: number, digit: string) => void,
  onComplete?: () => void,
): (() => void) => {
  const digits = splitOtpDigits(otp);
  if (!digits) {
    onComplete?.();
    return () => {};
  }

  const timers: ReturnType<typeof setTimeout>[] = [];

  digits.forEach((digit, index) => {
    const timer = setTimeout(() => {
      onDigit(index, digit);
      if (index === digits.length - 1) {
        onComplete?.();
      }
    }, INITIAL_DELAY_MS + index * DIGIT_DELAY_MS);
    timers.push(timer);
  });

  return () => timers.forEach(clearTimeout);
};
