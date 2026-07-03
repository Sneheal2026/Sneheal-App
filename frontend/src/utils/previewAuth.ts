import type { VerifyOtpResponse } from '@/types/auth';

export const isSkipAuthEnabled = (): boolean =>
  process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

/** Long-lived mock JWTs so session restore skips refresh calls. */
const PREVIEW_ACCESS_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjIwNTAwMDAwMDAsInN1YiI6InByZXZpZXcifQ.preview';
const PREVIEW_REFRESH_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjIwNTAwMDAwMDAsInN1YiI6InByZXZpZXctcmVmcmVzaCJ9.preview';

export const createPreviewSession = (): VerifyOtpResponse => ({
  accessToken: PREVIEW_ACCESS_TOKEN,
  refreshToken: PREVIEW_REFRESH_TOKEN,
  user: {
    id: 1,
    phone: '+919999999999',
    username: 'Preview User',
    language: 'ENGLISH',
    role: 'customer',
    profileCompleted: true,
  },
});
