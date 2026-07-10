import { apiRequest } from './apiClient';
import type {
  SendOtpResponse,
  VerifyOtpResponse,
  RefreshSessionResponse,
  CompleteRegistrationPayload,
  CompleteRegistrationResponse,
} from '@/types/auth';
import { devLog } from '@/utils/devLogger';

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  devLog('Auth', 'sendOtp called', { phone });
  return apiRequest<SendOtpResponse>('/api/auth/send-otp', {
    method: 'POST',
    body: { phone },
  });
};

export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  devLog('Auth', 'verifyOtp called', { phone, otp });
  return apiRequest<VerifyOtpResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp },
  });
};

export const refreshSession = async (
  refreshToken: string,
): Promise<RefreshSessionResponse> => {
  devLog('Auth', 'refreshSession called');
  return apiRequest<RefreshSessionResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
};

export const completeRegistration = async (
  payload: CompleteRegistrationPayload,
  accessToken: string,
): Promise<CompleteRegistrationResponse> => {
  devLog('Auth', 'completeRegistration called', {
    username: payload.username,
    role: payload.role,
    language: payload.language,
  });
  return apiRequest<CompleteRegistrationResponse>('/api/auth/complete-registration', {
    method: 'POST',
    body: payload,
    token: accessToken,
  });
};
