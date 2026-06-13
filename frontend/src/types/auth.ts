import type { UserRole } from '@/navigation/types';

export type AuthUser = {
  id: number;
  phone: string;
  username: string | null;
  language: string | null;
  role: UserRole | null;
  profileCompleted: boolean;
  createdAt?: string;
};

export type SendOtpResponse = {
  resendAfterSeconds: number;
  devOtp?: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
};
